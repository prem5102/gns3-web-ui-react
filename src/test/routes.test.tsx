import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Route as IndexRoute } from "@/routes/index";
import { Route as ProjectRoute } from "@/routes/projects/$projectId";
import { useTopologyStore } from "@/stores/topology-store";

// Mock gns3-api
vi.mock("@/lib/gns3-api", () => ({
	gns3Api: {
		getAuthToken: () => "mock-token",
		login: vi.fn().mockResolvedValue(true),
		getProjects: vi.fn().mockResolvedValue([
			{
				project_id: "proj-1",
				name: "BGP Lab",
				status: "opened",
				filename: "bgp.gns3",
			},
			{
				project_id: "proj-2",
				name: "OSPF Core",
				status: "closed",
				filename: "ospf.gns3",
			},
		]),
		getProject: vi.fn().mockImplementation((id: string) =>
			Promise.resolve({
				project_id: id,
				name: id === "proj-1" ? "BGP Lab" : "OSPF Core",
				status: "opened",
			}),
		),
		openProject: vi
			.fn()
			.mockResolvedValue({ project_id: "proj-2", status: "opened" }),
	},
}));

// Mock controller hooks
vi.mock("@/features/controller/use-controller", () => ({
	useControllerNotifications: vi.fn(),
	useControllerVersion: () => ({
		data: { version: "3.0.0" },
		refetch: vi.fn(),
	}),
	useControllerMe: () => ({
		data: { username: "admin" },
		refetch: vi.fn(),
	}),
}));

// Mock projects hook
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("@tanstack/react-router")>();
	return {
		...actual,
		useNavigate: () => mockNavigate,
		useRouter: () => ({ navigate: mockNavigate }),
	};
});

describe("Route Migration: Projects & Lab Routes", () => {
	it("renders ProjectsDashboard on / with projects and search capabilities", async () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});

		// Pre-populate query cache
		queryClient.setQueryData(
			["projects"],
			[
				{
					project_id: "proj-1",
					name: "BGP Lab",
					status: "opened",
					filename: "bgp.gns3",
				},
				{
					project_id: "proj-2",
					name: "OSPF Core",
					status: "closed",
					filename: "ospf.gns3",
				},
			],
		);

		const DashboardComponent = IndexRoute.options.component!;
		render(
			<QueryClientProvider client={queryClient}>
				<DashboardComponent />
			</QueryClientProvider>,
		);

		// Verify project cards are rendered
		expect(screen.getByText("BGP Lab")).toBeDefined();
		expect(screen.getByText("OSPF Core")).toBeDefined();
		expect(screen.getByText("Total Projects")).toBeDefined();

		// Clicking "Open Lab" triggers navigation to /projects/$projectId
		const openLabButtons = screen.getAllByRole("button", { name: /Open Lab/i });
		expect(openLabButtons.length).toBeGreaterThan(0);

		act(() => {
			openLabButtons[0].click();
		});

		expect(mockNavigate).toHaveBeenCalledWith({
			to: "/projects/$projectId",
			params: { projectId: "proj-1" },
		});
	});

	it("synchronizes activeProjectId on /projects/$projectId", async () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});

		queryClient.setQueryData(
			["projects"],
			[
				{
					project_id: "proj-1",
					name: "BGP Lab",
					status: "opened",
					filename: "bgp.gns3",
				},
			],
		);

		queryClient.setQueryData(["projects", "proj-1"], {
			project_id: "proj-1",
			name: "BGP Lab",
			status: "opened",
		});

		// Mock Route.useParams for /projects/$projectId
		vi.spyOn(ProjectRoute, "useParams").mockReturnValue({
			projectId: "proj-1",
		});

		useTopologyStore.setState({ activeProjectId: null });

		const LabComponent = ProjectRoute.options.component!;
		render(
			<QueryClientProvider client={queryClient}>
				<LabComponent />
			</QueryClientProvider>,
		);

		// Store is synchronized with route param
		expect(useTopologyStore.getState().activeProjectId).toBe("proj-1");
	});

	it("displays Not Found view when project ID does not exist on /projects/$projectId", async () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});

		queryClient.setQueryData(
			["projects"],
			[
				{
					project_id: "proj-1",
					name: "BGP Lab",
					status: "opened",
					filename: "bgp.gns3",
				},
			],
		);

		queryClient.setQueryData(["projects", "non-existent-id"], null);

		vi.spyOn(ProjectRoute, "useParams").mockReturnValue({
			projectId: "non-existent-id",
		});

		const LabComponent = ProjectRoute.options.component!;
		render(
			<QueryClientProvider client={queryClient}>
				<LabComponent />
			</QueryClientProvider>,
		);

		expect(await screen.findByText(/Lab Project Not Found/i)).toBeDefined();
		expect(screen.getByText("non-existent-id")).toBeDefined();
	});
});
