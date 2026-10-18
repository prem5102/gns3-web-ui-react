import { describe, expect, it } from "vitest";
import {
	BUILTIN_NODE_MODELS,
	GNS3_SYMBOLS,
	SYMBOL_MAP,
	getSymbolUrl,
	resolveNodeSymbol,
} from "@/lib/symbols";

describe("GNS3 Symbols System", () => {
	it("contains all 64 GNS3 symbols in the catalog", () => {
		expect(GNS3_SYMBOLS.length).toBe(64);
		expect(SYMBOL_MAP.has("router")).toBe(true);
		expect(SYMBOL_MAP.has("switch")).toBe(true);
		expect(SYMBOL_MAP.has("firewall")).toBe(true);
		expect(SYMBOL_MAP.has("cloud")).toBe(true);
		expect(SYMBOL_MAP.has("client")).toBe(true);
		expect(SYMBOL_MAP.has("server")).toBe(true);
		expect(SYMBOL_MAP.has("wifi")).toBe(true);
		expect(SYMBOL_MAP.has("wlc")).toBe(true);
	});

	it("generates correct symbol URLs across color variants", () => {
		// Blue
		expect(getSymbolUrl("router", "blue")).toBe(
			"/symbols/blue/sq_router_blue.svg",
		);
		expect(getSymbolUrl("switch", "blue")).toBe(
			"/symbols/blue/sq_switch_blue.svg",
		);

		// Gray (no _gray suffix in filenames)
		expect(getSymbolUrl("router", "gray")).toBe("/symbols/gray/sq_router.svg");
		expect(getSymbolUrl("switch", "gray")).toBe("/symbols/gray/sq_switch.svg");

		// Green
		expect(getSymbolUrl("router", "green")).toBe(
			"/symbols/green/sq_router_green.svg",
		);
		expect(getSymbolUrl("client", "green")).toBe(
			"/symbols/green/sq_client_green.svg",
		);

		// Red
		expect(getSymbolUrl("router", "red")).toBe(
			"/symbols/red/sq_router_red.svg",
		);
		expect(getSymbolUrl("firewall", "red")).toBe(
			"/symbols/red/sq_firewall_red.svg",
		);
	});

	it("translates classic GNS3 symbol paths to local SVG symbols", () => {
		// Classic GNS3 format: ":/symbols/router.svg"
		expect(getSymbolUrl(":/symbols/router.svg", "blue")).toBe(
			"/symbols/blue/sq_router_blue.svg",
		);

		// Affinity square format: ":/symbols/affinity-square-blue/router.svg"
		expect(
			getSymbolUrl(":/symbols/affinity-square-blue/router.svg", "green"),
		).toBe("/symbols/green/sq_router_green.svg");

		// Direct sq_ filename
		expect(getSymbolUrl("sq_switch_blue.svg", "blue")).toBe(
			"/symbols/blue/sq_switch_blue.svg",
		);
	});

	it("resolves node symbols dynamically based on device status", () => {
		const startedRouter = {
			name: "R1",
			node_type: "dynamips",
			status: "started",
		};
		// When running -> show blue
		expect(resolveNodeSymbol(startedRouter)).toBe(
			"/symbols/blue/sq_router_blue.svg",
		);

		const suspendedRouter = {
			name: "R1",
			node_type: "dynamips",
			status: "suspended",
		};
		// When not started -> show grey
		expect(resolveNodeSymbol(suspendedRouter)).toBe(
			"/symbols/gray/sq_router.svg",
		);

		const stoppedRouter = {
			name: "R1",
			node_type: "dynamips",
			status: "stopped",
		};
		// When not started -> show grey
		expect(resolveNodeSymbol(stoppedRouter)).toBe(
			"/symbols/gray/sq_router.svg",
		);
	});

	it("infers symbols intelligently from node_type, category, and name", () => {
		expect(
			resolveNodeSymbol({
				name: "SW1",
				node_type: "ethernet_switch",
				category: "switch",
			}),
		).toBe("/symbols/blue/sq_switch_blue.svg");

		expect(
			resolveNodeSymbol({
				name: "Core-L3-SW",
				node_type: "iou",
				category: "switch",
			}),
		).toBe("/symbols/blue/sq_switch_multilayer_blue.svg");

		expect(
			resolveNodeSymbol({
				name: "FW-1",
				node_type: "qemu",
				category: "firewall",
			}),
		).toBe("/symbols/blue/sq_firewall_blue.svg");

		expect(
			resolveNodeSymbol({
				name: "PC1",
				node_type: "vpcs",
				category: "guest",
			}),
		).toBe("/symbols/blue/sq_client_blue.svg");

		expect(
			resolveNodeSymbol({
				name: "NAT-Cloud",
				node_type: "cloud",
				category: "guest",
			}),
		).toBe("/symbols/blue/sq_cloud_blue.svg");

		expect(
			resolveNodeSymbol({
				name: "AppServer",
				node_type: "docker",
				category: "guest",
			}),
		).toBe("/symbols/blue/sq_server_blue.svg");
	});

	it("provides valid built-in node models for device library", () => {
		expect(BUILTIN_NODE_MODELS.length).toBeGreaterThanOrEqual(10);
		for (const model of BUILTIN_NODE_MODELS) {
			expect(model.template_id).toBeTruthy();
			expect(model.name).toBeTruthy();
			expect(model.category).toBeTruthy();
			expect(SYMBOL_MAP.has(model.symbol)).toBe(true);
		}
	});
});
