import { Folder, Grid, Play, Settings2, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	useCloseProject,
	useOpenProject,
	useProject,
} from "@/features/projects/use-projects";
import { useTopologyStore } from "@/stores/topology-store";

interface ProjectPropertiesProps {
	projectId: string;
}

export function ProjectProperties({ projectId }: ProjectPropertiesProps) {
	const { data: project } = useProject(projectId);
	const openProjectMutation = useOpenProject();
	const closeProjectMutation = useCloseProject();

	const {
		showGrid,
		setShowGrid,
		snapToGrid,
		setSnapToGrid,
		gridSize,
		setGridSize,
	} = useTopologyStore();

	if (!project) {
		return (
			<div className="flex flex-col items-center justify-center p-6 text-muted-foreground text-xs">
				<Folder className="w-8 h-8 opacity-30 mb-2" />
				<p>No project loaded.</p>
			</div>
		);
	}

	const isOpened = project.status === "opened";

	return (
		<div className="flex flex-col space-y-4 text-xs">
			{/* Header */}
			<div className="flex flex-col space-y-1.5 border-b border-border/70 pb-3">
				<div className="flex items-center justify-between">
					<span className="font-semibold text-foreground flex items-center gap-1.5 truncate">
						<Folder className="w-4 h-4 text-primary" />
						<span className="truncate">{project.name}</span>
					</span>
					<Badge
						variant={isOpened ? "success" : "muted"}
						className="text-[10px] uppercase font-mono"
					>
						{project.status}
					</Badge>
				</div>
				<span className="font-mono text-[10px] text-muted-foreground truncate">
					ID: {project.project_id}
				</span>
			</div>

			{/* Project Status Actions */}
			<div className="flex gap-2">
				{isOpened ? (
					<Button
						size="xs"
						variant="outline"
						className="w-full gap-1.5 text-muted-foreground hover:text-foreground"
						onClick={() => closeProjectMutation.mutate(project.project_id)}
						disabled={closeProjectMutation.isPending}
					>
						<Square className="w-3 h-3" />
						<span>Close Project</span>
					</Button>
				) : (
					<Button
						size="xs"
						variant="default"
						className="w-full gap-1.5"
						onClick={() => openProjectMutation.mutate(project.project_id)}
						disabled={openProjectMutation.isPending}
					>
						<Play className="w-3 h-3" />
						<span>Open Project</span>
					</Button>
				)}
			</div>

			{/* Project Details */}
			<div className="flex flex-col space-y-2 border border-border/60 rounded-md p-3 bg-muted/20">
				<span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
					<Settings2 className="w-3.5 h-3.5 text-primary" />
					<span>Project Specifications</span>
				</span>
				<div className="grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
					<span>Scene Width:</span>
					<span className="font-mono text-foreground font-medium">
						{project.scene_width || 2000} px
					</span>
					<span>Scene Height:</span>
					<span className="font-mono text-foreground font-medium">
						{project.scene_height || 1000} px
					</span>
					<span>Filename:</span>
					<span className="font-mono text-foreground truncate">
						{project.filename || "N/A"}
					</span>
					<span>Created By:</span>
					<span className="font-mono text-foreground">
						{project.created_by || "admin"}
					</span>
				</div>
			</div>

			{/* Canvas Interaction Settings */}
			<div className="flex flex-col space-y-2 border border-border/60 rounded-md p-3 bg-muted/20">
				<span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
					<Grid className="w-3.5 h-3.5 text-primary" />
					<span>Canvas Grid & Snap</span>
				</span>

				<div className="flex items-center justify-between text-[11px]">
					<span>Show Grid Dots</span>
					<input
						type="checkbox"
						checked={showGrid}
						onChange={(e) => setShowGrid(e.target.checked)}
						className="rounded border-border accent-primary cursor-pointer"
					/>
				</div>

				<div className="flex items-center justify-between text-[11px]">
					<span>Snap to Grid</span>
					<input
						type="checkbox"
						checked={snapToGrid}
						onChange={(e) => setSnapToGrid(e.target.checked)}
						className="rounded border-border accent-primary cursor-pointer"
					/>
				</div>

				<div className="flex items-center justify-between text-[11px]">
					<span>Grid Size</span>
					<select
						value={gridSize}
						onChange={(e) => setGridSize(Number(e.target.value))}
						className="bg-background text-foreground border border-border rounded px-1.5 py-0.5 text-xs font-mono"
					>
						<option value={15}>15 px</option>
						<option value={25}>25 px</option>
						<option value={50}>50 px</option>
						<option value={75}>75 px</option>
					</select>
				</div>
			</div>
		</div>
	);
}
