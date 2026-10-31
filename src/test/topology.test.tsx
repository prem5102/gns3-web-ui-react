import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import {
	applyNodeChanges,
	Controls,
	type Node,
	type NodeChange,
	Position,
	ReactFlow,
	ReactFlowProvider,
} from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";
import { CanvasToolbar } from "@/components/topology/canvas-toolbar";
import { DeviceNode } from "@/components/topology/device-node";
import { TopologyEdge } from "@/components/topology/topology-edge";
import { useTopologyStore } from "@/stores/topology-store";
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

vi.mock("@/features/links/use-links", () => ({
	useProjectLinks: () => ({ data: [] }),
	useCreateLink: () => ({
		mutate: vi.fn(),
		mutateAsync: vi.fn(),
		isPending: false,
	}),
}));

vi.mock("@xyflow/react", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@xyflow/react")>();
	return {
		...actual,
		EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => (
			<div data-testid="edge-label-renderer">{children}</div>
		),
	};
});

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
		// Port number removed from node; only icon and name kept
		expect(screen.queryByText(":5000")).toBeNull();

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
		const testQueryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		useUIStore.setState({ theme: "dark" });
		const { rerender } = render(
			<QueryClientProvider client={testQueryClient}>
				<ReactFlowProvider>
					<CanvasToolbar />
				</ReactFlowProvider>
			</QueryClientProvider>,
		);

		const themeBtn = screen.getByTitle("Switch to Light Mode");
		expect(themeBtn).toBeDefined();

		act(() => {
			themeBtn.click();
		});
		expect(useUIStore.getState().theme).toBe("light");

		rerender(
			<QueryClientProvider client={testQueryClient}>
				<ReactFlowProvider>
					<CanvasToolbar />
				</ReactFlowProvider>
			</QueryClientProvider>,
		);
		expect(screen.getByTitle("Switch to Dark Mode")).toBeDefined();
	});

	it("renders combined floating toolbar with node, canvas, drawing, and theme controls at top center", () => {
		const testQueryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		const { container } = render(
			<QueryClientProvider client={testQueryClient}>
				<ReactFlowProvider>
					<CanvasToolbar />
				</ReactFlowProvider>
			</QueryClientProvider>,
		);

		// Verified positioned at top-center
		const toolbar = container.querySelector(
			".top-4.left-1\\/2.-translate-x-1\\/2",
		);
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
		expect(
			screen.getByTitle("Draw Rectangle (R) - Click canvas to place"),
		).toBeDefined();
		expect(
			screen.getByTitle("Draw Ellipse / Circle (E) - Click canvas to place"),
		).toBeDefined();
		expect(
			screen.getByTitle("Add Text Annotation (T) - Click canvas to place"),
		).toBeDefined();
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

	it("renders DeviceNode with connection button on hover, center handles only, and no side handles", () => {
		const mockNodeWithPorts = {
			node_id: "node-sw1",
			project_id: "proj-1",
			name: "SW1",
			node_type: "ethernet_switch",
			status: "started" as const,
			x: 100,
			y: 100,
			console: 5001,
			ports: [
				{ name: "FastEthernet0/0", adapter_number: 0, port_number: 0 },
				{ name: "FastEthernet0/1", adapter_number: 0, port_number: 1 },
			],
		};

		const { container } = render(
			<ReactFlowProvider>
				<DeviceNode
					id="node-sw1"
					data={{ node: mockNodeWithPorts }}
					selected={false}
					type="deviceNode"
					zIndex={1}
					isConnectable={true}
					positionAbsoluteX={100}
					positionAbsoluteY={100}
					dragging={false}
					draggable={true}
					selectable={true}
					deletable={true}
				/>
			</ReactFlowProvider>,
		);

		// Connect interfaces button on hover exists
		const connectBtn = screen.getByTitle("Connect Interfaces");
		expect(connectBtn).toBeDefined();

		// Node port number (:5001) is removed; only icon and name are displayed
		expect(screen.getByText("SW1")).toBeDefined();
		expect(screen.queryByText(":5001")).toBeNull();

		// Handles: verify center handles exist and side handles (top, bottom, left, right) are removed
		const handles = container.querySelectorAll(".react-flow__handle");
		const handleIds = Array.from(handles).map((h) =>
			h.getAttribute("data-handleid"),
		);
		expect(handleIds).toContain("target");
		expect(handleIds).toContain("source");
		expect(handleIds).not.toContain("top");
		expect(handleIds).not.toContain("bottom");
		expect(handleIds).not.toContain("left");
		expect(handleIds).not.toContain("right");
	});

	it("renders multiple connections between the same two nodes with parallel perpendicular offsets", () => {
		// Render link 1 of 2
		const { container: container1 } = render(
			<ReactFlowProvider>
				<svg>
					<TopologyEdge
						id="link-1"
						source="node-1"
						target="node-2"
						sourceX={100}
						sourceY={100}
						targetX={300}
						targetY={100}
						sourcePosition={Position.Top}
						targetPosition={Position.Top}
						selected={false}
						data={{
							linkId: "link-1",
							sourceLabel: "e0",
							targetLabel: "e0",
							linkIndex: 0,
							totalLinks: 2,
							isCanonical: true,
						}}
					/>
				</svg>
			</ReactFlowProvider>,
		);

		// Render link 2 of 2
		const { container: container2 } = render(
			<ReactFlowProvider>
				<svg>
					<TopologyEdge
						id="link-2"
						source="node-1"
						target="node-2"
						sourceX={100}
						sourceY={100}
						targetX={300}
						targetY={100}
						sourcePosition={Position.Top}
						targetPosition={Position.Top}
						selected={false}
						data={{
							linkId: "link-2",
							sourceLabel: "e1",
							targetLabel: "e1",
							linkIndex: 1,
							totalLinks: 2,
							isCanonical: true,
						}}
					/>
				</svg>
			</ReactFlowProvider>,
		);

		const path1 =
			container1.querySelectorAll("path")[1]?.getAttribute("d") ||
			container1.querySelector("path")?.getAttribute("d");
		const path2 =
			container2.querySelectorAll("path")[1]?.getAttribute("d") ||
			container2.querySelector("path")?.getAttribute("d");

		expect(path1).toBeDefined();
		expect(path2).toBeDefined();
		// The two paths must be distinct, offset in parallel, and strictly within node size (±3px for 2 links)
		expect(path1).not.toEqual(path2);
		expect(path1).toBe("M 100,97L 300,97");
		expect(path2).toBe("M 100,103L 300,103");

		// When totalLinks > 1, multiple labels are hidden by default to prevent overlapping
		expect(screen.queryByText("e0")).toBeNull();

		// When hoveredNodeId is set to node-1, labels become visible on hover for the two nodes
		act(() => {
			useTopologyStore.getState().setHoveredNodeId("node-1");
		});
		expect(screen.queryAllByText("e0").length).toBeGreaterThan(0);
	});
});
