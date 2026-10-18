import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import httpProxy from "http-proxy";
import { nitro } from "nitro/vite";
import type { Plugin } from "vite";
import { defineConfig } from "vite";

const gns3Target = process.env.GNS3_CONTROLLER_URL || "http://127.0.0.1:80";

function gns3ProxyPlugin(): Plugin {
	const proxy = httpProxy.createProxyServer({
		target: gns3Target,
		changeOrigin: true,
		ws: true,
	});

	proxy.on("error", (err, _req, res) => {
		console.error("[GNS3 Proxy Error]", err.message);
		if (
			res &&
			"writeHead" in res &&
			!("headersSent" in res && res.headersSent)
		) {
			(res as import("http").ServerResponse).writeHead(502, {
				"Content-Type": "application/json",
			});
			res.end(
				JSON.stringify({
					error: "GNS3 Controller unavailable",
					details: err.message,
				}),
			);
		}
	});

	return {
		name: "gns3-proxy-plugin",
		enforce: "pre",
		configureServer(server) {
			// Connect middleware with route prefix '/api/gns3'
			// This signals Nitro dev server to NOT intercept this path with HTML error
			server.middlewares.use("/api/gns3", (req, res) => {
				if (!req.url?.startsWith("/")) {
					req.url = `/${req.url || ""}`;
				}
				proxy.web(req, res);
			});

			// WebSocket proxying for terminal consoles and notifications
			server.httpServer?.on("upgrade", (req, socket, head) => {
				if (req.url?.startsWith("/api/gns3")) {
					req.url = req.url.replace(/^\/api\/gns3/, "") || "/";
					proxy.ws(req, socket, head);
				}
			});
		},
	};
}

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	server: {
		port: 3000,
	},
	plugins: [
		gns3ProxyPlugin(),
		devtools(),
		nitro({
			rollupConfig: { external: [/^@sentry\//] },
			routeRules: {
				"/api/gns3/**": {
					proxy: `${gns3Target}/**`,
				},
			},
		}),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
});

export default config;
