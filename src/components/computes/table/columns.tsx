import type { ColumnDef } from "@tanstack/react-table";
import { Activity, Cpu, HardDrive, Link2, Server, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DataTableFeatures } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import type { Compute } from "@/types/gns3";

export interface ComputeTableActions {
	onConnect?: (computeId: string) => void;
	onDelete?: (compute: Compute) => void;
	isConnecting?: boolean;
}

export function getComputeColumns(
	actions?: ComputeTableActions,
): ColumnDef<DataTableFeatures, Compute>[] {
	return [
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Name" />
			),
			cell: ({ row }) => {
				const compute = row.original;
				return (
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-md bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0">
							<Server className="w-4 h-4" />
						</div>
						<div className="flex flex-col min-w-0">
							<span className="font-semibold text-xs truncate text-foreground">
								{compute.name || compute.compute_id}
							</span>
							<span className="text-[10px] text-muted-foreground font-mono truncate">
								{compute.compute_id === "local"
									? "Controller Local"
									: compute.compute_id}
							</span>
						</div>
					</div>
				);
			},
			filterFn: (row, _id, filterValue) => {
				const q = String(filterValue).toLowerCase().trim();
				if (!q) return true;
				const c = row.original;
				return Boolean(
					(c.name && c.name.toLowerCase().includes(q)) ||
						c.compute_id.toLowerCase().includes(q) ||
						c.host.toLowerCase().includes(q) ||
						(c.capabilities?.platform &&
							c.capabilities.platform.toLowerCase().includes(q)),
				);
			},
		},
		{
			accessorKey: "connected",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Status" />
			),
			cell: ({ row }) => {
				const connected = row.original.connected;
				return connected ? (
					<Badge
						variant="secondary"
						className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] gap-1 px-1.5 py-0.5"
					>
						<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
						Connected
					</Badge>
				) : (
					<Badge
						variant="destructive"
						className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-1 px-1.5 py-0.5"
					>
						<span className="w-1.5 h-1.5 rounded-full bg-destructive" />
						Disconnected
					</Badge>
				);
			},
			filterFn: (row, _id, value) => {
				if (!value || value === "all") return true;
				if (Array.isArray(value)) {
					if (value.length === 0) return true;
					return value.includes(
						row.original.connected ? "connected" : "disconnected",
					);
				}
				return (
					(row.original.connected ? "connected" : "disconnected") === value
				);
			},
		},
		{
			id: "endpoint",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Host Endpoint" />
			),
			cell: ({ row }) => {
				const c = row.original;
				return (
					<span className="font-mono text-xs text-muted-foreground">
						{c.protocol}://{c.host}:{c.port}
					</span>
				);
			},
		},
		{
			id: "platform",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Platform" />
			),
			cell: ({ row }) => (
				<span className="text-xs text-foreground">
					{row.original.capabilities?.platform || "Linux"}
				</span>
			),
		},
		{
			id: "resources",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Resource Usage" />
			),
			cell: ({ row }) => {
				const c = row.original;
				if (!c.connected) {
					return (
						<span className="text-xs text-muted-foreground italic">
							Unavailable
						</span>
					);
				}
				return (
					<div className="flex items-center gap-3 text-xs text-muted-foreground">
						<span className="flex items-center gap-1" title="CPU Usage">
							<Cpu className="w-3.5 h-3.5 text-primary" />
							{c.cpu_usage_percent ?? 0}%
						</span>
						<span className="flex items-center gap-1" title="Memory Usage">
							<Activity className="w-3.5 h-3.5 text-blue-500" />
							{c.memory_usage_percent ?? 0}%
						</span>
						<span className="flex items-center gap-1" title="Disk Usage">
							<HardDrive className="w-3.5 h-3.5 text-amber-500" />
							{c.disk_usage_percent ?? 0}%
						</span>
					</div>
				);
			},
		},
		{
			id: "actions",
			header: () => <div className="text-right text-xs">Actions</div>,
			cell: ({ row, table }) => {
				const compute = row.original;
				const meta =
					(table.options.meta as ComputeTableActions | undefined) ?? actions;

				if (compute.compute_id === "local") {
					return (
						<div className="flex justify-end">
							<Badge
								variant="outline"
								className="text-[10px] text-muted-foreground"
							>
								Managed
							</Badge>
						</div>
					);
				}

				return (
					<div className="flex items-center justify-end gap-1">
						<Button
							size="icon-xs"
							variant="ghost"
							title="Connect Compute"
							onClick={() => meta?.onConnect?.(compute.compute_id)}
							disabled={meta?.isConnecting}
							className="h-7 w-7 text-primary hover:text-primary"
						>
							<Link2 className="w-3.5 h-3.5" />
						</Button>
						<Button
							size="icon-xs"
							variant="ghost"
							title="Delete Compute"
							className="h-7 w-7 text-destructive hover:bg-destructive/10"
							onClick={() => meta?.onDelete?.(compute)}
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
