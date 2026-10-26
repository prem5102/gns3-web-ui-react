import type { RowData } from "@tanstack/react-table";
import type {
	LegacyColumn as Column,
	LegacyReactTable as Table,
} from "@tanstack/react-table/legacy";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableViewOptionsProps<TData extends RowData> {
	table: Table<TData>;
}

export function DataTableViewOptions<TData extends RowData>({
	table,
}: DataTableViewOptionsProps<TData>) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="ml-auto hidden h-8 lg:flex text-xs gap-1.5"
				>
					<SlidersHorizontal className="h-3.5 w-3.5" />
					<span>View</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-37.5">
				<DropdownMenuLabel className="text-xs">
					Toggle columns
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{table
					.getAllColumns()
					.filter(
						(column: Column<TData, unknown>) =>
							typeof column.accessorFn !== "undefined" && column.getCanHide(),
					)
					.map((column: Column<TData, unknown>) => {
						return (
							<DropdownMenuCheckboxItem
								key={column.id}
								className="capitalize text-xs"
								checked={column.getIsVisible()}
								onCheckedChange={(value) => column.toggleVisibility(!!value)}
							>
								{column.id}
							</DropdownMenuCheckboxItem>
						);
					})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
