import { create } from "zustand";

export interface ConnectingSourcePort {
	adapter_number: number;
	port_number: number;
	name: string;
}

export interface ContextMenuState {
	x: number;
	y: number;
	nodeId?: string;
	linkId?: string;
}

interface TopologyState {
	// Active Project
	activeProjectId: string | null;

	// Selection
	selectedNodeId: string | null;
	selectedLinkId: string | null;

	// Canvas Settings
	snapToGrid: boolean;
	showGrid: boolean;
	gridSize: number;
	showInterfaceLabels: boolean;

	// Interactive Connection Mode
	isConnecting: boolean;
	connectingSourceNodeId: string | null;
	connectingSourcePort: ConnectingSourcePort | null;
	linkDialogOpen: boolean;
	pendingLinkConnection: {
		sourceNodeId: string;
		targetNodeId: string;
	} | null;

	// Context Menu
	contextMenu: ContextMenuState | null;

	// Actions
	setActiveProjectId: (projectId: string | null) => void;
	selectNode: (nodeId: string | null) => void;
	selectLink: (linkId: string | null) => void;
	clearSelection: () => void;
	setSnapToGrid: (snap: boolean) => void;
	setShowGrid: (show: boolean) => void;
	setGridSize: (size: number) => void;
	setShowInterfaceLabels: (show: boolean) => void;
	startConnecting: (nodeId: string, port?: ConnectingSourcePort) => void;
	openLinkDialog: (sourceNodeId: string, targetNodeId: string) => void;
	closeLinkDialog: () => void;
	cancelConnecting: () => void;
	openContextMenu: (menu: ContextMenuState) => void;
	closeContextMenu: () => void;
}

export const useTopologyStore = create<TopologyState>((set) => ({
	activeProjectId: null,
	selectedNodeId: null,
	selectedLinkId: null,

	snapToGrid: false,
	showGrid: true,
	gridSize: 25,
	showInterfaceLabels: true,

	isConnecting: false,
	connectingSourceNodeId: null,
	connectingSourcePort: null,
	linkDialogOpen: false,
	pendingLinkConnection: null,

	contextMenu: null,

	setActiveProjectId: (projectId) =>
		set({
			activeProjectId: projectId,
			selectedNodeId: null,
			selectedLinkId: null,
			isConnecting: false,
			contextMenu: null,
		}),

	selectNode: (nodeId) =>
		set({
			selectedNodeId: nodeId,
			selectedLinkId: null,
		}),

	selectLink: (linkId) =>
		set({
			selectedLinkId: linkId,
			selectedNodeId: null,
		}),

	clearSelection: () =>
		set({
			selectedNodeId: null,
			selectedLinkId: null,
			contextMenu: null,
		}),

	setSnapToGrid: (snap) => set({ snapToGrid: snap }),
	setShowGrid: (show) => set({ showGrid: show }),
	setGridSize: (size) => set({ gridSize: size }),
	setShowInterfaceLabels: (show) => set({ showInterfaceLabels: show }),

	startConnecting: (nodeId, port) =>
		set({
			isConnecting: true,
			connectingSourceNodeId: nodeId,
			connectingSourcePort: port || null,
		}),

	openLinkDialog: (sourceNodeId, targetNodeId) =>
		set({
			linkDialogOpen: true,
			pendingLinkConnection: { sourceNodeId, targetNodeId },
			isConnecting: false,
		}),

	closeLinkDialog: () =>
		set({
			linkDialogOpen: false,
			pendingLinkConnection: null,
			connectingSourceNodeId: null,
			connectingSourcePort: null,
		}),

	cancelConnecting: () =>
		set({
			isConnecting: false,
			connectingSourceNodeId: null,
			connectingSourcePort: null,
		}),

	openContextMenu: (menu) => set({ contextMenu: menu }),
	closeContextMenu: () => set({ contextMenu: null }),
}));
