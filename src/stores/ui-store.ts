import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ControllerEvent {
	id: string;
	timestamp: string;
	level: "info" | "warning" | "error" | "success";
	message: string;
	source?: string;
}

export type SidebarTab =
	| "projects"
	| "devices"
	| "nodes"
	| "links"
	| "consoles";
export type BottomTab = "consoles" | "editor" | "events" | "logs";
export type ControllerConnectionStatus =
	| "connected"
	| "connecting"
	| "disconnected";

interface UIState {
	// Panels
	sidebarOpen: boolean;
	activeSidebarTab: SidebarTab;
	rightPanelOpen: boolean;
	bottomPanelOpen: boolean;
	bottomPanelHeight: number;
	activeBottomTab: BottomTab;

	// Theme
	theme: "dark" | "light";

	// Settings
	settingsModalOpen: boolean;
	controllerUrl: string;
	controllerUsername: string;

	// Controller Connection Status (ephemeral)
	controllerConnectionStatus: ControllerConnectionStatus;
	setControllerConnectionStatus: (status: ControllerConnectionStatus) => void;

	// Consoles & Editor
	openConsoles: string[]; // nodeIds
	activeConsoleNodeId: string | null;
	activeEditorNodeId: string | null;
	editorOpen: boolean;

	// Logs & Events
	events: ControllerEvent[];

	// Actions
	setSidebarOpen: (open: boolean) => void;
	toggleSidebar: () => void;
	setActiveSidebarTab: (tab: SidebarTab) => void;
	setRightPanelOpen: (open: boolean) => void;
	toggleRightPanel: () => void;
	setBottomPanelOpen: (open: boolean) => void;
	toggleBottomPanel: () => void;
	setBottomPanelHeight: (height: number) => void;
	setActiveBottomTab: (tab: BottomTab) => void;
	setTheme: (theme: "dark" | "light") => void;
	toggleTheme: () => void;
	setSettingsModalOpen: (open: boolean) => void;
	setControllerConfig: (url: string, username: string) => void;
	openConsoleForNode: (nodeId: string) => void;
	closeConsoleForNode: (nodeId: string) => void;
	closeAllConsoles: () => void;
	setActiveConsoleNodeId: (nodeId: string | null) => void;
	openEditorForNode: (nodeId: string) => void;
	closeEditor: () => void;
	addEvent: (event: Omit<ControllerEvent, "id" | "timestamp">) => void;
	clearEvents: () => void;
}

export const useUIStore = create<UIState>()(
	persist(
		(set, get) => ({
			sidebarOpen: true,
			activeSidebarTab: "devices",
			rightPanelOpen: true,
			bottomPanelOpen: false,
			bottomPanelHeight: 280,
			activeBottomTab: "consoles",

			theme: "dark",

			settingsModalOpen: false,
			controllerUrl: "/api/gns3",
			controllerUsername: "admin",

			controllerConnectionStatus: "disconnected",
			setControllerConnectionStatus: (controllerConnectionStatus) =>
				set({ controllerConnectionStatus }),

			openConsoles: [],
			activeConsoleNodeId: null,
			activeEditorNodeId: null,
			editorOpen: false,

			events: [],

			setSidebarOpen: (open) => set({ sidebarOpen: open }),
			toggleSidebar: () =>
				set((state) => ({ sidebarOpen: !state.sidebarOpen })),
			setActiveSidebarTab: (tab) =>
				set({ activeSidebarTab: tab, sidebarOpen: true }),
			setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
			toggleRightPanel: () =>
				set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
			setBottomPanelOpen: (open) => set({ bottomPanelOpen: open }),
			toggleBottomPanel: () =>
				set((state) => ({ bottomPanelOpen: !state.bottomPanelOpen })),
			setBottomPanelHeight: (height) => set({ bottomPanelHeight: height }),
			setActiveBottomTab: (tab) =>
				set({ activeBottomTab: tab, bottomPanelOpen: true }),

			setTheme: (theme) => {
				set({ theme });
				if (typeof document !== "undefined") {
					if (theme === "dark") {
						document.documentElement.classList.add("dark");
					} else {
						document.documentElement.classList.remove("dark");
					}
				}
			},
			toggleTheme: () => {
				const next = get().theme === "dark" ? "light" : "dark";
				get().setTheme(next);
			},

			setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),
			setControllerConfig: (url, username) =>
				set({ controllerUrl: url, controllerUsername: username }),

			openConsoleForNode: (nodeId) => {
				const { openConsoles } = get();
				if (!openConsoles.includes(nodeId)) {
					set({
						openConsoles: [...openConsoles, nodeId],
						activeConsoleNodeId: nodeId,
						bottomPanelOpen: true,
						activeBottomTab: "consoles",
					});
				} else {
					set({
						activeConsoleNodeId: nodeId,
						bottomPanelOpen: true,
						activeBottomTab: "consoles",
					});
				}
			},

			closeConsoleForNode: (nodeId) => {
				const openConsoles = get().openConsoles.filter((id) => id !== nodeId);
				let nextActive = get().activeConsoleNodeId;
				if (nextActive === nodeId) {
					nextActive =
						openConsoles.length > 0
							? openConsoles[openConsoles.length - 1]
							: null;
				}
				set({
					openConsoles,
					activeConsoleNodeId: nextActive,
					bottomPanelOpen:
						openConsoles.length > 0 ? get().bottomPanelOpen : false,
				});
			},

			closeAllConsoles: () =>
				set({
					openConsoles: [],
					activeConsoleNodeId: null,
					bottomPanelOpen: false,
				}),

			setActiveConsoleNodeId: (nodeId) => set({ activeConsoleNodeId: nodeId }),

			openEditorForNode: (nodeId) =>
				set({
					activeEditorNodeId: nodeId,
					editorOpen: true,
					bottomPanelOpen: true,
					activeBottomTab: "editor",
				}),

			closeEditor: () =>
				set({
					editorOpen: false,
					activeEditorNodeId: null,
				}),

			addEvent: (event) =>
				set((state) => ({
					events: [
						{
							...event,
							id: Math.random().toString(36).substring(2, 9),
							timestamp: new Date().toLocaleTimeString(),
						},
						...state.events.slice(0, 99), // keep last 100
					],
				})),

			clearEvents: () => set({ events: [] }),
		}),
		{
			name: "gns3-ui-storage",
			partialize: (state) => ({
				theme: state.theme,
				controllerUrl: state.controllerUrl,
				controllerUsername: state.controllerUsername,
				sidebarOpen: state.sidebarOpen,
				rightPanelOpen: state.rightPanelOpen,
				bottomPanelHeight: state.bottomPanelHeight,
			}),
			onRehydrateStorage: () => (state) => {
				if (state && typeof document !== "undefined") {
					if (state.theme === "dark") {
						document.documentElement.classList.add("dark");
						document.documentElement.classList.remove("light");
					} else {
						document.documentElement.classList.remove("dark");
						document.documentElement.classList.add("light");
					}
				}
			},
		},
	),
);
