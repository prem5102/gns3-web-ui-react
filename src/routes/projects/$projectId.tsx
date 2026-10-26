import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ReactFlowProvider } from "@xyflow/react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { BottomPanel } from "@/components/layout/bottom-panel";
import { RightPanel } from "@/components/layout/right-panel";
import { Sidebar } from "@/components/layout/sidebar";
import { TopologyCanvas } from "@/components/topology/topology-canvas";
import { Button } from "@/components/ui/button";
import { useControllerNotifications } from "@/features/controller/use-controller";
import { useOpenProject, useProject, useProjects } from "@/features/projects/use-projects";
import {
  projectLinksQueryOptions,
  projectNodesQueryOptions,
  projectQueryOptions,
} from "@/features/query-keys";
import { gns3Api } from "@/lib/gns3-api";
import { useTopologyStore } from "@/stores/topology-store";
import { useUIStore } from "@/stores/ui-store";

export const Route = createFileRoute("/projects/$projectId")({
  loader: async ({ context, params: { projectId } }) => {
    try {
      if (typeof window !== "undefined") {
        await Promise.all([
          context.queryClient.ensureQueryData(projectQueryOptions(projectId)),
          context.queryClient.ensureQueryData(projectNodesQueryOptions(projectId)),
          context.queryClient.ensureQueryData(projectLinksQueryOptions(projectId)),
        ]);
      }
    } catch {
      // Handled gracefully by component on mount
    }
  },
  component: ProjectLabWorkspace,
});

function ProjectLabWorkspace() {
  const router = useRouter({ warn: false });
  const { projectId } = Route.useParams();
  const { activeProjectId, setActiveProjectId, clearSelection } = useTopologyStore();
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const { data: project, isLoading: isLoadingProject, isError } = useProject(projectId);
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

  // Synchronize route projectId with activeProjectId in store
  useEffect(() => {
    if (projectId && activeProjectId !== projectId) {
      setActiveProjectId(projectId);
      clearSelection();
    }
  }, [projectId, activeProjectId, setActiveProjectId, clearSelection]);

  // Automatically open the project if it's currently closed
  useEffect(() => {
    if (
      project &&
      project.status === "closed" &&
      !openProjectMutation.isPending &&
      !openProjectMutation.isSuccess
    ) {
      openProjectMutation.mutate(projectId);
    }
  }, [project, projectId, openProjectMutation]);

  // Connect WebSocket notifications for active project
  useControllerNotifications(projectId);

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

  // Check if project is not found after loading finishes
  const projectNotFound =
    !isLoadingProjects &&
    !isLoadingProject &&
    projects.length > 0 &&
    !projects.some((p) => p.project_id === projectId) &&
    (!project || isError);

  if (projectNotFound) {
    return (
      <div
        className={`flex flex-col h-screen w-screen items-center justify-center bg-background ${theme} p-6 select-none`}
      >
        <div className="w-full max-w-md p-6 rounded-2xl border border-border bg-card shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Lab Project Not Found
            </h2>
            <p className="text-xs text-muted-foreground mt-1.5">
              The project ID{" "}
              <span className="font-mono text-foreground font-semibold px-1 py-0.5 bg-muted rounded">
                {projectId}
              </span>{" "}
              could not be found on this GNS3 controller.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="default"
              onClick={() => {
                if (router?.navigate) {
                  router.navigate({ to: "/" });
                } else if (typeof window !== "undefined") {
                  window.location.href = "/";
                }
              }}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden bg-background ${theme}`}>
      {/* Main Workspace Center Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Collapsible Sidebar */}
        <Sidebar />

        {/* Center Canvas */}
        <main className="flex-1 h-full relative overflow-hidden bg-background">
          <ReactFlowProvider>
            <TopologyCanvas />
          </ReactFlowProvider>
        </main>

        <RightPanel />
      </div>

      <BottomPanel />
    </div>
  );
}
