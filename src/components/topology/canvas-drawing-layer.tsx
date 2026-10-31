import type React from "react";
import { useRef, useState } from "react";
import {
	generateArrowSvg,
	generateCloudSvg,
	generateEllipseSvg,
	generateLineSvg,
	generatePenSvg,
	generateRectangleSvg,
	generateTextSvg,
} from "@/features/drawings/drawing-utils";
import type { DrawingDefaults, DrawingToolType } from "@/stores/topology-store";

interface CanvasDrawingLayerProps {
	containerRef: React.RefObject<HTMLDivElement | null>;
	isDrawingMode: boolean;
	activeDrawingTool: DrawingToolType | null;
	drawingDefaults: DrawingDefaults;
	setActiveDrawingTool: (tool: DrawingToolType | null) => void;
	screenToFlowPosition: (clientPos: { x: number; y: number }) => {
		x: number;
		y: number;
	};
	activeProjectId: string | null;
	onCreateDrawing: (params: { svg: string; x: number; y: number }) => void;
}

interface DragPreviewState {
	startClient: { x: number; y: number };
	currentClient: { x: number; y: number };
	startFlow: { x: number; y: number };
	currentFlow: { x: number; y: number };
	flowPoints: Array<{ x: number; y: number }>;
	clientPoints: Array<{ x: number; y: number }>;
}

export function CanvasDrawingLayer({
	containerRef,
	isDrawingMode,
	activeDrawingTool,
	drawingDefaults,
	setActiveDrawingTool,
	screenToFlowPosition,
	activeProjectId,
	onCreateDrawing,
}: CanvasDrawingLayerProps) {
	const isMouseDownRef = useRef(false);
	const [dragPreview, setDragPreview] = useState<DragPreviewState | null>(null);

	if (!isDrawingMode) return null;

	const getLocalPoint = (e: React.MouseEvent) => {
		if (!containerRef.current) return { x: e.clientX, y: e.clientY };
		const rect = containerRef.current.getBoundingClientRect();
		return {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		};
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		if (e.button !== 0) return; // Left click only
		e.stopPropagation();
		isMouseDownRef.current = true;

		const local = getLocalPoint(e);
		const flow = screenToFlowPosition({ x: e.clientX, y: e.clientY });

		setDragPreview({
			startClient: local,
			currentClient: local,
			startFlow: flow,
			currentFlow: flow,
			clientPoints: [local],
			flowPoints: [flow],
		});
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isMouseDownRef.current || !dragPreview) return;
		const local = getLocalPoint(e);
		const flow = screenToFlowPosition({ x: e.clientX, y: e.clientY });

		setDragPreview((prev) => {
			if (!prev) return null;
			return {
				...prev,
				currentClient: local,
				currentFlow: flow,
				clientPoints: [...prev.clientPoints, local],
				flowPoints: [...prev.flowPoints, flow],
			};
		});
	};

	const handleMouseUp = (e: React.MouseEvent) => {
		if (!isMouseDownRef.current) return;
		isMouseDownRef.current = false;

		if (!dragPreview || !activeProjectId) {
			setDragPreview(null);
			return;
		}

		const flowStart = dragPreview.startFlow;
		const flowCurrent = screenToFlowPosition({ x: e.clientX, y: e.clientY });

		const width = Math.round(Math.abs(flowCurrent.x - flowStart.x));
		const height = Math.round(Math.abs(flowCurrent.y - flowStart.y));
		const minX = Math.round(Math.min(flowStart.x, flowCurrent.x));
		const minY = Math.round(Math.min(flowStart.y, flowCurrent.y));
		const isClickOnly = width < 10 && height < 10;

		let shapeX = minX;
		let shapeY = minY;
		let shapeWidth = Math.max(width, 20);
		let shapeHeight = Math.max(height, 20);

		let svg = "";
		if (activeDrawingTool === "rectangle") {
			if (isClickOnly) {
				shapeWidth = 200;
				shapeHeight = 120;
				shapeX = Math.round(flowStart.x - 100);
				shapeY = Math.round(flowStart.y - 60);
			}
			svg = generateRectangleSvg({
				width: shapeWidth,
				height: shapeHeight,
				fill: drawingDefaults.fillColor,
				fillOpacity: drawingDefaults.fillOpacity,
				stroke: drawingDefaults.strokeColor,
				strokeWidth: drawingDefaults.strokeWidth,
				strokeStyle: drawingDefaults.strokeStyle,
				cornerRadius: drawingDefaults.cornerRadius,
			});
		} else if (activeDrawingTool === "ellipse") {
			if (isClickOnly) {
				shapeWidth = 180;
				shapeHeight = 120;
				shapeX = Math.round(flowStart.x - 90);
				shapeY = Math.round(flowStart.y - 60);
			}
			svg = generateEllipseSvg({
				width: shapeWidth,
				height: shapeHeight,
				fill: drawingDefaults.fillColor,
				fillOpacity: drawingDefaults.fillOpacity,
				stroke: drawingDefaults.strokeColor,
				strokeWidth: drawingDefaults.strokeWidth,
				strokeStyle: drawingDefaults.strokeStyle,
			});
		} else if (activeDrawingTool === "text") {
			shapeX = Math.round(flowStart.x);
			shapeY = Math.round(flowStart.y);
			svg = generateTextSvg({
				text: "Annotation",
				fontSize: drawingDefaults.fontSize,
				fontFamily: drawingDefaults.fontFamily,
				fontWeight: drawingDefaults.fontWeight,
				fontStyle: drawingDefaults.fontStyle,
				color: drawingDefaults.strokeColor,
			});
		} else if (activeDrawingTool === "line") {
			if (isClickOnly) {
				shapeWidth = 160;
				shapeHeight = 40;
				shapeX = Math.round(flowStart.x);
				shapeY = Math.round(flowStart.y);
			}
			svg = generateLineSvg({
				width: shapeWidth,
				height: shapeHeight,
				stroke: drawingDefaults.strokeColor,
				strokeWidth: drawingDefaults.strokeWidth,
				strokeStyle: drawingDefaults.strokeStyle,
			});
		} else if (activeDrawingTool === "arrow") {
			if (isClickOnly) {
				shapeWidth = 180;
				shapeHeight = 40;
				shapeX = Math.round(flowStart.x);
				shapeY = Math.round(flowStart.y);
			}
			svg = generateArrowSvg({
				width: shapeWidth,
				height: shapeHeight,
				stroke: drawingDefaults.strokeColor,
				strokeWidth: drawingDefaults.strokeWidth,
				strokeStyle: drawingDefaults.strokeStyle,
			});
		} else if (activeDrawingTool === "cloud") {
			if (isClickOnly) {
				shapeWidth = 220;
				shapeHeight = 130;
				shapeX = Math.round(flowStart.x - 110);
				shapeY = Math.round(flowStart.y - 65);
			} else {
				shapeWidth = Math.max(shapeWidth, 40);
				shapeHeight = Math.max(shapeHeight, 30);
			}
			svg = generateCloudSvg({
				width: shapeWidth,
				height: shapeHeight,
				fill: drawingDefaults.fillColor,
				fillOpacity: drawingDefaults.fillOpacity,
				stroke: drawingDefaults.strokeColor,
				strokeWidth: drawingDefaults.strokeWidth,
				strokeStyle: drawingDefaults.strokeStyle,
			});
		} else if (activeDrawingTool === "pen") {
			const points = dragPreview.flowPoints;
			if (points.length < 2) {
				shapeX = Math.round(flowStart.x);
				shapeY = Math.round(flowStart.y);
				svg = generatePenSvg({
					points: [
						{ x: 0, y: 0 },
						{ x: 30, y: -20 },
						{ x: 70, y: -10 },
						{ x: 100, y: 15 },
						{ x: 130, y: -5 },
					],
					stroke: drawingDefaults.strokeColor,
					strokeWidth: drawingDefaults.strokeWidth + 1,
				});
			} else {
				shapeX = minX;
				shapeY = minY;
				const relPoints = points.map((p) => ({
					x: Math.round(p.x - minX),
					y: Math.round(p.y - minY),
				}));
				svg = generatePenSvg({
					points: relPoints,
					stroke: drawingDefaults.strokeColor,
					strokeWidth: drawingDefaults.strokeWidth + 1,
				});
			}
		}

		if (svg) {
			onCreateDrawing({
				svg,
				x: shapeX,
				y: shapeY,
			});
		}

		setDragPreview(null);
		setActiveDrawingTool(null);
	};

	return (
		<div
			className="absolute inset-0 z-10 cursor-crosshair select-none bg-transparent"
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onContextMenu={(e) => {
				e.preventDefault();
				setDragPreview(null);
				isMouseDownRef.current = false;
				setActiveDrawingTool(null);
			}}
		>
			{/* Live Drawing Rubberband Preview */}
			{dragPreview && (
				<svg
					className="absolute inset-0 w-full h-full pointer-events-none"
					style={{ overflow: "visible" }}
				>
					{activeDrawingTool === "rectangle" && (
						<rect
							x={Math.min(
								dragPreview.startClient.x,
								dragPreview.currentClient.x,
							)}
							y={Math.min(
								dragPreview.startClient.y,
								dragPreview.currentClient.y,
							)}
							width={Math.max(
								Math.abs(
									dragPreview.currentClient.x - dragPreview.startClient.x,
								),
								4,
							)}
							height={Math.max(
								Math.abs(
									dragPreview.currentClient.y - dragPreview.startClient.y,
								),
								4,
							)}
							rx={drawingDefaults.cornerRadius}
							fill={drawingDefaults.fillColor}
							fillOpacity={drawingDefaults.fillOpacity}
							stroke={drawingDefaults.strokeColor}
							strokeWidth={drawingDefaults.strokeWidth}
							strokeDasharray="4,4"
						/>
					)}
					{activeDrawingTool === "ellipse" && (
						<ellipse
							cx={(dragPreview.startClient.x + dragPreview.currentClient.x) / 2}
							cy={(dragPreview.startClient.y + dragPreview.currentClient.y) / 2}
							rx={Math.max(
								Math.abs(
									dragPreview.currentClient.x - dragPreview.startClient.x,
								) / 2,
								4,
							)}
							ry={Math.max(
								Math.abs(
									dragPreview.currentClient.y - dragPreview.startClient.y,
								) / 2,
								4,
							)}
							fill={drawingDefaults.fillColor}
							fillOpacity={drawingDefaults.fillOpacity}
							stroke={drawingDefaults.strokeColor}
							strokeWidth={drawingDefaults.strokeWidth}
							strokeDasharray="4,4"
						/>
					)}
					{(activeDrawingTool === "line" || activeDrawingTool === "arrow") && (
						<line
							x1={dragPreview.startClient.x}
							y1={dragPreview.startClient.y}
							x2={dragPreview.currentClient.x}
							y2={dragPreview.currentClient.y}
							stroke={drawingDefaults.strokeColor}
							strokeWidth={drawingDefaults.strokeWidth}
							strokeDasharray="4,4"
						/>
					)}
					{activeDrawingTool === "cloud" && (
						<rect
							x={Math.min(
								dragPreview.startClient.x,
								dragPreview.currentClient.x,
							)}
							y={Math.min(
								dragPreview.startClient.y,
								dragPreview.currentClient.y,
							)}
							width={Math.max(
								Math.abs(
									dragPreview.currentClient.x - dragPreview.startClient.x,
								),
								4,
							)}
							height={Math.max(
								Math.abs(
									dragPreview.currentClient.y - dragPreview.startClient.y,
								),
								4,
							)}
							rx={16}
							fill={drawingDefaults.fillColor}
							fillOpacity={drawingDefaults.fillOpacity}
							stroke={drawingDefaults.strokeColor}
							strokeWidth={drawingDefaults.strokeWidth}
							strokeDasharray="4,4"
						/>
					)}
					{activeDrawingTool === "pen" &&
						dragPreview.clientPoints.length > 1 && (
							<path
								d={`M ${dragPreview.clientPoints.map((p) => `${p.x} ${p.y}`).join(" L ")}`}
								fill="none"
								stroke={drawingDefaults.strokeColor}
								strokeWidth={drawingDefaults.strokeWidth + 1}
							/>
						)}
				</svg>
			)}
		</div>
	);
}
