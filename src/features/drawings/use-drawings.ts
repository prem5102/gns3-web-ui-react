import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gns3Api } from "@/lib/gns3-api";
import { useUIStore } from "@/stores/ui-store";
import type { GNS3Drawing } from "@/types/gns3";

export const drawingKeys = {
	all: (projectId: string | null) =>
		["projects", projectId, "drawings"] as const,
	detail: (projectId: string | null, drawingId: string) =>
		["projects", projectId, "drawings", drawingId] as const,
};

export function useProjectDrawings(projectId: string | null) {
	return useQuery({
		queryKey: drawingKeys.all(projectId),
		queryFn: () => (projectId ? gns3Api.getProjectDrawings(projectId) : []),
		enabled: Boolean(projectId),
		refetchInterval: 10000,
	});
}

export function useCreateDrawing(projectId: string | null) {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: async (
			drawing: Partial<GNS3Drawing> & { project_id?: string },
		) => {
			const targetProjectId = drawing.project_id || projectId;
			if (!targetProjectId) {
				throw new Error("No active project available to create drawing");
			}
			return gns3Api.createDrawing(targetProjectId, drawing);
		},
		onMutate: async (newDrawing) => {
			const targetProjectId = newDrawing.project_id || projectId;
			if (!targetProjectId) return;

			await queryClient.cancelQueries({
				queryKey: drawingKeys.all(targetProjectId),
			});

			const prevDrawings =
				queryClient.getQueryData<GNS3Drawing[]>(
					drawingKeys.all(targetProjectId),
				) || [];

			const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
			const optimisticDrawing: GNS3Drawing = {
				drawing_id: tempId,
				project_id: targetProjectId,
				x: newDrawing.x ?? 0,
				y: newDrawing.y ?? 0,
				z: newDrawing.z ?? 0,
				rotation: newDrawing.rotation ?? 0,
				locked: newDrawing.locked ?? false,
				svg: newDrawing.svg ?? "<svg></svg>",
			};

			queryClient.setQueryData<GNS3Drawing[]>(
				drawingKeys.all(targetProjectId),
				[...prevDrawings, optimisticDrawing],
			);

			return { prevDrawings, targetProjectId, tempId };
		},
		onSuccess: (savedDrawing, variables, context) => {
			const targetProjectId =
				variables.project_id || projectId || context?.targetProjectId;
			if (targetProjectId && savedDrawing) {
				queryClient.setQueryData<GNS3Drawing[]>(
					drawingKeys.all(targetProjectId),
					(old: GNS3Drawing[] = []) => [
						...old.filter((d) => d.drawing_id !== context?.tempId),
						savedDrawing,
					],
				);
			}
			addEvent({
				level: "info",
				message: `Created drawing annotation`,
				source: "Topology",
			});
			return savedDrawing;
		},
		onError: (err: Error, _variables, context) => {
			if (context?.prevDrawings && context.targetProjectId) {
				queryClient.setQueryData(
					drawingKeys.all(context.targetProjectId),
					context.prevDrawings,
				);
			}
			addEvent({
				level: "error",
				message: `Failed to create drawing: ${err.message}`,
				source: "Topology",
			});
		},
		onSettled: (_data, _error, variables, context) => {
			const targetProjectId =
				variables.project_id || projectId || context?.targetProjectId;
			if (targetProjectId) {
				queryClient.invalidateQueries({
					queryKey: drawingKeys.all(targetProjectId),
				});
			}
		},
	});
}

export function useUpdateDrawing(projectId: string) {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: ({
			drawingId,
			data,
		}: {
			drawingId: string;
			data: Partial<GNS3Drawing>;
		}) => gns3Api.updateDrawing(projectId, drawingId, data),
		onMutate: async ({ drawingId, data }) => {
			// Optimistically update drawing in cache for instant 60fps drag/resize responsiveness
			await queryClient.cancelQueries({
				queryKey: drawingKeys.all(projectId),
			});
			const prevDrawings = queryClient.getQueryData<GNS3Drawing[]>(
				drawingKeys.all(projectId),
			);

			if (prevDrawings) {
				queryClient.setQueryData<GNS3Drawing[]>(
					drawingKeys.all(projectId),
					prevDrawings.map((d) =>
						d.drawing_id === drawingId ? { ...d, ...data } : d,
					),
				);
			}

			return { prevDrawings };
		},
		onError: (err: Error, _vars, context) => {
			if (context?.prevDrawings) {
				queryClient.setQueryData(
					drawingKeys.all(projectId),
					context.prevDrawings,
				);
			}
			addEvent({
				level: "error",
				message: `Failed to update drawing: ${err.message}`,
				source: "Topology",
			});
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: drawingKeys.all(projectId),
			});
		},
	});
}

export function useDeleteDrawing(projectId: string) {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: (drawingId: string) =>
			gns3Api.deleteDrawing(projectId, drawingId),
		onMutate: async (drawingId) => {
			await queryClient.cancelQueries({
				queryKey: drawingKeys.all(projectId),
			});
			const prevDrawings = queryClient.getQueryData<GNS3Drawing[]>(
				drawingKeys.all(projectId),
			);

			if (prevDrawings) {
				queryClient.setQueryData<GNS3Drawing[]>(
					drawingKeys.all(projectId),
					prevDrawings.filter((d) => d.drawing_id !== drawingId),
				);
			}

			return { prevDrawings };
		},
		onError: (err: Error, _vars, context) => {
			if (context?.prevDrawings) {
				queryClient.setQueryData(
					drawingKeys.all(projectId),
					context.prevDrawings,
				);
			}
			addEvent({
				level: "error",
				message: `Failed to delete drawing: ${err.message}`,
				source: "Topology",
			});
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: drawingKeys.all(projectId),
			});
		},
	});
}
