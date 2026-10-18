import {
  Activity,
  FileCode2,
  Folder,
  Info,
  Layers,
  LayoutGrid,
  List,
  Network,
  Play,
  Plus,
  SearchIcon,
  Settings,
  Square,
  Terminal,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { SettingsModal } from "@/components/settings/settings-modal";
import { NodeModelModal } from "@/components/topology/node-model-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjectNodes, useStartNode, useStopNode } from "@/features/nodes/use-nodes";
import {
  useCreateProject,
  useDeleteProject,
  useOpenProject,
  useProjects,
} from "@/features/projects/use-projects";
import { useCreateNodeFromTemplate, useTemplates } from "@/features/templates/use-templates";
import { BUILTIN_NODE_MODELS, resolveNodeSymbol } from "@/lib/symbols";
import { useTopologyStore } from "@/stores/topology-store";
import { type SidebarTab, useUIStore } from "@/stores/ui-store";
import type { GNS3Template } from "@/types/gns3";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group";
import { Separator } from "../ui/separator";

export function Sidebar() {
  const {
    sidebarOpen,
    setSidebarOpen,
    activeSidebarTab,
    setActiveSidebarTab,
    openConsoleForNode,
    setSettingsModalOpen,
    bottomPanelOpen,
    setBottomPanelOpen,
    activeBottomTab,
    setActiveBottomTab,
    openConsoles,
    events,
  } = useUIStore();

  const { activeProjectId, setActiveProjectId, selectedNodeId, selectNode } = useTopologyStore();

  const { data: projects = [] } = useProjects();
  const { data: templates = [] } = useTemplates();
  const { data: nodes = [] } = useProjectNodes(activeProjectId);

  const openProjectMutation = useOpenProject();
  const deleteProjectMutation = useDeleteProject();
  const createProjectMutation = useCreateProject();
  const startNodeMutation = useStartNode(activeProjectId || "");
  const stopNodeMutation = useStopNode(activeProjectId || "");
  const createFromTemplateMutation = useCreateNodeFromTemplate(activeProjectId || "");

  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceCategory, setDeviceCategory] = useState<
    "all" | "router" | "switch" | "guest" | "firewall"
  >("all");
  const [libraryViewMode, setLibraryViewMode] = useState<"grid" | "list">("grid");
  const [activeModalTemplate, setActiveModalTemplate] = useState<GNS3Template | null>(null);
  const [nodeModalOpen, setNodeModalOpen] = useState(false);

  const [newProjectName, setNewProjectName] = useState("");
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);

  const navItems: Array<{
    id: SidebarTab;
    label: string;
    icon: React.ElementType;
  }> = [
    { id: "projects", label: "Projects", icon: Folder },
    { id: "devices", label: "Device Library", icon: Layers },
    { id: "nodes", label: "Active Devices", icon: Network },
  ];

  const availableTemplates: GNS3Template[] = templates.length > 0 ? templates : BUILTIN_NODE_MODELS;

  const filteredTemplates = availableTemplates.filter((tpl) => {
    const matchesSearch = tpl.name.toLowerCase().includes(deviceSearch.toLowerCase());

    const matchesCategory =
      deviceCategory === "all" || tpl.category?.toLowerCase().includes(deviceCategory);

    return matchesSearch && matchesCategory;
  });

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProjectMutation.mutate({ name: newProjectName.trim() });
      setNewProjectName("");
      setShowNewProjectInput(false);
    }
  };

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    const p = projects.find((proj) => proj.project_id === projectId);
    if (p && p.status === "closed") {
      openProjectMutation.mutate(projectId);
    }
  };

  const handleQuickAddTemplate = (templateId: string) => {
    if (!activeProjectId) return;
    createFromTemplateMutation.mutate({
      templateId,
      x: Math.floor(Math.random() * 150) + 150,
      y: Math.floor(Math.random() * 150) + 150,
    });
  };

  const handleOpenModelDetails = (tpl: GNS3Template) => {
    setActiveModalTemplate(tpl);
    setNodeModalOpen(true);
  };

  const activeItem = navItems.find((item) => item.id === activeSidebarTab);

  const activeTabLabel = activeItem?.label || "Explorer";

  const handleActivityBarClick = (tabId: SidebarTab) => {
    if (sidebarOpen && activeSidebarTab === tabId) {
      setSidebarOpen(false);
    } else {
      setActiveSidebarTab(tabId);
      setSidebarOpen(true);
    }
  };

  return (
    <>
      <SettingsModal />
      <NodeModelModal
        template={activeModalTemplate}
        open={nodeModalOpen}
        onOpenChange={setNodeModalOpen}
      />

      {/* VS Code Style Activity Bar (Always visible on far left) */}
      <div className="w-13 h-full border-r border-border bg-card/90 backdrop-blur-md flex flex-col justify-between items-center p-1">
        <div className="flex flex-col items-center gap-1 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = sidebarOpen && activeSidebarTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleActivityBarClick(item.id)}
                className={`w-10 h-10 flex items-center justify-center rounded-md relative transition-colors ${
                  isActive
                    ? "text-foreground font-semibold bg-muted/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        {/* Activity Bar Bottom: Console, Config Editor, Events, Settings */}
        <div className="flex flex-col items-center gap-1 w-full">
          {/* Console Drawer Toggle */}
          <button
            type="button"
            title={`Consoles (${openConsoles.length})`}
            onClick={() => {
              if (bottomPanelOpen && activeBottomTab === "consoles") {
                setBottomPanelOpen(false);
              } else {
                setActiveBottomTab("consoles");
              }
            }}
            className={`w-10 h-10 flex items-center justify-center rounded-md relative transition-colors ${
              bottomPanelOpen && activeBottomTab === "consoles"
                ? "text-foreground font-semibold bg-muted/60"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Terminal className="w-4 h-4" />
            {openConsoles.length > 0 && (
              <span className="absolute top-1 right-1 px-1 min-w-3.5 h-3.5 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center leading-none">
                {openConsoles.length}
              </span>
            )}
          </button>

          {/* Config Editor Drawer Toggle */}
          <button
            type="button"
            title="Configuration Editor"
            onClick={() => {
              if (bottomPanelOpen && activeBottomTab === "editor") {
                setBottomPanelOpen(false);
              } else {
                setActiveBottomTab("editor");
              }
            }}
            className={`w-10 h-10 flex items-center justify-center rounded-md relative transition-colors ${
              bottomPanelOpen && activeBottomTab === "editor"
                ? "text-foreground font-semibold bg-muted/60"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <FileCode2 className="w-4 h-4" />
          </button>

          {/* Controller Events Drawer Toggle */}
          <button
            type="button"
            title={`Controller Events (${events.length})`}
            onClick={() => {
              if (bottomPanelOpen && activeBottomTab === "events") {
                setBottomPanelOpen(false);
              } else {
                setActiveBottomTab("events");
              }
            }}
            className={`w-10 h-10 flex items-center justify-center rounded-md relative transition-colors ${
              bottomPanelOpen && activeBottomTab === "events"
                ? "text-foreground font-semibold bg-muted/60"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Activity className="w-4 h-4" />
            {events.length > 0 && (
              <span className="absolute top-1 right-1 px-1 min-w-3.5 h-3.5 rounded-full bg-muted-foreground/20 text-muted-foreground text-[9px] font-semibold flex items-center justify-center leading-none">
                {events.length > 99 ? "99+" : events.length}
              </span>
            )}
          </button>

          <Separator className="w-6 my-0.5" />

          {/* Settings & Preferences */}
          <button
            type="button"
            title="Settings & Preferences"
            className="w-10 h-10 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            onClick={() => setSettingsModalOpen(true)}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* VS Code Primary Side Bar Panel (Visible when sidebarOpen is true) */}
      {sidebarOpen && (
        <aside className="w-72 md:w-80 h-full border-r border-border bg-card/95 backdrop-blur-md flex flex-col shadow-sm z-20 transition-all select-none shrink-0">
          {/* Header with Title and Actions */}
          <div className="pt-3 px-3 flex items-center justify-between shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {activeTabLabel}
            </span>

            <div className="flex items-center gap-1">
              {activeSidebarTab === "projects" && (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewProjectInput(!showNewProjectInput)}
                  title="New Project"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Tab Panel Content */}
          <div
            className={`flex-1 p-3 ${
              activeSidebarTab === "devices"
                ? "flex flex-col min-h-0 overflow-hidden"
                : "overflow-y-auto"
            }`}
          >
            {activeSidebarTab === "projects" && (
              <div className="flex flex-col space-y-3">
                {showNewProjectInput && (
                  <div className="flex flex-col gap-1.5 p-2 bg-muted/40 rounded-md border border-border">
                    <Input
                      placeholder="Project name..."
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                      className="h-7 text-xs"
                      autoFocus
                    />
                    <div className="flex justify-end gap-1">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setShowNewProjectInput(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="xs"
                        variant="default"
                        onClick={handleCreateProject}
                        disabled={!newProjectName.trim() || createProjectMutation.isPending}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col space-y-1.5">
                  {projects.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-xs">
                      No projects found.
                    </div>
                  ) : (
                    projects.map((proj) => {
                      const isCurrent = proj.project_id === activeProjectId;
                      const isOpened = proj.status === "opened";

                      return (
                        <div
                          key={proj.project_id}
                          onClick={() => handleSelectProject(proj.project_id)}
                          className={`group flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer transition-all ${
                            isCurrent
                              ? "bg-primary/10 border-primary/40 shadow-xs"
                              : "bg-card hover:bg-muted/40 border-border/60"
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <Folder
                                className={`w-3.5 h-3.5 ${
                                  isCurrent ? "text-primary" : "text-muted-foreground"
                                }`}
                              />
                              <span
                                className={`truncate font-medium ${
                                  isCurrent ? "text-foreground font-semibold" : "text-foreground/90"
                                }`}
                              >
                                {proj.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                              {proj.filename || proj.project_id.substring(0, 8)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Badge
                              variant={isOpened ? "success" : "muted"}
                              className="text-[9px] uppercase px-1 py-0"
                            >
                              {proj.status}
                            </Badge>

                            <button
                              type="button"
                              title="Delete Project"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete project "${proj.name}"?`)) {
                                  deleteProjectMutation.mutate(proj.project_id);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/15 text-destructive rounded-xs transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeSidebarTab === "devices" && (
              <div className="flex flex-col space-y-3 flex-1 min-h-0">
                {/* Search Bar */}
                <div className="shrink-0">
                  <InputGroup>
                    <InputGroupInput
                      value={deviceSearch}
                      placeholder="Search node models..."
                      onChange={(e) => setDeviceSearch(e.target.value)}
                    />
                    <InputGroupAddon>
                      <SearchIcon />
                    </InputGroupAddon>
                  </InputGroup>
                </div>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-1 shrink-0">
                  {(["all", "router", "switch", "guest", "firewall"] as const).map((cat) => (
                    <Badge
                      key={cat}
                      variant={deviceCategory === cat ? "default" : "outline"}
                      onClick={() => setDeviceCategory(cat)}
                      className="cursor-pointer"
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Badge>
                  ))}
                </div>

                {/* Toolbar: View Mode Switcher */}
                <div className="flex items-center justify-between text-xs shrink-0">
                  <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                    Templates ({filteredTemplates.length})
                  </span>

                  <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-md border border-border/70">
                    <button
                      type="button"
                      onClick={() => setLibraryViewMode("grid")}
                      title="Grid of Icons View"
                      className={`p-1 rounded-xs transition-colors ${
                        libraryViewMode === "grid"
                          ? "bg-card text-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLibraryViewMode("list")}
                      title="List View"
                      className={`p-1 rounded-xs transition-colors ${
                        libraryViewMode === "list"
                          ? "bg-card text-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <Separator />

                {/* Device Library Template Nodes inside shadcn ScrollArea */}
                <ScrollArea className="flex-1 min-h-0 -mr-2 pr-2">
                  {filteredTemplates.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-xs">
                      No templates match filter.
                    </div>
                  ) : libraryViewMode === "grid" ? (
                    /* Grid of Icons with Node Model */
                    <div className="grid grid-cols-2 gap-2 pb-4 pr-1">
                      {filteredTemplates.map((tpl) => {
                        const symbolSrc = resolveNodeSymbol(tpl);

                        return (
                          <div
                            key={tpl.template_id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("application/gns3-template", tpl.template_id);
                              e.dataTransfer.effectAllowed = "copy";
                            }}
                            onDoubleClick={() => handleQuickAddTemplate(tpl.template_id)}
                            className="group relative flex flex-col items-center p-3 rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-grab active:cursor-grabbing text-xs select-none"
                          >
                            {/* Top Right Info Icon (Only shown when hovering) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModelDetails(tpl);
                              }}
                              title="Node Model Details"
                              className="absolute top-1.5 right-1.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>

                            {/* Node Symbol Graphic - No border */}
                            <div className="relative w-12 h-12 flex items-center justify-center mb-2">
                              <img
                                src={symbolSrc}
                                alt={tpl.name}
                                className="w-12 h-12 object-contain pointer-events-none select-none transition-transform group-hover:scale-105"
                                draggable={false}
                              />
                            </div>

                            {/* Node Model Info */}
                            <div className="w-full text-center min-w-0">
                              <span
                                className="font-semibold text-foreground truncate block text-xs"
                                title={tpl.name}
                              >
                                {tpl.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground capitalize truncate block mt-0.5">
                                {tpl.category || "Device"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Compact List View */
                    <div className="flex flex-col space-y-1.5 pb-4 pr-1">
                      {filteredTemplates.map((tpl) => {
                        const symbolSrc = resolveNodeSymbol(tpl);

                        return (
                          <div
                            key={tpl.template_id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("application/gns3-template", tpl.template_id);
                              e.dataTransfer.effectAllowed = "copy";
                            }}
                            onDoubleClick={() => handleQuickAddTemplate(tpl.template_id)}
                            className="group relative flex items-center justify-between p-2 rounded-lg border border-border/70 bg-card hover:border-primary/50 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing text-xs select-none"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-1">
                              <div className="w-7 h-7 flex items-center justify-center shrink-0">
                                <img
                                  src={symbolSrc}
                                  alt={tpl.name}
                                  className="w-6 h-6 object-contain pointer-events-none select-none"
                                  draggable={false}
                                />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-foreground truncate">
                                  {tpl.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground capitalize">
                                  {tpl.category || "Device"}
                                </span>
                              </div>
                            </div>

                            {/* Hover Info Icon */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModelDetails(tpl);
                              }}
                              title="Node Model Info"
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {activeSidebarTab === "nodes" && (
              <div className="flex flex-col space-y-3">
                <div className="flex flex-col space-y-1.5">
                  {nodes.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-xs">
                      No devices placed yet.
                    </div>
                  ) : (
                    nodes.map((n) => {
                      const isSelected = n.node_id === selectedNodeId;
                      const isStarted = n.status === "started";
                      const symbolSrc = resolveNodeSymbol(n);

                      return (
                        <div
                          key={n.node_id}
                          onClick={() => selectNode(n.node_id)}
                          className={`flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? "bg-primary/10 border-primary/50 shadow-xs"
                              : "bg-card hover:bg-muted/40 border-border/60"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-1">
                            <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                              <img
                                src={symbolSrc}
                                alt={n.name}
                                className="w-full h-full object-contain pointer-events-none select-none"
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-foreground truncate">
                                {n.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {n.node_type} {n.console ? `(:${n.console})` : ""}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {isStarted ? (
                              <button
                                type="button"
                                title="Stop"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  stopNodeMutation.mutate(n.node_id);
                                }}
                                className="p-1 hover:bg-destructive/15 text-destructive rounded-xs"
                              >
                                <Square className="w-3 h-3 fill-current" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                title="Start"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startNodeMutation.mutate(n.node_id);
                                }}
                                className="p-1 hover:bg-emerald-500/15 text-emerald-500 rounded-xs"
                              >
                                <Play className="w-3 h-3 fill-current" />
                              </button>
                            )}

                            <button
                              type="button"
                              title="Console"
                              onClick={(e) => {
                                e.stopPropagation();
                                openConsoleForNode(n.node_id);
                              }}
                              className="p-1 hover:bg-muted text-foreground rounded-xs"
                            >
                              <Terminal className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
