import { createFileRoute } from "@tanstack/react-router";
import { ReactFlowProvider } from "@xyflow/react";
import { Network } from "lucide-react";
import { useEffect } from "react";
import { BottomPanel } from "@/components/layout/bottom-panel";
import { RightPanel } from "@/components/layout/right-panel";
import { Sidebar } from "@/components/layout/sidebar";
import { TopologyCanvas } from "@/components/topology/topology-canvas";
import { Badge } from "@/components/ui/badge";
import { useControllerNotifications } from "@/features/controller/use-controller";
import { useOpenProject, useProjects } from "@/features/projects/use-projects";
import { gns3Api } from "@/lib/gns3-api";
import { useTopologyStore } from "@/stores/topology-store";
import { useUIStore } from "@/stores/ui-store";

export const Route = createFileRoute("/")({
  component: MainWorkspace,
});

function MainWorkspace() {
  const { activeProjectId, setActiveProjectId } = useTopologyStore();
  const { data: projects = [] } = useProjects();
  const openProjectMutation = useOpenProject();
  const { theme } = useUIStore();

  // Try auto-login with default admin / admin on first load if not authenticated
  useEffect(() => {
    if (!gns3Api.getAuthToken()) {
      gns3Api.login("admin", "admin").catch(() => {
        // Ignored if custom credentials configured
      });
    }
  }, []);

  // Auto-select first project if none is active
  useEffect(() => {
    if (!activeProjectId && projects.length > 0) {
      // Pick first opened project, or first project
      const opened = projects.find((p) => p.status === "opened");
      const target = opened || projects[0];
      setActiveProjectId(target.project_id);
    }
  }, [activeProjectId, projects, setActiveProjectId]);

  // Connect WebSocket notifications for active project
  useControllerNotifications(activeProjectId);

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

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden bg-background ${theme}`}>
      {/* Main Workspace Center Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Collapsible Sidebar */}
        <Sidebar />

        {/* Center Canvas or Welcome Launcher */}
        <main className="flex-1 h-full relative overflow-hidden bg-background">
          {activeProjectId ? (
            <ReactFlowProvider>
              <TopologyCanvas />
            </ReactFlowProvider>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center select-none">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-sm">
                <Network className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">GNS3 Network Lab</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Select an existing network lab project to open the topology canvas, or create a new
                project.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 w-full max-w-md">
                {projects.map((proj) => (
                  <button
                    key={proj.project_id}
                    type="button"
                    onClick={() => {
                      setActiveProjectId(proj.project_id);
                      if (proj.status === "closed") {
                        openProjectMutation.mutate(proj.project_id);
                      }
                    }}
                    className="flex flex-col p-3 rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {proj.name}
                      </span>
                      <Badge
                        variant={proj.status === "opened" ? "success" : "muted"}
                        className="text-[9px] uppercase px-1 py-0"
                      >
                        {proj.status}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono mt-1">
                      {proj.filename || proj.project_id.substring(0, 8)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>

        <RightPanel />
      </div>

      <BottomPanel />
    </div>
  );
}
