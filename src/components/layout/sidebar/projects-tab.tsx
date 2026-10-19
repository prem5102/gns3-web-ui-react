import { Folder, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateProject,
  useDeleteProject,
  useOpenProject,
  useProjects,
} from "@/features/projects/use-projects";
import { useTopologyStore } from "@/stores/topology-store";

interface ProjectsTabProps {
  showNewProjectInput: boolean;
  onCloseNewProject: () => void;
}

export function ProjectsTab({ showNewProjectInput, onCloseNewProject }: ProjectsTabProps) {
  const { data: projects = [] } = useProjects();

  const { activeProjectId, setActiveProjectId } = useTopologyStore();

  const openProjectMutation = useOpenProject();

  const deleteProjectMutation = useDeleteProject();

  const createProjectMutation = useCreateProject();

  const [newProjectName, setNewProjectName] = useState("");

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProjectMutation.mutate({ name: newProjectName.trim() });
      setNewProjectName("");
      onCloseNewProject();
    }
  };

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);

    const p = projects.find((proj) => proj.project_id === projectId);

    if (p && p.status === "closed") {
      openProjectMutation.mutate(projectId);
    }
  };

  return (
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
            <Button size="xs" variant="ghost" onClick={onCloseNewProject}>
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
          <div className="text-center py-6 text-muted-foreground text-xs">No projects found.</div>
        ) : (
          projects.map((proj) => {
            const isCurrent = proj.project_id === activeProjectId;

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
                </div>

                <div className="flex items-center gap-1">
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
  );
}
