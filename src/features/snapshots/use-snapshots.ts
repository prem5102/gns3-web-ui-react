import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { snapshotKeys, snapshotsQueryOptions } from "@/features/query-keys";
import { gns3Api } from "@/lib/gns3-api";

export function useSnapshots(projectId: string | null) {
	return useQuery(snapshotsQueryOptions(projectId));
}

export function useCreateSnapshot(projectId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (name: string) => gns3Api.createSnapshot(projectId, name),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: snapshotKeys.all(projectId),
			});
		},
	});
}

export function useRestoreSnapshot(projectId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (snapshotId: string) =>
			gns3Api.restoreSnapshot(projectId, snapshotId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: snapshotKeys.all(projectId),
			});
		},
	});
}

export function useDeleteSnapshot(projectId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (snapshotId: string) =>
			gns3Api.deleteSnapshot(projectId, snapshotId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: snapshotKeys.all(projectId),
			});
		},
	});
}
