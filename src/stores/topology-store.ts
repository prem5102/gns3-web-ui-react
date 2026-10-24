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
	drawingId?: string;
}

export type DrawingToolType =
	| "select"
	| "rectangle"
	| "ellipse"
	| "text"
	| "line"
	| "arrow"
	| "cloud"
	| "pen"
	| "image"
	| "smart_area";

export interface DrawingDefaults {
	fillColor: string;
	fillOpacity: number;
	strokeColor: string;
	strokeWidth: number;
	strokeStyle: "solid" | "dashed" | "dotted";
	cornerRadius: number;
	fontSize: number;
	fontFamily: string;
	fontWeight: "normal" | "bold";
	fontStyle: "normal" | "italic";
}

interface TopologyState {
	// Active Project
	activeProjectId: string | null;

	// Selection
	selectedNodeId: string | null;
	selectedLinkId: string | null;
	selectedDrawingId: string | null;

	// Drawing Mode
	activeDrawingTool: DrawingToolType | null;
	drawingDefaults: DrawingDefaults;

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
	selectDrawing: (drawingId: string | null) => void;
	clearSelection: () => void;
	setActiveDrawingTool: (tool: DrawingToolType | null) => void;
	setDrawingDefaults: (defaults: Partial<DrawingDefaults>) => void;
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
	selectedDrawingId: null,

	activeDrawingTool: null,
	drawingDefaults: {
		fillColor: "#3b82f6",
		fillOpacity: 0.15,
		strokeColor: "#2563eb",
		strokeWidth: 2,
		strokeStyle: "solid",
		cornerRadius: 8,
		fontSize: 14,
		fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
		fontWeight: "bold",
		fontStyle: "normal",
	},

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
			selectedDrawingId: null,
			isConnecting: false,
			contextMenu: null,
		}),

	selectNode: (nodeId) =>
		set({
			selectedNodeId: nodeId,
			selectedLinkId: null,
			selectedDrawingId: null,
		}),

	selectLink: (linkId) =>
		set({
			selectedLinkId: linkId,
			selectedNodeId: null,
			selectedDrawingId: null,
		}),

	selectDrawing: (drawingId) =>
		set({
			selectedDrawingId: drawingId,
			selectedNodeId: null,
			selectedLinkId: null,
		}),

	clearSelection: () =>
		set({
			selectedNodeId: null,
			selectedLinkId: null,
			selectedDrawingId: null,
			contextMenu: null,
		}),

	setActiveDrawingTool: (tool) =>
		set({
			activeDrawingTool: tool,
			selectedNodeId: null,
			selectedLinkId: null,
			selectedDrawingId: null,
		}),

	setDrawingDefaults: (defaults) =>
		set((state) => ({
			drawingDefaults: { ...state.drawingDefaults, ...defaults },
		})),

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
