import type {
	AuthTokenResponse,
	GNS3Drawing,
	GNS3Link,
	GNS3Node,
	GNS3Project,
	GNS3Template,
	GNS3User,
	GNS3Version,
} from "@/types/gns3";

export class GNS3ApiError extends Error {
	status: number;
	data?: unknown;

	constructor(message: string, status: number, data?: unknown) {
		super(message);
		this.name = "GNS3ApiError";
		this.status = status;
		this.data = data;
	}
}

export interface GNS3ClientConfig {
	baseUrl: string;
	authToken?: string | null;
	refreshToken?: string | null;
	onAuthChange?: (token: string | null, refreshToken?: string | null) => void;
}

class GNS3ApiClient {
	private baseUrl: string = "/api/gns3";
	private authToken: string | null = null;
	private refreshToken: string | null = null;
	private onAuthChange?: (
		token: string | null,
		refreshToken?: string | null,
	) => void;

	constructor() {
		if (typeof window !== "undefined") {
			const savedUrl = localStorage.getItem("gns3_base_url");
			const savedToken = localStorage.getItem("gns3_auth_token");
			const savedRefreshToken = localStorage.getItem("gns3_refresh_token");

			if (savedUrl) this.baseUrl = savedUrl;
			if (savedToken) this.authToken = savedToken;
			if (savedRefreshToken) this.refreshToken = savedRefreshToken;
		}
	}

	public setConfig(config: Partial<GNS3ClientConfig>) {
		if (config.baseUrl !== undefined) {
			this.baseUrl = config.baseUrl;
			if (typeof window !== "undefined") {
				localStorage.setItem("gns3_base_url", this.baseUrl);
			}
		}
		if (config.authToken !== undefined) {
			this.authToken = config.authToken;
			if (typeof window !== "undefined") {
				if (this.authToken) {
					localStorage.setItem("gns3_auth_token", this.authToken);
				} else {
					localStorage.removeItem("gns3_auth_token");
				}
			}
		}
		if (config.refreshToken !== undefined) {
			this.refreshToken = config.refreshToken;
			if (typeof window !== "undefined") {
				if (this.refreshToken) {
					localStorage.setItem("gns3_refresh_token", this.refreshToken);
				} else {
					localStorage.removeItem("gns3_refresh_token");
				}
			}
		}
		if (config.onAuthChange) {
			this.onAuthChange = config.onAuthChange;
		}
	}

	public getBaseUrl(): string {
		return this.baseUrl;
	}

	public getAuthToken(): string | null {
		return this.authToken;
	}

	public getWebSocketUrl(path: string): string {
		let base = this.baseUrl;
		if (base.startsWith("/")) {
			// Relative URL, use window.location
			const loc =
				typeof window !== "undefined"
					? window.location
					: { protocol: "http:", host: "localhost:3000" };
			const protocol = loc.protocol === "https:" ? "wss:" : "ws:";
			base = `${protocol}//${loc.host}${base}`;
		} else {
			base = base.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
		}

		const cleanPath = path.startsWith("/") ? path : `/${path}`;
		const tokenParam = this.authToken
			? `?token=${encodeURIComponent(this.authToken)}`
			: "";
		return `${base}${cleanPath}${tokenParam}`;
	}

	private async request<T>(
		endpoint: string,
		options: RequestInit = {},
		retryOnAuth = true,
	): Promise<T> {
		const url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
		const headers = new Headers(options.headers || {});

		if (this.authToken && !headers.has("Authorization")) {
			headers.set("Authorization", `Bearer ${this.authToken}`);
		}

		if (!headers.has("Accept")) {
			headers.set("Accept", "application/json, text/html;q=0.9, */*;q=0.8");
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 15000);

		try {
			const response = await fetch(url, {
				...options,
				headers,
				signal: options.signal || controller.signal,
			});

			clearTimeout(timeoutId);

			if (response.status === 401 && retryOnAuth && this.refreshToken) {
				// Try to refresh token
				const refreshed = await this.tryRefreshToken();
				if (refreshed) {
					return this.request<T>(endpoint, options, false);
				}
			}

			if (!response.ok) {
				let errorData: unknown;
				let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;

				try {
					errorData = await response.json();
					if (typeof errorData === "object" && errorData !== null) {
						const dataObj = errorData as Record<string, unknown>;
						if (typeof dataObj.message === "string")
							errorMessage = dataObj.message;
						else if (typeof dataObj.detail === "string")
							errorMessage = dataObj.detail;
						else if (typeof dataObj.error === "string")
							errorMessage = dataObj.error;
					}
				} catch {
					// Response body was not JSON
				}

				throw new GNS3ApiError(errorMessage, response.status, errorData);
			}

			// Handle 204 No Content
			if (response.status === 204) {
				return undefined as T;
			}

			return (await response.json()) as T;
		} catch (err: unknown) {
			clearTimeout(timeoutId);
			if (err instanceof GNS3ApiError) throw err;
			if (err instanceof DOMException && err.name === "AbortError") {
				throw new GNS3ApiError("Request timed out after 15 seconds", 408);
			}
			throw new GNS3ApiError(
				(err as Error).message || "Network request failed",
				0,
				err,
			);
		}
	}

	private async tryRefreshToken(): Promise<boolean> {
		if (!this.refreshToken) return false;
		try {
			const res = await fetch(`${this.baseUrl}/v3/access/users/refresh`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.refreshToken}`,
				},
			});

			if (res.ok) {
				const data = (await res.json()) as AuthTokenResponse;
				this.setConfig({
					authToken: data.access_token,
					refreshToken: data.refresh_token || this.refreshToken,
				});
				if (this.onAuthChange) {
					this.onAuthChange(
						data.access_token,
						data.refresh_token || this.refreshToken,
					);
				}
				return true;
			}
		} catch {
			// Refresh failed
		}

		this.setConfig({ authToken: null, refreshToken: null });
		if (this.onAuthChange) this.onAuthChange(null, null);
		return false;
	}

	// ==========================================
	// Public API Methods
	// ==========================================

	public async getVersion(): Promise<GNS3Version> {
		return this.request<GNS3Version>("/v3/version");
	}

	public async login(
		username: string,
		password: string,
	): Promise<AuthTokenResponse> {
		const params = new URLSearchParams();
		params.append("username", username);
		params.append("password", password);

		const res = await this.request<AuthTokenResponse>(
			"/v3/access/users/login",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: params.toString(),
			},
			false,
		);

		this.setConfig({
			authToken: res.access_token,
			refreshToken: res.refresh_token || null,
		});

		if (this.onAuthChange) {
			this.onAuthChange(res.access_token, res.refresh_token);
		}

		return res;
	}

	public logout(): void {
		this.setConfig({ authToken: null, refreshToken: null });
		if (this.onAuthChange) this.onAuthChange(null, null);
	}

	public async getMe(): Promise<GNS3User> {
		return this.request<GNS3User>("/v3/access/users/me");
	}

	// Projects
	public async getProjects(): Promise<GNS3Project[]> {
		return this.request<GNS3Project[]>("/v3/projects");
	}

	public async getProject(projectId: string): Promise<GNS3Project> {
		return this.request<GNS3Project>(`/v3/projects/${projectId}`);
	}

	public async createProject(data: { name: string }): Promise<GNS3Project> {
		return this.request<GNS3Project>("/v3/projects", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
	}

	public async openProject(projectId: string): Promise<GNS3Project> {
		return this.request<GNS3Project>(`/v3/projects/${projectId}/open`, {
			method: "POST",
		});
	}

	public async closeProject(projectId: string): Promise<GNS3Project> {
		return this.request<GNS3Project>(`/v3/projects/${projectId}/close`, {
			method: "POST",
		});
	}

	public async deleteProject(projectId: string): Promise<void> {
		return this.request<void>(`/v3/projects/${projectId}`, {
			method: "DELETE",
		});
	}

	// Nodes
	public async getProjectNodes(projectId: string): Promise<GNS3Node[]> {
		return this.request<GNS3Node[]>(`/v3/projects/${projectId}/nodes`);
	}

	public async getNode(projectId: string, nodeId: string): Promise<GNS3Node> {
		return this.request<GNS3Node>(`/v3/projects/${projectId}/nodes/${nodeId}`);
	}

	public async createNode(
		projectId: string,
		data: {
			name?: string;
			node_type?: string;
			compute_id?: string;
			x?: number;
			y?: number;
		},
	): Promise<GNS3Node> {
		return this.request<GNS3Node>(`/v3/projects/${projectId}/nodes`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
	}

	public async createNodeFromTemplate(
		projectId: string,
		templateId: string,
		data: { x: number; y: number; name?: string; compute_id?: string },
	): Promise<GNS3Node> {
		return this.request<GNS3Node>(
			`/v3/projects/${projectId}/templates/${templateId}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			},
		);
	}

	public async updateNode(
		projectId: string,
		nodeId: string,
		data: Partial<GNS3Node>,
	): Promise<GNS3Node> {
		return this.request<GNS3Node>(`/v3/projects/${projectId}/nodes/${nodeId}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
	}

	public async deleteNode(projectId: string, nodeId: string): Promise<void> {
		return this.request<void>(`/v3/projects/${projectId}/nodes/${nodeId}`, {
			method: "DELETE",
		});
	}

	public async startNode(projectId: string, nodeId: string): Promise<GNS3Node> {
		return this.request<GNS3Node>(
			`/v3/projects/${projectId}/nodes/${nodeId}/start`,
			{
				method: "POST",
			},
		);
	}

	public async stopNode(projectId: string, nodeId: string): Promise<GNS3Node> {
		return this.request<GNS3Node>(
			`/v3/projects/${projectId}/nodes/${nodeId}/stop`,
			{
				method: "POST",
			},
		);
	}

	public async suspendNode(
		projectId: string,
		nodeId: string,
	): Promise<GNS3Node> {
		return this.request<GNS3Node>(
			`/v3/projects/${projectId}/nodes/${nodeId}/suspend`,
			{
				method: "POST",
			},
		);
	}

	public async reloadNode(
		projectId: string,
		nodeId: string,
	): Promise<GNS3Node> {
		return this.request<GNS3Node>(
			`/v3/projects/${projectId}/nodes/${nodeId}/reload`,
			{
				method: "POST",
			},
		);
	}

	public async startAllNodes(projectId: string): Promise<void> {
		return this.request<void>(`/v3/projects/${projectId}/nodes/start`, {
			method: "POST",
		});
	}

	public async stopAllNodes(projectId: string): Promise<void> {
		return this.request<void>(`/v3/projects/${projectId}/nodes/stop`, {
			method: "POST",
		});
	}

	// Links
	public async getProjectLinks(projectId: string): Promise<GNS3Link[]> {
		return this.request<GNS3Link[]>(`/v3/projects/${projectId}/links`);
	}

	public async createLink(
		projectId: string,
		nodes: Array<{
			node_id: string;
			adapter_number: number;
			port_number: number;
		}>,
	): Promise<GNS3Link> {
		return this.request<GNS3Link>(`/v3/projects/${projectId}/links`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ nodes }),
		});
	}

	public async deleteLink(projectId: string, linkId: string): Promise<void> {
		return this.request<void>(`/v3/projects/${projectId}/links/${linkId}`, {
			method: "DELETE",
		});
	}

	public async startLinkCapture(
		projectId: string,
		linkId: string,
	): Promise<void> {
		return this.request<void>(
			`/v3/projects/${projectId}/links/${linkId}/capture/start`,
			{
				method: "POST",
			},
		);
	}

	public async stopLinkCapture(
		projectId: string,
		linkId: string,
	): Promise<void> {
		return this.request<void>(
			`/v3/projects/${projectId}/links/${linkId}/capture/stop`,
			{
				method: "POST",
			},
		);
	}

	// Templates
	public async getTemplates(): Promise<GNS3Template[]> {
		return this.request<GNS3Template[]>("/v3/templates");
	}

	// Node Files / Configs
	public async getNodeFiles(
		projectId: string,
		nodeId: string,
	): Promise<Array<{ name: string }>> {
		return this.request<Array<{ name: string }>>(
			`/v3/projects/${projectId}/nodes/${nodeId}/files`,
		);
	}

	public async getNodeFileContent(
		projectId: string,
		nodeId: string,
		filePath: string,
	): Promise<string> {
		const url = `${this.baseUrl}/v3/projects/${projectId}/nodes/${nodeId}/files/${filePath}`;
		const headers = new Headers();
		if (this.authToken)
			headers.set("Authorization", `Bearer ${this.authToken}`);

		const res = await fetch(url, { headers });
		if (!res.ok) {
			throw new GNS3ApiError(
				`Failed to fetch file: ${res.statusText}`,
				res.status,
			);
		}
		return res.text();
	}

	public async saveNodeFileContent(
		projectId: string,
		nodeId: string,
		filePath: string,
		content: string,
	): Promise<void> {
		const url = `${this.baseUrl}/v3/projects/${projectId}/nodes/${nodeId}/files/${filePath}`;
		const headers = new Headers({ "Content-Type": "text/plain" });
		if (this.authToken)
			headers.set("Authorization", `Bearer ${this.authToken}`);

		const res = await fetch(url, {
			method: "POST",
			headers,
			body: content,
		});
		if (!res.ok) {
			throw new GNS3ApiError(
				`Failed to save file: ${res.statusText}`,
				res.status,
			);
		}
	}

	// Drawings
	public async getProjectDrawings(projectId: string): Promise<GNS3Drawing[]> {
		return this.request<GNS3Drawing[]>(`/v3/projects/${projectId}/drawings`);
	}

	public async createDrawing(
		projectId: string,
		drawing: Partial<GNS3Drawing>,
	): Promise<GNS3Drawing> {
		const { project_id: _p, drawing_id: _d, ...payload } = drawing;
		return this.request<GNS3Drawing>(`/v3/projects/${projectId}/drawings`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
	}

	public async updateDrawing(
		projectId: string,
		drawingId: string,
		drawing: Partial<GNS3Drawing>,
	): Promise<GNS3Drawing> {
		const { project_id: _p, drawing_id: _d, ...payload } = drawing;
		return this.request<GNS3Drawing>(
			`/v3/projects/${projectId}/drawings/${drawingId}`,
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			},
		);
	}

	public async deleteDrawing(
		projectId: string,
		drawingId: string,
	): Promise<void> {
		return this.request<void>(
			`/v3/projects/${projectId}/drawings/${drawingId}`,
			{
				method: "DELETE",
			},
		);
	}
}

export const gns3Api = new GNS3ApiClient();
