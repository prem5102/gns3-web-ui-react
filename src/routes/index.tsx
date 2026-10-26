import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnFiltersState, RowSelectionState, SortingState } from "@tanstack/react-table";
import {
  Activity,
  AlertCircle,
  BookOpen,
  Check,
  Cpu,
  FolderGit2,
  Github,
  HardDrive,
  Info,
  LayoutGrid,
  List,
  Moon,
  MoreHorizontal,
  Network,
  Pencil,
  Play,
  Plus,
  PowerOff,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Sliders,
  Sun,
  Terminal,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type VisibilityState = Record<string, boolean>;

import { flexRender } from "@tanstack/react-table";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useLegacyTable,
} from "@tanstack/react-table/legacy";
import { SettingsModal } from "@/components/settings/settings-modal";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DataTableColumnHeader,
  DataTablePagination,
  DataTableViewOptions,
} from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useControllerMe, useControllerVersion } from "@/features/controller/use-controller";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ImportProjectDialog } from "@/components/projects/import-project-dialog";
import { ProjectDetailsDialog } from "@/components/projects/project-details-dialog";
import { RenameProjectDialog } from "@/components/projects/rename-project-dialog";
import {
  useCloseProject,
  useDeleteProject,
  useOpenProject,
  useProjects,
} from "@/features/projects/use-projects";
import { projectsQueryOptions } from "@/features/query-keys";
import { gns3Api } from "@/lib/gns3-api";
import { cn } from "@/lib/utils";
import { useTopologyStore } from "@/stores/topology-store";
import { useUIStore } from "@/stores/ui-store";
import type { GNS3Project } from "@/types/gns3";

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
  component: ProjectsPage,
});

function ProjectsPage() {
  const navigate = useNavigate();
  const { data: projects = [], isLoading, refetch, isRefetching } = useProjects();
  const { setActiveProjectId } = useTopologyStore();
  const { theme, toggleTheme, setSettingsModalOpen } = useUIStore();
  const {
    data: versionData,
    isLoading: isVersionLoading,
    isError: isVersionError,
  } = useControllerVersion();
  const { data: meData } = useControllerMe();

  const openProjectMutation = useOpenProject();
  const closeProjectMutation = useCloseProject();
  const deleteProjectMutation = useDeleteProject();

  // Navigation state
  const [activeMenuTab, setActiveMenuTab] = useState("projects");

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "opened" | "closed">("all");
  const [sortBy, setSortBy] = useState<"name" | "status" | "id">("name");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });

  // Dialog states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [detailsProject, setDetailsProject] = useState<GNS3Project | null>(null);
  const [editProject, setEditProject] = useState<GNS3Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<GNS3Project | null>(null);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [genericModalInfo, setGenericModalInfo] = useState<{
    title: string;
    description: string;
  } | null>(null);

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

  const handleOpenLab = useCallback(
    (projectId: string) => {
      setActiveProjectId(projectId);
      const p = projects.find((proj) => proj.project_id === projectId);
      if (p && p.status === "closed") {
        openProjectMutation.mutate(projectId);
      }
      navigate({
        to: "/projects/$projectId",
        params: { projectId },
      });
    },
    [projects, openProjectMutation, setActiveProjectId, navigate],
  );

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<GNS3Project>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-0.5"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => {
          const proj = row.original;
          return (
            <div className="flex flex-col min-w-0">
              <button
                type="button"
                onClick={() => handleOpenLab(proj.project_id)}
                className="font-semibold text-xs text-foreground text-left hover:text-primary transition-colors truncate"
              >
                {proj.name}
              </button>
              <span className="text-[10px] text-muted-foreground font-mono truncate">
                {proj.filename || proj.project_id}
              </span>
            </div>
          );
        },
        filterFn: (row, _columnId, filterValue) => {
          const query = String(filterValue).toLowerCase().trim();
          if (!query) return true;
          const name = String(row.original.name || "").toLowerCase();
          const filename = String(row.original.filename || "").toLowerCase();
          const id = String(row.original.project_id || "").toLowerCase();
          return name.includes(query) || filename.includes(query) || id.includes(query);
        },
      },
      {
        id: "createdBy",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created By" />,
        cell: () => <span className="text-xs text-muted-foreground font-medium">admin</span>,
        enableSorting: false,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const isRunning = row.getValue("status") === "opened";
          return (
            <Badge
              variant={isRunning ? "success" : "muted"}
              className="text-[10px] capitalize font-medium gap-1 px-1.5 py-0.5"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isRunning ? "bg-emerald-500" : "bg-zinc-400"
                }`}
              />
              {isRunning ? "Running" : "Closed"}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          if (!value || value === "all") return true;
          return row.getValue(id) === value;
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const proj = row.original;
          const isRunning = proj.status === "opened";
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                size="xs"
                variant="default"
                onClick={() => handleOpenLab(proj.project_id)}
                className="gap-1 text-xs h-7 font-medium"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Open Lab</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => handleOpenLab(proj.project_id)}
                    className="text-xs gap-2 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" /> Open Lab
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDetailsProject(proj)}
                    className="text-xs gap-2 cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" /> Project details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditProject(proj);
                    }}
                    className="text-xs gap-2 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Rename project
                  </DropdownMenuItem>
                  {isRunning && (
                    <DropdownMenuItem
                      onClick={() => closeProjectMutation.mutate(proj.project_id)}
                      className="text-xs gap-2 cursor-pointer text-amber-500 hover:text-amber-600"
                    >
                      <PowerOff className="w-3.5 h-3.5" /> Close project
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setProjectToDelete(proj)}
                    className="text-xs gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleOpenLab, closeProjectMutation],
  );

  const table = useLegacyTable({
    data: projects,
    columns,
    getRowId: (row) => row.project_id,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleBatchDelete = () => {
    setIsBatchDeleteOpen(true);
  };

  const handleBatchOpen = () => {
    for (const row of selectedRows) {
      openProjectMutation.mutate(row.original.project_id);
    }
  };

  const handleBatchClose = () => {
    for (const row of selectedRows) {
      closeProjectMutation.mutate(row.original.project_id);
    }
  };

  const runningCount = projects.filter((p) => p.status === "opened").length;
  const closedCount = projects.filter((p) => p.status === "closed").length;

  const sidebarMenuItems = [
    {
      id: "controllers",
      label: "Controllers",
      icon: Network,
      action: () =>
        setGenericModalInfo({
          title: "Controllers Overview",
          description: `GNS3 Controller connection: Active (${gns3Api.getBaseUrl()}). Version: ${versionData?.version || "3.1.0"}`,
        }),
    },
    {
      id: "computes",
      label: "Computes",
      icon: Server,
      action: () =>
        setGenericModalInfo({
          title: "Compute Nodes",
          description:
            "Local compute engine is operational. Virtual machines, Dynamips, QEMU, and Docker containers are enabled.",
        }),
    },
    {
      id: "system-status",
      label: "System status",
      icon: Activity,
      action: () =>
        setGenericModalInfo({
          title: "System Status",
          description:
            "CPU, Memory, and Controller health are healthy. WebSocket notification channel is listening.",
        }),
    },
    {
      id: "projects",
      label: "Projects",
      icon: FolderGit2,
      action: () => setActiveMenuTab("projects"),
    },
    {
      id: "image-manager",
      label: "Image manager",
      icon: HardDrive,
      action: () =>
        setGenericModalInfo({
          title: "Image Manager",
          description:
            "Manage appliance disk images, ISOs, and container images for network emulators.",
        }),
    },
    {
      id: "templates",
      label: "Templates",
      icon: Cpu,
      action: () =>
        setGenericModalInfo({
          title: "Appliance Templates",
          description:
            "Router, Switch, Firewall, and Server templates are synced and ready for topology labs.",
        }),
    },
    {
      id: "web-settings",
      label: "Web settings",
      icon: Sliders,
      action: () => setSettingsModalOpen(true),
    },
    {
      id: "server-settings",
      label: "Server settings",
      icon: Settings,
      action: () => setSettingsModalOpen(true),
    },
    {
      id: "access-management",
      label: "Access Management",
      icon: ShieldCheck,
      action: () =>
        setGenericModalInfo({
          title: "Access Management",
          description: `Logged in as ${meData?.username || "admin"}. Role: Administrator.`,
        }),
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

  return (
    <TooltipProvider delayDuration={200}>
      <div className={`min-h-screen w-full bg-background ${theme} flex flex-col antialiased`}>
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
                            <a href={item.href} target="_blank" rel="noopener noreferrer">
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
                  <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
                    GNS3 Controller
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
                  <span className="text-[11px] text-muted-foreground font-mono">
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
                          {(meData?.username || "A").substring(0, 1).toUpperCase()}
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
                      onClick={() =>
                        setGenericModalInfo({
                          title: "User Profile",
                          description: `User: ${meData?.username || "admin"}. Controller: ${gns3Api.getBaseUrl()}`,
                        })
                      }
                      className="text-xs gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Account Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
              {/* Page Title & Top Actions Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">Projects</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage network lab projects, launch interactive topology workspaces, or import
                    designs.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New project</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsImportModalOpen(true)}
                    className="gap-1.5 shadow-xs"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import project</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="gap-1.5 shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
                    <span>Refresh projects</span>
                  </Button>
                </div>
              </div>

              {/* Filter, Search & Controls Bar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Filter projects..."
                    value={searchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      table.getColumn("name")?.setFilterValue(val || undefined);
                    }}
                    className="h-8 pl-9 text-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        table.getColumn("name")?.setFilterValue(undefined);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter, Sort and View Controls */}
                <div className="flex items-center flex-wrap gap-2.5">
                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="text-[11px] font-medium hidden sm:inline">Filter</span>
                    <Select
                      value={statusFilter}
                      onValueChange={(val) => {
                        const next = val as "all" | "opened" | "closed";
                        setStatusFilter(next);
                        table
                          .getColumn("status")
                          ?.setFilterValue(next === "all" ? undefined : next);
                      }}
                    >
                      <SelectTrigger size="sm" className="h-8 text-xs min-w-28">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All ({projects.length})</SelectItem>
                        <SelectItem value="opened">Running ({runningCount})</SelectItem>
                        <SelectItem value="closed">Closed ({closedCount})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Data Table Column Visibility */}
                  <DataTableViewOptions table={table} />
                </div>
              </div>

              {/* Batch Selection Action Bar (Shown when 1 or more items are selected) */}
              {selectedCount > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/40 bg-primary/5 text-xs animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">
                      {selectedCount} project(s) selected
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={handleBatchOpen}
                      className="text-xs h-7"
                    >
                      Open Selected
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={handleBatchClose}
                      className="text-xs h-7"
                    >
                      Close Selected
                    </Button>
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={handleBatchDelete}
                      className="text-xs h-7"
                    >
                      Delete Selected
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => table.resetRowSelection()}
                      className="text-xs h-7"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              {/* Main Content: Projects Table View */}
              {viewMode === "table" ? (
                <div className="space-y-4">
                  <div className="rounded-md border border-border bg-card shadow-xs overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id}>
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(header.column.columnDef.header, header.getContext())}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>

                      <TableBody>
                        {isLoading ? (
                          [1, 2, 3].map((i) => (
                            <TableRow key={i}>
                              <TableCell colSpan={columns.length} className="h-14">
                                <div className="h-4 bg-muted/60 animate-pulse rounded w-full" />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow
                              key={row.id}
                              data-state={row.getIsSelected() && "selected"}
                              className="group transition-colors hover:bg-muted/40"
                            >
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={columns.length}
                              className="h-40 text-center text-muted-foreground text-xs"
                            >
                              <div className="flex flex-col items-center justify-center gap-1.5">
                                <FolderGit2 className="w-8 h-8 text-muted-foreground/60 mb-1" />
                                <p className="font-semibold text-foreground">
                                  {searchQuery
                                    ? "No projects match your search query"
                                    : "No network projects found"}
                                </p>
                                <p className="text-[11px] text-muted-foreground max-w-xs">
                                  Create a new project to start designing and emulating network
                                  topologies.
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Standard shadcn Data Table Pagination */}
                  <DataTablePagination table={table} />
                </div>
              ) : (
                /* Main Content: Projects Grid View */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {table.getRowModel().rows.map((row) => {
                      const proj = row.original;
                      const isRunning = proj.status === "opened";
                      return (
                        <Card
                          key={proj.project_id}
                          className="group hover:border-primary/60 hover:shadow-md transition-all cursor-pointer"
                          onClick={() => handleOpenLab(proj.project_id)}
                        >
                          <CardContent className="p-4 flex flex-col justify-between h-40">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                  <FolderGit2 className="w-4 h-4" />
                                </div>
                                <Badge
                                  variant={isRunning ? "success" : "muted"}
                                  className="text-[10px] capitalize px-1.5 py-0.5"
                                >
                                  {isRunning ? "Running" : "Closed"}
                                </Badge>
                              </div>
                              <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                {proj.name}
                              </h3>
                              <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                                {proj.filename || proj.project_id}
                              </p>
                            </div>

                            <div
                              className="flex items-center justify-between pt-3 border-t border-border/50 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-[11px] text-muted-foreground">By admin</span>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="xs"
                                  variant="default"
                                  onClick={() => handleOpenLab(proj.project_id)}
                                  className="gap-1 h-7 text-xs"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Open Lab</span>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Standard shadcn Data Table Pagination */}
                  <DataTablePagination table={table} />
                </div>
              )}

              {/* Page Bottom Copyright Footer */}
              <footer className="pt-6 pb-2 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-center gap-3">
                <span>GNS3 Web-UI © 2018-2026 v{versionData?.version || "3.1.0"}</span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://github.com/GNS3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                  <a
                    href="https://gns3.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    <Network className="w-4 h-4" />
                  </a>
                </div>
              </footer>
            </main>
          </SidebarInset>
        </SidebarProvider>

        {/* Dialog: Create New Project */}
        <CreateProjectDialog
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSuccess={(newProj) => handleOpenLab(newProj.project_id)}
        />

        {/* Dialog: Import Project */}
        <ImportProjectDialog
          open={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
          onSuccess={(newProj) => handleOpenLab(newProj.project_id)}
        />

        {/* Dialog: Project Details */}
        <ProjectDetailsDialog
          project={detailsProject}
          onOpenChange={(open) => !open && setDetailsProject(null)}
          onLaunchLab={handleOpenLab}
        />

        {/* Dialog: Rename Project */}
        <RenameProjectDialog
          project={editProject}
          onOpenChange={(open) => !open && setEditProject(null)}
          onSuccess={() => refetch()}
        />

        {/* Dialog: Generic Info */}
        <Dialog
          open={Boolean(genericModalInfo)}
          onOpenChange={(open) => !open && setGenericModalInfo(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{genericModalInfo?.title}</DialogTitle>
              <DialogDescription className="pt-2 text-xs text-foreground/80 leading-relaxed">
                {genericModalInfo?.description}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setGenericModalInfo(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alert Dialog: Single Project Delete */}
        <AlertDialog
          open={Boolean(projectToDelete)}
          onOpenChange={(open) => !open && setProjectToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete project &quot;
                {projectToDelete?.name}&quot;? This action cannot be undone and will permanently
                remove all associated network nodes and links.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (projectToDelete) {
                    deleteProjectMutation.mutate(projectToDelete.project_id);
                    setProjectToDelete(null);
                  }
                }}
              >
                Delete Project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Alert Dialog: Batch Delete Selected Projects */}
        <AlertDialog open={isBatchDeleteOpen} onOpenChange={setIsBatchDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete selected projects</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedCount} selected project(s)? This action
                cannot be undone and will permanently remove all associated project data from the
                GNS3 controller.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  for (const row of selectedRows) {
                    deleteProjectMutation.mutate(row.original.project_id);
                  }
                  table.resetRowSelection();
                  setIsBatchDeleteOpen(false);
                }}
              >
                Delete {selectedCount} Projects
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
