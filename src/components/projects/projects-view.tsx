import { useNavigate } from "@tanstack/react-router";
import { Plus, RefreshCw, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	useCloseProject,
	useDeleteProject,
	useOpenProject,
	useProjects,
} from "@/features/projects/use-projects";
import { useTopologyStore } from "@/stores/topology-store";
import type { GNS3Project } from "@/types/gns3";
import { CreateProjectDialog } from "./dialogs/create-project-dialog";
import { ImportProjectDialog } from "./dialogs/import-project-dialog";
import { ProjectDetailsDialog } from "./dialogs/project-details-dialog";
import { RenameProjectDialog } from "./dialogs/rename-project-dialog";
import { ProjectsDataTable } from "./table";

export function ProjectsView() {
	const navigate = useNavigate();
	const setActiveProjectId = useTopologyStore((s) => s.setActiveProjectId);

	const {
		data: projects = [],
		isLoading,
		isRefetching,
		refetch,
	} = useProjects();

	const openProjectMutation = useOpenProject();
	const closeProjectMutation = useCloseProject();
	const deleteProjectMutation = useDeleteProject();

	// Dialog states
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
	const [detailsProject, setDetailsProject] = useState<GNS3Project | null>(
		null,
	);
	const [editProject, setEditProject] = useState<GNS3Project | null>(null);
	const [projectToDelete, setProjectToDelete] = useState<GNS3Project | null>(
		null,
	);
	const [batchDeleteProjects, setBatchDeleteProjects] = useState<GNS3Project[]>(
		[],
	);
	const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);

	const handleOpenLab = useCallback(
		(projectId: string) => {
			setActiveProjectId(projectId);
			const p = projects.find((proj) => proj.project_id === projectId);
			if (p && p.status === "closed") {
				openProjectMutation.mutate(projectId);
			}
			navigate({
				to: "/projects/$projectId",
				params: { projectId },
			});
		},
		[projects, openProjectMutation, setActiveProjectId, navigate],
	);

	const handleBatchOpen = useCallback(
		(selected: GNS3Project[]) => {
			for (const proj of selected) {
				openProjectMutation.mutate(proj.project_id);
			}
		},
		[openProjectMutation],
	);

	const handleBatchClose = useCallback(
		(selected: GNS3Project[]) => {
			for (const proj of selected) {
				closeProjectMutation.mutate(proj.project_id);
			}
		},
		[closeProjectMutation],
	);

	const handleBatchDeletePrompt = useCallback((selected: GNS3Project[]) => {
		setBatchDeleteProjects(selected);
		setIsBatchDeleteOpen(true);
	}, []);

	return (
		<main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 animate-in fade-in duration-200">
			{/* Page Title & Top Actions Row */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground">
						Projects
					</h1>
					<p className="text-xs text-muted-foreground mt-0.5">
						Manage network lab projects, launch interactive topology workspaces,
						or import designs.
					</p>
				</div>

				{/* Action Buttons */}
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isLoading || isRefetching}
						className="gap-1.5 shadow-xs"
						title="Refresh projects"
					>
						<RefreshCw
							className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
						/>
						<span className="hidden sm:inline">Refresh</span>
					</Button>

					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsImportModalOpen(true)}
						className="gap-1.5 shadow-xs"
					>
						<Upload className="w-4 h-4" />
						<span>Import project</span>
					</Button>

					<Button
						variant="default"
						size="sm"
						onClick={() => setIsCreateModalOpen(true)}
						className="gap-1.5 shadow-xs"
					>
						<Plus className="w-4 h-4" />
						<span>New project</span>
					</Button>
				</div>
			</div>

			{/* Data Table */}
			<ProjectsDataTable
				data={projects}
				isLoading={isLoading}
				onOpenLab={handleOpenLab}
				onOpenDetails={(proj) => setDetailsProject(proj)}
				onRename={(proj) => setEditProject(proj)}
				onClose={(projectId) => closeProjectMutation.mutate(projectId)}
				onDelete={(proj) => setProjectToDelete(proj)}
				onBatchOpen={handleBatchOpen}
				onBatchClose={handleBatchClose}
				onBatchDelete={handleBatchDeletePrompt}
			/>

			{/* Dialog: Create Project */}
			<CreateProjectDialog
				open={isCreateModalOpen}
				onOpenChange={setIsCreateModalOpen}
				onSuccess={(newProj) => handleOpenLab(newProj.project_id)}
			/>

			{/* Dialog: Import Project */}
			<ImportProjectDialog
				open={isImportModalOpen}
				onOpenChange={setIsImportModalOpen}
				onSuccess={(newProj) => handleOpenLab(newProj.project_id)}
			/>

			{/* Dialog: Project Details */}
			<ProjectDetailsDialog
				project={detailsProject}
				onOpenChange={(open) => !open && setDetailsProject(null)}
				onLaunchLab={handleOpenLab}
			/>

			{/* Dialog: Rename Project */}
			<RenameProjectDialog
				project={editProject}
				onOpenChange={(open) => !open && setEditProject(null)}
				onSuccess={() => refetch()}
			/>

			{/* Alert Dialog: Single Project Delete */}
			<AlertDialog
				open={Boolean(projectToDelete)}
				onOpenChange={(open) => !open && setProjectToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete project</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete project &quot;
							{projectToDelete?.name}&quot;? This action cannot be undone and
							will permanently remove all associated network nodes and links.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (projectToDelete) {
									deleteProjectMutation.mutate(projectToDelete.project_id);
									setProjectToDelete(null);
								}
							}}
							className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
						>
							Delete Project
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Alert Dialog: Batch Delete Selected Projects */}
			<AlertDialog open={isBatchDeleteOpen} onOpenChange={setIsBatchDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete selected projects</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete {batchDeleteProjects.length}{" "}
							selected project(s)? This action cannot be undone and will
							permanently remove all associated project data from the GNS3
							controller.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								for (const proj of batchDeleteProjects) {
									deleteProjectMutation.mutate(proj.project_id);
								}
								setBatchDeleteProjects([]);
								setIsBatchDeleteOpen(false);
							}}
							className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
						>
							Delete {batchDeleteProjects.length} Projects
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</main>
	);
}
