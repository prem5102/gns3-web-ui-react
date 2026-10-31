import type { ColumnDef } from "@tanstack/react-table";
import { Shield, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DataTableFeatures } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import type { GNS3User } from "@/types/gns3";

export interface UsersTableActions {
	currentUserId?: string;
	onDelete?: (user: GNS3User) => void;
}

export function getUsersColumns(
	actions?: UsersTableActions,
): ColumnDef<DataTableFeatures, GNS3User>[] {
	return [
		{
			accessorKey: "username",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="User" />
			),
			cell: ({ row, table }) => {
				const user = row.original;
				const meta =
					(table.options.meta as UsersTableActions | undefined) ?? actions;
				const isMe = meta?.currentUserId === user.user_id;
				const initials = (user.full_name || user.username || "U")
					.slice(0, 2)
					.toUpperCase();

				return (
					<div className="flex items-center gap-3">
						<Avatar className="w-8 h-8 text-xs font-semibold">
							<AvatarFallback className="bg-primary/10 text-primary">
								{initials}
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col min-w-0">
							<span className="font-semibold text-xs truncate flex items-center gap-1.5 text-foreground">
								{user.username}
								{isMe && (
									<Badge
										variant="outline"
										className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary"
									>
										You
									</Badge>
								)}
							</span>
							<span className="text-[10px] text-muted-foreground truncate">
								{user.full_name || "Standard Account"}
							</span>
						</div>
					</div>
				);
			},
			filterFn: (row, _id, filterValue) => {
				const q = String(filterValue).toLowerCase().trim();
				if (!q) return true;
				const u = row.original;
				return Boolean(
					(u.username && u.username.toLowerCase().includes(q)) ||
						(u.full_name && u.full_name.toLowerCase().includes(q)) ||
						(u.email && u.email.toLowerCase().includes(q)),
				);
			},
		},
		{
			accessorKey: "email",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Email" />
			),
			cell: ({ row }) => (
				<span className="text-xs text-muted-foreground font-mono">
					{row.original.email || "-"}
				</span>
			),
		},
		{
			accessorKey: "is_superadmin",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Role" />
			),
			cell: ({ row }) => {
				const isSuper = row.original.is_superadmin;
				return isSuper ? (
					<Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] gap-1 px-1.5 py-0.5">
						<Shield className="w-3 h-3" />
						Superadmin
					</Badge>
				) : (
					<Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
						User
					</Badge>
				);
			},
			filterFn: (row, _id, value) => {
				if (!value || value === "all") return true;
				if (Array.isArray(value)) {
					if (value.length === 0) return true;
					return value.includes(
						row.original.is_superadmin ? "superadmin" : "user",
					);
				}
				return (row.original.is_superadmin ? "superadmin" : "user") === value;
			},
		},
		{
			accessorKey: "is_active",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Status" />
			),
			cell: ({ row }) => {
				const isActive = row.original.is_active;
				return isActive ? (
					<Badge
						variant="secondary"
						className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] gap-1 px-1.5 py-0.5"
					>
						<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
						Active
					</Badge>
				) : (
					<Badge
						variant="outline"
						className="text-[10px] text-muted-foreground px-1.5 py-0.5"
					>
						Inactive
					</Badge>
				);
			},
		},
		{
			accessorKey: "created_at",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Created" />
			),
			cell: ({ row }) => {
				const date = row.original.created_at;
				return (
					<span className="text-xs text-muted-foreground">
						{date ? new Date(date).toLocaleDateString() : "-"}
					</span>
				);
			},
		},
		{
			id: "actions",
			header: () => <div className="text-right text-xs">Actions</div>,
			cell: ({ row, table }) => {
				const user = row.original;
				const meta =
					(table.options.meta as UsersTableActions | undefined) ?? actions;
				const isMe = meta?.currentUserId === user.user_id;

				if (isMe || user.is_superadmin) {
					return null;
				}

				return (
					<div className="flex justify-end">
						<Button
							size="icon-xs"
							variant="ghost"
							className="h-7 w-7 text-destructive hover:bg-destructive/10"
							title="Delete User"
							onClick={() => meta?.onDelete?.(user)}
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
