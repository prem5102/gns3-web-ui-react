import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WebSocketEventManager } from "@/features/controller/websocket-event-manager";
import {
	drawingKeys,
	linkKeys,
	nodeKeys,
	projectKeys,
	templateKeys,
} from "@/features/query-keys";
import { useUIStore } from "@/stores/ui-store";

describe("WebSocketEventManager", () => {
	let queryClient: QueryClient;
	let mockSocketInstances: MockWebSocket[] = [];

	class MockWebSocket {
		public readyState: number = WebSocket.CONNECTING;
		public onopen: (() => void) | null = null;
		public onmessage: ((event: { data: string }) => void) | null = null;
		public onerror: ((error: unknown) => void) | null = null;
		public onclose: (() => void) | null = null;
		public url: string;

		constructor(url: string) {
			this.url = url;
			mockSocketInstances.push(this);
		}

		public close() {
			this.readyState = WebSocket.CLOSED;
			if (this.onclose) this.onclose();
		}

		public triggerOpen() {
			this.readyState = WebSocket.OPEN;
			if (this.onopen) this.onopen();
		}

		public triggerMessage(data: unknown) {
			if (this.onmessage) {
				this.onmessage({ data: JSON.stringify(data) });
			}
		}
	}

	beforeEach(() => {
		mockSocketInstances = [];
		queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		vi.spyOn(queryClient, "invalidateQueries");
		// @ts-expect-error Mocking global WebSocket
		global.WebSocket = MockWebSocket;
		useUIStore.setState({
			events: [],
			controllerConnectionStatus: "disconnected",
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("connects and updates connection status", () => {
		const statusChanges: string[] = [];
		const manager = new WebSocketEventManager({
			projectId: "test-proj-1",
			queryClient,
			onStatusChange: (status) => statusChanges.push(status),
		});

		expect(manager.getStatus()).toBe("disconnected");
		manager.connect();

		expect(manager.getStatus()).toBe("connecting");
		expect(mockSocketInstances.length).toBe(1);

		mockSocketInstances[0].triggerOpen();
		expect(manager.getStatus()).toBe("connected");
		expect(manager.isConnected()).toBe(true);
		expect(useUIStore.getState().controllerConnectionStatus).toBe("connected");

		manager.disconnect();
		expect(manager.getStatus()).toBe("disconnected");
		expect(manager.isConnected()).toBe(false);
	});

	it("invalidates node queries on node.* notifications", () => {
		const manager = new WebSocketEventManager({
			projectId: "test-proj-1",
			queryClient,
		});

		manager.connect();
		mockSocketInstances[0].triggerOpen();

		mockSocketInstances[0].triggerMessage({
			action: "node.updated",
			event: { node_id: "node-1" },
		});

		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
			queryKey: nodeKeys.all("test-proj-1"),
		});

		manager.disconnect();
	});

	it("invalidates link queries on link.* notifications", () => {
		const manager = new WebSocketEventManager({
			projectId: "test-proj-1",
			queryClient,
		});

		manager.connect();
		mockSocketInstances[0].triggerOpen();

		mockSocketInstances[0].triggerMessage({
			action: "link.created",
			event: { link_id: "link-1" },
		});

		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
			queryKey: linkKeys.all("test-proj-1"),
		});

		manager.disconnect();
	});

	it("invalidates drawing queries on drawing.* notifications", () => {
		const manager = new WebSocketEventManager({
			projectId: "test-proj-1",
			queryClient,
		});

		manager.connect();
		mockSocketInstances[0].triggerOpen();

		mockSocketInstances[0].triggerMessage({
			action: "drawing.updated",
			event: { drawing_id: "draw-1" },
		});

		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
			queryKey: drawingKeys.all("test-proj-1"),
		});

		manager.disconnect();
	});

	it("invalidates project and template queries accordingly", () => {
		const manager = new WebSocketEventManager({
			projectId: "test-proj-1",
			queryClient,
		});

		manager.connect();
		mockSocketInstances[0].triggerOpen();

		mockSocketInstances[0].triggerMessage({
			action: "project.updated",
			event: { project_id: "test-proj-1" },
		});

		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
			queryKey: projectKeys.all,
		});
		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
			queryKey: projectKeys.detail("test-proj-1"),
		});

		mockSocketInstances[0].triggerMessage({
			action: "template.created",
			event: { template_id: "tmpl-1" },
		});

		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
			queryKey: templateKeys.all,
		});

		manager.disconnect();
	});

	it("records events into the UI store", () => {
		const manager = new WebSocketEventManager({
			projectId: "test-proj-1",
			queryClient,
		});

		manager.connect();
		mockSocketInstances[0].triggerOpen();

		mockSocketInstances[0].triggerMessage({
			action: "node.started",
			event: { node_id: "node-1" },
		});

		const events = useUIStore.getState().events;
		expect(events.length).toBeGreaterThan(0);
		expect(events[0].message).toContain("Event: node.started");
		expect(events[0].level).toBe("success");

		manager.disconnect();
	});
});
