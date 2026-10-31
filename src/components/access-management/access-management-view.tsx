import {
	Plus,
	RefreshCw,
	Search,
	Shield,
	ShieldCheck,
	Trash2,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	useDeleteUser,
	useRoles,
	useUsers,
} from "@/features/access/use-access";
import { useControllerMe } from "@/features/controller/use-controller";
import type { GNS3User } from "@/types/gns3";
import { AddUserDialog } from "./add-user-dialog";

export function AccessManagementView() {
	const { data: users = [], isLoading: isLoadingUsers, isFetching: isFetchingUsers, refetch: refetchUsers } = useUsers();
	const { data: roles = [], isLoading: isLoadingRoles, isFetching: isFetchingRoles, refetch: refetchRoles } = useRoles();
	const { data: meData } = useControllerMe();
	const deleteUserMutation = useDeleteUser();

	const [activeTab, setActiveTab] = useState<"users" | "roles">("users");
	const [searchText, setSearchText] = useState("");
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [userToDelete, setUserToDelete] = useState<GNS3User | null>(null);

	const superadminCount = useMemo(
		() => users.filter((u) => u.is_superadmin).length,
		[users],
	);

	const filteredUsers = useMemo(() => {
		return users.filter((user) => {
			const query = searchText.toLowerCase().trim();
			if (!query) return true;
			return (
				(user.username && user.username.toLowerCase().includes(query)) ||
				(user.full_name && user.full_name.toLowerCase().includes(query)) ||
				(user.email && user.email.toLowerCase().includes(query))
			);
		});
	}, [users, searchText]);

	const filteredRoles = useMemo(() => {
		return roles.filter((role) => {
			const query = searchText.toLowerCase().trim();
			if (!query) return true;
			return (
				role.name.toLowerCase().includes(query) ||
				(role.description && role.description.toLowerCase().includes(query))
			);
		});
	}, [roles, searchText]);

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
					<h1 className="text-2xl font-bold tracking-tight">Access Management</h1>
					<p className="text-sm text-muted-foreground">
						Role-Based Access Control (RBAC), user accounts, and security privileges for the controller.
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
					Roles & Privileges ({roles.length})
				</Button>
			</div>

			{/* Metric Stat Cards */}
			{activeTab === "users" && (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<Card className="border-border/60 shadow-xs">
						<CardContent className="p-4 flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-xs font-medium text-muted-foreground">Total Accounts</p>
								<p className="text-2xl font-bold">{users.length}</p>
							</div>
							<div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
								<Users className="w-5 h-5" />
							</div>
						</CardContent>
					</Card>

					<Card className="border-border/60 shadow-xs">
						<CardContent className="p-4 flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-xs font-medium text-muted-foreground">Super Administrators</p>
								<p className="text-2xl font-bold text-amber-500">{superadminCount}</p>
							</div>
							<div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
								<Shield className="w-5 h-5" />
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Filter & Search Bar */}
			<div className="flex items-center justify-between gap-3">
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder={activeTab === "users" ? "Search users by name or email..." : "Search roles..."}
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						className="pl-9"
					/>
				</div>
			</div>

			{/* Content Table */}
			{activeTab === "users" ? (
				<div className="rounded-lg border border-border/60 bg-card overflow-hidden shadow-xs">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-64">User</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Created</TableHead>
								<TableHead className="w-20 text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoadingUsers ? (
								<TableRow>
									<TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
										<RefreshCw className="w-5 h-5 animate-spin inline mr-2 text-primary" />
										Loading users...
									</TableCell>
								</TableRow>
							) : filteredUsers.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="h-36 text-center text-muted-foreground">
										No user accounts found matching your query.
									</TableCell>
								</TableRow>
							) : (
								filteredUsers.map((user) => {
									const isMe = meData?.user_id === user.user_id;
									const initials = (user.full_name || user.username || "U")
										.slice(0, 2)
										.toUpperCase();
									return (
										<TableRow key={user.user_id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<Avatar className="w-8 h-8 text-xs font-semibold">
														<AvatarFallback className="bg-primary/10 text-primary">
															{initials}
														</AvatarFallback>
													</Avatar>
													<div className="flex flex-col min-w-0">
														<span className="font-semibold text-sm truncate flex items-center gap-1.5">
															{user.username}
															{isMe && (
																<Badge variant="outline" className="text-2xs px-1.5 py-0 h-4">
																	You
																</Badge>
															)}
														</span>
														<span className="text-xs text-muted-foreground truncate">
															{user.full_name || "Standard Account"}
														</span>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<span className="text-xs text-muted-foreground">
													{user.email || "-"}
												</span>
											</TableCell>
											<TableCell>
												{user.is_superadmin ? (
													<Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs gap-1">
														<Shield className="w-3 h-3" />
														Superadmin
													</Badge>
												) : (
													<Badge variant="secondary" className="text-xs">
														User
													</Badge>
												)}
											</TableCell>
											<TableCell>
												{user.is_active ? (
													<Badge
														variant="secondary"
														className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs gap-1"
													>
														<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
														Active
													</Badge>
												) : (
													<Badge variant="outline" className="text-xs text-muted-foreground">
														Inactive
													</Badge>
												)}
											</TableCell>
											<TableCell>
												<span className="text-xs text-muted-foreground">
													{user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
												</span>
											</TableCell>
											<TableCell className="text-right">
												{!isMe && !user.is_superadmin && (
													<Button
														size="icon-xs"
														variant="ghost"
														className="text-destructive hover:bg-destructive/10"
														title="Delete User"
														onClick={() => setUserToDelete(user)}
													>
														<Trash2 className="w-3.5 h-3.5" />
													</Button>
												)}
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>
			) : (
				<div className="rounded-lg border border-border/60 bg-card overflow-hidden shadow-xs">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-64">Role Name</TableHead>
								<TableHead>Description</TableHead>
								<TableHead className="w-32">Type</TableHead>
								<TableHead>Permissions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoadingRoles ? (
								<TableRow>
									<TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
										<RefreshCw className="w-5 h-5 animate-spin inline mr-2 text-primary" />
										Loading roles...
									</TableCell>
								</TableRow>
							) : filteredRoles.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4} className="h-36 text-center text-muted-foreground">
										No roles found.
									</TableCell>
								</TableRow>
							) : (
								filteredRoles.map((role) => (
									<TableRow key={role.role_id}>
										<TableCell>
											<div className="flex items-center gap-2.5">
												<ShieldCheck className="w-4 h-4 text-primary shrink-0" />
												<span className="font-semibold text-sm">{role.name}</span>
											</div>
										</TableCell>
										<TableCell>
											<span className="text-xs text-muted-foreground">
												{role.description || "-"}
											</span>
										</TableCell>
										<TableCell>
											<Badge
												variant={role.is_builtin ? "outline" : "secondary"}
												className="text-xs"
											>
												{role.is_builtin ? "Built-in" : "Custom"}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="flex flex-wrap gap-1 max-w-xl">
												{role.privileges && role.privileges.length > 0 ? (
													<>
														{role.privileges.slice(0, 4).map((p) => (
															<Badge
																key={p.privilege_id}
																variant="secondary"
																className="font-mono text-2xs px-1.5 py-0"
															>
																{p.name}
															</Badge>
														))}
														{role.privileges.length > 4 && (
															<Badge variant="outline" className="text-2xs px-1.5 py-0">
																+{role.privileges.length - 4} more
															</Badge>
														)}
													</>
												) : (
													<span className="text-xs text-muted-foreground italic">
														No privileges assigned
													</span>
												)}
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Add User Dialog */}
			<AddUserDialog
				open={addDialogOpen}
				onOpenChange={setAddDialogOpen}
			/>

			{/* Delete User Confirmation */}
			<AlertDialog
				open={Boolean(userToDelete)}
				onOpenChange={(open) => !open && setUserToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete User Account</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to permanently delete user &quot;{userToDelete?.username}&quot;?
							They will lose access to all controller resources and assigned projects.
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
