import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { controllerKeys } from "@/features/query-keys";
import { gns3Api } from "@/lib/gns3-api";
import { type ControllerConnectionStatus, useUIStore } from "@/stores/ui-store";
import { WebSocketEventManager } from "./websocket-event-manager";

export { controllerKeys, WebSocketEventManager };

export function useControllerVersion() {
	return useQuery({
		queryKey: controllerKeys.version,
		queryFn: () => gns3Api.getVersion(),
		retry: 2,
		refetchInterval: 15000,
	});
}

export function useControllerMe() {
	return useQuery({
		queryKey: controllerKeys.me,
		queryFn: () => gns3Api.getMe(),
		retry: false,
		enabled: Boolean(gns3Api.getAuthToken()),
	});
}

export function useControllerLogin() {
	const queryClient = useQueryClient();
	const addEvent = useUIStore.getState().addEvent;

	return useMutation({
		mutationFn: ({
			username,
			password,
		}: {
			username: string;
			password: string;
		}) => gns3Api.login(username, password),
		onSuccess: () => {
			queryClient.invalidateQueries();
			addEvent({
				level: "success",
				message: "Connected and authenticated with GNS3 Controller",
				source: "Auth",
			});
		},
		onError: (err: Error) => {
			addEvent({
				level: "error",
				message: `Authentication failed: ${err.message}`,
				source: "Auth",
			});
		},
	});
}

export function useControllerNotifications(projectId: string | null) {
	const queryClient = useQueryClient();
	const [status, setStatus] =
		useState<ControllerConnectionStatus>("disconnected");

	useEffect(() => {
		if (typeof window === "undefined") return;

		const manager = new WebSocketEventManager({
			projectId,
			queryClient,
			onStatusChange: setStatus,
		});

		manager.connect();

		return () => {
			manager.disconnect();
		};
	}, [projectId, queryClient]);

	return {
		status,
		isConnected: status === "connected",
	};
}

