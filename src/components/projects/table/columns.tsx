import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { DataTableFeatures } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import type { GNS3Project } from "@/types/gns3";
import {
	DataTableRowActions,
	type ProjectTableActions,
} from "./data-table-row-actions";

export type { ProjectTableActions };

export function getColumns(
	actions?: ProjectTableActions,
): ColumnDef<DataTableFeatures, GNS3Project>[] {
	return [
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
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Name" />
			),
			cell: ({ row, table }) => {
				const proj = row.original;
				const meta =
					(table.options.meta as ProjectTableActions | undefined) ?? actions;
				return (
					<button
						type="button"
						onClick={() => meta?.onOpenLab?.(proj.project_id)}
						className="font-semibold text-xs text-foreground text-left hover:text-primary transition-colors truncate"
					>
						{proj.name}
					</button>
				);
			},
			filterFn: (row, _columnId, filterValue) => {
				const query = String(filterValue).toLowerCase().trim();
				if (!query) return true;
				const name = String(row.original.name || "").toLowerCase();
				const filename = String(row.original.filename || "").toLowerCase();
				const id = String(row.original.project_id || "").toLowerCase();
				return (
					name.includes(query) || filename.includes(query) || id.includes(query)
				);
			},
		},

		{
			id: "createdBy",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Created By" />
			),
			cell: () => (
				<span className="text-xs text-muted-foreground font-medium">admin</span>
			),
			enableSorting: false,
		},

		{
			accessorKey: "status",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Status" />
			),
			cell: ({ row }) => {
				const isRunning = row.getValue("status") === "opened";
				return (
					<Badge
						variant={isRunning ? "success" : "muted"}
						className="text-[10px] capitalize font-medium gap-1 px-1.5 py-0.5"
					>
						<span
							className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-emerald-500" : "bg-zinc-400"}`}
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
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Actions" />
			),
			cell: ({ row }) => (
				<DataTableRowActions
					row={row}
					onOpenLab={actions?.onOpenLab}
					onOpenDetails={actions?.onOpenDetails}
					onRename={actions?.onRename}
					onClose={actions?.onClose}
					onDelete={actions?.onDelete}
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
	];
}

export const columns: ColumnDef<DataTableFeatures, GNS3Project>[] =
	getColumns();
