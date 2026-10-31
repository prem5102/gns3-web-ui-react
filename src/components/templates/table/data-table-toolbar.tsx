import type { ReactTable } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DataTableFacetedFilter,
	type DataTableFacetedFilterOption,
	type DataTableFeatures,
	DataTableViewOptions,
} from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import type { GNS3Template } from "@/types/gns3";

interface TemplateDataTableToolbarProps {
	table: ReactTable<DataTableFeatures, GNS3Template>;
	categories: string[];
}

const scopeOptions: DataTableFacetedFilterOption[] = [
	{ label: "Built-in", value: "builtin" },
	{ label: "Custom", value: "custom" },
];

export function TemplateDataTableToolbar({
	table,
	categories,
}: TemplateDataTableToolbarProps) {
	const isFiltered = (table.state.columnFilters?.length ?? 0) > 0;

	const nameFilterValue =
		(table.getColumn("name")?.getFilterValue() as string) ?? "";

	const categoryOptions: DataTableFacetedFilterOption[] = categories.map(
		(c) => ({
			label: c.charAt(0).toUpperCase() + c.slice(1),
			value: c,
		}),
	);

	return (
		<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
			<div className="flex flex-1 flex-wrap items-center gap-2">
				<div className="relative w-full sm:w-64">
					<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
					<Input
						placeholder="Filter templates..."
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

				{table.getColumn("builtin") && (
					<DataTableFacetedFilter
						column={table.getColumn("builtin")}
						title="Scope"
						options={scopeOptions}
					/>
				)}

				{table.getColumn("category") && categoryOptions.length > 0 && (
					<DataTableFacetedFilter
						column={table.getColumn("category")}
						title="Category"
						options={categoryOptions}
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
