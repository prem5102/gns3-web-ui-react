import type { ReactTable } from "@tanstack/react-table";
import { CheckCircle2, Search, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DataTableFacetedFilter,
	type DataTableFacetedFilterOption,
	type DataTableFeatures,
	DataTableViewOptions,
} from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import type { Compute } from "@/types/gns3";

interface ComputeDataTableToolbarProps {
	table: ReactTable<DataTableFeatures, Compute>;
}

const statusOptions: DataTableFacetedFilterOption[] = [
	{
		label: "Connected",
		value: "connected",
		icon: ({ className }) => (
			<CheckCircle2 className={`w-3.5 h-3.5 text-emerald-500 ${className}`} />
		),
	},
	{
		label: "Disconnected",
		value: "disconnected",
		icon: ({ className }) => (
			<XCircle className={`w-3.5 h-3.5 text-destructive ${className}`} />
		),
	},
];

export function ComputeDataTableToolbar({
	table,
}: ComputeDataTableToolbarProps) {
	const isFiltered = (table.state.columnFilters?.length ?? 0) > 0;

	const nameFilterValue =
		(table.getColumn("name")?.getFilterValue() as string) ?? "";

	return (
		<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
			<div className="flex flex-1 flex-wrap items-center gap-2">
				<div className="relative w-full sm:w-64">
					<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
					<Input
						placeholder="Filter compute nodes..."
						value={nameFilterValue}
						onChange={(e) =>
							table.getColumn("name")?.setFilterValue(e.target.value)
						}
						className="h-8 pl-8 text-xs w-full"
					/>
					{nameFilterValue && (
						<button
							type="button"
							onClick={() => table.getColumn("name")?.setFilterValue("")}
							className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							<X className="w-3.5 h-3.5" />
						</button>
					)}
				</div>

				{table.getColumn("connected") && (
					<DataTableFacetedFilter
						column={table.getColumn("connected")}
						title="Status"
						options={statusOptions}
					/>
				)}

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
	);
}
