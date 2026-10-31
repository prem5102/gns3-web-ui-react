import type { ColumnDef } from "@tanstack/react-table";
import { Cpu, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DataTableFeatures } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import { getSymbolUrl } from "@/lib/symbols";
import type { GNS3Template } from "@/types/gns3";

export interface TemplateTableActions {
	onDelete?: (template: GNS3Template) => void;
}

export function getTemplateColumns(
	actions?: TemplateTableActions,
): ColumnDef<DataTableFeatures, GNS3Template>[] {
	return [
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Template" />
			),
			cell: ({ row }) => {
				const template = row.original;
				const symbolUrl = getSymbolUrl(template.symbol);
				return (
					<div className="flex items-center gap-3 min-w-0">
						<div className="w-8 h-8 rounded-md bg-muted/60 border border-border/40 flex items-center justify-center shrink-0 p-1">
							{symbolUrl ? (
								<img
									src={symbolUrl}
									alt={template.name}
									className="w-full h-full object-contain"
								/>
							) : (
								<Cpu className="w-4 h-4 text-muted-foreground" />
							)}
						</div>
						<div className="flex flex-col min-w-0">
							<span
								className="font-semibold text-xs truncate text-foreground"
								title={template.name}
							>
								{template.name}
							</span>
							{template.usage && (
								<span className="text-[10px] text-muted-foreground truncate max-w-xs">
									{template.usage}
								</span>
							)}
						</div>
					</div>
				);
			},
			filterFn: (row, _id, filterValue) => {
				const q = String(filterValue).toLowerCase().trim();
				if (!q) return true;
				const t = row.original;
				return Boolean(
					t.name.toLowerCase().includes(q) ||
						(t.template_type && t.template_type.toLowerCase().includes(q)) ||
						(t.category && t.category.toLowerCase().includes(q)) ||
						(t.usage && t.usage.toLowerCase().includes(q)),
				);
			},
		},
		{
			accessorKey: "category",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Category" />
			),
			cell: ({ row }) => (
				<Badge
					variant="outline"
					className="capitalize text-[10px] px-1.5 py-0.5"
				>
					{row.original.category}
				</Badge>
			),
			filterFn: (row, _id, value) => {
				if (!value || value === "all") return true;
				if (Array.isArray(value)) {
					if (value.length === 0) return true;
					return value.includes(row.original.category);
				}
				return row.original.category === value;
			},
		},
		{
			accessorKey: "template_type",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Emulator Type" />
			),
			cell: ({ row }) => (
				<span className="font-mono text-xs text-muted-foreground">
					{row.original.template_type || "default"}
				</span>
			),
			filterFn: (row, _id, value) => {
				if (!value || value === "all") return true;
				if (Array.isArray(value)) {
					if (value.length === 0) return true;
					return value.includes(row.original.template_type);
				}
				return row.original.template_type === value;
			},
		},
		{
			accessorKey: "compute_id",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Compute Node" />
			),
			cell: ({ row }) => (
				<span className="text-xs text-muted-foreground font-mono">
					{row.original.compute_id || "local"}
				</span>
			),
		},
		{
			accessorKey: "builtin",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Scope" />
			),
			cell: ({ row }) => (
				<Badge
					variant={row.original.builtin ? "outline" : "secondary"}
					className="text-[10px] px-1.5 py-0.5"
				>
					{row.original.builtin ? "Built-in" : "Custom"}
				</Badge>
			),
			filterFn: (row, _id, value) => {
				if (!value || value === "all") return true;
				if (Array.isArray(value)) {
					if (value.length === 0) return true;
					return value.includes(row.original.builtin ? "builtin" : "custom");
				}
				return (row.original.builtin ? "builtin" : "custom") === value;
			},
		},
		{
			id: "actions",
			header: () => <div className="text-right text-xs">Actions</div>,
			cell: ({ row, table }) => {
				const template = row.original;
				const meta =
					(table.options.meta as TemplateTableActions | undefined) ?? actions;

				if (template.builtin) {
					return null;
				}

				return (
					<div className="flex justify-end">
						<Button
							size="icon-xs"
							variant="ghost"
							className="h-7 w-7 text-destructive hover:bg-destructive/10"
							title="Delete Template"
							onClick={() => meta?.onDelete?.(template)}
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
