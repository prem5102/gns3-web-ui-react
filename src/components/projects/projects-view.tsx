import { useNavigate } from "@tanstack/react-router";
import type { ColumnFiltersState, RowSelectionState, SortingState } from "@tanstack/react-table";
import {
	FolderGit2,
	Info,
	LayoutGrid,
	List,
	MoreHorizontal,
	Pencil,
	Play,
	Plus,
	PowerOff,
	RefreshCw,
	Search,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

type VisibilityState = Record<string, boolean>;

import { flexRender } from "@tanstack/react-table";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import {
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useLegacyTable,
} from "@tanstack/react-table/legacy";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DataTableColumnHeader,
	DataTablePagination,
	DataTableViewOptions,
} from "@/components/ui/data-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	useCloseProject,
	useDeleteProject,
	useOpenProject,
	useProjects,
} from "@/features/projects/use-projects";
import { useTopologyStore } from "@/stores/topology-store";
import type { GNS3Project } from "@/types/gns3";
import { CreateProjectDialog } from "./create-project-dialog";
import { ImportProjectDialog } from "./import-project-dialog";
import { ProjectDetailsDialog } from "./project-details-dialog";
import { RenameProjectDialog } from "./rename-project-dialog";

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

	// Filter & Search states
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | "opened" | "closed">("all");
	const [viewMode, setViewMode] = useState<"table" | "grid">("table");

	// TanStack Table states
	const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });

	// Dialog states
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
	const [detailsProject, setDetailsProject] = useState<GNS3Project | null>(null);
	const [editProject, setEditProject] = useState<GNS3Project | null>(null);
	const [projectToDelete, setProjectToDelete] = useState<GNS3Project | null>(null);
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

	// TanStack Table Column Definitions
	const columns = useMemo<ColumnDef<GNS3Project>[]>(
		() => [
			{
				id: "select",
				header: ({ table }) => (
					<Checkbox
						checked={
							table.getIsAllPageRowsSelected() ||
							(table.getIsSomePageRowsSelected() && "indeterminate")
						}
						onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
						aria-label="Select all"
						className="translate-y-0.5"
					/>
				),
				cell: ({ row }) => (
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(value) => row.toggleSelected(!!value)}
						aria-label="Select row"
						className="translate-y-0.5"
					/>
				),
				enableSorting: false,
				enableHiding: false,
			},
			{
				accessorKey: "name",
				header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
				cell: ({ row }) => {
					const proj = row.original;
					return (
						<div className="flex flex-col min-w-0">
							<button
								type="button"
								onClick={() => handleOpenLab(proj.project_id)}
								className="font-semibold text-xs text-foreground text-left hover:text-primary transition-colors truncate"
							>
								{proj.name}
							</button>
							<span className="text-[10px] text-muted-foreground font-mono truncate">
								{proj.filename || proj.project_id}
							</span>
						</div>
					);
				},
				filterFn: (row, _columnId, filterValue) => {
					const query = String(filterValue).toLowerCase().trim();
					if (!query) return true;
					const name = String(row.original.name || "").toLowerCase();
					const filename = String(row.original.filename || "").toLowerCase();
					const id = String(row.original.project_id || "").toLowerCase();
					return name.includes(query) || filename.includes(query) || id.includes(query);
				},
			},
			{
				id: "createdBy",
				header: ({ column }) => <DataTableColumnHeader column={column} title="Created By" />,
				cell: () => <span className="text-xs text-muted-foreground font-medium">admin</span>,
				enableSorting: false,
			},
			{
				accessorKey: "status",
				header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
				cell: ({ row }) => {
					const isRunning = row.getValue("status") === "opened";
					return (
						<Badge
							variant={isRunning ? "success" : "muted"}
							className="text-[10px] capitalize font-medium gap-1 px-1.5 py-0.5"
						>
							<span
								className={`w-1.5 h-1.5 rounded-full ${
									isRunning ? "bg-emerald-500" : "bg-zinc-400"
								}`}
							/>
							{isRunning ? "Running" : "Closed"}
						</Badge>
					);
				},
				filterFn: (row, id, value) => {
					if (!value || value === "all") return true;
					return row.getValue(id) === value;
				},
			},
			{
				id: "actions",
				cell: ({ row }) => {
					const proj = row.original;
					const isRunning = proj.status === "opened";
					return (
						<div className="flex items-center justify-end gap-1">
							<Button
								size="xs"
								variant="default"
								onClick={() => handleOpenLab(proj.project_id)}
								className="gap-1 text-xs h-7 font-medium"
							>
								<Play className="w-3 h-3 fill-current" />
								<span>Open Lab</span>
							</Button>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
									>
										<span className="sr-only">Open menu</span>
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-44">
									<DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
									<DropdownMenuItem
										onClick={() => handleOpenLab(proj.project_id)}
										className="text-xs gap-2 cursor-pointer"
									>
										<Play className="w-3.5 h-3.5" /> Open Lab
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => setDetailsProject(proj)}
										className="text-xs gap-2 cursor-pointer"
									>
										<Info className="w-3.5 h-3.5" /> Project details
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => setEditProject(proj)}
										className="text-xs gap-2 cursor-pointer"
									>
										<Pencil className="w-3.5 h-3.5" /> Rename project
									</DropdownMenuItem>
									{isRunning && (
										<DropdownMenuItem
											onClick={() => closeProjectMutation.mutate(proj.project_id)}
											className="text-xs gap-2 cursor-pointer text-amber-500 hover:text-amber-600"
										>
											<PowerOff className="w-3.5 h-3.5" /> Close project
										</DropdownMenuItem>
									)}
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => setProjectToDelete(proj)}
										className="text-xs gap-2 cursor-pointer text-destructive focus:text-destructive"
									>
										<Trash2 className="w-3.5 h-3.5" /> Delete project
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					);
				},
				enableSorting: false,
				enableHiding: false,
			},
		],
		[handleOpenLab, closeProjectMutation],
	);

	const table = useLegacyTable({
		data: projects,
		columns,
		getRowId: (row) => row.project_id,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			pagination,
		},
		enableRowSelection: true,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	const selectedRows = table.getFilteredSelectedRowModel().rows;
	const selectedCount = selectedRows.length;

	const handleBatchDelete = () => {
		setIsBatchDeleteOpen(true);
	};

	const handleBatchOpen = () => {
		for (const row of selectedRows) {
			openProjectMutation.mutate(row.original.project_id);
		}
	};

	const handleBatchClose = () => {
		for (const row of selectedRows) {
			closeProjectMutation.mutate(row.original.project_id);
		}
	};

	const runningCount = projects.filter((p) => p.status === "opened").length;
	const closedCount = projects.filter((p) => p.status === "closed").length;

	return (
		<main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 animate-in fade-in duration-200">
			{/* Page Title & Top Actions Row */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground">Projects</h1>
					<p className="text-xs text-muted-foreground mt-0.5">
						Manage network lab projects, launch interactive topology workspaces, or import designs.
					</p>
				</div>

				{/* Action Buttons */}
				<div className="flex items-center gap-2">
					<Button
						variant="default"
						size="sm"
						onClick={() => setIsCreateModalOpen(true)}
						className="gap-1.5 shadow-xs"
					>
						<Plus className="w-4 h-4" />
						<span>New project</span>
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
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isRefetching}
						className="gap-1.5 shadow-xs text-muted-foreground hover:text-foreground"
						title="Refresh projects list"
					>
						<RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
						<span className="hidden sm:inline">Refresh</span>
					</Button>
				</div>
			</div>

			{/* Metric Stat Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card className="border-border/60 shadow-xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">Total Projects</p>
							<p className="text-2xl font-bold">{projects.length}</p>
						</div>
						<div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
							<FolderGit2 className="w-5 h-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60 shadow-xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">Running Labs</p>
							<p className="text-2xl font-bold text-emerald-500">{runningCount}</p>
						</div>
						<div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
							<Play className="w-5 h-5 fill-current" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60 shadow-xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">Closed Labs</p>
							<p className="text-2xl font-bold text-muted-foreground">{closedCount}</p>
						</div>
						<div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
							<PowerOff className="w-5 h-5" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filter & Search Bar */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Search projects by name or ID..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							table.getColumn("name")?.setFilterValue(e.target.value);
						}}
						className="pl-9 text-xs"
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={() => {
								setSearchQuery("");
								table.getColumn("name")?.setFilterValue("");
							}}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							<X className="w-3.5 h-3.5" />
						</button>
					)}
				</div>

				<div className="flex items-center gap-2">
					<Select
						value={statusFilter}
						onValueChange={(val: "all" | "opened" | "closed") => {
							setStatusFilter(val);
							table.getColumn("status")?.setFilterValue(val === "all" ? undefined : val);
						}}
					>
						<SelectTrigger className="w-36 text-xs h-9">
							<SelectValue placeholder="All statuses" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All statuses</SelectItem>
							<SelectItem value="opened">Running</SelectItem>
							<SelectItem value="closed">Closed</SelectItem>
						</SelectContent>
					</Select>

					<DataTableViewOptions table={table} />

					<div className="border border-border/60 rounded-md p-0.5 flex items-center bg-muted/40">
						<Button
							size="icon-xs"
							variant={viewMode === "table" ? "secondary" : "ghost"}
							onClick={() => setViewMode("table")}
							title="Table View"
						>
							<List className="w-3.5 h-3.5" />
						</Button>
						<Button
							size="icon-xs"
							variant={viewMode === "grid" ? "secondary" : "ghost"}
							onClick={() => setViewMode("grid")}
							title="Grid View"
						>
							<LayoutGrid className="w-3.5 h-3.5" />
						</Button>
					</div>
				</div>
			</div>

			{/* Batch Selection Action Bar */}
			{selectedCount > 0 && (
				<div className="p-2.5 px-4 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between text-xs animate-in fade-in duration-150">
					<span className="font-medium text-foreground">
						{selectedCount} project{selectedCount > 1 ? "s" : ""} selected
					</span>
					<div className="flex items-center gap-2">
						<Button
							size="xs"
							variant="outline"
							onClick={handleBatchOpen}
							className="gap-1.5 h-7"
						>
							<Play className="w-3 h-3 fill-current text-emerald-500" />
							<span>Start All</span>
						</Button>
						<Button
							size="xs"
							variant="outline"
							onClick={handleBatchClose}
							className="gap-1.5 h-7"
						>
							<PowerOff className="w-3 h-3 text-amber-500" />
							<span>Close All</span>
						</Button>
						<Button
							size="xs"
							variant="destructive"
							onClick={handleBatchDelete}
							className="gap-1.5 h-7"
						>
							<Trash2 className="w-3 h-3" />
							<span>Delete Selected</span>
						</Button>
					</div>
				</div>
			)}

			{/* View Representation: Table or Grid */}
			{viewMode === "table" ? (
				<div className="rounded-lg border border-border/60 bg-card overflow-hidden shadow-xs">
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id} colSpan={header.colSpan}>
											{header.isPlaceholder
												? null
												: flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground text-xs">
										<RefreshCw className="w-5 h-5 animate-spin inline mr-2 text-primary" />
										Loading projects...
									</TableCell>
								</TableRow>
							) : table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && "selected"}
										className="hover:bg-muted/40 transition-colors"
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={columns.length} className="h-36 text-center">
										<div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
											<FolderGit2 className="w-8 h-8 stroke-1 text-muted-foreground/60" />
											<p className="font-medium text-foreground">No projects found</p>
											<p className="text-xs">
												{searchQuery || statusFilter !== "all"
													? "No projects match your filter criteria."
													: "Create a new project or import a topology archive to begin."}
											</p>
										</div>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>

					<div className="p-4 border-t border-border/60">
						<DataTablePagination table={table} />
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{table.getRowModel().rows.map((row) => {
						const proj = row.original;
						const isRunning = proj.status === "opened";
						return (
							<Card
								key={proj.project_id}
								className="border-border/60 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between"
							>
								<CardContent className="p-4 space-y-3">
									<div className="flex items-start justify-between gap-2">
										<div className="flex items-center gap-2.5 min-w-0">
											<div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
												<FolderGit2 className="w-5 h-5" />
											</div>
											<div className="min-w-0">
												<h3
													onClick={() => handleOpenLab(proj.project_id)}
													className="font-bold text-sm text-foreground hover:text-primary cursor-pointer truncate"
													title={proj.name}
												>
													{proj.name}
												</h3>
												<p className="text-[10px] text-muted-foreground font-mono truncate">
													{proj.project_id}
												</p>
											</div>
										</div>

										<Badge
											variant={isRunning ? "success" : "muted"}
											className="text-[10px] capitalize font-medium gap-1 px-1.5 py-0.5 shrink-0"
										>
											<span
												className={`w-1.5 h-1.5 rounded-full ${
													isRunning ? "bg-emerald-500" : "bg-zinc-400"
												}`}
											/>
											{isRunning ? "Running" : "Closed"}
										</Badge>
									</div>

									<div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
										<Button
											size="xs"
											variant="default"
											onClick={() => handleOpenLab(proj.project_id)}
											className="gap-1.5"
										>
											<Play className="w-3 h-3 fill-current" />
											<span>Launch Lab</span>
										</Button>

										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button size="icon-xs" variant="ghost">
													<MoreHorizontal className="w-3.5 h-3.5" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-40">
												<DropdownMenuItem onClick={() => setDetailsProject(proj)}>
													Details
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => setEditProject(proj)}>
													Rename
												</DropdownMenuItem>
												{isRunning && (
													<DropdownMenuItem onClick={() => closeProjectMutation.mutate(proj.project_id)}>
														Close Project
													</DropdownMenuItem>
												)}
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onClick={() => setProjectToDelete(proj)}
													className="text-destructive"
												>
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

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
							Are you sure you want to delete project &quot;{projectToDelete?.name}&quot;? This action cannot be undone and will permanently remove all associated network nodes and links.
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
							Are you sure you want to delete {selectedCount} selected project(s)? This action cannot be undone and will permanently remove all associated project data from the GNS3 controller.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								for (const row of selectedRows) {
									deleteProjectMutation.mutate(row.original.project_id);
								}
								table.resetRowSelection();
								setIsBatchDeleteOpen(false);
							}}
							className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
						>
							Delete {selectedCount} Projects
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</main>
	);
}
