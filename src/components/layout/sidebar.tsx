import {
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Folder,
  Layers,
  Network,
  Play,
  Plus,
  Radio,
  Search,
  Square,
  Terminal,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useDeleteLink,
  useProjectLinks,
  useStartLinkCapture,
  useStopLinkCapture,
} from "@/features/links/use-links";
import { useProjectNodes, useStartNode, useStopNode } from "@/features/nodes/use-nodes";
import {
  useCreateProject,
  useDeleteProject,
  useOpenProject,
  useProjects,
} from "@/features/projects/use-projects";
import { useCreateNodeFromTemplate, useTemplates } from "@/features/templates/use-templates";
import { useTopologyStore } from "@/stores/topology-store";
import { type SidebarTab, useUIStore } from "@/stores/ui-store";

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, activeSidebarTab, setActiveSidebarTab, openConsoleForNode } =
    useUIStore();

  const {
    activeProjectId,
    setActiveProjectId,
    selectedNodeId,
    selectNode,
    selectedLinkId,
    selectLink,
  } = useTopologyStore();

  const { data: projects = [] } = useProjects();
  const { data: templates = [] } = useTemplates();
  const { data: nodes = [] } = useProjectNodes(activeProjectId);
  const { data: links = [] } = useProjectLinks(activeProjectId);

  const openProjectMutation = useOpenProject();
  const deleteProjectMutation = useDeleteProject();
  const createProjectMutation = useCreateProject();
  const startNodeMutation = useStartNode(activeProjectId || "");
  const stopNodeMutation = useStopNode(activeProjectId || "");
  const createFromTemplateMutation = useCreateNodeFromTemplate(activeProjectId || "");
  const deleteLinkMutation = useDeleteLink(activeProjectId || "");
  const startCaptureMutation = useStartLinkCapture(activeProjectId || "");
  const stopCaptureMutation = useStopLinkCapture(activeProjectId || "");

  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceCategory, setDeviceCategory] = useState<
    "all" | "router" | "switch" | "guest" | "firewall"
  >("all");
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
    { id: "links", label: "Connections", icon: ArrowRightLeft },
  ];

  const filteredTemplates = templates.filter((tpl) => {
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
      x: 0,
      y: 0,
    });
  };

  if (!sidebarOpen) {
    return (
      <aside className="w-12 h-full border-r border-border bg-card/90 backdrop-blur-md flex flex-col items-center py-3 space-y-3 z-20 select-none">
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={() => setSidebarOpen(true)}
          title="Expand Sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        <div className="w-6 h-px bg-border/60" />

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSidebarTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSidebarTab(item.id)}
              className={`p-2 rounded-md transition-colors ${
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              title={item.label}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </aside>
    );
  }

  return (
    <aside className="w-64 md:w-72 h-full border-r border-border bg-card/95 backdrop-blur-md flex flex-col shadow-md z-20 transition-all select-none">
      {/* Sidebar Top Nav Tabs */}
      <div className="flex items-center justify-between p-2 border-b border-border/80 bg-muted/30">
        <div className="flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSidebarTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSidebarTab(item.id)}
                className={`p-1.5 rounded-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                title={item.label}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>

        <Button
          size="icon-xs"
          variant="ghost"
          onClick={() => setSidebarOpen(false)}
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Tab Panel Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* ========================================================= */}
        {/* TAB 1: PROJECTS */}
        {/* ========================================================= */}
        {activeSidebarTab === "projects" && (
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Projects ({projects.length})
              </span>
              <Button
                size="xs"
                variant="outline"
                className="gap-1 h-6"
                onClick={() => setShowNewProjectInput(!showNewProjectInput)}
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </Button>
            </div>

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
                  <Button size="xs" variant="ghost" onClick={() => setShowNewProjectInput(false)}>
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

        {/* ========================================================= */}
        {/* TAB 2: DEVICE LIBRARY (TEMPLATES) */}
        {/* ========================================================= */}
        {activeSidebarTab === "devices" && (
          <div className="flex flex-col space-y-3">
            <div className="flex flex-col space-y-2">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Device Library
              </span>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                  className="pl-7 h-7 text-xs"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1">
                {(["all", "router", "switch", "guest", "firewall"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDeviceCategory(cat)}
                    className={`px-2 py-0.5 rounded-xs text-[10px] font-medium capitalize transition-colors ${
                      deviceCategory === cat
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Template List */}
            <div className="flex flex-col space-y-1.5">
              <p className="text-[10px] text-muted-foreground">
                Drag a device onto the canvas or click '+' to add.
              </p>

              {filteredTemplates.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  No templates match filter.
                </div>
              ) : (
                filteredTemplates.map((tpl) => (
                  <div
                    key={tpl.template_id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/gns3-template", tpl.template_id);
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className="group flex items-center justify-between p-2 rounded-md border border-border/70 bg-card hover:border-primary/50 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <Layers className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-foreground truncate">{tpl.name}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {tpl.category || "Device"} • {tpl.compute_id || "local"}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => handleQuickAddTemplate(tpl.template_id)}
                      disabled={!activeProjectId || createFromTemplateMutation.isPending}
                      title="Add to canvas"
                      className="opacity-0 group-hover:opacity-100 hover:bg-primary/20 text-primary transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ACTIVE PROJECT NODES */}
        {/* ========================================================= */}
        {activeSidebarTab === "nodes" && (
          <div className="flex flex-col space-y-3">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Project Devices ({nodes.length})
            </span>

            <div className="flex flex-col space-y-1.5">
              {nodes.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  No devices placed yet.
                </div>
              ) : (
                nodes.map((n) => {
                  const isSelected = n.node_id === selectedNodeId;
                  const isStarted = n.status === "started";

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
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isStarted ? "bg-emerald-500" : "bg-zinc-500"
                          }`}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground truncate">{n.name}</span>
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

        {/* ========================================================= */}
        {/* TAB 4: CONNECTIONS / LINKS */}
        {/* ========================================================= */}
        {activeSidebarTab === "links" && (
          <div className="flex flex-col space-y-3">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Connections ({links.length})
            </span>

            <div className="flex flex-col space-y-1.5">
              {links.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  No links created yet.
                </div>
              ) : (
                links.map((link) => {
                  const isSelected = link.link_id === selectedLinkId;
                  const nodeA = nodes.find((n) => n.node_id === link.nodes?.[0]?.node_id);
                  const nodeB = nodes.find((n) => n.node_id === link.nodes?.[1]?.node_id);

                  return (
                    <div
                      key={link.link_id}
                      onClick={() => selectLink(link.link_id)}
                      className={`flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary/50 shadow-xs"
                          : "bg-card hover:bg-muted/40 border-border/60"
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-1">
                        <span className="font-semibold text-foreground truncate">
                          {nodeA?.name || "Node A"} ↔ {nodeB?.name || "Node B"}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {link.link_type} {link.capturing ? "• Capturing" : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {link.capturing ? (
                          <button
                            type="button"
                            title="Stop Capture"
                            onClick={(e) => {
                              e.stopPropagation();
                              stopCaptureMutation.mutate(link.link_id);
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-500/15 rounded-xs"
                          >
                            <Radio className="w-3 h-3 animate-pulse" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            title="Start Capture"
                            onClick={(e) => {
                              e.stopPropagation();
                              startCaptureMutation.mutate(link.link_id);
                            }}
                            className="p-1 text-muted-foreground hover:text-foreground rounded-xs"
                          >
                            <Radio className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          type="button"
                          title="Delete Link"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Delete link?")) {
                              deleteLinkMutation.mutate(link.link_id);
                            }
                          }}
                          className="p-1 hover:bg-destructive/15 text-destructive rounded-xs"
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
      </div>
    </aside>
  );
}
