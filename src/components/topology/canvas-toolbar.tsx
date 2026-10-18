import { useReactFlow } from "@xyflow/react";
import { Grid, Magnet, Maximize2, Play, Square, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStartAllNodes, useStopAllNodes } from "@/features/nodes/use-nodes";
import { useTopologyStore } from "@/stores/topology-store";

export function CanvasToolbar() {
	const { fitView } = useReactFlow();

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
		<div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-card/90 backdrop-blur-md border border-border/80 shadow-md rounded-lg p-1.5 text-xs">
			<Button
				size="xs"
				variant="ghost"
				onClick={() => startAllMutation.mutate()}
				disabled={startAllMutation.isPending || !activeProjectId}
				className="text-emerald-500 hover:bg-emerald-500/10"
				title="Start All Nodes"
			>
				<Play className="w-3.5 h-3.5 fill-current" />
			</Button>

			<Button
				size="xs"
				variant="ghost"
				onClick={() => stopAllMutation.mutate()}
				disabled={stopAllMutation.isPending || !activeProjectId}
				className="text-destructive hover:bg-destructive/10"
				title="Stop All Nodes"
			>
				<Square className="w-3.5 h-3.5 fill-current" />
			</Button>

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
	);
}
