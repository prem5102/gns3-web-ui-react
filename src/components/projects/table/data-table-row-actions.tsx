import type { Row } from "@tanstack/react-table";
import { Info, Pencil, Play, PowerOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DataTableFeatures } from "@/components/ui/data-table";
import type { GNS3Project } from "@/types/gns3";

export interface ProjectTableActions {
	onOpenLab?: (projectId: string) => void;
	onOpenDetails?: (project: GNS3Project) => void;
	onRename?: (project: GNS3Project) => void;
	onClose?: (projectId: string) => void;
	onDelete?: (project: GNS3Project) => void;
}

interface DataTableRowActionsProps extends ProjectTableActions {
	row: Row<DataTableFeatures, GNS3Project>;
}

export function DataTableRowActions({
	row,
	onOpenLab,
	onOpenDetails,
	onRename,
	onClose,
	onDelete,
}: DataTableRowActionsProps) {
	const proj = row.original;
	const isRunning = proj.status === "opened";
	const meta = row.table.options.meta as ProjectTableActions | undefined;

	const handleOpenLab = onOpenLab ?? meta?.onOpenLab;
	const handleOpenDetails = onOpenDetails ?? meta?.onOpenDetails;
	const handleRename = onRename ?? meta?.onRename;
	const handleClose = onClose ?? meta?.onClose;
	const handleDelete = onDelete ?? meta?.onDelete;

	return (
		<div className="flex items-center gap-1">
			<Button
				variant="ghost"
				size="icon-xs"
				className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
				onClick={() => handleOpenLab?.(proj.project_id)}
				title="Open Lab"
				aria-label="Open Lab"
			>
				<Play className="h-3.5 w-3.5 fill-current" />
				<span className="sr-only">Open Lab</span>
			</Button>

			<Button
				variant="ghost"
				size="icon-xs"
				className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
				onClick={() => handleOpenDetails?.(proj)}
				title="Project Details"
				aria-label="Project Details"
			>
				<Info className="h-3.5 w-3.5" />
				<span className="sr-only">Project Details</span>
			</Button>

			<Button
				variant="ghost"
				size="icon-xs"
				className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
				onClick={() => handleRename?.(proj)}
				title="Rename Project"
				aria-label="Rename Project"
			>
				<Pencil className="h-3.5 w-3.5" />
				<span className="sr-only">Rename Project</span>
			</Button>

			{isRunning && (
				<Button
					variant="ghost"
					size="icon-xs"
					className="h-7 w-7 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 dark:hover:bg-amber-500/20"
					onClick={() => handleClose?.(proj.project_id)}
					title="Close Project"
					aria-label="Close Project"
				>
					<PowerOff className="h-3.5 w-3.5" />
					<span className="sr-only">Close Project</span>
				</Button>
			)}

			<Button
				variant="ghost"
				size="icon-xs"
				className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
				onClick={() => handleDelete?.(proj)}
				title="Delete Project"
				aria-label="Delete Project"
			>
				<Trash2 className="h-3.5 w-3.5" />
				<span className="sr-only">Delete Project</span>
			</Button>
		</div>
	);
}
