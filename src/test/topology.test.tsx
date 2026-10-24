import { act, render, screen } from "@testing-library/react";
import {
	applyNodeChanges,
	Controls,
	type Node,
	type NodeChange,
	ReactFlow,
	ReactFlowProvider,
} from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";
import { CanvasToolbar } from "@/components/topology/canvas-toolbar";
import { DeviceNode } from "@/components/topology/device-node";
import { useUIStore } from "@/stores/ui-store";

// Mock Query Client / Hooks
vi.mock("@/features/nodes/use-nodes", () => ({
	useStartNode: () => ({ mutate: vi.fn() }),
	useStopNode: () => ({ mutate: vi.fn() }),
	useStartAllNodes: () => ({ mutate: vi.fn(), isPending: false }),
	useStopAllNodes: () => ({ mutate: vi.fn(), isPending: false }),
	useProjectNodes: () => ({ data: [] }),
}));

vi.mock("@/features/drawings/use-drawings", () => ({
	useCreateDrawing: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("Topology Live Dragging & Device Node", () => {
	it("renders DeviceNode with grab cursor classes for live dragging", () => {
		const mockGns3Node = {
			node_id: "test-node-1",
			project_id: "proj-1",
			name: "R1",
			node_type: "dynamips",
			status: "started" as const,
			x: 100,
			y: 200,
			console: 5000,
			console_type: "telnet",
		};

		const { container } = render(
			<ReactFlowProvider>
				<DeviceNode
					id="test-node-1"
					data={{ node: mockGns3Node }}
					selected={false}
					type="deviceNode"
					zIndex={1}
					isConnectable={true}
					positionAbsoluteX={100}
					positionAbsoluteY={200}
					dragging={false}
					draggable={true}
					selectable={true}
					deletable={true}
				/>
			</ReactFlowProvider>,
		);

		expect(screen.getByText("R1")).toBeDefined();
		expect(screen.getByText(":5000")).toBeDefined();

		// Verify GNS3 SVG symbol image is rendered
		const symbolImg = screen.getByRole("img", { name: "R1" });
		expect(symbolImg).toBeDefined();
		expect(symbolImg.getAttribute("src")).toBe(
			"/symbols/blue/sq_router_blue.svg",
		);

		// Verify grab cursor styling is present for dragging
		const rootDiv = container.querySelector(".cursor-grab");
		expect(rootDiv).toBeDefined();
	});

	it("updates node position in real-time during live dragging using applyNodeChanges", () => {
		const initialNodes: Node[] = [
			{
				id: "node-1",
				type: "deviceNode",
				position: { x: 50, y: 50 },
				data: { label: "Router 1" },
			},
			{
				id: "node-2",
				type: "deviceNode",
				position: { x: 200, y: 150 },
				data: { label: "Switch 1" },
			},
		];

		// Simulate live dragging mousemove changes emitted by React Flow
		const dragChanges: NodeChange[] = [
			{
				id: "node-1",
				type: "position",
				position: { x: 75, y: 80 },
				dragging: true,
			},
		];

		const updatedNodes = applyNodeChanges(dragChanges, initialNodes);

		expect(updatedNodes[0].position).toEqual({ x: 75, y: 80 });
		expect(updatedNodes[0].dragging).toBe(true);
		// Other node remains untouched
		expect(updatedNodes[1].position).toEqual({ x: 200, y: 150 });

		// Simulate further drag move
		const dragChanges2: NodeChange[] = [
			{
				id: "node-1",
				type: "position",
				position: { x: 120, y: 140 },
				dragging: true,
			},
		];

		const finalNodes = applyNodeChanges(dragChanges2, updatedNodes);
		expect(finalNodes[0].position).toEqual({ x: 120, y: 140 });
	});

	it("renders CanvasToolbar with theme toggle button and switches theme", () => {
		useUIStore.setState({ theme: "dark" });
		const { rerender } = render(
			<ReactFlowProvider>
				<CanvasToolbar />
			</ReactFlowProvider>,
		);

		const themeBtn = screen.getByTitle("Switch to Light Mode");
		expect(themeBtn).toBeDefined();

		act(() => {
			themeBtn.click();
		});
		expect(useUIStore.getState().theme).toBe("light");

		rerender(
			<ReactFlowProvider>
				<CanvasToolbar />
			</ReactFlowProvider>,
		);
		expect(screen.getByTitle("Switch to Dark Mode")).toBeDefined();
	});

	it("renders combined floating toolbar with node, canvas, drawing, and theme controls at top center", () => {
		const { container } = render(
			<ReactFlowProvider>
				<CanvasToolbar />
			</ReactFlowProvider>,
		);

		// Verified positioned at top-center
		const toolbar = container.querySelector(".top-4.left-1\\/2.-translate-x-1\\/2");
		expect(toolbar).not.toBeNull();

		// Node controls
		expect(screen.getByTitle("Start All Nodes")).toBeDefined();
		expect(screen.getByTitle("Stop All Nodes")).toBeDefined();

		// Canvas controls
		expect(screen.getByTitle("Toggle Canvas Grid")).toBeDefined();
		expect(screen.getByTitle("Toggle Snap to Grid")).toBeDefined();
		expect(screen.getByTitle("Toggle Interface Labels")).toBeDefined();
		expect(screen.getByTitle("Fit View")).toBeDefined();

		// Drawing tools
		expect(screen.getByTitle("Pointer / Select Tool (V)")).toBeDefined();
		expect(screen.getByTitle("Draw Rectangle (R) - Click canvas to place")).toBeDefined();
		expect(screen.getByTitle("Draw Ellipse / Circle (E) - Click canvas to place")).toBeDefined();
		expect(screen.getByTitle("Add Text Annotation (T) - Click canvas to place")).toBeDefined();
		expect(screen.getByTitle("Draw Line (L)")).toBeDefined();
		expect(screen.getByTitle("Draw Flow Arrow (A)")).toBeDefined();
		expect(screen.getByTitle("Draw Cloud Boundary (C)")).toBeDefined();
		expect(screen.getByTitle("Freehand Sketch / Pencil (P)")).toBeDefined();
	});

	it("updates React Flow container dark class based on colorMode prop", () => {
		const { container, rerender } = render(
			<ReactFlowProvider>
				<ReactFlow colorMode="dark">
					<Controls />
				</ReactFlow>
			</ReactFlowProvider>,
		);

		const rfElement = container.querySelector(".react-flow");
		expect(rfElement).toBeDefined();
		expect(rfElement?.classList.contains("dark")).toBe(true);

		rerender(
			<ReactFlowProvider>
				<ReactFlow colorMode="light">
					<Controls />
				</ReactFlow>
			</ReactFlowProvider>,
		);

		expect(rfElement?.classList.contains("dark")).toBe(false);
	});
});
