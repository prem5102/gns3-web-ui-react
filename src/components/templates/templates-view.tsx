import {
	Boxes,
	Cpu,
	Grid,
	List,
	Plus,
	RefreshCw,
	Search,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	useDeleteTemplate,
	useTemplates,
} from "@/features/templates/use-templates";
import { getSymbolUrl } from "@/lib/symbols";
import type { GNS3Template } from "@/types/gns3";
import { CreateTemplateDialog } from "./create-template-dialog";
import { TemplatesDataTable } from "./table";

export function TemplatesView() {
	const {
		data: templates = [],
		isLoading,
		isFetching,
		refetch,
	} = useTemplates();
	const deleteTemplateMutation = useDeleteTemplate();

	const [scope, setScope] = useState<"all" | "custom" | "builtin">("all");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [searchText, setSearchText] = useState("");
	const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [templateToDelete, setTemplateToDelete] = useState<GNS3Template | null>(
		null,
	);

	const customCount = useMemo(
		() => templates.filter((t) => !t.builtin).length,
		[templates],
	);
	const builtinCount = useMemo(
		() => templates.filter((t) => t.builtin).length,
		[templates],
	);

	const categories = useMemo(() => {
		const set = new Set<string>();
		templates.forEach((t) => {
			if (t.category) set.add(t.category);
		});
		return Array.from(set);
	}, [templates]);

	const filteredTemplates = useMemo(() => {
		return templates.filter((tmpl) => {
			const query = searchText.toLowerCase().trim();
			const matchesSearch =
				!query ||
				tmpl.name.toLowerCase().includes(query) ||
				(tmpl.template_type &&
					tmpl.template_type.toLowerCase().includes(query)) ||
				(tmpl.category && tmpl.category.toLowerCase().includes(query)) ||
				(tmpl.usage && tmpl.usage.toLowerCase().includes(query));

			const matchesScope =
				scope === "all" ||
				(scope === "builtin" && tmpl.builtin) ||
				(scope === "custom" && !tmpl.builtin);

			const matchesCategory =
				categoryFilter === "all" || tmpl.category === categoryFilter;

			return matchesSearch && matchesScope && matchesCategory;
		});
	}, [templates, searchText, scope, categoryFilter]);

	const handleDeleteConfirm = async () => {
		if (templateToDelete) {
			try {
				await deleteTemplateMutation.mutateAsync(templateToDelete.template_id);
			} finally {
				setTemplateToDelete(null);
			}
		}
	};

	return (
		<div className="flex-1 flex flex-col p-6 space-y-6 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Appliance Templates
					</h1>
					<p className="text-sm text-muted-foreground">
						Device catalog blueprints for routers, switches, servers, and
						virtual appliances.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isLoading || isFetching}
						className="gap-2"
					>
						<RefreshCw
							className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>
					<Button
						size="sm"
						onClick={() => setCreateDialogOpen(true)}
						className="gap-2"
					>
						<Plus className="w-4 h-4" />
						New Template
					</Button>
				</div>
			</div>

			{/* Scopes Navigation Bar */}
			<div className="flex items-center gap-2 border-b border-border/60 pb-3">
				<Button
					variant={scope === "all" ? "secondary" : "ghost"}
					size="sm"
					onClick={() => setScope("all")}
					className="gap-1.5"
				>
					All Templates
					<Badge variant="outline" className="text-xs px-1.5 py-0">
						{templates.length}
					</Badge>
				</Button>
				<Button
					variant={scope === "custom" ? "secondary" : "ghost"}
					size="sm"
					onClick={() => setScope("custom")}
					className="gap-1.5"
				>
					Custom
					<Badge variant="outline" className="text-xs px-1.5 py-0">
						{customCount}
					</Badge>
				</Button>
				<Button
					variant={scope === "builtin" ? "secondary" : "ghost"}
					size="sm"
					onClick={() => setScope("builtin")}
					className="gap-1.5"
				>
					Built-in
					<Badge variant="outline" className="text-xs px-1.5 py-0">
						{builtinCount}
					</Badge>
				</Button>
			</div>

			{/* View Mode & Filter Controls for Grid Mode */}
			{viewMode === "grid" && (
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
					<div className="relative flex-1 max-w-md">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input
							placeholder="Search by name, category, or type..."
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							className="pl-9 h-8 text-xs"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Select
							value={scope}
							onValueChange={(val: "all" | "custom" | "builtin") =>
								setScope(val)
							}
						>
							<SelectTrigger className="w-32 h-8 text-xs">
								<SelectValue placeholder="Scope" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All scopes</SelectItem>
								<SelectItem value="custom">Custom only</SelectItem>
								<SelectItem value="builtin">Built-in only</SelectItem>
							</SelectContent>
						</Select>

						<Select value={categoryFilter} onValueChange={setCategoryFilter}>
							<SelectTrigger className="w-32 h-8 text-xs">
								<SelectValue placeholder="Category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All categories</SelectItem>
								<SelectItem value="router">Router</SelectItem>
								<SelectItem value="switch">Switch</SelectItem>
								<SelectItem value="guest">Guest</SelectItem>
								<SelectItem value="firewall">Firewall</SelectItem>
							</SelectContent>
						</Select>

						<div className="border border-border/60 rounded-md p-0.5 flex items-center bg-muted/40">
							<Button
								size="icon-xs"
								variant="secondary"
								onClick={() => setViewMode("grid")}
								className="h-6 w-6"
								title="Grid View"
							>
								<Grid className="w-3.5 h-3.5" />
							</Button>
							<Button
								size="icon-xs"
								variant="ghost"
								onClick={() => setViewMode("table")}
								className="h-6 w-6"
								title="Table View"
							>
								<List className="w-3.5 h-3.5" />
							</Button>
						</div>
					</div>
				</div>
			)}

			{viewMode === "table" && (
				<div className="flex items-center justify-between pb-1">
					<span className="text-xs text-muted-foreground">
						Template Inventory ({templates.length})
					</span>
					<div className="border border-border/60 rounded-md p-0.5 flex items-center bg-muted/40">
						<Button
							size="icon-xs"
							variant="ghost"
							onClick={() => setViewMode("grid")}
							className="h-6 w-6"
							title="Grid View"
						>
							<Grid className="w-3.5 h-3.5" />
						</Button>
						<Button
							size="icon-xs"
							variant="secondary"
							onClick={() => setViewMode("table")}
							className="h-6 w-6"
							title="Table View"
						>
							<List className="w-3.5 h-3.5" />
						</Button>
					</div>
				</div>
			)}

			{/* Template Listing Content */}
			{viewMode === "table" ? (
				<TemplatesDataTable
					data={templates}
					categories={categories}
					isLoading={isLoading}
					onDelete={(t) => setTemplateToDelete(t)}
				/>
			) : isLoading ? (
				<div className="py-24 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
					<RefreshCw className="w-6 h-6 animate-spin text-primary" />
					<p className="text-sm">Loading template catalog...</p>
				</div>
			) : filteredTemplates.length === 0 ? (
				<div className="py-24 border border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center gap-3 text-center">
					<Boxes className="w-10 h-10 text-muted-foreground/60 stroke-1" />
					<p className="font-semibold text-foreground">No templates found</p>
					<p className="text-xs text-muted-foreground max-w-sm">
						{searchText || categoryFilter !== "all" || scope !== "all"
							? "Try adjusting your search terms or filters to find device templates."
							: "Create your first template or import an appliance to start building topologies."}
					</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setCreateDialogOpen(true)}
						className="mt-2 gap-2"
					>
						<Plus className="w-4 h-4" />
						Create Template
					</Button>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					{filteredTemplates.map((template) => {
						const symbolUrl = getSymbolUrl(template.symbol);
						return (
							<Card
								key={template.template_id}
								className="border-border/60 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between overflow-hidden group"
							>
								<CardContent className="p-4 space-y-3">
									<div className="flex items-start justify-between gap-2">
										<div className="flex items-center gap-3 min-w-0">
											<div className="w-11 h-11 rounded-lg bg-muted/60 border border-border/40 flex items-center justify-center shrink-0 p-1.5">
												{symbolUrl ? (
													<img
														src={symbolUrl}
														alt={template.name}
														className="w-full h-full object-contain"
													/>
												) : (
													<Cpu className="w-6 h-6 text-muted-foreground" />
												)}
											</div>
											<div className="min-w-0 flex flex-col">
												<span
													className="font-semibold text-sm truncate"
													title={template.name}
												>
													{template.name}
												</span>
												<span className="text-xs text-muted-foreground capitalize">
													{template.category} •{" "}
													{template.template_type || "emulator"}
												</span>
											</div>
										</div>

										{!template.builtin && (
											<Button
												size="icon-xs"
												variant="ghost"
												className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
												title="Delete Template"
												onClick={() => setTemplateToDelete(template)}
											>
												<Trash2 className="w-3.5 h-3.5" />
											</Button>
										)}
									</div>

									{template.usage && (
										<p className="text-xs text-muted-foreground line-clamp-2 bg-muted/30 p-2 rounded-md">
											{template.usage}
										</p>
									)}

									<div className="pt-2 flex items-center justify-between border-t border-border/40 text-xs">
										<Badge
											variant={template.builtin ? "outline" : "secondary"}
											className="text-xs"
										>
											{template.builtin ? "Built-in" : "Custom"}
										</Badge>
										<span className="text-muted-foreground text-xs font-mono">
											{template.compute_id === "local" || !template.compute_id
												? "local"
												: template.compute_id}
										</span>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

			{/* Create Template Dialog */}
			<CreateTemplateDialog
				open={createDialogOpen}
				onOpenChange={setCreateDialogOpen}
			/>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={Boolean(templateToDelete)}
				onOpenChange={(open) => !open && setTemplateToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Template</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete template &quot;
							{templateToDelete?.name}&quot;? Existing topology nodes created
							from this template will not be deleted, but no new nodes can be
							instantiated from it.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
						>
							Delete Template
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
