import type { ReactTable } from "@tanstack/react-table";
import { Play, PowerOff, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DataTableFacetedFilter,
	type DataTableFacetedFilterOption,
	type DataTableFeatures,
	DataTableViewOptions,
} from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import type { GNS3Project } from "@/types/gns3";

interface DataTableToolbarProps {
	table: ReactTable<DataTableFeatures, GNS3Project>;
}

const statusOptions: DataTableFacetedFilterOption[] = [
	{
		label: "Running",
		value: "opened",
		icon: ({ className }) => (
			<Play
				className={`w-3.5 h-3.5 fill-current text-emerald-500 ${className}`}
			/>
		),
	},
	{
		label: "Closed",
		value: "closed",
		icon: ({ className }) => (
			<PowerOff className={`w-3.5 h-3.5 text-muted-foreground ${className}`} />
		),
	},
];

export function DataTableToolbar({ table }: DataTableToolbarProps) {
	const isFiltered = (table.state.columnFilters?.length ?? 0) > 0;

	const nameFilterValue =
		(table.getColumn("name")?.getFilterValue() as string) ?? "";

	return (
		<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
			<div className="flex flex-1 flex-wrap items-center gap-2">
				<div className="relative w-full sm:w-64">
					<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
					<Input
						placeholder="Filter projects..."
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

				{table.getColumn("status") && (
					<DataTableFacetedFilter
						column={table.getColumn("status")}
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
