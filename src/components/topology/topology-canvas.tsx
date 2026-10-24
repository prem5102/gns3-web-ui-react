import {
	applyEdgeChanges,
	applyNodeChanges,
	Background,
	BackgroundVariant,
	type Connection,
	Controls,
	type Edge,
	type EdgeChange,
	type Node,
	type NodeChange,
	ReactFlow,
	useReactFlow,
} from "@xyflow/react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import "@xyflow/react/dist/style.css";

import {
	generateArrowSvg,
	generateCloudSvg,
	generateEllipseSvg,
	generateLineSvg,
	generatePenSvg,
	generateRectangleSvg,
	generateTextSvg,
} from "@/features/drawings/drawing-utils";
import {
	useCreateDrawing,
	useDeleteDrawing,
	useProjectDrawings,
	useUpdateDrawing,
} from "@/features/drawings/use-drawings";
import { useProjectLinks } from "@/features/links/use-links";
import { useProjectNodes, useUpdateNode } from "@/features/nodes/use-nodes";
import { useCreateNodeFromTemplate } from "@/features/templates/use-templates";
import { useTopologyStore } from "@/stores/topology-store";
import { useUIStore } from "@/stores/ui-store";
import type { GNS3Drawing, GNS3Link, GNS3Node } from "@/types/gns3";
import { CanvasToolbar } from "./canvas-toolbar";
import { DeviceNode } from "./device-node";
import { DrawingNode } from "./drawing-node";
import { LinkDialog } from "./link-dialog";
import { TopologyEdge, type TopologyEdgeData } from "./topology-edge";
import { cn } from "@/lib/utils";

const EMPTY_NODES: GNS3Node[] = [];
const EMPTY_LINKS: GNS3Link[] = [];
const EMPTY_DRAWINGS: GNS3Drawing[] = [];

const nodeTypes = {
	deviceNode: DeviceNode,
	drawingNode: DrawingNode,
};

const edgeTypes = {
	topologyEdge: TopologyEdge,
};

export function TopologyCanvas() {
	const {
		activeProjectId,
		selectedNodeId,
		selectedLinkId,
		selectedDrawingId,
		selectNode,
		selectLink,
		selectDrawing,
		clearSelection,
		activeDrawingTool,
		setActiveDrawingTool,
		drawingDefaults,
		showGrid,
		snapToGrid,
		gridSize,
		openLinkDialog,
	} = useTopologyStore();

	const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
	const theme = useUIStore((s) => s.theme);

	const { data: gns3Nodes = EMPTY_NODES } = useProjectNodes(activeProjectId);
	const { data: gns3Links = EMPTY_LINKS } = useProjectLinks(activeProjectId);
	const { data: gns3Drawings = EMPTY_DRAWINGS } =
		useProjectDrawings(activeProjectId);

	const updateNodeMutation = useUpdateNode(activeProjectId || "");
	const createFromTemplateMutation = useCreateNodeFromTemplate(
		activeProjectId || "",
	);
	const updateDrawingMutation = useUpdateDrawing(activeProjectId || "");
	const createDrawingMutation = useCreateDrawing(activeProjectId || "");
	const deleteDrawingMutation = useDeleteDrawing(activeProjectId || "");

	const { screenToFlowPosition, fitView } = useReactFlow();

	// Local state for interactive 60fps nodes and edges
	const [nodes, setNodes] = useState<Node[]>([]);
	const [edges, setEdges] = useState<Edge[]>([]);

	// Container ref for relative client coordinate calculations
	const containerRef = useRef<HTMLDivElement>(null);

	// Drawing mode state
	const isDrawingMode = Boolean(
		activeDrawingTool && activeDrawingTool !== "select",
	);
	const isMouseDownRef = useRef(false);
	const [dragPreview, setDragPreview] = useState<{
		startClient: { x: number; y: number };
		currentClient: { x: number; y: number };
		startFlow: { x: number; y: number };
		currentFlow: { x: number; y: number };
		flowPoints: Array<{ x: number; y: number }>;
		clientPoints: Array<{ x: number; y: number }>;
	} | null>(null);

	// Track dragging to prevent background query refetches from overwriting active drags
	const isDraggingRef = useRef(false);
	const hasFittedRef = useRef<string | null>(null);

	// Synchronize GNS3 nodes AND drawings to React Flow nodes with smart diffing
	useEffect(() => {
		setNodes((prevNodes) => {
			const prevMap = new Map(prevNodes.map((n) => [n.id, n]));
			let hasChanges =
				prevNodes.length !== gns3Nodes.length + gns3Drawings.length;

			// 1. Map Device Nodes (zIndex: 50 by default so devices are in foreground)
			const nextDeviceNodes: Node[] = gns3Nodes.map((n) => {
				const existing = prevMap.get(n.node_id);
				if (!existing) {
					hasChanges = true;
					return {
						id: n.node_id,
						type: "deviceNode",
						position: { x: n.x, y: n.y },
						selected: n.node_id === selectedNodeId,
						zIndex: 50,
						data: { node: n },
					};
				}

				const isCurrentlyDragging = isDraggingRef.current;
				const targetX = isCurrentlyDragging ? existing.position.x : n.x;
				const targetY = isCurrentlyDragging ? existing.position.y : n.y;
				const isSelected = n.node_id === selectedNodeId;

				const posChanged =
					Math.abs(existing.position.x - targetX) > 0.01 ||
					Math.abs(existing.position.y - targetY) > 0.01;

				const selChanged = Boolean(existing.selected) !== isSelected;

				const prevDataNode = (existing.data as { node?: GNS3Node } | undefined)
					?.node;
				const dataChanged =
					!prevDataNode ||
					prevDataNode.status !== n.status ||
					prevDataNode.name !== n.name ||
					prevDataNode.console !== n.console ||
					prevDataNode.node_type !== n.node_type ||
					prevDataNode.ports?.length !== n.ports?.length;

				if (posChanged || selChanged || dataChanged) {
					hasChanges = true;
				}

				return {
					...existing,
					id: n.node_id,
					type: "deviceNode",
					position: { x: targetX, y: targetY },
					selected: isSelected,
					zIndex: 50,
					data: { node: n },
				};
			});

			// 2. Map Drawing Annotations (zIndex: >= 1 so drawings are in front of background canvas and behind devices)
			const nextDrawingNodes: Node[] = gns3Drawings.map((d) => {
				const rfId = `drawing-${d.drawing_id}`;
				const existing = prevMap.get(rfId);
				const drawingZIndex = Math.max(1, (d.z ?? 0) + 1);

				if (!existing) {
					hasChanges = true;
					return {
						id: rfId,
						type: "drawingNode",
						position: { x: d.x, y: d.y },
						selected: d.drawing_id === selectedDrawingId,
						draggable: !d.locked,
						selectable: true,
						zIndex: drawingZIndex,
						data: { drawing: d },
					};
				}

				const isCurrentlyDragging = isDraggingRef.current;
				const targetX = isCurrentlyDragging ? existing.position.x : d.x;
				const targetY = isCurrentlyDragging ? existing.position.y : d.y;
				const isSelected = d.drawing_id === selectedDrawingId;

				const posChanged =
					Math.abs(existing.position.x - targetX) > 0.01 ||
					Math.abs(existing.position.y - targetY) > 0.01;

				const selChanged = Boolean(existing.selected) !== isSelected;

				const prevDataDrawing = (
					existing.data as { drawing?: GNS3Drawing } | undefined
				)?.drawing;
				const dataChanged =
					!prevDataDrawing ||
					prevDataDrawing.svg !== d.svg ||
					prevDataDrawing.rotation !== d.rotation ||
					prevDataDrawing.locked !== d.locked ||
					prevDataDrawing.z !== d.z;

				if (posChanged || selChanged || dataChanged) {
					hasChanges = true;
				}

				return {
					...existing,
					id: rfId,
					type: "drawingNode",
					position: { x: targetX, y: targetY },
					selected: isSelected,
					draggable: !d.locked,
					selectable: true,
					zIndex: drawingZIndex,
					data: { drawing: d },
				};
			});

			if (!hasChanges) {
				return prevNodes;
			}

			return [...nextDrawingNodes, ...nextDeviceNodes];
		});
	}, [gns3Nodes, gns3Drawings, selectedNodeId, selectedDrawingId]);

	// Synchronize GNS3 links to React Flow edges with smart diffing
	useEffect(() => {
		setEdges((prevEdges) => {
			const prevMap = new Map(prevEdges.map((e) => [e.id, e]));
			const validLinks = gns3Links.filter(
				(l) => l.nodes && l.nodes.length >= 2,
			);

			let hasChanges = prevEdges.length !== validLinks.length;

			const nextEdges: Edge[] = validLinks.map((l) => {
				const existing = prevMap.get(l.link_id);
				const sourceEndpoint = l.nodes[0];
				const targetEndpoint = l.nodes[1];

				const sNode = gns3Nodes.find(
					(n) => n.node_id === sourceEndpoint.node_id,
				);
				const tNode = gns3Nodes.find(
					(n) => n.node_id === targetEndpoint.node_id,
				);

				const sPort = sNode?.ports?.find(
					(p) =>
						p.adapter_number === sourceEndpoint.adapter_number &&
						p.port_number === sourceEndpoint.port_number,
				);
				const tPort = tNode?.ports?.find(
					(p) =>
						p.adapter_number === targetEndpoint.adapter_number &&
						p.port_number === targetEndpoint.port_number,
				);

				const sourceLabel =
					sourceEndpoint.label?.text ||
					sPort?.short_name ||
					sPort?.name ||
					`e${sourceEndpoint.port_number}`;
				const targetLabel =
					targetEndpoint.label?.text ||
					tPort?.short_name ||
					tPort?.name ||
					`e${targetEndpoint.port_number}`;

				const isSelected = l.link_id === selectedLinkId;

				const prevData = existing?.data as TopologyEdgeData | undefined;
				if (
					!existing ||
					existing.source !== sourceEndpoint.node_id ||
					existing.target !== targetEndpoint.node_id ||
					Boolean(existing.selected) !== isSelected ||
					prevData?.sourceLabel !== sourceLabel ||
					prevData?.targetLabel !== targetLabel ||
					prevData?.capturing !== l.capturing ||
					prevData?.suspend !== l.suspend
				) {
					hasChanges = true;
				}

				return {
					...existing,
					id: l.link_id,
					source: sourceEndpoint.node_id,
					target: targetEndpoint.node_id,
					type: "topologyEdge",
					selected: isSelected,
					data: {
						linkId: l.link_id,
						sourceLabel,
						targetLabel,
						capturing: l.capturing,
						suspend: l.suspend,
					},
				};
			});

			if (!hasChanges) {
				return prevEdges;
			}

			return nextEdges;
		});
	}, [gns3Links, gns3Nodes, selectedLinkId]);

	// Automatically fit topology into view on initial project load
	useEffect(() => {
		if (
			activeProjectId &&
			gns3Nodes.length > 0 &&
			hasFittedRef.current !== activeProjectId
		) {
			hasFittedRef.current = activeProjectId;
			const timer = setTimeout(() => {
				fitView({ padding: 0.2, duration: 350 });
			}, 80);
			return () => clearTimeout(timer);
		}
	}, [activeProjectId, gns3Nodes.length, fitView]);

	// Keyboard Shortcuts (Delete, Escape, Ctrl+D Duplicate)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;
			if (
				target &&
				(target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					target.isContentEditable)
			) {
				return;
			}

			if (e.key === "Delete" || e.key === "Backspace") {
				if (selectedDrawingId && activeProjectId) {
					e.preventDefault();
					deleteDrawingMutation.mutate(selectedDrawingId);
					selectDrawing(null);
				}
			} else if (e.key === "Escape") {
				setActiveDrawingTool(null);
				setDragPreview(null);
				isMouseDownRef.current = false;
				clearSelection();
			} else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
				if (selectedDrawingId && activeProjectId) {
					e.preventDefault();
					const d = gns3Drawings.find(
						(x) => x.drawing_id === selectedDrawingId,
					);
					if (d) {
						createDrawingMutation.mutate({
							project_id: activeProjectId,
							svg: d.svg,
							x: d.x + 25,
							y: d.y + 25,
							z: d.z,
							rotation: d.rotation,
							locked: false,
						});
					}
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		activeProjectId,
		selectedDrawingId,
		gns3Drawings,
		deleteDrawingMutation,
		createDrawingMutation,
		selectDrawing,
		setActiveDrawingTool,
		clearSelection,
	]);

	// Handle React Flow node changes
	const onNodesChange = useCallback((changes: NodeChange[]) => {
		setNodes((nds) => applyNodeChanges(changes, nds));
	}, []);

	// Handle React Flow edge changes
	const onEdgesChange = useCallback((changes: EdgeChange[]) => {
		setEdges((eds) => applyEdgeChanges(changes, eds));
	}, []);

	// Drag Lifecycle Handlers
	const onNodeDragStart = useCallback((_event: unknown, _node: Node) => {
		isDraggingRef.current = true;
	}, []);

	const onNodeDragStop = useCallback(
		(_event: unknown, node: Node, draggedNodes: Node[]) => {
			isDraggingRef.current = false;
			if (!activeProjectId) return;

			const nodesToPersist =
				draggedNodes && draggedNodes.length > 0 ? draggedNodes : [node];

			for (const n of nodesToPersist) {
				if (n.type === "drawingNode") {
					const drawingData = (n.data as { drawing?: GNS3Drawing })?.drawing;
					if (drawingData) {
						updateDrawingMutation.mutate({
							drawingId: drawingData.drawing_id,
							data: {
								x: Math.round(n.position.x),
								y: Math.round(n.position.y),
							},
						});
					}
				} else {
					updateNodeMutation.mutate({
						nodeId: n.id,
						data: {
							x: Math.round(n.position.x),
							y: Math.round(n.position.y),
						},
					});
				}
			}
		},
		[activeProjectId, updateNodeMutation, updateDrawingMutation],
	);

	const onSelectionDragStart = useCallback(() => {
		isDraggingRef.current = true;
	}, []);

	const onSelectionDragStop = useCallback(
		(_event: unknown, draggedNodes: Node[]) => {
			isDraggingRef.current = false;
			if (!activeProjectId) return;

			for (const n of draggedNodes) {
				if (n.type === "drawingNode") {
					const drawingData = (n.data as { drawing?: GNS3Drawing })?.drawing;
					if (drawingData) {
						updateDrawingMutation.mutate({
							drawingId: drawingData.drawing_id,
							data: {
								x: Math.round(n.position.x),
								y: Math.round(n.position.y),
							},
						});
					}
				} else {
					updateNodeMutation.mutate({
						nodeId: n.id,
						data: {
							x: Math.round(n.position.x),
							y: Math.round(n.position.y),
						},
					});
				}
			}
		},
		[activeProjectId, updateNodeMutation, updateDrawingMutation],
	);

	// Handle Drag & Drop of Templates onto Canvas
	const onDragOver = useCallback((event: React.DragEvent) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "copy";
	}, []);

	const onDrop = useCallback(
		(event: React.DragEvent) => {
			event.preventDefault();
			const templateId = event.dataTransfer.getData(
				"application/gns3-template",
			);
			if (!templateId || !activeProjectId) return;

			const position = screenToFlowPosition({
				x: event.clientX,
				y: event.clientY,
			});

			createFromTemplateMutation.mutate({
				templateId,
				x: Math.round(position.x),
				y: Math.round(position.y),
			});
		},
		[activeProjectId, createFromTemplateMutation, screenToFlowPosition],
	);

	// Handle Connect -> open LinkDialog
	const onConnect = useCallback(
		(params: Connection) => {
			if (params.source && params.target && params.source !== params.target) {
				openLinkDialog(params.source, params.target);
			}
		},
		[openLinkDialog],
	);

	// Relative local point inside canvas wrapper
	const getLocalPoint = (e: React.MouseEvent) => {
		if (!containerRef.current) return { x: e.clientX, y: e.clientY };
		const rect = containerRef.current.getBoundingClientRect();
		return {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		};
	};

	// Drawing Surface Interaction Handlers (Overrides React Flow pan during drawing)
	const handleDrawingMouseDown = (e: React.MouseEvent) => {
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

	const handleDrawingMouseMove = (e: React.MouseEvent) => {
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

	const handleDrawingMouseUp = (e: React.MouseEvent) => {
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
			createDrawingMutation.mutate(
				{
					project_id: activeProjectId,
					svg,
					x: shapeX,
					y: shapeY,
					z: 0,
					rotation: 0,
					locked: false,
				},
				{
					onSuccess: (savedDrawing) => {
						if (savedDrawing?.drawing_id) {
							selectDrawing(savedDrawing.drawing_id);
							setRightPanelOpen(true);
						}
					},
				},
			);
		}

		setDragPreview(null);
		setActiveDrawingTool(null);
	};

	return (
		<div
			ref={containerRef}
			className={cn(
				"relative w-full h-full bg-background overflow-hidden",
				isDrawingMode && "drawing-mode-active cursor-crosshair",
			)}
			onDragOver={onDragOver}
			onDrop={onDrop}
		>
			<CanvasToolbar />

			{/* Interactive Drawing Mode Surface Overlay */}
			{isDrawingMode && (
				<div
					className="absolute inset-0 z-10 cursor-crosshair select-none bg-transparent"
					onMouseDown={handleDrawingMouseDown}
					onMouseMove={handleDrawingMouseMove}
					onMouseUp={handleDrawingMouseUp}
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
									cx={
										(dragPreview.startClient.x + dragPreview.currentClient.x) /
										2
									}
									cy={
										(dragPreview.startClient.y + dragPreview.currentClient.y) /
										2
									}
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
							{(activeDrawingTool === "line" ||
								activeDrawingTool === "arrow") && (
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
			)}

			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				colorMode={theme}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onNodeDragStart={onNodeDragStart}
				onNodeDragStop={onNodeDragStop}
				onSelectionDragStart={onSelectionDragStart}
				onSelectionDragStop={onSelectionDragStop}
				nodesDraggable={!isDrawingMode}
				elementsSelectable={!isDrawingMode}
				panOnDrag={!isDrawingMode}
				panOnScroll={!isDrawingMode}
				onConnect={onConnect}
				onNodeClick={(_e, node) => {
					if (isDrawingMode) return;
					if (node.type === "drawingNode") {
						const d = (node.data as { drawing?: GNS3Drawing })?.drawing;
						if (d) {
							selectDrawing(d.drawing_id);
							setRightPanelOpen(true);
						}
					} else {
						selectNode(node.id);
						setRightPanelOpen(true);
					}
				}}
				onEdgeClick={(_e, edge) => {
					if (isDrawingMode) return;
					selectLink(edge.id);
					setRightPanelOpen(true);
				}}
				onPaneClick={() => {
					if (!isDrawingMode) {
						clearSelection();
					}
				}}
				snapToGrid={snapToGrid}
				snapGrid={[gridSize, gridSize]}
				fitView
				minZoom={0.2}
				maxZoom={2.5}
				defaultViewport={{ x: 0, y: 0, zoom: 1 }}
				deleteKeyCode={null}
			>
				{showGrid && (
					<Background
						variant={BackgroundVariant.Dots}
						gap={gridSize}
						size={1.5}
						color={theme === "dark" ? "#27272a" : "#d4d4d8"}
					/>
				)}

				<Controls
					showInteractive={false}
					fitViewOptions={{ duration: 300 }}
					className="shadow-md rounded-lg"
				/>
			</ReactFlow>

			{/* Port Connection Modal */}
			<LinkDialog />
		</div>
	);
}
