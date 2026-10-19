import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	ConsolePanel,
	getTerminalTheme,
	TERMINAL_DARK_THEME,
	TERMINAL_LIGHT_THEME,
} from "@/components/console/console-panel";
import { BottomPanel } from "@/components/layout/bottom-panel";
import { Sidebar } from "@/components/layout/sidebar";
import { NodeModelModal } from "@/components/topology/node-model-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTopologyStore } from "@/stores/topology-store";
import { useUIStore } from "@/stores/ui-store";

vi.mock("@/features/nodes/use-nodes", () => ({
	useProjectNodes: () => ({ data: [] }),
	useStartNode: () => ({ mutate: vi.fn() }),
	useStopNode: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/features/projects/use-projects", () => ({
	useProjects: () => ({ data: [] }),
	useOpenProject: () => ({ mutate: vi.fn() }),
	useDeleteProject: () => ({ mutate: vi.fn() }),
	useCreateProject: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/features/templates/use-templates", () => ({
	useTemplates: () => ({ data: [] }),
	useCreateNodeFromTemplate: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("UI Primitives", () => {
	it("renders Badge with custom variants", () => {
		const { rerender } = render(<Badge variant="success">Running</Badge>);
		expect(screen.getByText("Running")).toBeDefined();

		rerender(<Badge variant="destructive">Stopped</Badge>);
		expect(screen.getByText("Stopped")).toBeDefined();
	});

	it("renders Button and handles click events", () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Click Me</Button>);

		const button = screen.getByText("Click Me");
		button.click();
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("renders ScrollArea with viewport data slot", () => {
		const { container } = render(
			<ScrollArea className="h-40">
				<div>Scrollable Item 1</div>
				<div>Scrollable Item 2</div>
			</ScrollArea>,
		);

		const scrollArea = container.querySelector('[data-slot="scroll-area"]');
		expect(scrollArea).toBeDefined();
		const viewport = container.querySelector(
			'[data-slot="scroll-area-viewport"]',
		);
		expect(viewport).toBeDefined();
		expect(screen.getByText("Scrollable Item 1")).toBeDefined();
	});

	it("renders NodeModelModal with symbol details and specifications", () => {
		const mockTemplate = {
			template_id: "test-tpl-1",
			name: "Cisco c7200 Router",
			category: "router",
			template_type: "dynamips",
			symbol: "router",
			compute_id: "local",
			builtin: true,
		};

		render(
			<NodeModelModal
				template={mockTemplate}
				open={true}
				onOpenChange={vi.fn()}
			/>,
		);

		expect(screen.getByText("Cisco c7200 Router")).toBeDefined();
		expect(screen.getByText("Node Model Specifications")).toBeDefined();
		expect(screen.getByText("Symbol Catalog")).toBeDefined();
		expect(screen.getByText("Add to Topology")).toBeDefined();
	});

	it("renders Device Library template nodes inside shadcn ScrollArea component", () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});

		const { container } = render(
			<QueryClientProvider client={queryClient}>
				<Sidebar />
			</QueryClientProvider>,
		);

		// ScrollArea wrapper must exist in Device Library
		const scrollArea = container.querySelector('[data-slot="scroll-area"]');
		expect(scrollArea).toBeDefined();

		const viewport = container.querySelector(
			'[data-slot="scroll-area-viewport"]',
		);
		expect(viewport).toBeDefined();

		// Template nodes (e.g. Cisco c7200 Router) should be rendered inside viewport
		const routerModel = screen.getByText("Cisco c7200 Router");
		expect(routerModel).toBeDefined();
		expect(viewport?.contains(routerModel)).toBe(true);
	});

	it("renders Console and Events at the bottom of the sidebar near Settings", () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});

		useUIStore.setState({
			openConsoles: ["node-alpha"],
			bottomPanelOpen: false,
		});

		render(
			<QueryClientProvider client={queryClient}>
				<Sidebar />
			</QueryClientProvider>,
		);

		const consoleBtn = screen.getByTitle(/Consoles/i);
		const eventsBtn = screen.getByTitle(/Controller Events/i);
		const settingsBtn = screen.getByTitle("Settings & Preferences");

		expect(consoleBtn).toBeDefined();
		expect(eventsBtn).toBeDefined();
		expect(settingsBtn).toBeDefined();

		// When at least one console is open, clicking console button opens console drawer
		act(() => {
			consoleBtn.click();
		});
		expect(useUIStore.getState().bottomPanelOpen).toBe(true);
		expect(useUIStore.getState().activeBottomTab).toBe("consoles");

		// Clicking events button switches activeBottomTab to "events"
		act(() => {
			eventsBtn.click();
		});
		expect(useUIStore.getState().bottomPanelOpen).toBe(true);
		expect(useUIStore.getState().activeBottomTab).toBe("events");

		// Clicking active events button toggles bottomPanel closed
		act(() => {
			eventsBtn.click();
		});
		expect(useUIStore.getState().bottomPanelOpen).toBe(false);
	});

	it("renders BottomPanel with interactive top resizer handle that updates panel height", () => {
		useUIStore.setState({
			bottomPanelOpen: true,
			bottomPanelHeight: 280,
			activeBottomTab: "events",
		});

		render(<BottomPanel />);

		const resizer = screen.getByRole("separator", {
			name: /Resize drawer height/i,
		});
		expect(resizer).toBeDefined();

		// Simulate mouse drag on resizer: drag upwards by 100px
		act(() => {
			resizer.dispatchEvent(
				new MouseEvent("mousedown", { clientY: 500, bubbles: true }),
			);
			window.dispatchEvent(
				new MouseEvent("mousemove", { clientY: 400, bubbles: true }),
			);
			window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
		});

		// 280 + (500 - 400) = 380px
		expect(useUIStore.getState().bottomPanelHeight).toBe(380);

		// Double-clicking resizer toggles height back to default (280px)
		act(() => {
			resizer.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
		});
		expect(useUIStore.getState().bottomPanelHeight).toBe(280);
	});

	it("renders ConsolePanel horizontal tabs and handles tab switching and closing", () => {
		useTopologyStore.setState({ activeProjectId: "test-proj-1" });
		useUIStore.setState({
			openConsoles: ["node-alpha", "node-beta"],
			activeConsoleNodeId: "node-alpha",
			bottomPanelOpen: true,
			activeBottomTab: "consoles",
		});

		render(<ConsolePanel />);

		// Check that tabs for node-alpha and node-beta are rendered horizontally
		expect(screen.getByText("node-alp")).toBeDefined();
		expect(screen.getByText("node-bet")).toBeDefined();

		// Click on node-beta tab
		const betaTab = screen.getByText("node-bet");
		act(() => {
			betaTab.click();
		});
		expect(useUIStore.getState().activeConsoleNodeId).toBe("node-beta");

		// Reconnect button exists in horizontal tab controls
		const reconnectBtn = screen.getByTitle("Reconnect Active Console");
		expect(reconnectBtn).toBeDefined();

		// Verify no vertical session list separator exists
		const verticalSeparator = screen.queryByRole("separator", {
			name: /Resize console sessions list width/i,
		});
		expect(verticalSeparator).toBeNull();
	});

	it("renders overflow dropdown menu button when tabs overflow container width", () => {
		useTopologyStore.setState({ activeProjectId: "test-proj-1" });
		useUIStore.setState({
			openConsoles: ["node-alpha", "node-beta", "node-gamma", "node-delta"],
			activeConsoleNodeId: "node-alpha",
			bottomPanelOpen: true,
			activeBottomTab: "consoles",
		});

		const { container } = render(<ConsolePanel />);

		// Initially in jsdom (clientWidth=0), all tabs are visible fallback
		expect(screen.getByText("node-alp")).toBeDefined();
		expect(screen.getByText("node-bet")).toBeDefined();

		// Simulate container width constraint (160px), which cannot fit all 4 tabs
		const tabsContainer = container.querySelector(
			'[data-slot="console-tabs-container"]',
		);
		if (tabsContainer) {
			Object.defineProperty(tabsContainer, "clientWidth", {
				value: 160,
				configurable: true,
			});
		}

		act(() => {
			window.dispatchEvent(new Event("resize"));
		});

		// Overflow button should now be rendered with title containing overflow consoles
		const overflowBtn = screen.getByTitle(/overflow console/i);
		expect(overflowBtn).toBeDefined();

		// Active tab remains visible in the tab bar
		expect(screen.getByText("node-alp")).toBeDefined();
	});

	it("supports dark and light mode in console terminal", () => {
		expect(getTerminalTheme("dark")).toEqual(TERMINAL_DARK_THEME);
		expect(getTerminalTheme("light")).toEqual(TERMINAL_LIGHT_THEME);
		expect(TERMINAL_DARK_THEME.background).toBe("#09090b");
		expect(TERMINAL_LIGHT_THEME.background).toBe("#ffffff");

		useTopologyStore.setState({ activeProjectId: "test-proj-1" });
		useUIStore.setState({
			openConsoles: ["node-alpha"],
			activeConsoleNodeId: "node-alpha",
			bottomPanelOpen: true,
			activeBottomTab: "consoles",
			theme: "dark",
		});

		const { rerender } = render(<ConsolePanel />);
		expect(useUIStore.getState().theme).toBe("dark");

		act(() => {
			useUIStore.getState().toggleTheme();
		});

		expect(useUIStore.getState().theme).toBe("light");
		rerender(<ConsolePanel />);
	});

	it("shows add console dropdown when no console is opened, and opens console drawer without dropdown when at least one console is opened", () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});

		// 1. When no console is opened: clicking console icon shows the AddConsoleDropdownContent
		useUIStore.setState({
			openConsoles: [],
			activeConsoleNodeId: null,
			bottomPanelOpen: false,
		});

		const { unmount } = render(
			<QueryClientProvider client={queryClient}>
				<Sidebar />
			</QueryClientProvider>,
		);

		let consoleBtn = screen.getByTitle(/Consoles/i);
		expect(consoleBtn).toBeDefined();

		// Initially, the add console dropdown is not open
		expect(screen.queryByPlaceholderText("Search nodes...")).toBeNull();

		// Clicking console button when no console is opened shows the add console dropdown
		act(() => {
			consoleBtn.click();
		});

		expect(screen.getByPlaceholderText("Search nodes...")).toBeDefined();

		unmount();

		// 2. When at least one console is opened: clicking console icon does NOT show dropdown and opens console drawer
		useUIStore.setState({
			openConsoles: ["node-alpha"],
			activeConsoleNodeId: "node-alpha",
			bottomPanelOpen: false,
		});

		render(
			<QueryClientProvider client={queryClient}>
				<Sidebar />
			</QueryClientProvider>,
		);

		consoleBtn = screen.getByTitle(/Consoles/i);
		expect(screen.queryByPlaceholderText("Search nodes...")).toBeNull();

		act(() => {
			consoleBtn.click();
		});

		// Dropdown is not shown
		expect(screen.queryByPlaceholderText("Search nodes...")).toBeNull();
		// Console drawer is opened
		expect(useUIStore.getState().bottomPanelOpen).toBe(true);
		expect(useUIStore.getState().activeBottomTab).toBe("consoles");
	});

	it("automatically closes console bottom drawer when all consoles are closed", () => {
		useTopologyStore.setState({ activeProjectId: "test-proj-1" });
		useUIStore.setState({
			openConsoles: ["node-alpha"],
			activeConsoleNodeId: "node-alpha",
			bottomPanelOpen: true,
			activeBottomTab: "consoles",
		});

		const { rerender } = render(<BottomPanel />);
		expect(useUIStore.getState().bottomPanelOpen).toBe(true);

		// Close the only open console
		act(() => {
			useUIStore.getState().closeConsoleForNode("node-alpha");
		});

		expect(useUIStore.getState().openConsoles).toHaveLength(0);
		expect(useUIStore.getState().bottomPanelOpen).toBe(false);

		// Re-open with multiple consoles, then closeAllConsoles
		act(() => {
			useUIStore.setState({
				openConsoles: ["node-alpha", "node-beta"],
				activeConsoleNodeId: "node-alpha",
				bottomPanelOpen: true,
				activeBottomTab: "consoles",
			});
			useUIStore.getState().closeAllConsoles();
		});

		expect(useUIStore.getState().openConsoles).toHaveLength(0);
		expect(useUIStore.getState().bottomPanelOpen).toBe(false);

		// Render with openConsoles: [] and bottomPanelOpen: true on consoles tab
		act(() => {
			useUIStore.setState({
				openConsoles: [],
				activeConsoleNodeId: null,
				bottomPanelOpen: true,
				activeBottomTab: "consoles",
			});
			rerender(<BottomPanel />);
		});

		expect(useUIStore.getState().bottomPanelOpen).toBe(false);
	});
});
