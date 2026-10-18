import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gns3Api } from "@/lib/gns3-api";
import { useUIStore } from "@/stores/ui-store";
import type { GNS3Link } from "@/types/gns3";

export const linkKeys = {
	all: (projectId: string) => ["projects", projectId, "links"] as const,
};

export function useProjectLinks(projectId: string | null) {
	return useQuery({
		queryKey: linkKeys.all(projectId || ""),
		queryFn: () => (projectId ? gns3Api.getProjectLinks(projectId) : []),
		enabled: Boolean(projectId),
		refetchInterval: 5000,
	});
}

export function useCreateLink(projectId: string) {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: (
			nodes: Array<{
				node_id: string;
				adapter_number: number;
				port_number: number;
			}>,
		) => gns3Api.createLink(projectId, nodes),
		onSuccess: (link) => {
			queryClient.setQueryData<GNS3Link[]>(linkKeys.all(projectId), (old) =>
				old ? [...old, link] : [link],
			);
			addEvent({
				level: "success",
				message: "Link connected successfully",
				source: "Topology",
			});
		},
		onError: (err: Error) => {
			addEvent({
				level: "error",
				message: `Failed to create link: ${err.message}`,
				source: "Topology",
			});
		},
	});
}

export function useDeleteLink(projectId: string) {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: (linkId: string) => gns3Api.deleteLink(projectId, linkId),
		onSuccess: (_data, linkId) => {
			queryClient.setQueryData<GNS3Link[]>(linkKeys.all(projectId), (old) =>
				old ? old.filter((l) => l.link_id !== linkId) : [],
			);
			addEvent({
				level: "info",
				message: "Link removed",
				source: "Topology",
			});
		},
		onError: (err: Error) => {
			addEvent({
				level: "error",
				message: `Failed to delete link: ${err.message}`,
				source: "Topology",
			});
		},
	});
}

export function useStartLinkCapture(projectId: string) {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: (linkId: string) => gns3Api.startLinkCapture(projectId, linkId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: linkKeys.all(projectId) });
			addEvent({
				level: "info",
				message: "Packet capture started on link",
				source: "Capture",
			});
		},
		onError: (err: Error) => {
			addEvent({
				level: "error",
				message: `Failed to start capture: ${err.message}`,
				source: "Capture",
			});
		},
	});
}

export function useStopLinkCapture(projectId: string) {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: (linkId: string) => gns3Api.stopLinkCapture(projectId, linkId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: linkKeys.all(projectId) });
			addEvent({
				level: "info",
				message: "Packet capture stopped",
				source: "Capture",
			});
		},
		onError: (err: Error) => {
			addEvent({
				level: "error",
				message: `Failed to stop capture: ${err.message}`,
				source: "Capture",
			});
		},
	});
}
