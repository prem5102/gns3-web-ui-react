import { describe, expect, it } from "vitest";
import {
	generateArrowSvg,
	generateCloudSvg,
	generateEllipseSvg,
	generateImageSvg,
	generateLineSvg,
	generatePenSvg,
	generateRectangleSvg,
	generateTextSvg,
	parseSvgContent,
	updateSvgDimensions,
} from "@/features/drawings/drawing-utils";
import { useTopologyStore } from "@/stores/topology-store";

describe("Drawing Tools & SVG Generators", () => {
	it("generates rectangle SVG with correct attributes", () => {
		const svg = generateRectangleSvg({
			width: 200,
			height: 100,
			fill: "#3b82f6",
			fillOpacity: 0.2,
			stroke: "#2563eb",
			strokeWidth: 2,
			cornerRadius: 12,
		});

		expect(svg).toContain("<rect");
		expect(svg).toContain('width="200"');
		expect(svg).toContain('height="100"');
		expect(svg).toContain('rx="12"');
		expect(svg).toContain('fill="#3b82f6"');
		expect(svg).toContain('fill-opacity="0.2"');

		const parsed = parseSvgContent(svg);
		expect(parsed.type).toBe("rectangle");
		expect(parsed.fill).toBe("#3b82f6");
		expect(parsed.cornerRadius).toBe(12);
	});

	it("generates ellipse SVG with correct attributes", () => {
		const svg = generateEllipseSvg({
			width: 150,
			height: 100,
			fill: "#8b5cf6",
			fillOpacity: 0.15,
			stroke: "#7c3aed",
			strokeWidth: 2,
		});

		expect(svg).toContain("<ellipse");
		expect(svg).toContain('fill="#8b5cf6"');

		const parsed = parseSvgContent(svg);
		expect(parsed.type).toBe("ellipse");
		expect(parsed.fill).toBe("#8b5cf6");
	});

	it("generates text annotation SVG and parses content", () => {
		const svg = generateTextSvg({
			text: "VLAN 10 - Users\n192.168.10.0/24",
			fontSize: 16,
			color: "#ef4444",
		});

		expect(svg).toContain("<text");
		expect(svg).toContain("VLAN 10 - Users");
		expect(svg).toContain("192.168.10.0/24");

		const parsed = parseSvgContent(svg);
		expect(parsed.type).toBe("text");
		expect(parsed.text).toContain("VLAN 10 - Users");
		expect(parsed.fontSize).toBe(16);
		expect(parsed.stroke).toBe("#ef4444");
	});

	it("generates straight line SVG", () => {
		const svg = generateLineSvg({
			width: 180,
			height: 20,
			stroke: "#64748b",
			strokeWidth: 3,
			strokeStyle: "dashed",
		});

		expect(svg).toContain("<line");
		expect(svg).toContain('stroke-dasharray="9,6"');

		const parsed = parseSvgContent(svg);
		expect(parsed.type).toBe("line");
		expect(parsed.stroke).toBe("#64748b");
		expect(parsed.strokeWidth).toBe(3);
		expect(parsed.strokeStyle).toBe("dashed");
	});

	it("generates arrow SVG with polygon head", () => {
		const svg = generateArrowSvg({
			width: 200,
			height: 40,
			stroke: "#2563eb",
			strokeWidth: 2,
			arrowType: "double",
		});

		expect(svg).toContain("<line");
		expect(svg).toContain("<polygon");

		const parsed = parseSvgContent(svg);
		expect(parsed.type).toBe("arrow");
		expect(parsed.stroke).toBe("#2563eb");
	});

	it("generates network cloud boundary SVG", () => {
		const svg = generateCloudSvg({
			width: 250,
			height: 150,
			fill: "#0284c7",
			fillOpacity: 0.25,
			stroke: "#0369a1",
		});

		expect(svg).toContain("<path");
		expect(svg).toContain('fill="#0284c7"');

		const parsed = parseSvgContent(svg);
		expect(parsed.type).toBe("cloud");
		expect(parsed.fill).toBe("#0284c7");
	});

	it("generates freehand pen sketch SVG", () => {
		const points = [
			{ x: 10, y: 10 },
			{ x: 30, y: 25 },
			{ x: 60, y: 15 },
		];
		const svg = generatePenSvg({
			points,
			stroke: "#f59e0b",
			strokeWidth: 4,
		});

		expect(svg).toContain("<path");
		expect(svg).toContain('stroke="#f59e0b"');

		const parsed = parseSvgContent(svg);
		expect(parsed.type).toBe("pen");
	});

	it("generates image SVG with href", () => {
		const svg = generateImageSvg({
			width: 200,
			height: 150,
			href: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
		});

		expect(svg).toContain("<image");
		expect(svg).toContain("data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==");

		const parsed = parseSvgContent(svg);
		expect(parsed.type).toBe("image");
		expect(parsed.href).toBe("data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==");
	});

	it("updates SVG dimensions dynamically on resize", () => {
		const original = generateRectangleSvg({
			width: 100,
			height: 80,
			fill: "#10b981",
		});

		const resized = updateSvgDimensions(original, 250, 180);
		const parsed = parseSvgContent(resized);

		expect(parsed.width).toBe(252); // width + strokeWidth
		expect(parsed.height).toBe(182);
		expect(parsed.fill).toBe("#10b981");
	});

	it("manages drawing state in topology store", () => {
		const store = useTopologyStore.getState();

		store.setActiveDrawingTool("rectangle");
		expect(useTopologyStore.getState().activeDrawingTool).toBe("rectangle");

		store.selectDrawing("drawing-uuid-123");
		expect(useTopologyStore.getState().selectedDrawingId).toBe(
			"drawing-uuid-123",
		);
		expect(useTopologyStore.getState().selectedNodeId).toBeNull();

		store.clearSelection();
		expect(useTopologyStore.getState().selectedDrawingId).toBeNull();

		store.setDrawingDefaults({ fillColor: "#dc2626", strokeWidth: 4 });
		expect(useTopologyStore.getState().drawingDefaults.fillColor).toBe(
			"#dc2626",
		);
		expect(useTopologyStore.getState().drawingDefaults.strokeWidth).toBe(4);
	});
});
