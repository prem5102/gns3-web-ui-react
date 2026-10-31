import { queryOptions } from "@tanstack/react-query";
import { gns3Api } from "@/lib/gns3-api";

/**
 * Centralized, type-safe query key registry for all GNS3 controller resources.
 * Prevents circular dependencies across feature hooks and guarantees consistent cache invalidation.
 */
export const queryKeys = {
	controller: {
		all: ["controller"] as const,
		version: () => ["controller", "version"] as const,
		me: () => ["controller", "me"] as const,
	},
	projects: {
		all: ["projects"] as const,
		detail: (id: string) => ["projects", id] as const,
	},
	nodes: {
		all: (projectId: string) => ["projects", projectId, "nodes"] as const,
		detail: (projectId: string, nodeId: string) =>
			["projects", projectId, "nodes", nodeId] as const,
		files: (projectId: string, nodeId: string) =>
			["projects", projectId, "nodes", nodeId, "files"] as const,
	},
	links: {
		all: (projectId: string) => ["projects", projectId, "links"] as const,
	},
	drawings: {
		all: (projectId: string | null) =>
			["projects", projectId, "drawings"] as const,
		detail: (projectId: string | null, drawingId: string) =>
			["projects", projectId, "drawings", drawingId] as const,
	},
	templates: {
		all: ["templates"] as const,
	},
	computes: {
		all: ["computes"] as const,
		detail: (computeId: string) => ["computes", computeId] as const,
	},
	statistics: {
		all: ["statistics"] as const,
	},
	images: {
		all: ["images"] as const,
	},
	access: {
		users: ["access", "users"] as const,
		roles: ["access", "roles"] as const,
	},
	snapshots: {
		all: (projectId: string) => ["projects", projectId, "snapshots"] as const,
	},
} as const;

// Backward-compatible individual key exports matching existing code contracts
export const projectKeys = {
	all: queryKeys.projects.all,
	detail: queryKeys.projects.detail,
};

export const nodeKeys = {
	all: queryKeys.nodes.all,
	detail: queryKeys.nodes.detail,
	files: queryKeys.nodes.files,
};

export const linkKeys = {
	all: queryKeys.links.all,
};

export const drawingKeys = {
	all: queryKeys.drawings.all,
	detail: queryKeys.drawings.detail,
};

export const templateKeys = {
	all: queryKeys.templates.all,
};

export const computeKeys = {
	all: queryKeys.computes.all,
	detail: queryKeys.computes.detail,
};

export const statisticsKeys = {
	all: queryKeys.statistics.all,
};

export const imageKeys = {
	all: queryKeys.images.all,
};

export const accessKeys = {
	users: queryKeys.access.users,
	roles: queryKeys.access.roles,
};

export const snapshotKeys = {
	all: queryKeys.snapshots.all,
};

export const controllerKeys = {
	all: queryKeys.controller.all,
	version: queryKeys.controller.version(),
	me: queryKeys.controller.me(),
};

/**
 * Query options factories for TanStack Query and TanStack Router Loaders.
 * Standardizes fetch queries, caching durations, and preload behavior across routes and components.
 */
export const projectsQueryOptions = () =>
	queryOptions({
		queryKey: queryKeys.projects.all,
		queryFn: () => gns3Api.getProjects(),
		refetchInterval: 10000,
	});

export const projectQueryOptions = (projectId: string | null) =>
	queryOptions({
		queryKey: queryKeys.projects.detail(projectId || ""),
		queryFn: () => (projectId ? gns3Api.getProject(projectId) : null),
		enabled: Boolean(projectId),
		refetchInterval: 10000,
	});

export const projectNodesQueryOptions = (projectId: string | null) =>
	queryOptions({
		queryKey: queryKeys.nodes.all(projectId || ""),
		queryFn: () => (projectId ? gns3Api.getProjectNodes(projectId) : []),
		enabled: Boolean(projectId),
		refetchInterval: 5000,
	});

export const projectLinksQueryOptions = (projectId: string | null) =>
	queryOptions({
		queryKey: queryKeys.links.all(projectId || ""),
		queryFn: () => (projectId ? gns3Api.getProjectLinks(projectId) : []),
		enabled: Boolean(projectId),
		refetchInterval: 5000,
	});

export const projectDrawingsQueryOptions = (projectId: string | null) =>
	queryOptions({
		queryKey: queryKeys.drawings.all(projectId),
		queryFn: () => (projectId ? gns3Api.getProjectDrawings(projectId) : []),
		enabled: Boolean(projectId),
		refetchInterval: 10000,
	});

export const templatesQueryOptions = () =>
	queryOptions({
		queryKey: queryKeys.templates.all,
		queryFn: () => gns3Api.getTemplates(),
		staleTime: 60000,
	});

export const controllerVersionQueryOptions = () =>
	queryOptions({
		queryKey: queryKeys.controller.version(),
		queryFn: () => gns3Api.getVersion(),
		retry: 2,
		refetchInterval: 15000,
	});

export const controllerMeQueryOptions = () =>
	queryOptions({
		queryKey: queryKeys.controller.me(),
		queryFn: () => gns3Api.getMe(),
		retry: false,
		enabled: Boolean(gns3Api.getAuthToken()),
	});

export const computesQueryOptions = () =>
	queryOptions({
		queryKey: queryKeys.computes.all,
		queryFn: () => gns3Api.getComputes(),
		refetchInterval: 10000,
	});

export const statisticsQueryOptions = () =>
	queryOptions({
		queryKey: queryKeys.statistics.all,
		queryFn: () => gns3Api.getStatistics(),
		refetchInterval: 5000,
	});

export const imagesQueryOptions = () =>
	queryOptions({
		queryKey: queryKeys.images.all,
		queryFn: () => gns3Api.getImages(),
		refetchInterval: 15000,
	});

export const usersQueryOptions = () =>
	queryOptions({
		queryKey: queryKeys.access.users,
		queryFn: () => gns3Api.getUsers(),
		refetchInterval: 15000,
	});

export const rolesQueryOptions = () =>
	queryOptions({
		queryKey: queryKeys.access.roles,
		queryFn: () => gns3Api.getRoles(),
		staleTime: 60000,
	});

export const snapshotsQueryOptions = (projectId: string | null) =>
	queryOptions({
		queryKey: queryKeys.snapshots.all(projectId || ""),
		queryFn: () => (projectId ? gns3Api.getSnapshots(projectId) : []),
		enabled: Boolean(projectId),
		refetchInterval: 10000,
	});

