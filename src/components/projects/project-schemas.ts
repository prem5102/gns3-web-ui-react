import { z } from "zod";

export const createProjectSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Project name is required")
		.max(64, "Project name cannot exceed 64 characters")
		.regex(
			/^[a-zA-Z0-9_\- ]+$/,
			"Only letters, numbers, spaces, hyphens, and underscores are allowed",
		),
	scene_width: z.coerce
		.number()
		.int()
		.min(500, "Minimum width is 500px")
		.max(10000, "Maximum width is 10000px")
		.default(2000),
	scene_height: z.coerce
		.number()
		.int()
		.min(500, "Minimum height is 500px")
		.max(10000, "Maximum height is 10000px")
		.default(1000),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export const renameProjectSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Project name is required")
		.max(64, "Project name cannot exceed 64 characters")
		.regex(
			/^[a-zA-Z0-9_\- ]+$/,
			"Only letters, numbers, spaces, hyphens, and underscores are allowed",
		),
});

export type RenameProjectFormValues = z.infer<typeof renameProjectSchema>;
