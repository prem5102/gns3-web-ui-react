import { useReactFlow } from "@xyflow/react";
import { Grid, Magnet, Maximize2, Moon, Play, Square, Sun, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStartAllNodes, useStopAllNodes } from "@/features/nodes/use-nodes";
import { useTopologyStore } from "@/stores/topology-store";
import { useUIStore } from "@/stores/ui-store";
import { DrawingTools } from "./drawing-toolbar";

export function CanvasToolbar() {
	const { fitView } = useReactFlow();
	const theme = useUIStore((s) => s.theme);
	const toggleTheme = useUIStore((s) => s.toggleTheme);

	const {
		activeProjectId,
		showGrid,
		setShowGrid,
		snapToGrid,
		setSnapToGrid,
		showInterfaceLabels,
		setShowInterfaceLabels,
	} = useTopologyStore();

	const startAllMutation = useStartAllNodes(activeProjectId || "");
	const stopAllMutation = useStopAllNodes(activeProjectId || "");

	return (
		<div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-card/90 backdrop-blur-md border border-border/80 shadow-lg rounded-xl p-1.5 text-xs select-none max-w-[calc(100vw-2rem)] overflow-x-auto scrollbar-none">
			{/* Node Execution Controls */}
			<div className="flex items-center gap-1">
				<Button
					size="icon-xs"
					variant="ghost"
					onClick={() => startAllMutation.mutate()}
					disabled={startAllMutation.isPending || !activeProjectId}
					className="text-emerald-500 hover:bg-emerald-500/10"
					title="Start All Nodes"
				>
					<Play className="w-3.5 h-3.5 fill-current" />
				</Button>

				<Button
					size="icon-xs"
					variant="ghost"
					onClick={() => stopAllMutation.mutate()}
					disabled={stopAllMutation.isPending || !activeProjectId}
					className="text-destructive hover:bg-destructive/10"
					title="Stop All Nodes"
				>
					<Square className="w-3.5 h-3.5 fill-current" />
				</Button>
			</div>

			<div className="w-px h-4 bg-border/60 mx-0.5 shrink-0" />

			{/* Canvas View Controls */}
			<div className="flex items-center gap-1">
				<Button
					size="icon-xs"
					variant={showGrid ? "secondary" : "ghost"}
					onClick={() => setShowGrid(!showGrid)}
					title="Toggle Canvas Grid"
				>
					<Grid className="w-3.5 h-3.5" />
				</Button>

				<Button
					size="icon-xs"
					variant={snapToGrid ? "secondary" : "ghost"}
					onClick={() => setSnapToGrid(!snapToGrid)}
					title="Toggle Snap to Grid"
				>
					<Magnet className="w-3.5 h-3.5" />
				</Button>

				<Button
					size="icon-xs"
					variant={showInterfaceLabels ? "secondary" : "ghost"}
					title="Toggle Interface Labels"
					onClick={() => setShowInterfaceLabels(!showInterfaceLabels)}
				>
					<Tag className="w-3.5 h-3.5" />
				</Button>

				<Button
					size="icon-xs"
					variant="ghost"
					title="Fit View"
					onClick={() => fitView({ duration: 300 })}
				>
					<Maximize2 className="w-3.5 h-3.5" />
				</Button>
			</div>

			<div className="w-px h-4 bg-border/60 mx-0.5 shrink-0" />

			{/* Drawing & Annotation Tools */}
			<DrawingTools />

			<div className="w-px h-4 bg-border/60 mx-0.5 shrink-0" />

			{/* Theme Appearance Mode */}
			<Button
				size="icon-xs"
				variant="ghost"
				title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
				onClick={toggleTheme}
			>
				{theme === "dark" ? (
					<Sun className="w-3.5 h-3.5 text-amber-400" />
				) : (
					<Moon className="w-3.5 h-3.5 text-zinc-700" />
				)}
			</Button>
		</div>
	);
}
