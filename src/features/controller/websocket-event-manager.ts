import type { QueryClient } from "@tanstack/react-query";
import {
	controllerKeys,
	drawingKeys,
	linkKeys,
	nodeKeys,
	projectKeys,
	templateKeys,
} from "@/features/query-keys";
import { gns3Api } from "@/lib/gns3-api";
import {
	type ControllerConnectionStatus,
	type ControllerEvent,
	useUIStore,
} from "@/stores/ui-store";
import type { GNS3Notification } from "@/types/gns3";

export interface WebSocketEventManagerOptions {
	projectId?: string | null;
	queryClient: QueryClient;
	onStatusChange?: (status: ControllerConnectionStatus) => void;
	onNotification?: (notification: GNS3Notification) => void;
	onEvent?: (event: Omit<ControllerEvent, "id" | "timestamp">) => void;
}

export class WebSocketEventManager {
	private projectId: string | null = null;
	private queryClient: QueryClient;
	private onStatusChange?: (status: ControllerConnectionStatus) => void;
	private onNotification?: (notification: GNS3Notification) => void;
	private onEvent?: (event: Omit<ControllerEvent, "id" | "timestamp">) => void;

	private socket: WebSocket | null = null;
	private status: ControllerConnectionStatus = "disconnected";
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private retryCount = 0;
	private isDisposed = false;

	private readonly initialDelayMs = 1000;
	private readonly maxDelayMs = 30000;
	private readonly backoffMultiplier = 1.5;

	constructor(options: WebSocketEventManagerOptions) {
		this.projectId = options.projectId ?? null;
		this.queryClient = options.queryClient;
		this.onStatusChange = options.onStatusChange;
		this.onNotification = options.onNotification;
		this.onEvent = options.onEvent;
	}

	public getStatus(): ControllerConnectionStatus {
		return this.status;
	}

	public isConnected(): boolean {
		return this.status === "connected";
	}

	private setStatus(newStatus: ControllerConnectionStatus): void {
		if (this.status !== newStatus) {
			this.status = newStatus;
			this.onStatusChange?.(newStatus);
			useUIStore.getState().setControllerConnectionStatus(newStatus);
		}
	}

	public connect(): void {
		if (this.isDisposed || typeof window === "undefined") return;
		if (
			this.socket &&
			(this.socket.readyState === WebSocket.CONNECTING ||
				this.socket.readyState === WebSocket.OPEN)
		) {
			return;
		}

		this.clearReconnectTimer();
		this.setStatus("connecting");

		try {
			const wsPath = this.projectId
				? `/v3/projects/${this.projectId}/notifications/ws`
				: "/v3/notifications/ws";

			const wsUrl = gns3Api.getWebSocketUrl(wsPath);
			const socket = new WebSocket(wsUrl);
			this.socket = socket;

			socket.onopen = () => {
				if (this.isDisposed || this.socket !== socket) return;
				this.retryCount = 0;
				this.setStatus("connected");

				this.logEvent({
					level: "info",
					message: this.projectId
						? "Connected to project notification stream"
						: "Connected to controller notification stream",
					source: "WebSocket",
				});
			};

			socket.onmessage = (event) => {
				if (this.isDisposed || this.socket !== socket) return;
				try {
					const data: GNS3Notification = JSON.parse(event.data);
					this.handleMessage(data);
				} catch {
					// Non-JSON or ping/pong frame
				}
			};

			socket.onerror = () => {
				// Socket error handled in onclose
			};

			socket.onclose = () => {
				if (this.isDisposed) return;
				this.setStatus("disconnected");
				this.scheduleReconnect();
			};
		} catch {
			this.setStatus("disconnected");
			this.scheduleReconnect();
		}
	}

	public disconnect(): void {
		this.isDisposed = true;
		this.clearReconnectTimer();

		if (this.socket) {
			try {
				this.socket.onopen = null;
				this.socket.onmessage = null;
				this.socket.onerror = null;
				this.socket.onclose = null;
				this.socket.close();
			} catch {
				// Ignore close error
			}
			this.socket = null;
		}

		this.setStatus("disconnected");
	}

	private handleMessage(data: GNS3Notification): void {
		this.onNotification?.(data);

		const action = data.action || "";
		const projectId = this.projectId;

		// Decoupled TanStack Query invalidation
		if (action.includes("node.")) {
			if (projectId) {
				this.queryClient.invalidateQueries({
					queryKey: nodeKeys.all(projectId),
				});
			}
		} else if (action.includes("link.")) {
			if (projectId) {
				this.queryClient.invalidateQueries({
					queryKey: linkKeys.all(projectId),
				});
			}
		} else if (action.includes("drawing.")) {
			if (projectId) {
				this.queryClient.invalidateQueries({
					queryKey: drawingKeys.all(projectId),
				});
			}
		} else if (action.includes("project.")) {
			this.queryClient.invalidateQueries({ queryKey: projectKeys.all });
			if (projectId) {
				this.queryClient.invalidateQueries({
					queryKey: projectKeys.detail(projectId),
				});
			}
		} else if (action.includes("template.")) {
			this.queryClient.invalidateQueries({ queryKey: templateKeys.all });
		} else if (action.includes("compute.") || action.includes("server.")) {
			this.queryClient.invalidateQueries({ queryKey: controllerKeys.all });
		}

		// Log UI event
		this.logEvent({
			level: action.includes("error")
				? "error"
				: action.includes("start")
					? "success"
					: "info",
			message: `Event: ${action}`,
			source: "Controller",
		});
	}

	private logEvent(event: Omit<ControllerEvent, "id" | "timestamp">): void {
		if (this.onEvent) {
			this.onEvent(event);
		} else {
			useUIStore.getState().addEvent(event);
		}
	}

	private scheduleReconnect(): void {
		if (this.isDisposed) return;
		this.clearReconnectTimer();

		// Calculate exponential backoff with jitter
		const jitter = Math.random() * 500;
		const delay = Math.min(
			this.initialDelayMs * Math.pow(this.backoffMultiplier, this.retryCount) +
				jitter,
			this.maxDelayMs,
		);

		this.retryCount += 1;

		this.reconnectTimer = setTimeout(() => {
			if (!this.isDisposed) {
				this.connect();
			}
		}, delay);
	}

	private clearReconnectTimer(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
	}
}
