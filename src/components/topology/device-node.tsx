import { Handle, type NodeProps, Position } from "@xyflow/react";
import {
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
import { memo, useState } from "react";
import { useStartNode, useStopNode } from "@/features/nodes/use-nodes";
import { resolveNodeSymbol } from "@/lib/symbols";
import { cn } from "@/lib/utils";
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
	const symbolSrc = resolveNodeSymbol(node);
	const IconComponent = getDeviceIcon(node.node_type, node.name);
	const isStarted = node.status === "started";

	return (
		<div
			className={cn(
				"group relative flex flex-col items-center select-none cursor-grab active:cursor-grabbing",
			)}
		>
			{/* Port Connection Handles */}
			<Handle
				type="target"
				position={Position.Top}
				id="top"
				className="w-2.5 h-2.5 bg-primary/80 border-2 border-background opacity-0 group-hover:opacity-100 transition-opacity"
			/>
			<Handle
				type="source"
				position={Position.Bottom}
				id="bottom"
				className="w-2.5 h-2.5 bg-primary/80 border-2 border-background opacity-0 group-hover:opacity-100 transition-opacity"
			/>
			<Handle
				type="target"
				position={Position.Left}
				id="left"
				className="w-2.5 h-2.5 bg-primary/80 border-2 border-background opacity-0 group-hover:opacity-100 transition-opacity"
			/>
			<Handle
				type="source"
				position={Position.Right}
				id="right"
				className="w-2.5 h-2.5 bg-primary/80 border-2 border-background opacity-0 group-hover:opacity-100 transition-opacity"
			/>

			{/* Floating Hover Action Toolbar */}
			<div className="absolute -top-9 flex items-center gap-1 bg-card/95 border border-border shadow-md rounded-md p-0.5 opacity-0 group-hover:opacity-100 transition-all z-20 scale-90 hover:scale-100">
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
			</div>

			{/* Main Node Graphic */}
			<div
				className={cn(
					"relative flex items-center justify-center w-12 h-12 transition-transform duration-150",
					selected && "scale-105 filter drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]",
				)}
			>
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


			{/* Device Name Label */}
			<div className="mt-1.5 flex flex-col items-center">
				<span
					className={cn(
						"text-xs font-medium px-1.5 py-0.5 rounded-sm max-w-[120px] truncate leading-tight",
						selected
							? "bg-primary text-primary-foreground font-semibold"
							: "text-foreground/90 bg-card/60 backdrop-blur-xs border border-border/40",
					)}
				>
					{node.name}
				</span>

				{/* Console Port pill if running */}
				{node.console && (
					<span className="text-[10px] text-muted-foreground/80 font-mono mt-0.5">
						:{node.console}
					</span>
				)}
			</div>
		</div>
	);
});

DeviceNode.displayName = "DeviceNode";
