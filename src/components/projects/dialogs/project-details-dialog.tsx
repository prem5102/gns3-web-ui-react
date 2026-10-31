import { ExternalLink, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { GNS3Project } from "@/types/gns3";

interface ProjectDetailsDialogProps {
	project: GNS3Project | null;
	onOpenChange: (open: boolean) => void;
	onLaunchLab: (projectId: string) => void;
}

export function ProjectDetailsDialog({
	project,
	onOpenChange,
	onLaunchLab,
}: ProjectDetailsDialogProps) {
	if (!project) return null;

	const isRunning = project.status === "opened";

	return (
		<Dialog open={Boolean(project)} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Info className="w-4 h-4 text-primary" />
						Project Details
					</DialogTitle>
					<DialogDescription>
						Specifications and runtime status for {project.name}.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-2.5 pt-2 text-xs">
					<div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border">
						<span className="text-muted-foreground">Project Name</span>
						<span className="col-span-2 font-semibold text-foreground">
							{project.name}
						</span>
					</div>

					<div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border">
						<span className="text-muted-foreground">Project ID</span>
						<span className="col-span-2 font-mono text-[11px] text-foreground select-all">
							{project.project_id}
						</span>
					</div>

					<div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border">
						<span className="text-muted-foreground">Status</span>
						<span className="col-span-2">
							<Badge
								variant={isRunning ? "success" : "muted"}
								className="capitalize text-[10px]"
							>
								{isRunning ? "Running" : "Closed"}
							</Badge>
						</span>
					</div>

					<div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border">
						<span className="text-muted-foreground">Filename</span>
						<span className="col-span-2 font-mono text-[11px] text-foreground">
							{project.filename || "default.gns3"}
						</span>
					</div>

					<div className="grid grid-cols-3 gap-2 py-1.5">
						<span className="text-muted-foreground">Path</span>
						<span className="col-span-2 font-mono text-[10px] text-muted-foreground truncate">
							{project.path || "Server managed storage"}
						</span>
					</div>
				</div>

				<DialogFooter className="pt-2">
					<Button
						size="sm"
						variant="default"
						onClick={() => {
							onLaunchLab(project.project_id);
							onOpenChange(false);
						}}
						className="gap-1.5 w-full sm:w-auto"
					>
						<ExternalLink className="w-3.5 h-3.5" />
						Launch Lab
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
