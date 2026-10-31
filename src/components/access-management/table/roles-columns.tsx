import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { DataTableFeatures } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import type { GNS3Role } from "@/types/gns3";

export function getRolesColumns(): ColumnDef<DataTableFeatures, GNS3Role>[] {
	return [
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Role Name" />
			),
			cell: ({ row }) => (
				<span className="font-semibold text-xs text-foreground">
					{row.original.name}
				</span>
			),
			filterFn: (row, _id, filterValue) => {
				const q = String(filterValue).toLowerCase().trim();
				if (!q) return true;
				const r = row.original;
				return Boolean(
					r.name.toLowerCase().includes(q) ||
						(r.description && r.description.toLowerCase().includes(q)),
				);
			},
		},
		{
			accessorKey: "description",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Description" />
			),
			cell: ({ row }) => (
				<span className="text-xs text-muted-foreground truncate block max-w-md">
					{row.original.description || "No description provided."}
				</span>
			),
		},
		{
			accessorKey: "is_builtin",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Type" />
			),
			cell: ({ row }) =>
				row.original.is_builtin ? (
					<Badge
						variant="outline"
						className="text-[10px] text-muted-foreground px-1.5 py-0.5"
					>
						System Built-in
					</Badge>
				) : (
					<Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
						Custom Role
					</Badge>
				),
		},
		{
			id: "permissions",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Permissions" />
			),
			cell: ({ row }) => {
				const privs = row.original.privileges || [];
				return (
					<div className="flex items-center gap-1.5 flex-wrap">
						<span className="text-xs text-muted-foreground font-mono">
							{privs.length} privilege{privs.length !== 1 ? "s" : ""}
						</span>
					</div>
				);
			},
		},
	];
}
