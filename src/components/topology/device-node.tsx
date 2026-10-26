import { Handle, type NodeProps, Position } from "@xyflow/react";
import {
	Cable,
	Cloud,
	FileCode2,
	Monitor,
	Network,
	Play,
	Router as RouterIcon,
	Server,
	Shield,
	Square,
	Terminal,
} from "lucide-react";
import { memo, useCallback, useState } from "react";
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useCreateLink, useProjectLinks } from "@/features/links/use-links";
import {
	useProjectNodes,
	useStartNode,
	useStopNode,
} from "@/features/nodes/use-nodes";
import { resolveNodeSymbol } from "@/lib/symbols";
import { cn } from "@/lib/utils";
import { useTopologyStore } from "@/stores/topology-store";
import { useUIStore } from "@/stores/ui-store";
import type { GNS3Node } from "@/types/gns3";

export function getDeviceIcon(nodeType: string, name: string) {
	const lowerType = (nodeType || "").toLowerCase();
	const lowerName = (name || "").toLowerCase();

	if (
		lowerType.includes("switch") ||
		lowerName.includes("sw") ||
		lowerType.includes("iou")
	) {
		return Network;
	}
	if (
		lowerType.includes("firewall") ||
		lowerType.includes("asa") ||
		lowerName.includes("fw")
	) {
		return Shield;
	}
	if (lowerType.includes("cloud") || lowerType.includes("nat")) {
		return Cloud;
	}
	if (
		lowerType.includes("vpcs") ||
		lowerType.includes("pc") ||
		lowerName.includes("pc") ||
		lowerName.includes("host")
	) {
		return Monitor;
	}
	if (lowerType.includes("docker") || lowerType.includes("server")) {
		return Server;
	}
	return RouterIcon;
}

export const DeviceNode = memo(({ data, selected }: NodeProps) => {
	const node = data.node as GNS3Node;
	const openConsoleForNode = useUIStore((s) => s.openConsoleForNode);
	const openEditorForNode = useUIStore((s) => s.openEditorForNode);

	const startMutation = useStartNode(node.project_id);
	const stopMutation = useStopNode(node.project_id);

	const [imgError, setImgError] = useState(false);
	const [sourcePopoverOpen, setSourcePopoverOpen] = useState(false);

	const symbolSrc = resolveNodeSymbol(node);
	const IconComponent = getDeviceIcon(node.node_type, node.name);
	const isStarted = node.status === "started";

	// Connection Mode State from topology store
	const isConnecting = useTopologyStore((s) => s.isConnecting);
	const connectingSourceNodeId = useTopologyStore(
		(s) => s.connectingSourceNodeId,
	);
	const connectingSourcePort = useTopologyStore((s) => s.connectingSourcePort);
	const connectingTargetNodeId = useTopologyStore(
		(s) => s.connectingTargetNodeId,
	);
	const startConnecting = useTopologyStore((s) => s.startConnecting);
	const setConnectingTargetNodeId = useTopologyStore(
		(s) => s.setConnectingTargetNodeId,
	);
	const cancelConnecting = useTopologyStore((s) => s.cancelConnecting);
	const setHoveredNodeId = useTopologyStore((s) => s.setHoveredNodeId);

	// Links & Nodes queries for checking port usage and linking
	const { data: links = [] } = useProjectLinks(node.project_id);
	const { data: allNodes = [] } = useProjectNodes(node.project_id);
	const createLinkMutation = useCreateLink(node.project_id);

	const isSourceNode = isConnecting && connectingSourceNodeId === node.node_id;
	const isTargetNode = isConnecting && connectingTargetNodeId === node.node_id;
	const isEligibleTarget =
		isConnecting &&
		Boolean(connectingSourceNodeId) &&
		connectingSourceNodeId !== node.node_id;

	const sourceNode = allNodes.find((n) => n.node_id === connectingSourceNodeId);

	// Check if a port on this node is already in use by any link
	const isPortConnected = useCallback(
		(adapter: number, port: number) => {
			return links.some((l) =>
				l.nodes?.some(
					(endpoint) =>
						endpoint.node_id === node.node_id &&
						endpoint.adapter_number === adapter &&
						endpoint.port_number === port,
				),
			);
		},
		[links, node.node_id],
	);

	return (
		<div
			className={cn(
				"group relative flex flex-col items-center select-none cursor-grab active:cursor-grabbing",
				isSourceNode &&
					"ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg",
				isEligibleTarget &&
					"cursor-pointer hover:ring-2 hover:ring-emerald-500 hover:ring-offset-2 hover:ring-offset-background rounded-lg",
			)}
			onMouseEnter={() => setHoveredNodeId(node.node_id)}
			onMouseLeave={() => setHoveredNodeId(null)}
			onClick={(e) => {
				if (isEligibleTarget) {
					e.stopPropagation();
					setConnectingTargetNodeId(node.node_id);
				}
			}}
		>
			{/* Floating Hover Action Toolbar */}
			<div
				className={cn(
					"absolute -top-9 flex items-center gap-1 bg-card/95 border border-border shadow-md rounded-md p-0.5 transition-all z-20 scale-90 hover:scale-100",
					sourcePopoverOpen || isSourceNode
						? "opacity-100 scale-100 pointer-events-auto"
						: "opacity-0 group-hover:opacity-100",
				)}
			>
				{isStarted ? (
					<button
						type="button"
						title="Stop Device"
						onClick={(e) => {
							e.stopPropagation();
							stopMutation.mutate(node.node_id);
						}}
						className="p-1 hover:bg-destructive/20 text-destructive rounded-xs"
					>
						<Square className="w-3.5 h-3.5 fill-current" />
					</button>
				) : (
					<button
						type="button"
						title="Start Device"
						onClick={(e) => {
							e.stopPropagation();
							startMutation.mutate(node.node_id);
						}}
						className="p-1 hover:bg-emerald-500/20 text-emerald-500 rounded-xs"
					>
						<Play className="w-3.5 h-3.5 fill-current" />
					</button>
				)}

				<button
					type="button"
					title="Open Web Console"
					onClick={(e) => {
						e.stopPropagation();
						openConsoleForNode(node.node_id);
					}}
					className="p-1 hover:bg-accent text-accent-foreground rounded-xs"
				>
					<Terminal className="w-3.5 h-3.5" />
				</button>

				<button
					type="button"
					title="Configuration Editor"
					onClick={(e) => {
						e.stopPropagation();
						openEditorForNode(node.node_id);
					}}
					className="p-1 hover:bg-accent text-accent-foreground rounded-xs"
				>
					<FileCode2 className="w-3.5 h-3.5" />
				</button>

				{/* Connection button on hover */}
				<Popover open={sourcePopoverOpen} onOpenChange={setSourcePopoverOpen}>
					<PopoverTrigger asChild>
						<button
							type="button"
							title="Connect Interfaces"
							onClick={(e) => {
								e.stopPropagation();
								if (isEligibleTarget) {
									setConnectingTargetNodeId(node.node_id);
								} else {
									setSourcePopoverOpen((prev) => !prev);
								}
							}}
							className={cn(
								"p-1 hover:bg-accent text-accent-foreground rounded-xs transition-colors",
								(sourcePopoverOpen || isSourceNode) &&
									"bg-primary text-primary-foreground hover:bg-primary/90",
							)}
						>
							<Cable className="w-3.5 h-3.5" />
						</button>
					</PopoverTrigger>
					<PopoverContent
						side="top"
						align="center"
						className="w-56 p-2 bg-card border border-border shadow-xl rounded-md z-50 text-xs"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border/60">
							<div className="font-semibold text-foreground flex items-center gap-1.5">
								<Cable className="w-3.5 h-3.5 text-primary" />
								<span>Select Interface</span>
							</div>
							<span className="text-[10px] text-muted-foreground font-mono truncate max-w-20">
								{node.name}
							</span>
						</div>

						<div className="max-h-48 overflow-y-auto space-y-1">
							{node.ports && node.ports.length > 0 ? (
								node.ports.map((port) => {
									const busy = isPortConnected(
										port.adapter_number,
										port.port_number,
									);
									return (
										<button
											key={`${port.adapter_number}-${port.port_number}`}
											type="button"
											disabled={busy}
											onClick={() => {
												startConnecting(node.node_id, {
													adapter_number: port.adapter_number,
													port_number: port.port_number,
													name: port.name,
												});
												setSourcePopoverOpen(false);
											}}
											className={cn(
												"w-full flex items-center justify-between px-2 py-1.5 rounded-sm font-mono text-[11px] text-left transition-colors",
												busy
													? "opacity-40 line-through cursor-not-allowed bg-muted/20 text-muted-foreground"
													: "hover:bg-primary hover:text-primary-foreground text-foreground cursor-pointer bg-muted/40",
											)}
										>
											<span className="truncate">{port.name}</span>
											{busy ? (
												<span className="text-[9px] font-sans no-underline opacity-80">
													(in use)
												</span>
											) : (
												<span className="text-[9px] font-sans text-emerald-500 font-medium">
													available
												</span>
											)}
										</button>
									);
								})
							) : (
								<div className="py-3 text-center text-[11px] text-muted-foreground">
									No interfaces available
								</div>
							)}
						</div>
					</PopoverContent>
				</Popover>
			</div>

			{/* Main Node Graphic */}
			<div
				className={cn(
					"relative flex items-center justify-center w-12 h-12 transition-transform duration-150",
					selected &&
						"scale-105 filter drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]",
				)}
			>
				{/* Center Connection Handles for Straight Center-to-Center Links */}
				<Handle
					type="target"
					position={Position.Top}
					id="target"
					style={{
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						opacity: 0,
						pointerEvents: "none",
						border: "none",
						width: 1,
						height: 1,
						minWidth: 0,
						minHeight: 0,
						padding: 0,
					}}
				/>
				<Handle
					type="source"
					position={Position.Top}
					id="source"
					style={{
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						opacity: 0,
						pointerEvents: "none",
						border: "none",
						width: 1,
						height: 1,
						minWidth: 0,
						minHeight: 0,
						padding: 0,
					}}
				/>

				{/* Device Symbol (GNS3 SVG) with Lucide fallback */}
				{!imgError ? (
					<img
						src={symbolSrc}
						alt={node.name}
						onError={() => setImgError(true)}
						className="w-12 h-12 object-contain pointer-events-none select-none transition-transform group-hover:scale-105"
						draggable={false}
					/>
				) : (
					<IconComponent
						className={cn(
							"w-8 h-8 transition-colors",
							isStarted ? "text-blue-500" : "text-zinc-400",
						)}
					/>
				)}
			</div>

			{/* Device Name Label (Node port number removed; only icon and name kept) */}
			<div className="mt-1.5 flex flex-col items-center">
				<span
					className={cn(
						"text-xs font-medium px-1.5 py-0.5 rounded-sm max-w-30 truncate leading-tight",
						selected
							? "bg-primary text-primary-foreground font-semibold"
							: "text-foreground/90 bg-card/60 backdrop-blur-xs border border-border/40",
					)}
				>
					{node.name}
				</span>
			</div>

			{/* Connecting indicator badge on source node */}
			{isSourceNode && connectingSourcePort && (
				<div className="absolute -bottom-6 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap z-30 animate-pulse">
					<Cable className="w-2.5 h-2.5" />
					<span>Connecting: {connectingSourcePort.name}</span>
				</div>
			)}

			{/* Target Node Interface Dropdown */}
			<Popover
				open={isTargetNode}
				onOpenChange={(open) => {
					if (!open) {
						setConnectingTargetNodeId(null);
					}
				}}
			>
				<PopoverAnchor className="absolute inset-0 pointer-events-none" />
				<PopoverContent
					side="top"
					align="center"
					className="w-60 p-2 bg-card border border-primary/50 shadow-2xl rounded-md z-50 text-xs animate-in fade-in-50 zoom-in-95"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="pb-1.5 mb-1.5 border-b border-border/60">
						<div className="flex items-center justify-between">
							<span className="font-semibold text-foreground flex items-center gap-1.5">
								<Cable className="w-3.5 h-3.5 text-emerald-500" />
								<span>Connect to {node.name}</span>
							</span>
						</div>
						{sourceNode && connectingSourcePort && (
							<div className="text-[10px] text-muted-foreground mt-0.5 truncate">
								From:{" "}
								<span className="font-semibold text-foreground">
									{sourceNode.name}
								</span>{" "}
								({connectingSourcePort.name})
							</div>
						)}
					</div>

					<div className="max-h-48 overflow-y-auto space-y-1">
						{node.ports && node.ports.length > 0 ? (
							node.ports.map((port) => {
								const busy = isPortConnected(
									port.adapter_number,
									port.port_number,
								);
								return (
									<button
										key={`${port.adapter_number}-${port.port_number}`}
										type="button"
										disabled={busy}
										onClick={async () => {
											if (connectingSourceNodeId && connectingSourcePort) {
												await createLinkMutation.mutateAsync([
													{
														node_id: connectingSourceNodeId,
														adapter_number: connectingSourcePort.adapter_number,
														port_number: connectingSourcePort.port_number,
													},
													{
														node_id: node.node_id,
														adapter_number: port.adapter_number,
														port_number: port.port_number,
													},
												]);
												cancelConnecting();
											}
										}}
										className={cn(
											"w-full flex items-center justify-between px-2 py-1.5 rounded-sm font-mono text-[11px] text-left transition-colors",
											busy
												? "opacity-40 line-through cursor-not-allowed bg-muted/20 text-muted-foreground"
												: "hover:bg-emerald-600 hover:text-white text-foreground cursor-pointer bg-muted/40",
										)}
									>
										<span className="truncate">{port.name}</span>
										{busy ? (
											<span className="text-[9px] font-sans no-underline opacity-80">
												(in use)
											</span>
										) : (
											<span className="text-[9px] font-sans text-emerald-500 font-medium">
												connect
											</span>
										)}
									</button>
								);
							})
						) : (
							<div className="py-3 text-center text-[11px] text-muted-foreground">
								No interfaces available
							</div>
						)}
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
});

DeviceNode.displayName = "DeviceNode";
