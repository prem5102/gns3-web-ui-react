import { beforeEach, describe, expect, it, vi } from "vitest";
import { GNS3ApiError, gns3Api } from "@/lib/gns3-api";

describe("GNS3ApiClient", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		gns3Api.setConfig({
			baseUrl: "/api/gns3",
			authToken: "test-token",
		});
	});

	it("formats endpoint URL correctly", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ version: "3.1.0a6" }),
		});
		global.fetch = mockFetch;

		const version = await gns3Api.getVersion();
		expect(mockFetch).toHaveBeenCalledWith(
			"/api/gns3/v3/version",
			expect.objectContaining({
				headers: expect.any(Headers),
			}),
		);
		expect(version.version).toBe("3.1.0a6");
	});

	it("attaches Authorization header when token is present", async () => {
		let capturedHeaders: Headers | undefined;
		const mockFetch = vi.fn().mockImplementation((_url, options) => {
			capturedHeaders = options.headers as Headers;
			return Promise.resolve({
				ok: true,
				status: 200,
				json: async () => [],
			});
		});
		global.fetch = mockFetch;

		await gns3Api.getProjects();
		expect(capturedHeaders?.get("Authorization")).toBe("Bearer test-token");
	});

	it("throws GNS3ApiError on HTTP error status", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 404,
			statusText: "Not Found",
			json: async () => ({ message: "Project not found" }),
		});
		global.fetch = mockFetch;

		await expect(gns3Api.getProject("non-existent")).rejects.toThrow(
			GNS3ApiError,
		);
	});

	it("builds correct WebSocket URLs", () => {
		const wsUrl = gns3Api.getWebSocketUrl("/v3/projects/p1/notifications/ws");
		expect(wsUrl).toContain(
			"/v3/projects/p1/notifications/ws?token=test-token",
		);
	});
});
