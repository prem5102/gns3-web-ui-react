import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { computeKeys, computesQueryOptions } from "@/features/query-keys";
import { gns3Api } from "@/lib/gns3-api";
import type { ComputeCreate, ComputeUpdate } from "@/types/gns3";

export function useComputes() {
	return useQuery(computesQueryOptions());
}

export function useCreateCompute() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: ComputeCreate) => gns3Api.createCompute(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: computeKeys.all });
		},
	});
}

export function useUpdateCompute() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			computeId,
			data,
		}: {
			computeId: string;
			data: ComputeUpdate;
		}) => gns3Api.updateCompute(computeId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: computeKeys.all });
		},
	});
}

export function useDeleteCompute() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (computeId: string) => gns3Api.deleteCompute(computeId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: computeKeys.all });
		},
	});
}

export function useConnectCompute() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (computeId: string) => gns3Api.connectCompute(computeId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: computeKeys.all });
		},
	});
}
