import { render, screen } from "@testing-library/react";
import {
	applyNodeChanges,
	type Node,
	type NodeChange,
	ReactFlowProvider,
} from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";
import { DeviceNode } from "@/components/topology/device-node";

// Mock Query Client / Hooks
vi.mock("@/features/nodes/use-nodes", () => ({
	useStartNode: () => ({ mutate: vi.fn() }),
	useStopNode: () => ({ mutate: vi.fn() }),
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
});
