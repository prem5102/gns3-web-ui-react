import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	type RowSelectionState,
	type SortingState,
	useTable,
} from "@tanstack/react-table";
import { Play, PowerOff, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	type DataTableFeatures,
	DataTableFloatingBar,
	DataTablePagination,
	features,
} from "@/components/ui/data-table";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { GNS3Project } from "@/types/gns3";
import { getColumns, type ProjectTableActions } from "./columns";
import { DataTableToolbar } from "./data-table-toolbar";

type VisibilityState = Record<string, boolean>;

export interface ProjectsDataTableProps extends ProjectTableActions {
	data: GNS3Project[];
	isLoading?: boolean;
	columns?: ColumnDef<DataTableFeatures, GNS3Project>[];
	onBatchOpen?: (selectedProjects: GNS3Project[]) => void;
	onBatchClose?: (selectedProjects: GNS3Project[]) => void;
	onBatchDelete?: (selectedProjects: GNS3Project[]) => void;
}

export function ProjectsDataTable({
	data,
	isLoading = false,
	columns: userColumns,
	onOpenLab,
	onOpenDetails,
	onRename,
	onClose,
	onDelete,
	onBatchOpen,
	onBatchClose,
	onBatchDelete,
}: ProjectsDataTableProps) {
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "name", desc: false },
	]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });

	const defaultColumns = useMemo(
		() =>
			getColumns({
				onOpenLab,
				onOpenDetails,
				onRename,
				onClose,
				onDelete,
			}),
		[onOpenLab, onOpenDetails, onRename, onClose, onDelete],
	);

	const tableColumns = userColumns ?? defaultColumns;

	const tableMeta = useMemo(
		() => ({
			onOpenLab,
			onOpenDetails,
			onRename,
			onClose,
			onDelete,
		}),
		[onOpenLab, onOpenDetails, onRename, onClose, onDelete],
	);

	const table = useTable({
		features,
		data,
		columns: tableColumns,
		meta: tableMeta,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			pagination,
		},
		enableRowSelection: true,
		getRowId: (row) => row.project_id,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		onPaginationChange: setPagination,
	});

	const selectedRows = table.getFilteredSelectedRowModel().rows;
	const selectedProjects = useMemo(
		() => selectedRows.map((r) => r.original),
		[selectedRows],
	);

	const handleBatchDelete = () => {
		if (onBatchDelete) {
			onBatchDelete(selectedProjects);
			table.resetRowSelection();
		}
	};

	const handleBatchOpen = () => {
		if (onBatchOpen) {
			onBatchOpen(selectedProjects);
		}
	};

	const handleBatchClose = () => {
		if (onBatchClose) {
			onBatchClose(selectedProjects);
		}
	};

	return (
		<div className="space-y-4">
			<DataTableToolbar table={table} />

			<div className="overflow-hidden rounded-md border border-border/60 bg-card shadow-xs">
				<Table>
					<TableHeader className="bg-muted/40">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										colSpan={header.colSpan}
										className="text-xs font-semibold text-muted-foreground"
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell
									colSpan={tableColumns.length}
									className="h-32 text-center text-muted-foreground text-xs"
								>
									<RefreshCw className="w-5 h-5 animate-spin inline mr-2 text-primary" />
									Loading projects...
								</TableCell>
							</TableRow>
						) : table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
									className="hover:bg-muted/40 data-[state=selected]:bg-muted/60 transition-colors"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className="text-xs py-2.5">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={tableColumns.length}
									className="h-28 text-center text-xs text-muted-foreground"
								>
									No projects found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<DataTablePagination table={table} />

			{/* Floating Action Bar (tablecn style) */}
			<DataTableFloatingBar table={table}>
				{onBatchOpen && (
					<Button
						size="xs"
						variant="outline"
						onClick={handleBatchOpen}
						className="gap-1.5 h-7 text-xs shadow-xs"
					>
						<Play className="w-3 h-3 fill-current text-emerald-500" />
						<span>Start All</span>
					</Button>
				)}
				{onBatchClose && (
					<Button
						size="xs"
						variant="outline"
						onClick={handleBatchClose}
						className="gap-1.5 h-7 text-xs shadow-xs"
					>
						<PowerOff className="w-3 h-3 text-amber-500" />
						<span>Close All</span>
					</Button>
				)}
				{onBatchDelete && (
					<Button
						size="xs"
						variant="destructive"
						onClick={handleBatchDelete}
						className="gap-1.5 h-7 text-xs shadow-xs"
					>
						<Trash2 className="w-3 h-3" />
						<span>Delete Selected</span>
					</Button>
				)}
			</DataTableFloatingBar>
		</div>
	);
}
