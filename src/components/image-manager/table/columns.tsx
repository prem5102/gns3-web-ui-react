import type { ColumnDef } from "@tanstack/react-table";
import { HardDrive, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DataTableFeatures } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import { formatBytes } from "@/lib/utils";
import type { GNS3Image } from "@/types/gns3";

export interface ImageTableActions {
	onDelete?: (image: GNS3Image) => void;
}

export function getImageColumns(
	actions?: ImageTableActions,
): ColumnDef<DataTableFeatures, GNS3Image>[] {
	return [
		{
			accessorKey: "filename",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Filename" />
			),
			cell: ({ row }) => {
				const img = row.original;
				return (
					<div className="flex items-center gap-2.5 min-w-0">
						<HardDrive className="w-4 h-4 text-muted-foreground shrink-0" />
						<span
							className="font-semibold text-xs truncate text-foreground"
							title={img.filename}
						>
							{img.filename}
						</span>
					</div>
				);
			},
			filterFn: (row, _id, filterValue) => {
				const q = String(filterValue).toLowerCase().trim();
				if (!q) return true;
				const img = row.original;
				return Boolean(
					img.filename.toLowerCase().includes(q) ||
						img.path.toLowerCase().includes(q) ||
						(img.checksum && img.checksum.toLowerCase().includes(q)),
				);
			},
		},
		{
			accessorKey: "image_type",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Type" />
			),
			cell: ({ row }) => (
				<Badge
					variant="secondary"
					className="font-mono text-[10px] uppercase font-medium px-1.5 py-0.5"
				>
					{row.original.image_type}
				</Badge>
			),
			filterFn: (row, _id, value) => {
				if (!value || value === "all") return true;
				if (Array.isArray(value)) {
					if (value.length === 0) return true;
					return value.includes(row.original.image_type);
				}
				return row.original.image_type === value;
			},
		},
		{
			accessorKey: "image_size",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Size" />
			),
			cell: ({ row }) => (
				<span className="text-xs font-mono text-muted-foreground">
					{formatBytes(row.original.image_size)}
				</span>
			),
		},
		{
			accessorKey: "path",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Path / Location" />
			),
			cell: ({ row }) => (
				<span
					className="font-mono text-xs text-muted-foreground truncate block max-w-sm"
					title={row.original.path}
				>
					{row.original.path}
				</span>
			),
		},
		{
			accessorKey: "checksum",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Checksum" />
			),
			cell: ({ row }) => {
				const checksum = row.original.checksum;
				return checksum ? (
					<span
						className="font-mono text-xs text-muted-foreground truncate block max-w-32"
						title={checksum}
					>
						{checksum.slice(0, 12)}...
					</span>
				) : (
					<span className="text-xs text-muted-foreground italic">-</span>
				);
			},
		},
		{
			id: "actions",
			header: () => <div className="text-right text-xs">Actions</div>,
			cell: ({ row, table }) => {
				const img = row.original;
				const meta =
					(table.options.meta as ImageTableActions | undefined) ?? actions;

				return (
					<div className="flex justify-end">
						<Button
							size="icon-xs"
							variant="ghost"
							title="Delete Image"
							className="h-7 w-7 text-destructive hover:bg-destructive/10"
							onClick={() => meta?.onDelete?.(img)}
						>
							<Trash2 className="w-3.5 h-3.5" />
						</Button>
					</div>
				);
			},
			enableSorting: false,
			enableHiding: false,
		},
	];
}
