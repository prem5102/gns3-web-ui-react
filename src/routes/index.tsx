import { createFileRoute } from "@tanstack/react-router";
import {
	Activity,
	AlertCircle,
	BookOpen,
	Cpu,
	FolderGit2,
	HardDrive,
	Moon,
	Network,
	Server,
	Settings,
	ShieldCheck,
	Sliders,
	Sun,
	Terminal,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AccessManagementView } from "@/components/access-management/access-management-view";
import { ComputesView } from "@/components/computes/computes-view";
import { ImageManagerView } from "@/components/image-manager/image-manager-view";
import { ProjectsView } from "@/components/projects/projects-view";
import { SettingsModal } from "@/components/settings/settings-modal";
import { SystemStatusView } from "@/components/system-status/system-status-view";
import { TemplatesView } from "@/components/templates/templates-view";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
	useControllerMe,
	useControllerVersion,
} from "@/features/controller/use-controller";
import { projectsQueryOptions } from "@/features/query-keys";
import { gns3Api } from "@/lib/gns3-api";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

export const Route = createFileRoute("/")({
	loader: async ({ context }) => {
		try {
			if (typeof window !== "undefined") {
				await context.queryClient.ensureQueryData(projectsQueryOptions());
			}
		} catch {
			// Handled gracefully by component on mount
		}
	},
	component: DashboardPage,
});

type MenuTab =
	| "projects"
	| "computes"
	| "system-status"
	| "templates"
	| "image-manager"
	| "access-management";

function DashboardPage() {
	const { theme, toggleTheme, setSettingsModalOpen } = useUIStore();
	const {
		data: versionData,
		isLoading: isVersionLoading,
		isError: isVersionError,
	} = useControllerVersion();
	const { data: meData } = useControllerMe();

	const [activeMenuTab, setActiveMenuTab] = useState<MenuTab>("projects");

	// Auto-login on mount if not authenticated
	useEffect(() => {
		if (!gns3Api.getAuthToken()) {
			gns3Api.login("admin", "admin").catch(() => {});
		}
	}, []);

	// Sync active theme to document root
	useEffect(() => {
		if (typeof document !== "undefined") {
			if (theme === "dark") {
				document.documentElement.classList.add("dark");
				document.documentElement.classList.remove("light");
			} else {
				document.documentElement.classList.remove("dark");
				document.documentElement.classList.add("light");
			}
		}
	}, [theme]);

	const sidebarMenuItems = [
		{
			id: "projects" as const,
			label: "Projects",
			icon: FolderGit2,
			action: () => setActiveMenuTab("projects"),
		},
		{
			id: "computes" as const,
			label: "Computes",
			icon: Server,
			action: () => setActiveMenuTab("computes"),
		},
		{
			id: "system-status" as const,
			label: "System status",
			icon: Activity,
			action: () => setActiveMenuTab("system-status"),
		},
		{
			id: "templates" as const,
			label: "Templates",
			icon: Cpu,
			action: () => setActiveMenuTab("templates"),
		},
		{
			id: "image-manager" as const,
			label: "Image manager",
			icon: HardDrive,
			action: () => setActiveMenuTab("image-manager"),
		},
		{
			id: "access-management" as const,
			label: "Access Management",
			icon: ShieldCheck,
			action: () => setActiveMenuTab("access-management"),
		},
		{
			id: "web-settings" as const,
			label: "Web settings",
			icon: Sliders,
			action: () => setSettingsModalOpen(true),
		},
		{
			id: "server-settings" as const,
			label: "Server settings",
			icon: Settings,
			action: () => setSettingsModalOpen(true),
		},
	];

	const sidebarSupportItems = [
		{
			label: "Documentation",
			icon: BookOpen,
			href: "https://docs.gns3.com/",
		},
		{
			label: "Community",
			icon: Users,
			href: "https://gns3.com/community",
		},
		{
			label: "API documentation",
			icon: Terminal,
			href: "https://gns3-server.readthedocs.io/",
		},
		{
			label: "Report Issue",
			icon: AlertCircle,
			href: "https://github.com/GNS3/gns3-gui/issues",
		},
	];

	const viewTitles: Record<MenuTab, string> = {
		projects: "Projects",
		computes: "Compute Nodes",
		"system-status": "System Status",
		templates: "Appliance Templates",
		"image-manager": "Image Manager",
		"access-management": "Access Management",
	};

	return (
		<TooltipProvider delayDuration={200}>
			<div
				className={`min-h-screen w-full bg-background ${theme} flex flex-col antialiased`}
			>
				<SettingsModal />

				<SidebarProvider defaultOpen={true}>
					{/* Official shadcn Navigation Sidebar */}
					<Sidebar collapsible="icon">
						{/* GNS3 Brand Header */}
						<SidebarHeader className="h-14 border-b border-sidebar-border flex flex-row items-center px-4 gap-3">
							<div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
								<Network className="w-4 h-4" />
							</div>
							<div className="flex items-center gap-1.5 overflow-hidden group-data-[collapsible=icon]:hidden">
								<span className="font-bold text-sm tracking-tight text-sidebar-foreground">
									GNS3
								</span>
							</div>
						</SidebarHeader>

						{/* Sidebar Navigation Items */}
						<SidebarContent>
							{/* Main Menu Section */}
							<SidebarGroup>
								<SidebarGroupLabel>Main Menu</SidebarGroupLabel>
								<SidebarGroupContent>
									<SidebarMenu>
										{sidebarMenuItems.map((item) => {
											const isActive = activeMenuTab === item.id;
											const Icon = item.icon;
											return (
												<SidebarMenuItem key={item.id}>
													<SidebarMenuButton
														isActive={isActive}
														onClick={item.action}
														tooltip={item.label}
														className={
															isActive
																? "bg-primary/10 text-primary font-semibold shadow-xs"
																: "text-muted-foreground hover:text-foreground"
														}
													>
														<Icon className="w-4 h-4" />
														<span>{item.label}</span>
													</SidebarMenuButton>
												</SidebarMenuItem>
											);
										})}
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>

							{/* Support Section */}
							<SidebarGroup>
								<SidebarGroupLabel>Support</SidebarGroupLabel>
								<SidebarGroupContent>
									<SidebarMenu>
										{sidebarSupportItems.map((item) => {
											const Icon = item.icon;
											return (
												<SidebarMenuItem key={item.label}>
													<SidebarMenuButton asChild tooltip={item.label}>
														<a
															href={item.href}
															target="_blank"
															rel="noopener noreferrer"
														>
															<Icon className="w-4 h-4" />
															<span>{item.label}</span>
														</a>
													</SidebarMenuButton>
												</SidebarMenuItem>
											);
										})}
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						</SidebarContent>

						<SidebarRail />
					</Sidebar>

					{/* Main App Workspace */}
					<SidebarInset className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-background">
						{/* Top Navbar */}
						<header className="h-14 border-b border-border bg-card/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
							<div className="flex items-center gap-3">
								<SidebarTrigger className="text-muted-foreground hover:text-foreground" />
								<div className="flex items-center gap-2">
									<span className="text-xs font-semibold text-foreground">
										{viewTitles[activeMenuTab]}
									</span>
									<span className="text-xs text-muted-foreground hidden sm:inline">
										•
									</span>
									<span className="text-xs font-medium text-muted-foreground hidden sm:inline">
										Controller
									</span>
									<span
										className={cn(
											"w-1.5 h-1.5 rounded-full",
											versionData && !isVersionError
												? "bg-emerald-500 animate-pulse"
												: isVersionLoading
													? "bg-amber-500 animate-ping"
													: "bg-destructive",
										)}
									/>
									<span className="text-[11px] text-muted-foreground font-mono hidden sm:inline">
										{versionData && !isVersionError
											? `Online${versionData.version ? ` v${versionData.version}` : ""}`
											: isVersionLoading
												? "Connecting..."
												: "Offline"}
									</span>
								</div>
							</div>

							<div className="flex items-center gap-2">
								{/* Theme Toggle Button */}
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={toggleTheme}
									title={theme === "dark" ? "Light mode" : "Dark mode"}
									className="text-muted-foreground hover:text-foreground"
								>
									{theme === "dark" ? (
										<Sun className="w-4 h-4 text-amber-400" />
									) : (
										<Moon className="w-4 h-4 text-zinc-700" />
									)}
								</Button>

								{/* User Profile Dropdown */}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className="gap-2 h-8 px-2 text-xs font-normal text-foreground"
										>
											<Avatar className="w-6 h-6 border border-border">
												<AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
													{(meData?.username || "A")
														.substring(0, 1)
														.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<span className="font-medium hidden sm:inline">
												{meData?.username || "admin"}
											</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-48">
										<DropdownMenuLabel className="text-xs">
											Signed in as {meData?.username || "admin"}
										</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={() => setSettingsModalOpen(true)}
											className="text-xs gap-2 cursor-pointer"
										>
											<Settings className="w-3.5 h-3.5" /> Web Settings
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => setActiveMenuTab("access-management")}
											className="text-xs gap-2 cursor-pointer"
										>
											<ShieldCheck className="w-3.5 h-3.5" /> Access Management
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</header>

						{/* Dynamic Active Feature View */}
						{activeMenuTab === "projects" && <ProjectsView />}
						{activeMenuTab === "computes" && <ComputesView />}
						{activeMenuTab === "system-status" && (
							<SystemStatusView
								onNavigateProjects={() => setActiveMenuTab("projects")}
							/>
						)}
						{activeMenuTab === "templates" && <TemplatesView />}
						{activeMenuTab === "image-manager" && <ImageManagerView />}
						{activeMenuTab === "access-management" && <AccessManagementView />}
					</SidebarInset>
				</SidebarProvider>
			</div>
		</TooltipProvider>
	);
}
