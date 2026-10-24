import {
	ArrowDownToLine,
	ArrowUpToLine,
	Copy,
	Lock,
	RotateCw,
	Sliders,
	Trash2,
	Type,
	Unlock,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	NETWORK_COLOR_PRESETS,
	generateArrowSvg,
	generateCloudSvg,
	generateEllipseSvg,
	generateLineSvg,
	generateRectangleSvg,
	generateTextSvg,
	parseSvgContent,
} from "@/features/drawings/drawing-utils";
import {
	useCreateDrawing,
	useDeleteDrawing,
	useUpdateDrawing,
} from "@/features/drawings/use-drawings";
import { useTopologyStore } from "@/stores/topology-store";
import type { GNS3Drawing } from "@/types/gns3";

interface DrawingPropertiesProps {
	drawing: GNS3Drawing;
}

export function DrawingProperties({ drawing }: DrawingPropertiesProps) {
	const activeProjectId = useTopologyStore((s) => s.activeProjectId);
	const selectDrawing = useTopologyStore((s) => s.selectDrawing);

	const updateDrawingMutation = useUpdateDrawing(activeProjectId || "");
	const createDrawingMutation = useCreateDrawing(activeProjectId || "");
	const deleteDrawingMutation = useDeleteDrawing(activeProjectId || "");

	const parsed = parseSvgContent(drawing.svg);

	// Local state for responsive editing
	const [fill, setFill] = useState(parsed.fill || "#3b82f6");
	const [fillOpacity, setFillOpacity] = useState(
		parsed.fillOpacity !== undefined ? parsed.fillOpacity : 0.15,
	);
	const [stroke, setStroke] = useState(parsed.stroke || "#2563eb");
	const [strokeWidth, setStrokeWidth] = useState(parsed.strokeWidth || 2);
	const [strokeStyle, setStrokeStyle] = useState<"solid" | "dashed" | "dotted">(
		parsed.strokeStyle || "solid",
	);
	const [cornerRadius, setCornerRadius] = useState(parsed.cornerRadius || 8);
	const [rotation, setRotation] = useState(drawing.rotation || 0);
	const [textContent, setTextContent] = useState(parsed.text || "");
	const [fontSize, setFontSize] = useState(parsed.fontSize || 14);

	useEffect(() => {
		const p = parseSvgContent(drawing.svg);
		if (p.fill) setFill(p.fill);
		if (p.fillOpacity !== undefined) setFillOpacity(p.fillOpacity);
		if (p.stroke) setStroke(p.stroke);
		if (p.strokeWidth !== undefined) setStrokeWidth(p.strokeWidth);
		if (p.strokeStyle) setStrokeStyle(p.strokeStyle);
		if (p.cornerRadius !== undefined) setCornerRadius(p.cornerRadius);
		if (p.text !== undefined) setTextContent(p.text);
		if (p.fontSize !== undefined) setFontSize(p.fontSize);
		setRotation(drawing.rotation || 0);
	}, [drawing.svg, drawing.rotation]);

	// Apply updated SVG to server
	const applyStyles = (overrides: {
		fill?: string;
		fillOpacity?: number;
		stroke?: string;
		strokeWidth?: number;
		strokeStyle?: "solid" | "dashed" | "dotted";
		cornerRadius?: number;
		text?: string;
		fontSize?: number;
	}) => {
		if (!activeProjectId) return;

		const currentFill = overrides.fill !== undefined ? overrides.fill : fill;
		const currentOpacity =
			overrides.fillOpacity !== undefined ? overrides.fillOpacity : fillOpacity;
		const currentStroke =
			overrides.stroke !== undefined ? overrides.stroke : stroke;
		const currentWidth =
			overrides.strokeWidth !== undefined ? overrides.strokeWidth : strokeWidth;
		const currentStyle =
			overrides.strokeStyle !== undefined ? overrides.strokeStyle : strokeStyle;
		const currentRadius =
			overrides.cornerRadius !== undefined
				? overrides.cornerRadius
				: cornerRadius;
		const currentText =
			overrides.text !== undefined ? overrides.text : textContent;
		const currentFontSize =
			overrides.fontSize !== undefined ? overrides.fontSize : fontSize;

		let updatedSvg = drawing.svg;

		if (parsed.type === "rectangle") {
			updatedSvg = generateRectangleSvg({
				width: parsed.width,
				height: parsed.height,
				fill: currentFill,
				fillOpacity: currentOpacity,
				stroke: currentStroke,
				strokeWidth: currentWidth,
				strokeStyle: currentStyle,
				cornerRadius: currentRadius,
			});
		} else if (parsed.type === "ellipse") {
			updatedSvg = generateEllipseSvg({
				width: parsed.width,
				height: parsed.height,
				fill: currentFill,
				fillOpacity: currentOpacity,
				stroke: currentStroke,
				strokeWidth: currentWidth,
				strokeStyle: currentStyle,
			});
		} else if (parsed.type === "cloud") {
			updatedSvg = generateCloudSvg({
				width: parsed.width,
				height: parsed.height,
				fill: currentFill,
				fillOpacity: currentOpacity,
				stroke: currentStroke,
				strokeWidth: currentWidth,
				strokeStyle: currentStyle,
			});
		} else if (parsed.type === "line") {
			updatedSvg = generateLineSvg({
				width: parsed.width,
				height: parsed.height,
				stroke: currentStroke,
				strokeWidth: currentWidth,
				strokeStyle: currentStyle,
			});
		} else if (parsed.type === "arrow") {
			updatedSvg = generateArrowSvg({
				width: parsed.width,
				height: parsed.height,
				stroke: currentStroke,
				strokeWidth: currentWidth,
				strokeStyle: currentStyle,
			});
		} else if (parsed.type === "text") {
			updatedSvg = generateTextSvg({
				text: currentText,
				fontSize: currentFontSize,
				color: currentStroke,
				fill: currentFill,
				fillOpacity: currentOpacity,
			});
		}

		updateDrawingMutation.mutate({
			drawingId: drawing.drawing_id,
			data: { svg: updatedSvg },
		});
	};

	// Duplicate
	const handleDuplicate = () => {
		if (!activeProjectId) return;
		createDrawingMutation.mutate({
			project_id: activeProjectId,
			svg: drawing.svg,
			x: drawing.x + 25,
			y: drawing.y + 25,
			z: drawing.z,
			rotation: drawing.rotation,
			locked: false,
		});
	};

	// Delete
	const handleDelete = () => {
		if (!activeProjectId) return;
		deleteDrawingMutation.mutate(drawing.drawing_id);
		selectDrawing(null);
	};

	// Toggle Lock
	const handleToggleLock = () => {
		if (!activeProjectId) return;
		updateDrawingMutation.mutate({
			drawingId: drawing.drawing_id,
			data: { locked: !drawing.locked },
		});
	};

	// Change Z-Index
	const handleZIndex = (delta: number) => {
		if (!activeProjectId) return;
		const newZ = (drawing.z ?? 0) + delta;
		updateDrawingMutation.mutate({
			drawingId: drawing.drawing_id,
			data: { z: newZ },
		});
	};

	// Preset apply
	const applyPreset = (preset: (typeof NETWORK_COLOR_PRESETS)[0]) => {
		setFill(preset.fill);
		setFillOpacity(preset.fillOpacity);
		setStroke(preset.stroke);
		applyStyles({
			fill: preset.fill,
			fillOpacity: preset.fillOpacity,
			stroke: preset.stroke,
		});
	};

	return (
		<div className="space-y-4 text-xs">
			{/* Header Details */}
			<div className="flex items-center justify-between pb-2 border-b border-border">
				<div>
					<span className="font-semibold capitalize text-foreground">
						{parsed.type} Shape
					</span>
					<p className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">
						{drawing.drawing_id}
					</p>
				</div>

				<div className="flex items-center gap-1">
					<Button
						size="icon-xs"
						variant={drawing.locked ? "secondary" : "ghost"}
						onClick={handleToggleLock}
						title={drawing.locked ? "Unlock Drawing" : "Lock Drawing"}
						className={
							drawing.locked ? "text-amber-500" : "text-muted-foreground"
						}
					>
						{drawing.locked ? (
							<Lock className="w-3.5 h-3.5" />
						) : (
							<Unlock className="w-3.5 h-3.5" />
						)}
					</Button>

					<Button
						size="icon-xs"
						variant="ghost"
						onClick={handleDuplicate}
						title="Duplicate Drawing"
					>
						<Copy className="w-3.5 h-3.5" />
					</Button>

					<Button
						size="icon-xs"
						variant="ghost"
						onClick={handleDelete}
						className="text-destructive hover:bg-destructive/10"
						title="Delete Drawing"
					>
						<Trash2 className="w-3.5 h-3.5" />
					</Button>
				</div>
			</div>

			{/* Semantic Network Presets */}
			<div>
				<Label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
					Network Domain Presets
				</Label>
				<div className="grid grid-cols-4 gap-1.5">
					{NETWORK_COLOR_PRESETS.map((p) => (
						<button
							key={p.id}
							type="button"
							onClick={() => applyPreset(p)}
							title={p.name}
							className="h-6 rounded border flex items-center justify-center transition-all hover:scale-105"
							style={{ backgroundColor: p.fill, borderColor: p.stroke }}
						/>
					))}
				</div>
			</div>

			{/* Text Content Editor */}
			{parsed.type === "text" && (
				<div className="space-y-2">
					<Label className="text-[11px] font-medium text-muted-foreground">
						Text Content
					</Label>
					<textarea
						value={textContent}
						onChange={(e) => {
							setTextContent(e.target.value);
							applyStyles({ text: e.target.value });
						}}
						className="w-full h-16 p-2 text-xs font-mono rounded border border-input bg-background resize-none focus:outline-hidden"
						placeholder="Annotation text..."
					/>

					<div className="flex items-center justify-between gap-2">
						<Label className="text-[11px] text-muted-foreground">
							Font Size
						</Label>
						<Input
							type="number"
							min={10}
							max={48}
							value={fontSize}
							onChange={(e) => {
								const size = Number.parseInt(e.target.value, 10) || 14;
								setFontSize(size);
								applyStyles({ fontSize: size });
							}}
							className="w-20 h-7 text-xs"
						/>
					</div>
				</div>
			)}

			{/* Fill Color & Opacity (For shapes) */}
			{parsed.type !== "line" && parsed.type !== "arrow" && (
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label className="text-[11px] font-medium text-muted-foreground">
							Fill Color & Opacity
						</Label>
						<span className="text-[10px] text-muted-foreground font-mono">
							{Math.round(fillOpacity * 100)}%
						</span>
					</div>

					<div className="flex items-center gap-2">
						<input
							type="color"
							value={fill.startsWith("#") ? fill : "#3b82f6"}
							onChange={(e) => {
								setFill(e.target.value);
								applyStyles({ fill: e.target.value });
							}}
							className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent p-0.5"
						/>
						<input
							type="range"
							min={0}
							max={1}
							step={0.05}
							value={fillOpacity}
							onChange={(e) => {
								const val = Number.parseFloat(e.target.value);
								setFillOpacity(val);
								applyStyles({ fillOpacity: val });
							}}
							className="flex-1 accent-primary cursor-pointer"
						/>
					</div>
				</div>
			)}

			{/* Stroke / Outline */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label className="text-[11px] font-medium text-muted-foreground">
						Border / Stroke
					</Label>
					<span className="text-[10px] text-muted-foreground font-mono">
						{strokeWidth}px • {strokeStyle}
					</span>
				</div>

				<div className="flex items-center gap-2">
					<input
						type="color"
						value={stroke.startsWith("#") ? stroke : "#2563eb"}
						onChange={(e) => {
							setStroke(e.target.value);
							applyStyles({ stroke: e.target.value });
						}}
						className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent p-0.5"
					/>

					{/* Stroke Style Selector */}
					<div className="flex items-center rounded border border-border overflow-hidden">
						{(["solid", "dashed", "dotted"] as const).map((style) => (
							<button
								key={style}
								type="button"
								onClick={() => {
									setStrokeStyle(style);
									applyStyles({ strokeStyle: style });
								}}
								className={`px-2 py-1 text-[10px] capitalize transition-colors ${
									strokeStyle === style
										? "bg-primary text-primary-foreground font-medium"
										: "hover:bg-muted text-muted-foreground"
								}`}
							>
								{style}
							</button>
						))}
					</div>
				</div>

				<div className="flex items-center justify-between gap-2 pt-1">
					<Label className="text-[11px] text-muted-foreground">
						Stroke Width
					</Label>
					<div className="flex items-center gap-1">
						{[1, 2, 3, 4, 6].map((w) => (
							<button
								key={w}
								type="button"
								onClick={() => {
									setStrokeWidth(w);
									applyStyles({ strokeWidth: w });
								}}
								className={`w-6 h-6 rounded border text-[10px] transition-colors ${
									strokeWidth === w
										? "bg-primary text-primary-foreground font-bold border-primary"
										: "hover:bg-muted border-border text-muted-foreground"
								}`}
							>
								{w}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Corner Radius (for Rectangle) */}
			{parsed.type === "rectangle" && (
				<div className="space-y-1">
					<div className="flex items-center justify-between">
						<Label className="text-[11px] text-muted-foreground">
							Corner Radius
						</Label>
						<span className="text-[10px] text-muted-foreground font-mono">
							{cornerRadius}px
						</span>
					</div>
					<input
						type="range"
						min={0}
						max={32}
						step={2}
						value={cornerRadius}
						onChange={(e) => {
							const val = Number.parseInt(e.target.value, 10);
							setCornerRadius(val);
							applyStyles({ cornerRadius: val });
						}}
						className="w-full accent-primary cursor-pointer"
					/>
				</div>
			)}

			{/* Rotation */}
			<div className="space-y-1">
				<div className="flex items-center justify-between">
					<Label className="text-[11px] text-muted-foreground">Rotation</Label>
					<span className="text-[10px] text-muted-foreground font-mono">
						{rotation}°
					</span>
				</div>
				<div className="flex items-center gap-2">
					<input
						type="range"
						min={-180}
						max={180}
						step={5}
						value={rotation}
						onChange={(e) => {
							const deg = Number.parseInt(e.target.value, 10);
							setRotation(deg);
							updateDrawingMutation.mutate({
								drawingId: drawing.drawing_id,
								data: { rotation: deg },
							});
						}}
						className="flex-1 accent-primary cursor-pointer"
					/>
					<Button
						size="icon-xs"
						variant="outline"
						onClick={() => {
							setRotation(0);
							updateDrawingMutation.mutate({
								drawingId: drawing.drawing_id,
								data: { rotation: 0 },
							});
						}}
						title="Reset Rotation to 0°"
					>
						<RotateCw className="w-3 h-3" />
					</Button>
				</div>
			</div>

			{/* Layer Ordering (Z-Index) */}
			<div className="pt-2 border-t border-border space-y-2">
				<div className="flex items-center justify-between">
					<Label className="text-[11px] font-medium text-muted-foreground">
						Layering (Z-Index: {drawing.z ?? 0})
					</Label>
				</div>

				<div className="grid grid-cols-2 gap-1.5">
					<Button
						size="xs"
						variant="outline"
						onClick={() => {
							updateDrawingMutation.mutate({
								drawingId: drawing.drawing_id,
								data: { z: -2 },
							});
						}}
						className="text-[11px] gap-1"
						title="Place behind all topology nodes and cables"
					>
						<ArrowDownToLine className="w-3 h-3" />
						<span>Send to Back</span>
					</Button>

					<Button
						size="xs"
						variant="outline"
						onClick={() => {
							updateDrawingMutation.mutate({
								drawingId: drawing.drawing_id,
								data: { z: 2 },
							});
						}}
						className="text-[11px] gap-1"
						title="Place above all items"
					>
						<ArrowUpToLine className="w-3 h-3" />
						<span>Bring to Front</span>
					</Button>
				</div>
			</div>
		</div>
	);
}
