import { beforeEach, describe, expect, it } from "vitest";
import { useTopologyStore } from "@/stores/topology-store";
import { useUIStore } from "@/stores/ui-store";

describe("useUIStore", () => {
	beforeEach(() => {
		useUIStore.setState({
			sidebarOpen: true,
			activeSidebarTab: "devices",
			rightPanelOpen: true,
			bottomPanelOpen: false,
			openConsoles: [],
			activeConsoleNodeId: null,
			events: [],
			theme: "dark",
		});
	});

	it("toggles sidebar state", () => {
		expect(useUIStore.getState().sidebarOpen).toBe(true);
		useUIStore.getState().toggleSidebar();
		expect(useUIStore.getState().sidebarOpen).toBe(false);
	});

	it("switches sidebar tabs and ensures sidebar is open", () => {
		useUIStore.getState().setSidebarOpen(false);
		useUIStore.getState().setActiveSidebarTab("projects");
		expect(useUIStore.getState().activeSidebarTab).toBe("projects");
		expect(useUIStore.getState().sidebarOpen).toBe(true);
	});

	it("manages multiple console tabs and active tab switching", () => {
		useUIStore.getState().openConsoleForNode("node-1");
		expect(useUIStore.getState().openConsoles).toContain("node-1");
		expect(useUIStore.getState().activeConsoleNodeId).toBe("node-1");
		expect(useUIStore.getState().bottomPanelOpen).toBe(true);

		useUIStore.getState().openConsoleForNode("node-2");
		expect(useUIStore.getState().openConsoles).toEqual(["node-1", "node-2"]);
		expect(useUIStore.getState().activeConsoleNodeId).toBe("node-2");

		useUIStore.getState().closeConsoleForNode("node-2");
		expect(useUIStore.getState().openConsoles).toEqual(["node-1"]);
		expect(useUIStore.getState().activeConsoleNodeId).toBe("node-1");
	});

	it("closes all open consoles with closeAllConsoles", () => {
		useUIStore.getState().openConsoleForNode("node-1");
		useUIStore.getState().openConsoleForNode("node-2");
		expect(useUIStore.getState().openConsoles.length).toBe(2);

		useUIStore.getState().closeAllConsoles();
		expect(useUIStore.getState().openConsoles.length).toBe(0);
		expect(useUIStore.getState().activeConsoleNodeId).toBeNull();
	});

	it("records and clears controller events", () => {
		useUIStore.getState().addEvent({
			level: "success",
			message: "Node started",
			source: "Test",
		});
		expect(useUIStore.getState().events.length).toBe(1);
		expect(useUIStore.getState().events[0].message).toBe("Node started");

		useUIStore.getState().clearEvents();
		expect(useUIStore.getState().events.length).toBe(0);
	});
});

describe("useTopologyStore", () => {
	beforeEach(() => {
		useTopologyStore.setState({
			activeProjectId: null,
			selectedNodeId: null,
			selectedLinkId: null,
			isConnecting: false,
			showGrid: true,
			snapToGrid: false,
			gridSize: 25,
		});
	});

	it("selects and clears nodes and links", () => {
		useTopologyStore.getState().selectNode("node-123");
		expect(useTopologyStore.getState().selectedNodeId).toBe("node-123");
		expect(useTopologyStore.getState().selectedLinkId).toBeNull();

		useTopologyStore.getState().selectLink("link-456");
		expect(useTopologyStore.getState().selectedLinkId).toBe("link-456");
		expect(useTopologyStore.getState().selectedNodeId).toBeNull();

		useTopologyStore.getState().clearSelection();
		expect(useTopologyStore.getState().selectedNodeId).toBeNull();
		expect(useTopologyStore.getState().selectedLinkId).toBeNull();
	});

	it("handles link connection dialog lifecycle", () => {
		useTopologyStore.getState().openLinkDialog("node-1", "node-2");
		expect(useTopologyStore.getState().linkDialogOpen).toBe(true);
		expect(useTopologyStore.getState().pendingLinkConnection).toEqual({
			sourceNodeId: "node-1",
			targetNodeId: "node-2",
		});

		useTopologyStore.getState().closeLinkDialog();
		expect(useTopologyStore.getState().linkDialogOpen).toBe(false);
		expect(useTopologyStore.getState().pendingLinkConnection).toBeNull();
	});

	it("manages interactive connection mode lifecycle", () => {
		useTopologyStore.getState().startConnecting("node-source", {
			adapter_number: 0,
			port_number: 1,
			name: "FastEthernet0/1",
		});
		expect(useTopologyStore.getState().isConnecting).toBe(true);
		expect(useTopologyStore.getState().connectingSourceNodeId).toBe(
			"node-source",
		);
		expect(useTopologyStore.getState().connectingSourcePort?.name).toBe(
			"FastEthernet0/1",
		);
		expect(useTopologyStore.getState().connectingTargetNodeId).toBeNull();

		useTopologyStore.getState().setConnectingTargetNodeId("node-target");
		expect(useTopologyStore.getState().connectingTargetNodeId).toBe(
			"node-target",
		);

		useTopologyStore.getState().cancelConnecting();
		expect(useTopologyStore.getState().isConnecting).toBe(false);
		expect(useTopologyStore.getState().connectingSourceNodeId).toBeNull();
		expect(useTopologyStore.getState().connectingSourcePort).toBeNull();
		expect(useTopologyStore.getState().connectingTargetNodeId).toBeNull();
	});
});
