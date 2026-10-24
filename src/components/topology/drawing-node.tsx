import { NodeResizer, type NodeProps, type ResizeParams } from "@xyflow/react";
import { Lock } from "lucide-react";
import React, { memo, useCallback, useEffect, useState } from "react";
import {
	generateTextSvg,
	parseSvgContent,
	updateSvgDimensions,
} from "@/features/drawings/drawing-utils";
import { useUpdateDrawing } from "@/features/drawings/use-drawings";
import { useTopologyStore } from "@/stores/topology-store";
import type { GNS3Drawing } from "@/types/gns3";
import { cn } from "@/lib/utils";

export interface DrawingNodeData {
	drawing: GNS3Drawing;
}

export const DrawingNode = memo(function DrawingNode({
	id: _id,
	data,
	selected,
}: NodeProps) {
	const drawing = (data as unknown as DrawingNodeData).drawing;
	const activeProjectId = useTopologyStore((s) => s.activeProjectId);
	const updateDrawingMutation = useUpdateDrawing(activeProjectId || "");

	const initialParsed = parseSvgContent(drawing?.svg || "");
	const [isEditingText, setIsEditingText] = useState(false);
	const [editText, setEditText] = useState(initialParsed.text || "");
	const [localSvg, setLocalSvg] = useState(drawing?.svg || "<svg></svg>");
	const [dimensions, setDimensions] = useState<{
		width: number;
		height: number;
	}>({
		width: initialParsed.width || 100,
		height: initialParsed.height || 100,
	});

	const parsed = parseSvgContent(localSvg);
	const isTextType = parsed.type === "text";
	const isLocked = Boolean(drawing?.locked);

	// Sync local SVG with drawing updates from server
	useEffect(() => {
		if (drawing?.svg) {
			setLocalSvg(drawing.svg);
			const p = parseSvgContent(drawing.svg);
			setDimensions({ width: p.width, height: p.height });
			if (p.text) setEditText(p.text);
		}
	}, [drawing?.svg]);

	// Interactive resize handler (updates live SVG dimensions)
	const onResize = useCallback(
		(_event: unknown, params: ResizeParams) => {
			const nextWidth = Math.round(params.width);
			const nextHeight = Math.round(params.height);
			setDimensions({ width: nextWidth, height: nextHeight });
			const updatedSvg = updateSvgDimensions(
				drawing.svg,
				nextWidth,
				nextHeight,
			);
			setLocalSvg(updatedSvg);
		},
		[drawing.svg],
	);

	// Persist final resized SVG back to GNS3 Controller on mouse release
	const onResizeEnd = useCallback(
		(_event: unknown, params: ResizeParams) => {
			if (!activeProjectId || isLocked) return;
			const nextWidth = Math.round(params.width);
			const nextHeight = Math.round(params.height);
			const updatedSvg = updateSvgDimensions(
				drawing.svg,
				nextWidth,
				nextHeight,
			);

			updateDrawingMutation.mutate({
				drawingId: drawing.drawing_id,
				data: {
					svg: updatedSvg,
					x: Math.round(params.x),
					y: Math.round(params.y),
				},
			});
		},
		[
			activeProjectId,
			drawing.drawing_id,
			drawing.svg,
			isLocked,
			updateDrawingMutation,
		],
	);

	// Handle inline text commit
	const commitTextEdit = useCallback(() => {
		setIsEditingText(false);
		if (!activeProjectId || !isTextType || isLocked) return;

		const updatedSvg = generateTextSvg({
			text: editText || "Note",
			fontSize: parsed.fontSize,
			fontFamily: parsed.fontFamily,
			fontWeight: parsed.fontWeight,
			fontStyle: parsed.fontStyle,
			color: parsed.stroke || "#3b82f6",
			fill: parsed.fill,
			fillOpacity: parsed.fillOpacity,
		});

		setLocalSvg(updatedSvg);
		updateDrawingMutation.mutate({
			drawingId: drawing.drawing_id,
			data: { svg: updatedSvg },
		});
	}, [
		activeProjectId,
		drawing.drawing_id,
		editText,
		isLocked,
		isTextType,
		parsed,
		updateDrawingMutation,
	]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			commitTextEdit();
		} else if (e.key === "Escape") {
			setIsEditingText(false);
			setEditText(parsed.text || "");
		}
	};

	const rotation = drawing?.rotation || 0;
	const transformStyle = rotation ? `rotate(${rotation}deg)` : undefined;

	return (
		<div
			className={cn(
				"relative group select-none transition-shadow",
				selected &&
					!isLocked &&
					"ring-1 ring-primary/80 ring-offset-1 rounded-sm",
				isLocked &&
					selected &&
					"ring-1 ring-amber-500/80 ring-offset-1 rounded-sm",
			)}
			style={{
				transform: transformStyle,
				transformOrigin: "center center",
				width: dimensions.width,
				height: dimensions.height,
			}}
			onDoubleClick={(e) => {
				if (isTextType && !isLocked) {
					e.stopPropagation();
					setIsEditingText(true);
				}
			}}
		>
			{/* React Flow 8-point Node Resizer */}
			<NodeResizer
				isVisible={Boolean(selected && !isLocked && !isEditingText)}
				minWidth={20}
				minHeight={20}
				onResize={onResize}
				onResizeEnd={onResizeEnd}
				handleClassName="w-2.5 h-2.5 bg-primary border border-background rounded-full shadow-sm hover:scale-125 transition-transform"
				lineClassName="border-primary/40 border-dashed"
			/>

			{/* Inline Text Editor Overlay */}
			{isEditingText ? (
				<div className="absolute inset-0 z-50 p-1 flex items-center justify-center bg-card/90 backdrop-blur-xs rounded border border-primary shadow-lg">
					<textarea
						autoFocus
						value={editText}
						onChange={(e) => setEditText(e.target.value)}
						onBlur={commitTextEdit}
						onKeyDown={handleKeyDown}
						className="w-full h-full min-h-[3rem] p-1 bg-transparent text-xs font-mono resize-none focus:outline-hidden text-foreground"
						placeholder="Enter annotation..."
					/>
				</div>
			) : (
				/* SVG Rendering Container */
				<div
					className="w-full h-full flex items-center justify-center pointer-events-auto [&>svg]:w-full [&>svg]:h-full [&>svg]:overflow-visible"
					dangerouslySetInnerHTML={{ __html: localSvg }}
				/>
			)}

			{/* Lock Status Badge */}
			{isLocked && (
				<div
					className="absolute top-1 right-1 p-0.5 bg-background/80 border border-border rounded-xs shadow-xs text-amber-500 pointer-events-none"
					title="Drawing is locked"
				>
					<Lock className="w-2.5 h-2.5" />
				</div>
			)}
		</div>
	);
});
