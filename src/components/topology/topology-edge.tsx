import {
	BaseEdge,
	EdgeLabelRenderer,
	type EdgeProps,
	getBezierPath,
} from "@xyflow/react";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTopologyStore } from "@/stores/topology-store";

export interface TopologyEdgeData {
	linkId: string;
	sourceLabel?: string;
	targetLabel?: string;
	capturing?: boolean;
	suspend?: boolean;
}

export function TopologyEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	selected,
	data,
}: EdgeProps) {
	const edgeData = data as TopologyEdgeData | undefined;
	const showInterfaceLabels = useTopologyStore((s) => s.showInterfaceLabels);

	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});

	// Calculate endpoint label offsets (25% and 75% along the line)
	const sourceLabelX = sourceX + (targetX - sourceX) * 0.22;
	const sourceLabelY = sourceY + (targetY - sourceY) * 0.22;

	const targetLabelX = sourceX + (targetX - sourceX) * 0.78;
	const targetLabelY = sourceY + (targetY - sourceY) * 0.78;

	const isCapturing = edgeData?.capturing;
	const isSuspended = edgeData?.suspend;

	return (
		<>
			<BaseEdge
				id={id}
				path={edgePath}
				className={cn(
					"transition-[stroke,stroke-width] duration-150",
					selected
						? "stroke-primary stroke-[3px]"
						: "stroke-zinc-500/70 hover:stroke-zinc-300 stroke-[2px]",
					isSuspended && "stroke-dashed stroke-amber-500/70",
					isCapturing && "stroke-rose-500",
				)}
			/>

			<EdgeLabelRenderer>
				{/* Capturing Pulse Indicator in the middle */}
				{isCapturing && (
					<div
						style={{
							position: "absolute",
							transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
							pointerEvents: "all",
						}}
						className="flex items-center gap-1 bg-rose-500/90 text-white px-1.5 py-0.5 rounded-full text-[10px] font-mono shadow-xs animate-pulse"
					>
						<Radio className="w-3 h-3 animate-spin" />
						<span>CAP</span>
					</div>
				)}

				{/* Interface Labels on both ends */}
				{showInterfaceLabels && edgeData?.sourceLabel && (
					<div
						style={{
							position: "absolute",
							transform: `translate(-50%, -50%) translate(${sourceLabelX}px,${sourceLabelY}px)`,
							pointerEvents: "none",
						}}
						className="bg-card/90 text-foreground text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-xs border border-border/80 shadow-xs backdrop-blur-xs select-none"
					>
						{edgeData.sourceLabel}
					</div>
				)}

				{showInterfaceLabels && edgeData?.targetLabel && (
					<div
						style={{
							position: "absolute",
							transform: `translate(-50%, -50%) translate(${targetLabelX}px,${targetLabelY}px)`,
							pointerEvents: "none",
						}}
						className="bg-card/90 text-foreground text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-xs border border-border/80 shadow-xs backdrop-blur-xs select-none"
					>
						{edgeData.targetLabel}
					</div>
				)}
			</EdgeLabelRenderer>
		</>
	);
}
