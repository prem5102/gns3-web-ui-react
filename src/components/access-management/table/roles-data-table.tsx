import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	type SortingState,
	useTable,
} from "@tanstack/react-table";
import { RefreshCw, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	type DataTableFeatures,
	DataTablePagination,
	DataTableViewOptions,
	features,
} from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { GNS3Role } from "@/types/gns3";
import { getRolesColumns } from "./roles-columns";

type VisibilityState = Record<string, boolean>;

export interface RolesDataTableProps {
	data: GNS3Role[];
	isLoading?: boolean;
	columns?: ColumnDef<DataTableFeatures, GNS3Role>[];
}

export function RolesDataTable({
	data,
	isLoading = false,
	columns: userColumns,
}: RolesDataTableProps) {
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "name", desc: false },
	]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });

	const defaultColumns = getRolesColumns();
	const tableColumns = userColumns ?? defaultColumns;

	const table = useTable({
		features,
		data,
		columns: tableColumns,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			pagination,
		},
		getRowId: (row) => row.role_id,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
	});

	const isFiltered = (table.state.columnFilters?.length ?? 0) > 0;
	const nameFilter =
		(table.getColumn("name")?.getFilterValue() as string) ?? "";

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
				<div className="flex flex-1 flex-wrap items-center gap-2">
					<div className="relative w-full sm:w-64">
						<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
						<Input
							placeholder="Filter roles..."
							value={nameFilter}
							onChange={(e) =>
								table.getColumn("name")?.setFilterValue(e.target.value)
							}
							className="h-8 pl-8 text-xs w-full"
						/>
						{nameFilter && (
							<button
								type="button"
								onClick={() => table.getColumn("name")?.setFilterValue("")}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						)}
					</div>

					{isFiltered && (
						<Button
							variant="ghost"
							onClick={() => table.resetColumnFilters()}
							className="h-8 px-2 lg:px-3 text-xs gap-1.5 font-normal text-muted-foreground hover:text-foreground"
						>
							Reset
							<X className="w-3.5 h-3.5" />
						</Button>
					)}
				</div>

				<div className="flex items-center gap-2">
					<DataTableViewOptions table={table} />
				</div>
			</div>

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
									Loading roles...
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
									className="h-28 text-center text-xs text-muted-foreground"
								>
									No roles found.
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
