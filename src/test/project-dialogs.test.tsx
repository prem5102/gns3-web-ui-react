import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import {
	createProjectSchema,
	renameProjectSchema,
} from "@/components/projects/project-schemas";
import { ProjectDetailsDialog } from "@/components/projects/project-details-dialog";
import { RenameProjectDialog } from "@/components/projects/rename-project-dialog";
import type { GNS3Project } from "@/types/gns3";

describe("Project Schemas & Dialogs", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
	});

	function renderWithQuery(ui: React.ReactElement) {
		return render(
			<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
		);
	}

	describe("createProjectSchema", () => {
		it("validates compliant project names", () => {
			const result = createProjectSchema.safeParse({
				name: "OSPF-Multiarea-Lab_01",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe("OSPF-Multiarea-Lab_01");
				expect(result.data.scene_width).toBe(2000);
				expect(result.data.scene_height).toBe(1000);
			}
		});

		it("rejects empty or whitespace-only project names", () => {
			const result = createProjectSchema.safeParse({ name: "   " });
			expect(result.success).toBe(false);
		});

		it("rejects invalid characters in project names", () => {
			const result = createProjectSchema.safeParse({ name: "Lab/../Attack" });
			expect(result.success).toBe(false);
		});

		it("enforces scene dimension bounds", () => {
			const tooSmall = createProjectSchema.safeParse({
				name: "ValidName",
				scene_width: 100,
			});
			expect(tooSmall.success).toBe(false);

			const validCustom = createProjectSchema.safeParse({
				name: "ValidName",
				scene_width: 3000,
				scene_height: 1500,
			});
			expect(validCustom.success).toBe(true);
		});
	});

	describe("renameProjectSchema", () => {
		it("accepts valid names and trims whitespace", () => {
			const result = renameProjectSchema.safeParse({
				name: "  Renamed-Lab  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe("Renamed-Lab");
			}
		});
	});

	describe("Dialog Components", () => {
		it("renders CreateProjectDialog when open", () => {
			renderWithQuery(
				<CreateProjectDialog open={true} onOpenChange={vi.fn()} />,
			);
			expect(screen.getByText("Create New Project")).toBeInTheDocument();
			expect(screen.getByLabelText("Project Name")).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: /create & open/i }),
			).toBeInTheDocument();
		});

		it("renders ProjectDetailsDialog with project information", () => {
			const sampleProject: GNS3Project = {
				project_id: "proj-abc-123",
				name: "Enterprise Data Center",
				status: "opened",
				filename: "datacenter.gns3",
				path: "/opt/gns3/projects/datacenter",
				auto_close: false,
				auto_open: false,
				auto_start: false,
				scene_height: 1000,
				scene_width: 2000,
				zoom: 100,
				show_grid: false,
				show_interface_labels: false,
				snap_to_grid: false,
				grid_size: 20,
				supplier: null,
			};

			renderWithQuery(
				<ProjectDetailsDialog
					project={sampleProject}
					onOpenChange={vi.fn()}
					onLaunchLab={vi.fn()}
				/>
			);

			expect(screen.getByText("Project Details")).toBeInTheDocument();
			expect(screen.getByText("Enterprise Data Center")).toBeInTheDocument();
			expect(screen.getByText("proj-abc-123")).toBeInTheDocument();
			expect(screen.getByText("Running")).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: /launch lab/i }),
			).toBeInTheDocument();
		});

		it("renders RenameProjectDialog with existing name populated", () => {
			const sampleProject: GNS3Project = {
				project_id: "proj-1",
				name: "Core Router Test",
				status: "closed",
				filename: "test.gns3",
				path: "/test",
				auto_close: false,
				auto_open: false,
				auto_start: false,
				scene_height: 1000,
				scene_width: 2000,
				zoom: 100,
				show_grid: false,
				show_interface_labels: false,
				snap_to_grid: false,
				grid_size: 20,
				supplier: null,
			};

			renderWithQuery(
				<RenameProjectDialog project={sampleProject} onOpenChange={vi.fn()} />,
			);

			expect(screen.getByText("Rename Project")).toBeInTheDocument();
			const input = screen.getByLabelText("Project Name") as HTMLInputElement;
			expect(input.value).toBe("Core Router Test");
		});
	});
});
