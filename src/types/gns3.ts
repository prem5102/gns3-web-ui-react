import { z } from "zod";

// ==========================================
// Controller & Version
// ==========================================
export interface GNS3Version {
	version: string;
	controller_host?: string | null;
	local?: boolean | null;
}

export const GNS3VersionSchema = z.object({
	version: z.string(),
	controller_host: z.string().nullable().optional(),
	local: z.boolean().nullable().optional(),
});

// ==========================================
// Authentication
// ==========================================
export interface AuthTokenResponse {
	access_token: string;
	token_type: string;
	refresh_token?: string | null;
}

export const AuthTokenSchema = z.object({
	access_token: z.string(),
	token_type: z.string(),
	refresh_token: z.string().nullable().optional(),
});

export interface GNS3User {
	user_id: string;
	username: string | null;
	email?: string | null;
	full_name?: string | null;
	is_active: boolean;
	is_superadmin: boolean;
	created_at?: string | null;
	last_login?: string | null;
}

// ==========================================
// Projects
// ==========================================
export type ProjectStatus = "opened" | "closed";

export interface GNS3Project {
	project_id: string;
	name: string;
	status: ProjectStatus;
	path?: string;
	filename?: string;
	auto_close?: boolean;
	auto_open?: boolean;
	auto_start?: boolean;
	scene_height?: number;
	scene_width?: number;
	zoom?: number;
	show_layers?: boolean;
	snap_to_grid?: boolean;
	show_grid?: boolean;
	grid_size?: number;
	drawing_grid_size?: number;
	show_interface_labels?: boolean;
	created_by?: string | null;
	variables?: Array<{ name: string; value?: string | null }> | null;
}

export const GNS3ProjectSchema = z.object({
	project_id: z.string(),
	name: z.string(),
	status: z.enum(["opened", "closed"]),
	path: z.string().optional(),
	filename: z.string().optional(),
	scene_height: z.number().optional(),
	scene_width: z.number().optional(),
	zoom: z.number().optional(),
	snap_to_grid: z.boolean().optional(),
	show_grid: z.boolean().optional(),
	grid_size: z.number().optional(),
	show_interface_labels: z.boolean().optional(),
	created_by: z.string().nullable().optional(),
});

// ==========================================
// Nodes
// ==========================================
export type NodeStatus = "started" | "stopped" | "suspended";
export type NodeType =
	| "vpcs"
	| "dynamips"
	| "qemu"
	| "docker"
	| "iou"
	| "virtualbox"
	| "vmware"
	| "ethernet_switch"
	| "ethernet_hub"
	| "cloud"
	| "nat"
	| string;

export interface NodePort {
	name: string;
	short_name?: string;
	adapter_number: number;
	port_number: number;
	link_type?: "ethernet" | "serial" | string;
	data_link_types?: Record<string, string>;
}

export interface NodeLabel {
	text: string;
	style?: string;
	x?: number;
	y?: number;
	rotation?: number;
}

export interface GNS3Node {
	node_id: string;
	project_id: string;
	name: string;
	status: NodeStatus;
	node_type: NodeType;
	compute_id: string;
	console?: number | null;
	console_type?: "telnet" | "vnc" | "ssh" | "none" | string | null;
	console_host?: string | null;
	console_auto_start?: boolean;
	x: number;
	y: number;
	z?: number;
	width?: number;
	height?: number;
	label?: NodeLabel;
	symbol?: string;
	ports?: NodePort[];
	properties?: Record<string, unknown>;
	tags?: string[];
	template_id?: string | null;
	locked?: boolean;
	command_line?: string;
}

// ==========================================
// Links
// ==========================================
export interface LinkEndpoint {
	node_id: string;
	adapter_number: number;
	port_number: number;
	label?: {
		text: string;
		style?: string;
		x?: number;
		y?: number;
		rotation?: number;
	};
}

export interface GNS3Link {
	link_id: string;
	project_id: string;
	link_type: "ethernet" | "serial" | string;
	nodes: [LinkEndpoint, LinkEndpoint] | LinkEndpoint[];
	suspend?: boolean;
	capturing?: boolean;
	capture_file_name?: string | null;
	capture_file_path?: string | null;
	capture_compute_id?: string | null;
	filters?: Record<string, unknown>;
}

// ==========================================
// Templates
// ==========================================
export type TemplateCategory =
	| "router"
	| "switch"
	| "guest"
	| "firewall"
	| string;

export interface GNS3Template {
	template_id: string;
	name: string;
	category: TemplateCategory;
	default_name_format?: string;
	symbol?: string;
	builtin?: boolean;
	compute_id?: string;
	template_type?: string;
	usage?: string;
	properties?: Record<string, unknown>;
}

// ==========================================
// Notifications & WebSockets
// ==========================================
export interface GNS3Notification<T = unknown> {
	action: string;
	event:
		| {
				type?: string;
				action?: string;
				data?: T;
		  }
		| T;
}

// ==========================================
// Drawings
// ==========================================
export interface GNS3Drawing {
	drawing_id: string;
	project_id: string;
	x: number;
	y: number;
	z?: number;
	locked?: boolean;
	rotation?: number;
	svg: string;
}

export const GNS3DrawingSchema = z.object({
	drawing_id: z.string(),
	project_id: z.string(),
	x: z.number(),
	y: z.number(),
	z: z.number().optional(),
	locked: z.boolean().optional(),
	rotation: z.number().min(-359).max(360).optional(),
	svg: z.string(),
});

// ==========================================
// UI Connection & Configuration
// ==========================================
export interface ControllerConfig {
	baseUrl: string; // e.g. http://127.0.0.1:80 or /api/gns3
	username: string;
	password: string;
	authToken: string | null;
	refreshToken: string | null;
}

// ==========================================
// Computes
// ==========================================
export interface ComputeCapabilities {
	node_types: string[];
	platform: string;
	version: string;
	cpus?: number;
	memory?: number;
	disk_size?: number;
}

export interface Compute {
	capabilities?: ComputeCapabilities;
	compute_id: string;
	connected: boolean;
	cpu_usage_percent?: number;
	disk_usage_percent?: number;
	host: string;
	last_error?: string | null;
	memory_usage_percent?: number;
	name: string;
	port: number;
	protocol: string;
	user?: string;
}

export interface ComputeCreate {
	protocol: "http" | "https";
	host: string;
	port: number;
	user?: string;
	password?: string;
	name?: string;
}

export interface ComputeUpdate {
	protocol?: "http" | "https";
	host?: string;
	port?: number;
	user?: string;
	password?: string;
	name?: string;
}

// ==========================================
// Statistics & System Status
// ==========================================
export interface ResourceStatistics {
	cpu_count?: number;
	cpu_count_physical?: number;
	cpu_model?: string;
	cpu_usage_percent: number;
	disk_free?: number;
	disk_total?: number;
	disk_usage_percent: number;
	disk_used?: number;
	load_average?: number[];
	load_average_percent?: number[];
	memory_free: number;
	memory_total: number;
	memory_usage_percent: number;
	memory_used: number;
	swap_free?: number;
	swap_total?: number;
	swap_usage_percent?: number;
	swap_used?: number;
}

export interface ComputeStatistics {
	compute_id: string;
	compute_name: string;
	statistics: ResourceStatistics;
}

export interface ProjectStats {
	total: number;
	opened: number;
	closed: number;
}

export interface NodeStats {
	total: number;
	open_project_nodes?: number;
	closed_project_nodes?: number;
	by_type: Record<string, number>;
	by_status: Record<string, number>;
}

export interface LinkStats {
	total: number;
	capturing: number;
}

export interface ControllerStatistics {
	uptime_seconds?: number;
	computes: ComputeStatistics[];
	projects: ProjectStats;
	nodes: NodeStats;
	links: LinkStats;
}

// ==========================================
// Images
// ==========================================
export interface GNS3Image {
	filename: string;
	path: string;
	image_type: string;
	image_size: number;
	checksum?: string;
	checksum_algorithm?: string;
	created_at?: string;
	updated_at?: string;
	availability?: "unknown" | "available" | "missing" | "unavailable" | "invalid";
	last_seen_at?: string;
	last_verified_at?: string;
	last_error?: string;
}

export interface ImageSyncJob {
	job_id: string;
	status: "queued" | "running" | "completed" | "partial" | "failed" | "cancelled" | "interrupted";
	dry_run: boolean;
	force_checksum: boolean;
	counts?: Record<string, number>;
	errors?: Array<{ path: string; reason: string }>;
}

// ==========================================
// Access Management (RBAC)
// ==========================================
export interface GNS3Privilege {
	privilege_id: string;
	name: string;
	description?: string;
	created_at?: string;
	updated_at?: string;
}

export interface GNS3Role {
	role_id: string;
	name: string;
	description?: string;
	is_builtin?: boolean;
	privileges?: GNS3Privilege[];
	created_at?: string;
	updated_at?: string;
}

// ==========================================
// Snapshots
// ==========================================
export interface GNS3Snapshot {
	snapshot_id: string;
	name: string;
	created_at: number;
	project_id: string;
}

