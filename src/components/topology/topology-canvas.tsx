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

import { useProjectLinks } from "@/features/links/use-links";
import { useProjectNodes, useUpdateNode } from "@/features/nodes/use-nodes";
import { useCreateNodeFromTemplate } from "@/features/templates/use-templates";
import { useTopologyStore } from "@/stores/topology-store";
import { useUIStore } from "@/stores/ui-store";
import type { GNS3Link, GNS3Node } from "@/types/gns3";
import { CanvasToolbar } from "./canvas-toolbar";
import { DeviceNode } from "./device-node";
import { LinkDialog } from "./link-dialog";
import { TopologyEdge, type TopologyEdgeData } from "./topology-edge";

const EMPTY_NODES: GNS3Node[] = [];
const EMPTY_LINKS: GNS3Link[] = [];

const nodeTypes = {
	deviceNode: DeviceNode,
};

const edgeTypes = {
	topologyEdge: TopologyEdge,
};

export function TopologyCanvas() {
	const {
		activeProjectId,
		selectedNodeId,
		selectedLinkId,
		selectNode,
		selectLink,
		clearSelection,
		showGrid,
		snapToGrid,
		gridSize,
		openLinkDialog,
	} = useTopologyStore();

	const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
	const theme = useUIStore((s) => s.theme);

	const { data: gns3Nodes = EMPTY_NODES } = useProjectNodes(activeProjectId);
	const { data: gns3Links = EMPTY_LINKS } = useProjectLinks(activeProjectId);

	const updateNodeMutation = useUpdateNode(activeProjectId || "");
	const createFromTemplateMutation = useCreateNodeFromTemplate(
		activeProjectId || "",
	);
	const { screenToFlowPosition, fitView } = useReactFlow();

	// Local state for interactive 60fps nodes and edges
	const [nodes, setNodes] = useState<Node[]>([]);
	const [edges, setEdges] = useState<Edge[]>([]);

	// Track dragging to prevent background query refetches from overwriting active drags
	const isDraggingRef = useRef(false);
	const hasFittedRef = useRef<string | null>(null);

	// Synchronize GNS3 nodes to React Flow nodes with smart diffing to prevent re-render loops
	useEffect(() => {
		setNodes((prevNodes) => {
			const prevMap = new Map(prevNodes.map((n) => [n.id, n]));
			let hasChanges = prevNodes.length !== gns3Nodes.length;

			const nextNodes: Node[] = gns3Nodes.map((n) => {
				const existing = prevMap.get(n.node_id);
				if (!existing) {
					hasChanges = true;
					return {
						id: n.node_id,
						type: "deviceNode",
						position: { x: n.x, y: n.y },
						selected: n.node_id === selectedNodeId,
						data: { node: n },
					};
				}

				const isCurrentlyDragging = isDraggingRef.current;
				const targetX = isCurrentlyDragging ? existing.position.x : n.x;
				const targetY = isCurrentlyDragging ? existing.position.y : n.y;
				const isSelected = n.node_id === selectedNodeId;

				// Check position change
				const posChanged =
					Math.abs(existing.position.x - targetX) > 0.01 ||
					Math.abs(existing.position.y - targetY) > 0.01;

				// Check selection change
				const selChanged = Boolean(existing.selected) !== isSelected;

				// Check underlying node data change (status, name, console, ports)
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
					data: { node: n },
				};
			});

			// If nothing structurally changed, bail out and preserve identical reference
			if (!hasChanges) {
				return prevNodes;
			}

			return nextNodes;
		});
	}, [gns3Nodes, selectedNodeId]);

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

	// Handle React Flow node changes (live dragging position updates, selection, etc.)
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

			// Handle single node or group selection drag
			const nodesToPersist =
				draggedNodes && draggedNodes.length > 0 ? draggedNodes : [node];

			for (const n of nodesToPersist) {
				updateNodeMutation.mutate({
					nodeId: n.id,
					data: {
						x: Math.round(n.position.x),
						y: Math.round(n.position.y),
					},
				});
			}
		},
		[activeProjectId, updateNodeMutation],
	);

	const onSelectionDragStart = useCallback(() => {
		isDraggingRef.current = true;
	}, []);

	const onSelectionDragStop = useCallback(
		(_event: unknown, draggedNodes: Node[]) => {
			isDraggingRef.current = false;
			if (!activeProjectId) return;

			for (const n of draggedNodes) {
				updateNodeMutation.mutate({
					nodeId: n.id,
					data: {
						x: Math.round(n.position.x),
						y: Math.round(n.position.y),
					},
				});
			}
		},
		[activeProjectId, updateNodeMutation],
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

	return (
		<div
			className="relative w-full h-full bg-background overflow-hidden"
			onDragOver={onDragOver}
			onDrop={onDrop}
		>
			<CanvasToolbar />

			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onNodeDragStart={onNodeDragStart}
				onNodeDragStop={onNodeDragStop}
				onSelectionDragStart={onSelectionDragStart}
				onSelectionDragStop={onSelectionDragStop}
				nodesDraggable={true}
				elementsSelectable={true}
				onConnect={onConnect}
				onNodeClick={(_e, node) => {
					selectNode(node.id);
					setRightPanelOpen(true);
				}}
				onEdgeClick={(_e, edge) => {
					selectLink(edge.id);
					setRightPanelOpen(true);
				}}
				onPaneClick={() => clearSelection()}
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

				<Controls showInteractive={false} className="shadow-md rounded-lg" />
			</ReactFlow>

			{/* Port Connection Modal */}
			<LinkDialog />
		</div>
	);
}
