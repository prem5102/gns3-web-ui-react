import {
	BaseEdge,
	EdgeLabelRenderer,
	type EdgeProps,
	getStraightPath,
} from "@xyflow/react";
import { Radio } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTopologyStore } from "@/stores/topology-store";

export interface TopologyEdgeData {
	linkId: string;
	sourceLabel?: string;
	targetLabel?: string;
	capturing?: boolean;
	suspend?: boolean;
	linkIndex?: number;
	totalLinks?: number;
	isCanonical?: boolean;
}

export function TopologyEdge({
	id,
	source,
	target,
	sourceX,
	sourceY,
	targetX,
	targetY,
	selected,
	data,
}: EdgeProps) {
	const edgeData = data as TopologyEdgeData | undefined;
	const showInterfaceLabels = useTopologyStore((s) => s.showInterfaceLabels);
	const hoveredNodeId = useTopologyStore((s) => s.hoveredNodeId);

	const [isEdgeHovered, setIsEdgeHovered] = useState(false);

	const linkIndex = edgeData?.linkIndex ?? 0;
	const totalLinks = edgeData?.totalLinks ?? 1;
	const isCanonical = edgeData?.isCanonical ?? true;

	const isMultiLink = totalLinks > 1;
	const isNodeHovered =
		Boolean(hoveredNodeId) &&
		(hoveredNodeId === source || hoveredNodeId === target);

	// When interfaces exceed (multiple connections), only display interface labels on hover of edge or either node
	const shouldShowLabels =
		showInterfaceLabels &&
		(!isMultiLink || isEdgeHovered || isNodeHovered || selected);

	// Calculate perpendicular parallel offset for multiple connections between same two nodes
	// Clamped to maxSpan = 18px so lines NEVER exceed the 48px node graphic
	let adjustedSourceX = sourceX;
	let adjustedSourceY = sourceY;
	let adjustedTargetX = targetX;
	let adjustedTargetY = targetY;

	if (isMultiLink) {
		const maxSpan = 18; // 18px max spread ensures lines stay well inside the 48px node
		const defaultSpacing = 6; // 6px clean parallel separation
		const spacing = Math.min(defaultSpacing, maxSpan / (totalLinks - 1));
		const offsetIndex = linkIndex - (totalLinks - 1) / 2;
		const offsetDistance = offsetIndex * spacing;

		const dx = targetX - sourceX;
		const dy = targetY - sourceY;
		const len = Math.hypot(dx, dy);

		if (len > 0.001) {
			const sign = isCanonical ? 1 : -1;
			const nx = (-dy / len) * sign;
			const ny = (dx / len) * sign;

			adjustedSourceX = sourceX + nx * offsetDistance;
			adjustedSourceY = sourceY + ny * offsetDistance;
			adjustedTargetX = targetX + nx * offsetDistance;
			adjustedTargetY = targetY + ny * offsetDistance;
		}
	}

	const [edgePath, labelX, labelY] = getStraightPath({
		sourceX: adjustedSourceX,
		sourceY: adjustedSourceY,
		targetX: adjustedTargetX,
		targetY: adjustedTargetY,
	});

	// Stagger label positions along the line for multiple links so they never collide
	const staggerStep = totalLinks <= 2 ? 0.08 : 0.06;
	const sourceFraction = isMultiLink
		? 0.16 + (linkIndex % 4) * staggerStep
		: 0.22;
	const targetFraction = isMultiLink
		? 0.84 - (linkIndex % 4) * staggerStep
		: 0.78;

	const sourceLabelX =
		adjustedSourceX + (adjustedTargetX - adjustedSourceX) * sourceFraction;
	const sourceLabelY =
		adjustedSourceY + (adjustedTargetY - adjustedSourceY) * sourceFraction;

	const targetLabelX =
		adjustedSourceX + (adjustedTargetX - adjustedSourceX) * targetFraction;
	const targetLabelY =
		adjustedSourceY + (adjustedTargetY - adjustedSourceY) * targetFraction;

	const isCapturing = edgeData?.capturing;
	const isSuspended = edgeData?.suspend;

	return (
		<>
			{/* Invisible wider interaction path for easy edge hover and click */}
			<path
				d={edgePath}
				fill="none"
				stroke="transparent"
				strokeWidth={14}
				className="cursor-pointer pointer-events-auto"
				onMouseEnter={() => setIsEdgeHovered(true)}
				onMouseLeave={() => setIsEdgeHovered(false)}
			/>

			{/* Visible straight edge */}
			<BaseEdge
				id={id}
				path={edgePath}
				className={cn(
					"transition-[stroke,stroke-width] duration-150 pointer-events-none",
					selected || isEdgeHovered
						? "stroke-primary stroke-[3px]"
						: "stroke-zinc-500/70 stroke-[2px]",
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
						className="flex items-center gap-1 bg-rose-500/90 text-white px-1.5 py-0.5 rounded-full text-[10px] font-mono shadow-xs animate-pulse z-30"
					>
						<Radio className="w-3 h-3 animate-spin" />
						<span>CAP</span>
					</div>
				)}

				{/* Source Interface Label */}
				{shouldShowLabels && edgeData?.sourceLabel && (
					<div
						style={{
							position: "absolute",
							transform: `translate(-50%, -50%) translate(${sourceLabelX}px,${sourceLabelY}px)`,
							pointerEvents: "none",
						}}
						className={cn(
							"text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-xs shadow-xs backdrop-blur-xs select-none transition-all duration-150",
							isEdgeHovered || selected
								? "bg-primary text-primary-foreground font-semibold shadow-md z-40 ring-1 ring-primary/40 scale-105"
								: "bg-card/95 text-foreground border border-border/90 z-20",
						)}
					>
						{edgeData.sourceLabel}
					</div>
				)}

				{/* Target Interface Label */}
				{shouldShowLabels && edgeData?.targetLabel && (
					<div
						style={{
							position: "absolute",
							transform: `translate(-50%, -50%) translate(${targetLabelX}px,${targetLabelY}px)`,
							pointerEvents: "none",
						}}
						className={cn(
							"text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-xs shadow-xs backdrop-blur-xs select-none transition-all duration-150",
							isEdgeHovered || selected
								? "bg-primary text-primary-foreground font-semibold shadow-md z-40 ring-1 ring-primary/40 scale-105"
								: "bg-card/95 text-foreground border border-border/90 z-20",
						)}
					>
						{edgeData.targetLabel}
					</div>
				)}
			</EdgeLabelRenderer>
		</>
	);
}
