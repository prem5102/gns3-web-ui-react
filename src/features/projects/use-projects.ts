import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectKeys } from "@/features/query-keys";
import { gns3Api } from "@/lib/gns3-api";
import { useUIStore } from "@/stores/ui-store";

export { projectKeys };

export function useProjects() {
	return useQuery({
		queryKey: projectKeys.all,
		queryFn: () => gns3Api.getProjects(),
		refetchInterval: 10000,
	});
}

export function useProject(projectId: string | null) {
	return useQuery({
		queryKey: projectKeys.detail(projectId || ""),
		queryFn: () => (projectId ? gns3Api.getProject(projectId) : null),
		enabled: Boolean(projectId),
		refetchInterval: 10000,
	});
}

export function useCreateProject() {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: (data: {
			name: string;
			scene_width?: number;
			scene_height?: number;
			path?: string;
		}) => gns3Api.createProject(data),
		onSuccess: (project) => {
			queryClient.invalidateQueries({ queryKey: projectKeys.all });
			addEvent({
				level: "success",
				message: `Project "${project.name}" created`,
				source: "Projects",
			});
		},
		onError: (err: Error) => {
			addEvent({
				level: "error",
				message: `Failed to create project: ${err.message}`,
				source: "Projects",
			});
		},
	});
}

export function useOpenProject() {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: (projectId: string) => gns3Api.openProject(projectId),
		onSuccess: (project) => {
			queryClient.invalidateQueries({ queryKey: projectKeys.all });
			queryClient.invalidateQueries({
				queryKey: projectKeys.detail(project.project_id),
			});
			addEvent({
				level: "success",
				message: `Project "${project.name}" opened`,
				source: "Projects",
			});
		},
		onError: (err: Error) => {
			addEvent({
				level: "error",
				message: `Failed to open project: ${err.message}`,
				source: "Projects",
			});
		},
	});
}

export function useCloseProject() {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: (projectId: string) => gns3Api.closeProject(projectId),
		onSuccess: (project) => {
			queryClient.invalidateQueries({ queryKey: projectKeys.all });
			queryClient.invalidateQueries({
				queryKey: projectKeys.detail(project.project_id),
			});
			addEvent({
				level: "info",
				message: `Project "${project.name}" closed`,
				source: "Projects",
			});
		},
		onError: (err: Error) => {
			addEvent({
				level: "error",
				message: `Failed to close project: ${err.message}`,
				source: "Projects",
			});
		},
	});
}

export function useDeleteProject() {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: (projectId: string) => gns3Api.deleteProject(projectId),
		onSuccess: (_data, projectId) => {
			queryClient.invalidateQueries({ queryKey: projectKeys.all });
			addEvent({
				level: "info",
				message: `Project ${projectId} deleted`,
				source: "Projects",
			});
		},
		onError: (err: Error) => {
			addEvent({
				level: "error",
				message: `Failed to delete project: ${err.message}`,
				source: "Projects",
			});
		},
	});
}
