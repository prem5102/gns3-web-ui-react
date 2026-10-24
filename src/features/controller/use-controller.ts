import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { drawingKeys } from "@/features/drawings/use-drawings";
import { linkKeys } from "@/features/links/use-links";
import { nodeKeys } from "@/features/nodes/use-nodes";
import { projectKeys } from "@/features/projects/use-projects";
import { gns3Api } from "@/lib/gns3-api";
import { useUIStore } from "@/stores/ui-store";
import type { GNS3Notification } from "@/types/gns3";

export const controllerKeys = {
	version: ["controller", "version"] as const,
	me: ["controller", "me"] as const,
};

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
	const addEvent = useUIStore.getState().addEvent;
	const socketRef = useRef<WebSocket | null>(null);

	useEffect(() => {
		if (!projectId || typeof window === "undefined") return;

		const currentProjectId = projectId;
		let socket: WebSocket | null = null;
		let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
		let isSubscribed = true;

		function connect() {
			if (!isSubscribed) return;

			try {
				const wsUrl = gns3Api.getWebSocketUrl(
					`/v3/projects/${currentProjectId}/notifications/ws`,
				);
				socket = new WebSocket(wsUrl);
				socketRef.current = socket;

				socket.onopen = () => {
					addEvent({
						level: "info",
						message: "Subscribed to project notification feed",
						source: "WebSocket",
					});
				};

				socket.onmessage = (event) => {
					try {
						const data: GNS3Notification = JSON.parse(event.data);
						const action = data.action || "";

						if (action.includes("node.")) {
							queryClient.invalidateQueries({
								queryKey: nodeKeys.all(currentProjectId),
							});
						} else if (action.includes("link.")) {
							queryClient.invalidateQueries({
								queryKey: linkKeys.all(currentProjectId),
							});
						} else if (action.includes("drawing.")) {
							queryClient.invalidateQueries({
								queryKey: drawingKeys.all(currentProjectId),
							});
						} else if (action.includes("project.")) {
							queryClient.invalidateQueries({ queryKey: projectKeys.all });
							queryClient.invalidateQueries({
								queryKey: projectKeys.detail(currentProjectId),
							});
						}

						addEvent({
							level: action.includes("error")
								? "error"
								: action.includes("start")
									? "success"
									: "info",
							message: `Event: ${action}`,
							source: "Controller",
						});
					} catch {
						// non-json or ping frame
					}
				};

				socket.onerror = () => {
					// Socket error
				};

				socket.onclose = () => {
					if (isSubscribed) {
						reconnectTimer = setTimeout(connect, 5000);
					}
				};
			} catch {
				if (isSubscribed) {
					reconnectTimer = setTimeout(connect, 5000);
				}
			}
		}

		connect();

		return () => {
			isSubscribed = false;
			if (reconnectTimer) clearTimeout(reconnectTimer);
			if (socketRef.current) {
				socketRef.current.close();
				socketRef.current = null;
			}
		};
	}, [projectId, queryClient, addEvent]);
}
