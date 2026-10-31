import { Plus, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	useDeleteUser,
	useRoles,
	useUsers,
} from "@/features/access/use-access";
import { useControllerMe } from "@/features/controller/use-controller";
import type { GNS3User } from "@/types/gns3";
import { AddUserDialog } from "./add-user-dialog";
import { RolesDataTable, UsersDataTable } from "./table";

export function AccessManagementView() {
	const {
		data: users = [],
		isLoading: isLoadingUsers,
		isFetching: isFetchingUsers,
		refetch: refetchUsers,
	} = useUsers();
	const {
		data: roles = [],
		isLoading: isLoadingRoles,
		isFetching: isFetchingRoles,
		refetch: refetchRoles,
	} = useRoles();
	const { data: meData } = useControllerMe();
	const deleteUserMutation = useDeleteUser();

	const [activeTab, setActiveTab] = useState<"users" | "roles">("users");
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [userToDelete, setUserToDelete] = useState<GNS3User | null>(null);

	const handleDeleteConfirm = async () => {
		if (userToDelete) {
			try {
				await deleteUserMutation.mutateAsync(userToDelete.user_id);
			} finally {
				setUserToDelete(null);
			}
		}
	};

	return (
		<div className="flex-1 flex flex-col p-6 space-y-6 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Access Management
					</h1>
					<p className="text-sm text-muted-foreground">
						Role-Based Access Control (RBAC), user accounts, and security
						privileges for the controller.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							refetchUsers();
							refetchRoles();
						}}
						disabled={isFetchingUsers || isFetchingRoles}
						className="gap-2"
					>
						<RefreshCw
							className={`w-4 h-4 ${isFetchingUsers || isFetchingRoles ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>
					{activeTab === "users" && (
						<Button
							size="sm"
							onClick={() => setAddDialogOpen(true)}
							className="gap-2"
						>
							<Plus className="w-4 h-4" />
							Add User
						</Button>
					)}
				</div>
			</div>

			{/* Sub-navigation tabs */}
			<div className="flex items-center gap-2 border-b border-border/60 pb-3">
				<Button
					variant={activeTab === "users" ? "secondary" : "ghost"}
					size="sm"
					onClick={() => setActiveTab("users")}
					className="gap-2"
				>
					<Users className="w-4 h-4" />
					Users ({users.length})
				</Button>
				<Button
					variant={activeTab === "roles" ? "secondary" : "ghost"}
					size="sm"
					onClick={() => setActiveTab("roles")}
					className="gap-2"
				>
					<ShieldCheck className="w-4 h-4" />
					Roles ({roles.length})
				</Button>
			</div>

			{/* Content Table (tablecn style) */}
			{activeTab === "users" ? (
				<UsersDataTable
					data={users}
					isLoading={isLoadingUsers}
					currentUserId={meData?.user_id}
					onDelete={(u) => setUserToDelete(u)}
				/>
			) : (
				<RolesDataTable data={roles} isLoading={isLoadingRoles} />
			)}

			{/* Add User Modal */}
			<AddUserDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

			{/* Delete User Confirmation Dialog */}
			<AlertDialog
				open={Boolean(userToDelete)}
				onOpenChange={(open) => !open && setUserToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete User Account</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete user &quot;
							{userToDelete?.username}&quot;? This user will immediately lose
							access to the controller and running project sessions.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
						>
							Delete User
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
