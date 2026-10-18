import { act, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { BottomPanel } from "@/components/layout/bottom-panel";
import { Sidebar } from "@/components/layout/sidebar";
import { NodeModelModal } from "@/components/topology/node-model-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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

	it("renders Console, Events and Config Editor at the bottom of the sidebar near Settings", () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});

		render(
			<QueryClientProvider client={queryClient}>
				<Sidebar />
			</QueryClientProvider>,
		);

		const consoleBtn = screen.getByTitle(/Consoles/i);
		const editorBtn = screen.getByTitle("Configuration Editor");
		const eventsBtn = screen.getByTitle(/Controller Events/i);
		const settingsBtn = screen.getByTitle("Settings & Preferences");

		expect(consoleBtn).toBeDefined();
		expect(editorBtn).toBeDefined();
		expect(eventsBtn).toBeDefined();
		expect(settingsBtn).toBeDefined();

		// Clicking console button toggles activeBottomTab to "consoles" and opens bottom panel
		act(() => {
			consoleBtn.click();
		});
		expect(useUIStore.getState().bottomPanelOpen).toBe(true);
		expect(useUIStore.getState().activeBottomTab).toBe("consoles");

		// Clicking editor button switches activeBottomTab to "editor"
		act(() => {
			editorBtn.click();
		});
		expect(useUIStore.getState().bottomPanelOpen).toBe(true);
		expect(useUIStore.getState().activeBottomTab).toBe("editor");

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
});
