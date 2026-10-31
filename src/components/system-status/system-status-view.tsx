import {
	Activity,
	CheckCircle2,
	Cpu,
	FolderGit2,
	HardDrive,
	Info,
	Network,
	PieChart,
	RefreshCw,
	Server,
} from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	useControllerMe,
	useControllerVersion,
} from "@/features/controller/use-controller";
import { useProjects } from "@/features/projects/use-projects";
import { useSystemStatistics } from "@/features/system/use-system-status";
import { gns3Api } from "@/lib/gns3-api";
import { formatBytes } from "@/lib/utils";

function formatUptime(seconds?: number): string {
	if (!seconds || seconds <= 0) return "Just started";
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const mins = Math.floor((seconds % 3600) / 60);

	const parts: string[] = [];
	if (days > 0) parts.push(`${days}d`);
	if (hours > 0) parts.push(`${hours}h`);
	if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
	return parts.join(" ");
}

export function SystemStatusView({
	onNavigateProjects,
}: {
	onNavigateProjects?: () => void;
}) {
	const { data: stats, isLoading, isFetching, refetch } = useSystemStatistics();
	const { data: versionData } = useControllerVersion();
	const { data: meData } = useControllerMe();
	const { data: projects = [] } = useProjects();

	const localCompute =
		stats?.computes?.find((c) => c.compute_id === "local") ||
		stats?.computes?.[0];
	const rawStats = localCompute?.statistics;

	const nodeTypes = useMemo(() => {
		if (!stats?.nodes?.by_type) return [];
		return Object.entries(stats.nodes.by_type);
	}, [stats]);

	const nodeStatuses = useMemo(() => {
		if (!stats?.nodes?.by_status) return [];
		return Object.entries(stats.nodes.by_status);
	}, [stats]);

	return (
		<div className="flex-1 flex flex-col p-6 space-y-6 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">System Status</h1>
					<p className="text-sm text-muted-foreground">
						Real-time telemetry, resource utilization, and health metrics for
						the GNS3 controller.
					</p>
				</div>
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
					Refresh Telemetry
				</Button>
			</div>

			{/* Metric Stat Cards */}
			<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
				<Card className="border-border/60 shadow-xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">
								Status
							</p>
							<div className="flex items-center gap-1.5 font-bold text-emerald-500">
								<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
								Online
							</div>
						</div>
						<div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
							<CheckCircle2 className="w-4 h-4" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60 shadow-xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">
								Projects
							</p>
							<p className="text-xl font-bold">
								{stats?.projects?.opened ?? 0}{" "}
								<span className="text-xs font-normal text-muted-foreground">
									/ {stats?.projects?.total ?? projects.length}
								</span>
							</p>
						</div>
						<div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
							<FolderGit2 className="w-4 h-4" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60 shadow-xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">
								Running Nodes
							</p>
							<p className="text-xl font-bold">
								{stats?.nodes?.by_status?.started ?? 0}{" "}
								<span className="text-xs font-normal text-muted-foreground">
									/ {stats?.nodes?.total ?? 0}
								</span>
							</p>
						</div>
						<div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
							<Cpu className="w-4 h-4" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60 shadow-xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">Links</p>
							<p className="text-xl font-bold">
								{stats?.links?.total ?? 0}{" "}
								<span className="text-xs font-normal text-muted-foreground">
									({stats?.links?.capturing ?? 0} cap)
								</span>
							</p>
						</div>
						<div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
							<Network className="w-4 h-4" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60 shadow-xs col-span-2 md:col-span-1">
					<CardContent className="p-4 flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">
								Computes
							</p>
							<p className="text-xl font-bold">
								{stats?.computes?.length ?? 1}
							</p>
						</div>
						<div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
							<Server className="w-4 h-4" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Grid: Server Info & Projects Overview */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Server Information */}
				<Card className="border-border/60 shadow-xs">
					<CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
						<CardTitle className="text-base font-semibold flex items-center gap-2">
							<Info className="w-4 h-4 text-primary" />
							Server Information
						</CardTitle>
						<Badge variant="outline" className="font-mono text-xs">
							v{versionData?.version || "3.1.0"}
						</Badge>
					</CardHeader>
					<CardContent className="p-4 space-y-3 text-sm">
						<div className="flex items-center justify-between py-1.5 border-b border-border/40">
							<span className="text-muted-foreground">Controller Endpoint</span>
							<span className="font-mono text-xs font-medium">
								{gns3Api.getBaseUrl()}
							</span>
						</div>
						<div className="flex items-center justify-between py-1.5 border-b border-border/40">
							<span className="text-muted-foreground">GNS3 Server Core</span>
							<span className="font-medium">
								{versionData?.version || "3.1.0"}
							</span>
						</div>
						<div className="flex items-center justify-between py-1.5 border-b border-border/40">
							<span className="text-muted-foreground">Web UI Architecture</span>
							<span className="font-medium">
								React 19 • TanStack Router & Query
							</span>
						</div>
						<div className="flex items-center justify-between py-1.5 border-b border-border/40">
							<span className="text-muted-foreground">Server Uptime</span>
							<span className="font-medium">
								{formatUptime(stats?.uptime_seconds)}
							</span>
						</div>
						<div className="flex items-center justify-between py-1.5">
							<span className="text-muted-foreground">Active Session</span>
							<span className="font-medium text-primary">
								{meData?.username || "admin"} (
								{meData?.is_superadmin ? "Superadmin" : "User"})
							</span>
						</div>
					</CardContent>
				</Card>

				{/* Project Overview */}
				<Card className="border-border/60 shadow-xs">
					<CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
						<CardTitle className="text-base font-semibold flex items-center gap-2">
							<FolderGit2 className="w-4 h-4 text-primary" />
							Projects Overview
						</CardTitle>
						{onNavigateProjects && (
							<Button variant="ghost" size="xs" onClick={onNavigateProjects}>
								View all
							</Button>
						)}
					</CardHeader>
					<CardContent className="p-4 divide-y divide-border/40">
						{projects.length === 0 ? (
							<div className="py-8 text-center text-xs text-muted-foreground">
								No projects created on this controller yet.
							</div>
						) : (
							projects.slice(0, 5).map((project) => (
								<div
									key={project.project_id}
									className="py-2.5 flex items-center justify-between text-sm"
								>
									<div className="flex items-center gap-2.5 min-w-0">
										<FolderGit2 className="w-4 h-4 text-muted-foreground shrink-0" />
										<span className="font-medium truncate">{project.name}</span>
									</div>
									<Badge
										variant={
											project.status === "opened" ? "secondary" : "outline"
										}
										className={
											project.status === "opened"
												? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs"
												: "text-muted-foreground text-xs"
										}
									>
										{project.status === "opened" ? "Running" : "Stopped"}
									</Badge>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>

			{/* Compute Hardware Telemetry Panel */}
			<Card className="border-border/60 shadow-xs">
				<CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
					<CardTitle className="text-base font-semibold flex items-center gap-2">
						<Activity className="w-4 h-4 text-primary" />
						Compute Resources Telemetry
					</CardTitle>
					<span className="text-xs text-muted-foreground">
						{localCompute?.compute_name || "Controller Host"} (
						{rawStats?.cpu_model || "Host CPU"})
					</span>
				</CardHeader>
				<CardContent className="p-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{/* CPU Usage Meter */}
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="font-medium flex items-center gap-1.5">
									<Cpu className="w-4 h-4 text-primary" />
									CPU Usage
								</span>
								<span className="font-bold">
									{rawStats?.cpu_usage_percent ?? 0}%
								</span>
							</div>
							<div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
								<div
									className="bg-primary h-2.5 rounded-full transition-all duration-500"
									style={{
										width: `${Math.min(100, rawStats?.cpu_usage_percent ?? 0)}%`,
									}}
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								{rawStats?.cpu_count || 1} Cores (
								{rawStats?.cpu_count_physical || 1} Physical)
							</p>
						</div>

						{/* Memory Usage Meter */}
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="font-medium flex items-center gap-1.5">
									<Activity className="w-4 h-4 text-blue-500" />
									Memory Usage
								</span>
								<span className="font-bold">
									{rawStats?.memory_usage_percent ?? 0}%
								</span>
							</div>
							<div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
								<div
									className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
									style={{
										width: `${Math.min(100, rawStats?.memory_usage_percent ?? 0)}%`,
									}}
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								{formatBytes(rawStats?.memory_used ?? 0)} /{" "}
								{formatBytes(rawStats?.memory_total ?? 0)}
							</p>
						</div>

						{/* Disk Usage Meter */}
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="font-medium flex items-center gap-1.5">
									<HardDrive className="w-4 h-4 text-amber-500" />
									Disk Usage
								</span>
								<span className="font-bold">
									{rawStats?.disk_usage_percent ?? 0}%
								</span>
							</div>
							<div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
								<div
									className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
									style={{
										width: `${Math.min(100, rawStats?.disk_usage_percent ?? 0)}%`,
									}}
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								{formatBytes(rawStats?.disk_used ?? 0)} /{" "}
								{formatBytes(rawStats?.disk_total ?? 0)}
							</p>
						</div>
					</div>

					{/* Load Average */}
					{rawStats?.load_average && rawStats.load_average.length > 0 && (
						<div className="mt-6 pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground gap-2">
							<span>Load Average (1m / 5m / 15m):</span>
							<span className="font-mono font-medium text-foreground">
								{rawStats.load_average.map((l) => l.toFixed(2)).join(" / ")}
							</span>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Nodes Breakdown Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* By Type */}
				<Card className="border-border/60 shadow-xs">
					<CardHeader className="pb-3 border-b border-border/40">
						<CardTitle className="text-base font-semibold flex items-center gap-2">
							<PieChart className="w-4 h-4 text-primary" />
							Emulators & Node Types
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 divide-y divide-border/40">
						{nodeTypes.length === 0 ? (
							<div className="py-6 text-center text-xs text-muted-foreground">
								No nodes provisioned across projects.
							</div>
						) : (
							nodeTypes.map(([type, count]) => (
								<div
									key={type}
									className="py-2 flex items-center justify-between text-sm"
								>
									<span className="capitalize">{type.replace("_", " ")}</span>
									<span className="font-mono font-semibold">{count}</span>
								</div>
							))
						)}
					</CardContent>
				</Card>

				{/* By Status */}
				<Card className="border-border/60 shadow-xs">
					<CardHeader className="pb-3 border-b border-border/40">
						<CardTitle className="text-base font-semibold flex items-center gap-2">
							<Activity className="w-4 h-4 text-primary" />
							Node Runtime Status
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 divide-y divide-border/40">
						{nodeStatuses.length === 0 ? (
							<div className="py-6 text-center text-xs text-muted-foreground">
								All configured nodes are idle or stopped.
							</div>
						) : (
							nodeStatuses.map(([status, count]) => (
								<div
									key={status}
									className="py-2 flex items-center justify-between text-sm"
								>
									<div className="flex items-center gap-2">
										<span
											className={`w-2 h-2 rounded-full ${
												status === "started"
													? "bg-emerald-500"
													: status === "suspended"
														? "bg-amber-500"
														: "bg-muted-foreground"
											}`}
										/>
										<span className="capitalize">{status}</span>
									</div>
									<span className="font-mono font-semibold">{count}</span>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
