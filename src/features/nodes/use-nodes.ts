import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gns3Api } from "@/lib/gns3-api";
import { useUIStore } from "@/stores/ui-store";
import type { GNS3Node } from "@/types/gns3";

export const nodeKeys = {
	all: (projectId: string) => ["projects", projectId, "nodes"] as const,
	detail: (projectId: string, nodeId: string) =>
		["projects", projectId, "nodes", nodeId] as const,
	files: (projectId: string, nodeId: string) =>
		["projects", projectId, "nodes", nodeId, "files"] as const,
};

export function useProjectNodes(projectId: string | null) {
	return useQuery({
		queryKey: nodeKeys.all(projectId || ""),
		queryFn: () => (projectId ? gns3Api.getProjectNodes(projectId) : []),
		enabled: Boolean(projectId),
		refetchInterval: 5000,
	});
}

export function useStartNode(projectId: string) {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: (nodeId: string) => gns3Api.startNode(projectId, nodeId),
		onSuccess: (node) => {
			queryClient.setQueryData<GNS3Node[]>(nodeKeys.all(projectId), (old) =>
				old ? old.map((n) => (n.node_id === node.node_id ? node : n)) : [node],
			);
			addEvent({
				level: "success",
				message: `Node "${node.name}" started (Console: ${node.console || "N/A"})`,
				source: "Nodes",
			});
		},
		onError: (err: Error) => {
			addEvent({
				level: "error",
				message: `Failed to start node: ${err.message}`,
				source: "Nodes",
			});
		},
	});
}

export function useStopNode(projectId: string) {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: (nodeId: string) => gns3Api.stopNode(projectId, nodeId),
		onSuccess: (node) => {
			queryClient.setQueryData<GNS3Node[]>(nodeKeys.all(projectId), (old) =>
				old ? old.map((n) => (n.node_id === node.node_id ? node : n)) : [node],
			);
			addEvent({
				level: "info",
				message: `Node "${node.name}" stopped`,
				source: "Nodes",
			});
		},
		onError: (err: Error) => {
			addEvent({
				level: "error",
				message: `Failed to stop node: ${err.message}`,
				source: "Nodes",
			});
		},
	});
}

export function useSuspendNode(projectId: string) {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: (nodeId: string) => gns3Api.suspendNode(projectId, nodeId),
		onSuccess: (node) => {
			queryClient.setQueryData<GNS3Node[]>(nodeKeys.all(projectId), (old) =>
				old ? old.map((n) => (n.node_id === node.node_id ? node : n)) : [node],
			);
			addEvent({
				level: "warning",
				message: `Node "${node.name}" suspended`,
				source: "Nodes",
			});
		},
		onError: (err: Error) => {
			addEvent({
				level: "error",
				message: `Failed to suspend node: ${err.message}`,
				source: "Nodes",
			});
		},
	});
}

export function useReloadNode(projectId: string) {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: (nodeId: string) => gns3Api.reloadNode(projectId, nodeId),
		onSuccess: (node) => {
			queryClient.setQueryData<GNS3Node[]>(nodeKeys.all(projectId), (old) =>
				old ? old.map((n) => (n.node_id === node.node_id ? node : n)) : [node],
			);
			addEvent({
				level: "info",
				message: `Node "${node.name}" reloaded`,
				source: "Nodes",
			});
		},
		onError: (err: Error) => {
			addEvent({
				level: "error",
				message: `Failed to reload node: ${err.message}`,
				source: "Nodes",
			});
		},
	});
}

export function useStartAllNodes(projectId: string) {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: () => gns3Api.startAllNodes(projectId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: nodeKeys.all(projectId) });
			addEvent({
				level: "success",
				message: "All nodes started",
				source: "Nodes",
			});
		},
		onError: (err: Error) => {
			addEvent({
				level: "error",
				message: `Failed to start all nodes: ${err.message}`,
				source: "Nodes",
			});
		},
	});
}

export function useStopAllNodes(projectId: string) {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: () => gns3Api.stopAllNodes(projectId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: nodeKeys.all(projectId) });
			addEvent({
				level: "info",
				message: "All nodes stopped",
				source: "Nodes",
			});
		},
		onError: (err: Error) => {
			addEvent({
				level: "error",
				message: `Failed to stop all nodes: ${err.message}`,
				source: "Nodes",
			});
		},
	});
}

export function useUpdateNode(projectId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			nodeId,
			data,
		}: {
			nodeId: string;
			data: Partial<GNS3Node>;
		}) => gns3Api.updateNode(projectId, nodeId, data),
		onSuccess: (node) => {
			queryClient.setQueryData<GNS3Node[]>(nodeKeys.all(projectId), (old) =>
				old ? old.map((n) => (n.node_id === node.node_id ? node : n)) : [node],
			);
		},
	});
}

export function useDeleteNode(projectId: string) {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: (nodeId: string) => gns3Api.deleteNode(projectId, nodeId),
		onSuccess: (_data, nodeId) => {
			queryClient.setQueryData<GNS3Node[]>(nodeKeys.all(projectId), (old) =>
				old ? old.filter((n) => n.node_id !== nodeId) : [],
			);
			addEvent({
				level: "info",
				message: `Node deleted`,
				source: "Nodes",
			});
		},
		onError: (err: Error) => {
			addEvent({
				level: "error",
				message: `Failed to delete node: ${err.message}`,
				source: "Nodes",
			});
		},
	});
}
