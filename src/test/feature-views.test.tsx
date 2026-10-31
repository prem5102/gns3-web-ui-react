import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessManagementView } from "@/components/access-management/access-management-view";
import { ComputesView } from "@/components/computes/computes-view";
import { NodeFileManagerDialog } from "@/components/files/node-file-manager-dialog";
import { ImageManagerView } from "@/components/image-manager/image-manager-view";
import { SnapshotsDialog } from "@/components/snapshots/snapshots-dialog";
import { SystemStatusView } from "@/components/system-status/system-status-view";
import { TemplatesView } from "@/components/templates/templates-view";
import { formatBytes } from "@/lib/utils";

// Mock gns3Api methods
vi.mock("@/lib/gns3-api", () => ({
	gns3Api: {
		getBaseUrl: () => "/api/gns3",
		getAuthToken: () => "mock-token",
		getComputes: vi.fn().mockResolvedValue([
			{
				compute_id: "local",
				name: "Controller Local",
				connected: true,
				protocol: "http",
				host: "127.0.0.1",
				port: 3080,
				cpu_usage_percent: 15,
				memory_usage_percent: 45,
				disk_usage_percent: 30,
				capabilities: {
					platform: "Linux",
					version: "3.1.0",
					node_types: ["qemu", "docker"],
				},
			},
			{
				compute_id: "remote-worker-1",
				name: "Remote Worker 1",
				connected: false,
				protocol: "https",
				host: "192.168.1.50",
				port: 3080,
				capabilities: {
					platform: "Linux",
					version: "3.1.0",
					node_types: ["qemu"],
				},
			},
		]),
		getStatistics: vi.fn().mockResolvedValue({
			uptime_seconds: 7200,
			computes: [
				{
					compute_id: "local",
					compute_name: "gns3vm (controller)",
					statistics: {
						cpu_usage_percent: 12,
						cpu_count: 8,
						cpu_count_physical: 4,
						cpu_model: "AMD Ryzen 7",
						memory_total: 16000000000,
						memory_free: 8000000000,
						memory_used: 8000000000,
						memory_usage_percent: 50,
						disk_total: 500000000000,
						disk_used: 100000000000,
						disk_usage_percent: 20,
						load_average: [0.5, 0.4, 0.3],
					},
				},
			],
			projects: { total: 3, opened: 1, closed: 2 },
			nodes: {
				total: 5,
				open_project_nodes: 2,
				closed_project_nodes: 3,
				by_type: { qemu: 3, docker: 2 },
				by_status: { started: 2, stopped: 3 },
			},
			links: { total: 4, capturing: 1 },
		}),
		getTemplates: vi.fn().mockResolvedValue([
			{
				template_id: "tmpl-1",
				name: "Cisco IOSv Router",
				category: "router",
				template_type: "qemu",
				builtin: false,
				compute_id: "local",
				usage: "Default credentials: admin / cisco",
			},
			{
				template_id: "tmpl-2",
				name: "Ethernet Switch",
				category: "switch",
				template_type: "ethernet_switch",
				builtin: true,
				compute_id: "local",
			},
		]),
		getImages: vi.fn().mockResolvedValue([
			{
				filename: "iosv-15.6.qcow2",
				path: "qemu/iosv-15.6.qcow2",
				image_type: "qemu",
				image_size: 536870912,
				checksum: "d41d8cd98f00b204e9800998ecf8427e",
			},
		]),
		getUsers: vi.fn().mockResolvedValue([
			{
				user_id: "user-1",
				username: "admin",
				full_name: "Super Administrator",
				is_superadmin: true,
				is_active: true,
				email: "admin@gns3.net",
				created_at: "2026-01-01T00:00:00",
			},
			{
				user_id: "user-2",
				username: "labuser",
				full_name: "Lab Student",
				is_superadmin: false,
				is_active: true,
				email: "student@gns3.net",
				created_at: "2026-02-01T00:00:00",
			},
		]),
		getRoles: vi.fn().mockResolvedValue([
			{
				role_id: "role-1",
				name: "Administrator",
				description: "Full access to all resources",
				is_builtin: true,
				privileges: [
					{ privilege_id: "p1", name: "Project.Allocate" },
					{ privilege_id: "p2", name: "Node.Audit" },
				],
			},
		]),
		getSnapshots: vi.fn().mockResolvedValue([
			{
				snapshot_id: "snap-1",
				name: "Initial OSPF Setup",
				created_at: 1700000000,
				project_id: "proj-1",
			},
		]),
		getNodeFiles: vi
			.fn()
			.mockResolvedValue([
				{ name: "startup-config.cfg" },
				{ name: "interfaces" },
			]),
		getNodeFileContent: vi.fn().mockResolvedValue("hostname Router1\n!"),
		saveNodeFileContent: vi.fn().mockResolvedValue(undefined),
		getVersion: vi
			.fn()
			.mockResolvedValue({ version: "3.1.0", controller_host: "127.0.0.1" }),
		getMe: vi
			.fn()
			.mockResolvedValue({
				user_id: "user-1",
				username: "admin",
				is_superadmin: true,
			}),
		getProjects: vi.fn().mockResolvedValue([]),
	},
}));

describe("GNS3 Web UI Feature Views", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
					gcTime: 0,
				},
			},
		});
		vi.clearAllMocks();
	});

	function renderWithQuery(ui: React.ReactElement) {
		return render(
			<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
		);
	}

	it("renders ComputesView with table entries and status badges", async () => {
		renderWithQuery(<ComputesView />);

		expect(await screen.findByText("Compute Nodes")).toBeInTheDocument();
		expect(screen.getByText("Add Compute")).toBeInTheDocument();

		// Check rows
		const localNodes = await screen.findAllByText("Controller Local");
		expect(localNodes.length).toBeGreaterThan(0);
		expect(await screen.findByText("Remote Worker 1")).toBeInTheDocument();
	});

	it("renders SystemStatusView with hardware telemetry, server info, and node statistics", async () => {
		renderWithQuery(<SystemStatusView />);

		expect(await screen.findByText("System Status")).toBeInTheDocument();
		expect(await screen.findByText("Server Information")).toBeInTheDocument();
		expect(
			await screen.findByText("Compute Resources Telemetry"),
		).toBeInTheDocument();
		expect(
			await screen.findByText("Emulators & Node Types"),
		).toBeInTheDocument();
		expect(await screen.findByText("Node Runtime Status")).toBeInTheDocument();

		// Check values
		expect(screen.getByText("Controller Endpoint")).toBeInTheDocument();
		expect(screen.getByText(/AMD Ryzen 7/)).toBeInTheDocument();
	});

	it("renders TemplatesView with scope tabs, filters, and appliance cards", async () => {
		renderWithQuery(<TemplatesView />);

		expect(await screen.findByText("Appliance Templates")).toBeInTheDocument();
		expect(screen.getByText("All Templates")).toBeInTheDocument();
		expect(screen.getByText("Custom")).toBeInTheDocument();
		expect(screen.getByText("Built-in")).toBeInTheDocument();

		// Check appliances
		expect(await screen.findByText("Cisco IOSv Router")).toBeInTheDocument();
		expect(await screen.findByText("Ethernet Switch")).toBeInTheDocument();
	});

	it("renders ImageManagerView with image table and formatted byte sizes", async () => {
		renderWithQuery(<ImageManagerView />);

		expect(await screen.findByText("Image Manager")).toBeInTheDocument();
		expect(screen.getByText("Add Image")).toBeInTheDocument();

		// Check image row
		expect(await screen.findByText("iosv-15.6.qcow2")).toBeInTheDocument();
		expect(screen.getAllByText("512 MB").length).toBeGreaterThan(0);
	});

	it("renders AccessManagementView with Users and Roles tabs", async () => {
		renderWithQuery(<AccessManagementView />);

		expect(await screen.findByText("Access Management")).toBeInTheDocument();
		expect(await screen.findByText("admin")).toBeInTheDocument();
		expect(await screen.findByText("labuser")).toBeInTheDocument();
		expect(screen.getByText("Super Administrator")).toBeInTheDocument();
	});

	it("renders SnapshotsDialog with snapshot records", async () => {
		renderWithQuery(
			<SnapshotsDialog
				projectId="proj-1"
				projectName="Test Lab"
				open={true}
				onOpenChange={vi.fn()}
			/>,
		);

		expect(await screen.findByText("Project Snapshots")).toBeInTheDocument();
		expect(await screen.findByText("Initial OSPF Setup")).toBeInTheDocument();
	});

	it("renders NodeFileManagerDialog and file listings", async () => {
		renderWithQuery(
			<NodeFileManagerDialog
				projectId="proj-1"
				nodeId="node-1"
				nodeName="Router 1"
				open={true}
				onOpenChange={vi.fn()}
			/>,
		);

		expect(await screen.findByText("Node File Manager")).toBeInTheDocument();
		expect(await screen.findByText("startup-config.cfg")).toBeInTheDocument();
		expect(await screen.findByText("interfaces")).toBeInTheDocument();
	});

	it("formats byte values accurately using formatBytes utility", () => {
		expect(formatBytes(0)).toBe("0 B");
		expect(formatBytes(1024)).toBe("1 KB");
		expect(formatBytes(1048576)).toBe("1 MB");
		expect(formatBytes(1073741824)).toBe("1 GB");
	});
});
