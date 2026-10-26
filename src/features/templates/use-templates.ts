import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { nodeKeys, templateKeys } from "@/features/query-keys";
import { gns3Api } from "@/lib/gns3-api";
import { useUIStore } from "@/stores/ui-store";
import type { GNS3Node } from "@/types/gns3";

export { templateKeys };

export function useTemplates() {
	return useQuery({
		queryKey: templateKeys.all,
		queryFn: () => gns3Api.getTemplates(),
		staleTime: 60000,
	});
}

export function useCreateNodeFromTemplate(projectId: string) {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: ({
			templateId,
			x,
			y,
			name,
		}: {
			templateId: string;
			x: number;
			y: number;
			name?: string;
		}) => gns3Api.createNodeFromTemplate(projectId, templateId, { x, y, name }),
		onSuccess: (node: GNS3Node) => {
			queryClient.setQueryData<GNS3Node[]>(
				nodeKeys.all(projectId),
				(old?: GNS3Node[]) => (old ? [...old, node] : [node]),
			);
			addEvent({
				level: "success",
				message: `Device "${node.name}" added to topology`,
				source: "Topology",
			});
		},
		onError: (err: Error) => {
			addEvent({
				level: "error",
				message: `Failed to create device: ${err.message}`,
				source: "Topology",
			});
		},
	});
}
