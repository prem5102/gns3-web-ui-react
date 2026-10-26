import {
	ArrowRight,
	Circle,
	Cloud,
	Image as ImageIcon,
	Layers,
	Minus,
	MousePointer,
	Palette,
	Pencil,
	Square,
	Type,
} from "lucide-react";
import type React from "react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	generateImageSvg,
	generateRectangleSvg,
	NETWORK_COLOR_PRESETS,
} from "@/features/drawings/drawing-utils";
import { useCreateDrawing } from "@/features/drawings/use-drawings";
import { useProjectNodes } from "@/features/nodes/use-nodes";
import { cn } from "@/lib/utils";
import {
	type DrawingToolType,
	useTopologyStore,
} from "@/stores/topology-store";

export function DrawingTools() {
	const {
		activeProjectId,
		activeDrawingTool,
		setActiveDrawingTool,
		drawingDefaults,
		setDrawingDefaults,
		selectedNodeId,
	} = useTopologyStore();

	const createDrawingMutation = useCreateDrawing(activeProjectId || "");
	const { data: nodes = [] } = useProjectNodes(activeProjectId);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const selectTool = (tool: DrawingToolType) => {
		if (activeDrawingTool === tool) {
			setActiveDrawingTool(null);
		} else {
			setActiveDrawingTool(tool);
		}
	};

	// Handle Image File Upload -> Convert to Base64 SVG -> Save to GNS3
	const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file || !activeProjectId) return;

		const reader = new FileReader();
		reader.onload = () => {
			const base64Data = reader.result as string;
			// Create image shape with natural aspect ratio
			const img = new Image();
			img.onload = () => {
				const maxDim = 300;
				let width = img.width || 200;
				let height = img.height || 150;
				if (width > maxDim || height > maxDim) {
					const ratio = Math.min(maxDim / width, maxDim / height);
					width = Math.round(width * ratio);
					height = Math.round(height * ratio);
				}

				const svg = generateImageSvg({
					width,
					height,
					href: base64Data,
				});

				createDrawingMutation.mutate({
					project_id: activeProjectId,
					svg,
					x: 200,
					y: 200,
					z: -1,
					rotation: 0,
					locked: false,
				});
				setActiveDrawingTool(null);
			};
			img.src = base64Data;
		};
		reader.readAsDataURL(file);
		// Reset file input
		event.target.value = "";
	};

	// Smart Multi-Node Area / Grouping (Matches GNS3 3.1 Copilot smart area calculation)
	const handleSmartArea = (presetId: string) => {
		if (!activeProjectId || nodes.length === 0) return;

		const preset =
			NETWORK_COLOR_PRESETS.find((p) => p.id === presetId) ||
			NETWORK_COLOR_PRESETS[0];

		// Find target nodes: if one node is selected, find it and its nearest neighbor, or use all nodes
		let targetNodes = nodes;
		if (selectedNodeId) {
			const sel = nodes.find((n) => n.node_id === selectedNodeId);
			if (sel) {
				// Pick up to 3 nearby nodes
				targetNodes = [sel];
				const others = nodes
					.filter((n) => n.node_id !== selectedNodeId)
					.sort((a, b) => {
						const distA = Math.hypot(a.x - sel.x, a.y - sel.y);
						const distB = Math.hypot(b.x - sel.x, b.y - sel.y);
						return distA - distB;
					});
				if (others.length > 0) targetNodes.push(others[0]);
				if (others.length > 1) targetNodes.push(others[1]);
			}
		}

		const minX = Math.min(...targetNodes.map((n) => n.x)) - 60;
		const maxX = Math.max(...targetNodes.map((n) => n.x + 80)) + 60;
		const minY = Math.min(...targetNodes.map((n) => n.y)) - 60;
		const maxY = Math.max(...targetNodes.map((n) => n.y + 80)) + 60;

		const width = Math.max(maxX - minX, 180);
		const height = Math.max(maxY - minY, 120);

		const svg = generateRectangleSvg({
			width,
			height,
			fill: preset.fill,
			fillOpacity: preset.fillOpacity,
			stroke: preset.stroke,
			strokeWidth: 2,
			strokeStyle: "dashed",
			cornerRadius: 16,
		});

		createDrawingMutation.mutate({
			project_id: activeProjectId,
			svg,
			x: Math.round(minX),
			y: Math.round(minY),
			z: -2, // behind all devices
			rotation: 0,
			locked: false,
		});
	};

	return (
		<div className="flex items-center gap-1">
			{/* Pointer / Select */}
			<Button
				size="icon-xs"
				variant={activeDrawingTool === null ? "secondary" : "ghost"}
				onClick={() => setActiveDrawingTool(null)}
				title="Pointer / Select Tool (V)"
			>
				<MousePointer className="w-3.5 h-3.5" />
			</Button>

			<div className="w-px h-4 bg-border/60 mx-0.5" />

			{/* Rectangle */}
			<Button
				size="icon-xs"
				variant={activeDrawingTool === "rectangle" ? "secondary" : "ghost"}
				onClick={() => selectTool("rectangle")}
				className={cn(
					activeDrawingTool === "rectangle" && "text-primary font-bold",
				)}
				title="Draw Rectangle (R) - Click canvas to place"
			>
				<Square className="w-3.5 h-3.5" />
			</Button>

			{/* Ellipse */}
			<Button
				size="icon-xs"
				variant={activeDrawingTool === "ellipse" ? "secondary" : "ghost"}
				onClick={() => selectTool("ellipse")}
				className={cn(
					activeDrawingTool === "ellipse" && "text-primary font-bold",
				)}
				title="Draw Ellipse / Circle (E) - Click canvas to place"
			>
				<Circle className="w-3.5 h-3.5" />
			</Button>

			{/* Text / Note */}
			<Button
				size="icon-xs"
				variant={activeDrawingTool === "text" ? "secondary" : "ghost"}
				onClick={() => selectTool("text")}
				className={cn(activeDrawingTool === "text" && "text-primary font-bold")}
				title="Add Text Annotation (T) - Click canvas to place"
			>
				<Type className="w-3.5 h-3.5" />
			</Button>

			{/* Straight Line */}
			<Button
				size="icon-xs"
				variant={activeDrawingTool === "line" ? "secondary" : "ghost"}
				onClick={() => selectTool("line")}
				className={cn(activeDrawingTool === "line" && "text-primary font-bold")}
				title="Draw Line (L)"
			>
				<Minus className="w-3.5 h-3.5" />
			</Button>

			{/* Arrow */}
			<Button
				size="icon-xs"
				variant={activeDrawingTool === "arrow" ? "secondary" : "ghost"}
				onClick={() => selectTool("arrow")}
				className={cn(
					activeDrawingTool === "arrow" && "text-primary font-bold",
				)}
				title="Draw Flow Arrow (A)"
			>
				<ArrowRight className="w-3.5 h-3.5" />
			</Button>

			{/* Cloud */}
			<Button
				size="icon-xs"
				variant={activeDrawingTool === "cloud" ? "secondary" : "ghost"}
				onClick={() => selectTool("cloud")}
				className={cn(
					activeDrawingTool === "cloud" && "text-primary font-bold",
				)}
				title="Draw Cloud Boundary (C)"
			>
				<Cloud className="w-3.5 h-3.5" />
			</Button>

			{/* Freehand Pen */}
			<Button
				size="icon-xs"
				variant={activeDrawingTool === "pen" ? "secondary" : "ghost"}
				onClick={() => selectTool("pen")}
				className={cn(activeDrawingTool === "pen" && "text-primary font-bold")}
				title="Freehand Sketch / Pencil (P)"
			>
				<Pencil className="w-3.5 h-3.5" />
			</Button>

			{/* Image Upload */}
			<Button
				size="icon-xs"
				variant="ghost"
				onClick={() => fileInputRef.current?.click()}
				title="Insert Image (PNG, JPG, SVG)"
			>
				<ImageIcon className="w-3.5 h-3.5" />
			</Button>
			<input
				ref={fileInputRef}
				type="file"
				accept="image/png,image/jpeg,image/svg+xml,image/webp"
				className="hidden"
				onChange={handleImageUpload}
			/>

			<div className="w-px h-4 bg-border/60 mx-0.5" />

			{/* Smart Multi-Node Area / Grouping */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						size="icon-xs"
						variant="ghost"
						title="Smart Area / Boundary (Enclose nodes with network preset)"
					>
						<Layers className="w-3.5 h-3.5 text-blue-500" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="w-56 p-1 text-xs">
					<DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
						Auto-Enclose Nodes
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{NETWORK_COLOR_PRESETS.map((preset) => (
						<DropdownMenuItem
							key={preset.id}
							onClick={() => handleSmartArea(preset.id)}
							className="flex items-center gap-2 cursor-pointer py-1.5"
						>
							<span
								className="w-3 h-3 rounded-full shrink-0 border"
								style={{
									backgroundColor: preset.fill,
									borderColor: preset.stroke,
								}}
							/>
							<span className="truncate">{preset.name}</span>
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Quick Color Palette Selector */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						size="icon-xs"
						variant="ghost"
						title="Active Drawing Color Scheme"
					>
						<Palette
							className="w-3.5 h-3.5"
							style={{ color: drawingDefaults.strokeColor }}
						/>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="w-52 p-1 text-xs">
					<DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
						Color Palette Presets
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{NETWORK_COLOR_PRESETS.map((preset) => (
						<DropdownMenuItem
							key={preset.id}
							onClick={() =>
								setDrawingDefaults({
									fillColor: preset.fill,
									fillOpacity: preset.fillOpacity,
									strokeColor: preset.stroke,
								})
							}
							className="flex items-center gap-2 cursor-pointer py-1.5"
						>
							<span
								className="w-3 h-3 rounded-full shrink-0 border"
								style={{
									backgroundColor: preset.fill,
									borderColor: preset.stroke,
								}}
							/>
							<span className="truncate">{preset.name}</span>
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

/** Legacy stub for backwards compatibility */
export function DrawingToolbar() {
	return null;
}
