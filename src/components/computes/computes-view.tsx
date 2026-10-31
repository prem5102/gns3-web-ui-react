import {
	Activity,
	CheckCircle2,
	Cpu,
	HardDrive,
	Link2,
	Plus,
	RefreshCw,
	Search,
	Server,
	Trash2,
	XCircle,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	useComputes,
	useConnectCompute,
	useDeleteCompute,
} from "@/features/computes/use-computes";
import type { Compute } from "@/types/gns3";
import { AddComputeDialog } from "./add-compute-dialog";

export function ComputesView() {
	const { data: computes = [], isLoading, isFetching, refetch } = useComputes();
	const deleteComputeMutation = useDeleteCompute();
	const connectComputeMutation = useConnectCompute();

	const [searchText, setSearchText] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | "connected" | "disconnected">("all");
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [computeToDelete, setComputeToDelete] = useState<Compute | null>(null);

	const connectedCount = useMemo(
		() => computes.filter((c) => c.connected).length,
		[computes],
	);

	const filteredComputes = useMemo(() => {
		return computes.filter((compute) => {
			const query = searchText.toLowerCase().trim();
			const matchesSearch =
				!query ||
				(compute.name && compute.name.toLowerCase().includes(query)) ||
				compute.compute_id.toLowerCase().includes(query) ||
				compute.host.toLowerCase().includes(query) ||
				(compute.capabilities?.platform &&
					compute.capabilities.platform.toLowerCase().includes(query));

			const matchesStatus =
				statusFilter === "all" ||
				(statusFilter === "connected" && compute.connected) ||
				(statusFilter === "disconnected" && !compute.connected);

			return matchesSearch && matchesStatus;
		});
	}, [computes, searchText, statusFilter]);

	const handleDeleteConfirm = async () => {
		if (computeToDelete) {
			try {
				await deleteComputeMutation.mutateAsync(computeToDelete.compute_id);
			} finally {
				setComputeToDelete(null);
			}
		}
	};

	return (
		<div className="flex-1 flex flex-col p-6 space-y-6 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Compute Nodes</h1>
					<p className="text-sm text-muted-foreground">
						Manage local and remote hypervisors and container engines powering topology emulations.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isLoading || isFetching}
						className="gap-2"
					>
						<RefreshCw
							className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>
					<Button
						size="sm"
						onClick={() => setAddDialogOpen(true)}
						className="gap-2"
					>
						<Plus className="w-4 h-4" />
						Add Compute
					</Button>
				</div>
			</div>

			{/* Metric Stat Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card className="border-border/60 shadow-xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">Total Computes</p>
							<p className="text-2xl font-bold">{computes.length}</p>
						</div>
						<div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
							<Server className="w-5 h-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60 shadow-xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">Connected</p>
							<p className="text-2xl font-bold text-emerald-500">{connectedCount}</p>
						</div>
						<div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
							<CheckCircle2 className="w-5 h-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60 shadow-xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">Disconnected</p>
							<p className="text-2xl font-bold text-destructive">
								{computes.length - connectedCount}
							</p>
						</div>
						<div className="w-10 h-10 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
							<XCircle className="w-5 h-5" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filter & Search Bar */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Search by name, host, or platform..."
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						className="pl-9"
					/>
				</div>

				<div className="flex items-center gap-2">
					<Select
						value={statusFilter}
						onValueChange={(val: "all" | "connected" | "disconnected") =>
							setStatusFilter(val)
						}
					>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Status filter" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All statuses</SelectItem>
							<SelectItem value="connected">Connected</SelectItem>
							<SelectItem value="disconnected">Disconnected</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Computes Table */}
			<div className="rounded-lg border border-border/60 bg-card overflow-hidden shadow-xs">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-64">Name</TableHead>
							<TableHead className="w-32">Status</TableHead>
							<TableHead>Host Endpoint</TableHead>
							<TableHead>Platform</TableHead>
							<TableHead>Resource Usage</TableHead>
							<TableHead className="w-28 text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
									<RefreshCw className="w-5 h-5 animate-spin inline mr-2 text-primary" />
									Loading compute nodes...
								</TableCell>
							</TableRow>
						) : filteredComputes.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="h-36 text-center">
									<div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
										<Server className="w-8 h-8 stroke-1 text-muted-foreground/60" />
										<p className="font-medium text-foreground">No compute nodes found</p>
										<p className="text-xs">
											{searchText || statusFilter !== "all"
												? "No computes match your filter criteria."
												: "The local compute engine is automatically managed by the controller."}
										</p>
									</div>
								</TableCell>
							</TableRow>
						) : (
							filteredComputes.map((compute) => (
								<TableRow key={compute.compute_id}>
									<TableCell>
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 rounded-md bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0">
												<Server className="w-4 h-4" />
											</div>
											<div className="flex flex-col min-w-0">
												<span className="font-semibold text-sm truncate">
													{compute.name || compute.compute_id}
												</span>
												<span className="text-xs text-muted-foreground truncate">
													{compute.compute_id === "local" ? "Controller Local" : compute.compute_id}
												</span>
											</div>
										</div>
									</TableCell>
									<TableCell>
										{compute.connected ? (
											<Badge
												variant="secondary"
												className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1.5"
											>
												<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
												Connected
											</Badge>
										) : (
											<Badge
												variant="destructive"
												className="bg-destructive/10 text-destructive border-destructive/20 gap-1.5"
											>
												<span className="w-1.5 h-1.5 rounded-full bg-destructive" />
												Disconnected
											</Badge>
										)}
									</TableCell>
									<TableCell>
										<span className="font-mono text-xs">
											{compute.protocol}://{compute.host}:{compute.port}
										</span>
									</TableCell>
									<TableCell>
										<span className="text-sm">
											{compute.capabilities?.platform || "Linux"}
										</span>
									</TableCell>
									<TableCell>
										{compute.connected ? (
											<div className="flex items-center gap-4 text-xs text-muted-foreground">
												<span className="flex items-center gap-1" title="CPU Usage">
													<Cpu className="w-3.5 h-3.5 text-primary" />
													{compute.cpu_usage_percent ?? 0}%
												</span>
												<span className="flex items-center gap-1" title="Memory Usage">
													<Activity className="w-3.5 h-3.5 text-blue-500" />
													{compute.memory_usage_percent ?? 0}%
												</span>
												<span className="flex items-center gap-1" title="Disk Usage">
													<HardDrive className="w-3.5 h-3.5 text-amber-500" />
													{compute.disk_usage_percent ?? 0}%
												</span>
											</div>
										) : (
											<span className="text-xs text-muted-foreground italic">
												Unavailable
											</span>
										)}
									</TableCell>
									<TableCell className="text-right">
										{compute.compute_id === "local" ? (
											<Badge variant="outline" className="text-xs text-muted-foreground">
												Managed
											</Badge>
										) : (
											<div className="flex items-center justify-end gap-1">
												<Button
													size="icon-xs"
													variant="ghost"
													title="Connect Compute"
													onClick={() => connectComputeMutation.mutate(compute.compute_id)}
													disabled={connectComputeMutation.isPending}
												>
													<Link2 className="w-3.5 h-3.5 text-primary" />
												</Button>
												<Button
													size="icon-xs"
													variant="ghost"
													title="Delete Compute"
													className="text-destructive hover:bg-destructive/10"
													onClick={() => setComputeToDelete(compute)}
												>
													<Trash2 className="w-3.5 h-3.5" />
												</Button>
											</div>
										)}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Add Compute Dialog */}
			<AddComputeDialog
				open={addDialogOpen}
				onOpenChange={setAddDialogOpen}
			/>

			{/* Delete Compute Confirmation */}
			<AlertDialog
				open={Boolean(computeToDelete)}
				onOpenChange={(open) => !open && setComputeToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Compute Node</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove compute node &quot;{computeToDelete?.name || computeToDelete?.compute_id}&quot;?
							Any appliances hosted exclusively on this compute will become unavailable.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
						>
							Delete Compute
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
