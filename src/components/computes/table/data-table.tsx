import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	type SortingState,
	useTable,
} from "@tanstack/react-table";
import { RefreshCw, Server } from "lucide-react";
import { useMemo, useState } from "react";
import {
	type DataTableFeatures,
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
import type { Compute } from "@/types/gns3";
import { type ComputeTableActions, getComputeColumns } from "./columns";
import { ComputeDataTableToolbar } from "./data-table-toolbar";

type VisibilityState = Record<string, boolean>;

export interface ComputesDataTableProps extends ComputeTableActions {
	data: Compute[];
	isLoading?: boolean;
	columns?: ColumnDef<DataTableFeatures, Compute>[];
}

export function ComputesDataTable({
	data,
	isLoading = false,
	columns: userColumns,
	onConnect,
	onDelete,
	isConnecting = false,
}: ComputesDataTableProps) {
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "name", desc: false },
	]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });

	const defaultColumns = useMemo(
		() =>
			getComputeColumns({
				onConnect,
				onDelete,
				isConnecting,
			}),
		[onConnect, onDelete, isConnecting],
	);

	const tableColumns = userColumns ?? defaultColumns;

	const tableMeta = useMemo(
		() => ({
			onConnect,
			onDelete,
			isConnecting,
		}),
		[onConnect, onDelete, isConnecting],
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
			pagination,
		},
		getRowId: (row) => row.compute_id,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
	});

	return (
		<div className="space-y-4">
			<ComputeDataTableToolbar table={table} />

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
									Loading compute nodes...
								</TableCell>
							</TableRow>
						) : table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									className="hover:bg-muted/40 transition-colors"
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
									className="h-36 text-center"
								>
									<div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
										<Server className="w-8 h-8 stroke-1 text-muted-foreground/60" />
										<p className="font-medium text-foreground text-xs">
											No compute nodes found
										</p>
										<p className="text-[11px] text-muted-foreground">
											The local compute engine is automatically managed by the
											controller.
										</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<DataTablePagination table={table} />
		</div>
	);
}
