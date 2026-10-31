import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { imageKeys, imagesQueryOptions } from "@/features/query-keys";
import { gns3Api } from "@/lib/gns3-api";

export function useImages() {
	return useQuery(imagesQueryOptions());
}

export function useSyncImages() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			forceChecksum = false,
			dryRun = false,
		}: {
			forceChecksum?: boolean;
			dryRun?: boolean;
		} = {}) => gns3Api.syncImages(forceChecksum, dryRun),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: imageKeys.all });
		},
	});
}

export function usePruneImages() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => gns3Api.pruneImages(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: imageKeys.all });
		},
	});
}

export function useDeleteImage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (imagePath: string) => gns3Api.deleteImage(imagePath),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: imageKeys.all });
		},
	});
}
