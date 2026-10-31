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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	useDeleteTemplate,
	useTemplates,
} from "@/features/templates/use-templates";
import { getSymbolUrl } from "@/lib/symbols";
import type { GNS3Template } from "@/types/gns3";
import { CreateTemplateDialog } from "./create-template-dialog";

export function TemplatesView() {
	const { data: templates = [], isLoading, isFetching, refetch } = useTemplates();
	const deleteTemplateMutation = useDeleteTemplate();

	const [scope, setScope] = useState<"all" | "custom" | "builtin">("all");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [searchText, setSearchText] = useState("");
	const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [templateToDelete, setTemplateToDelete] = useState<GNS3Template | null>(null);

	const customCount = useMemo(
		() => templates.filter((t) => !t.builtin).length,
		[templates],
	);
	const builtinCount = useMemo(
		() => templates.filter((t) => t.builtin).length,
		[templates],
	);

	const filteredTemplates = useMemo(() => {
		return templates.filter((tmpl) => {
			const query = searchText.toLowerCase().trim();
			const matchesSearch =
				!query ||
				tmpl.name.toLowerCase().includes(query) ||
				(tmpl.template_type && tmpl.template_type.toLowerCase().includes(query)) ||
				(tmpl.category && tmpl.category.toLowerCase().includes(query)) ||
				(tmpl.usage && tmpl.usage.toLowerCase().includes(query));

			const matchesScope =
				scope === "all" ||
				(scope === "builtin" && tmpl.builtin) ||
				(scope === "custom" && !tmpl.builtin);

			const matchesCategory =
				categoryFilter === "all" || tmpl.category === categoryFilter;

			const matchesType =
				typeFilter === "all" || tmpl.template_type === typeFilter;

			return matchesSearch && matchesScope && matchesCategory && matchesType;
		});
	}, [templates, searchText, scope, categoryFilter, typeFilter]);

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
					<h1 className="text-2xl font-bold tracking-tight">Appliance Templates</h1>
					<p className="text-sm text-muted-foreground">
						Device catalog blueprints for routers, switches, servers, and virtual appliances.
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
						<RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
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

			{/* Toolbar & Filter Controls */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Search templates by name, type, or usage..."
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						className="pl-9"
					/>
				</div>

				<div className="flex items-center gap-2">
					<Select value={categoryFilter} onValueChange={setCategoryFilter}>
						<SelectTrigger className="w-36">
							<SelectValue placeholder="Category" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All categories</SelectItem>
							<SelectItem value="router">Routers</SelectItem>
							<SelectItem value="switch">Switches</SelectItem>
							<SelectItem value="guest">End devices</SelectItem>
							<SelectItem value="firewall">Security</SelectItem>
						</SelectContent>
					</Select>

					<Select value={typeFilter} onValueChange={setTypeFilter}>
						<SelectTrigger className="w-36">
							<SelectValue placeholder="Type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All types</SelectItem>
							<SelectItem value="qemu">QEMU VM</SelectItem>
							<SelectItem value="docker">Docker</SelectItem>
							<SelectItem value="dynamips">Dynamips</SelectItem>
							<SelectItem value="iou">IOU</SelectItem>
							<SelectItem value="vpcs">VPCS</SelectItem>
							<SelectItem value="ethernet_switch">Switch</SelectItem>
							<SelectItem value="ethernet_hub">Hub</SelectItem>
						</SelectContent>
					</Select>

					<div className="border border-border/60 rounded-md p-0.5 flex items-center bg-muted/40">
						<Button
							size="icon-xs"
							variant={viewMode === "grid" ? "secondary" : "ghost"}
							onClick={() => setViewMode("grid")}
							title="Grid View"
						>
							<Grid className="w-3.5 h-3.5" />
						</Button>
						<Button
							size="icon-xs"
							variant={viewMode === "table" ? "secondary" : "ghost"}
							onClick={() => setViewMode("table")}
							title="Table View"
						>
							<List className="w-3.5 h-3.5" />
						</Button>
					</div>
				</div>
			</div>

			{/* Template Listing Content */}
			{isLoading ? (
				<div className="py-24 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
					<RefreshCw className="w-6 h-6 animate-spin text-primary" />
					<p className="text-sm">Loading template catalog...</p>
				</div>
			) : filteredTemplates.length === 0 ? (
				<div className="py-24 border border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center gap-3 text-center">
					<Boxes className="w-10 h-10 text-muted-foreground/60 stroke-1" />
					<p className="font-semibold text-foreground">No templates found</p>
					<p className="text-xs text-muted-foreground max-w-sm">
						{searchText || categoryFilter !== "all" || typeFilter !== "all" || scope !== "all"
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
			) : viewMode === "grid" ? (
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
												<span className="font-semibold text-sm truncate" title={template.name}>
													{template.name}
												</span>
												<span className="text-xs text-muted-foreground capitalize">
													{template.category} • {template.template_type || "emulator"}
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
										<Badge variant={template.builtin ? "outline" : "secondary"} className="text-xs">
											{template.builtin ? "Built-in" : "Custom"}
										</Badge>
										<span className="text-muted-foreground text-xs font-mono">
											{template.compute_id === "local" || !template.compute_id ? "local" : template.compute_id}
										</span>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			) : (
				<div className="rounded-lg border border-border/60 bg-card overflow-hidden shadow-xs">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-72">Template</TableHead>
								<TableHead>Category</TableHead>
								<TableHead>Emulator Type</TableHead>
								<TableHead>Compute Node</TableHead>
								<TableHead>Scope</TableHead>
								<TableHead className="w-20 text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredTemplates.map((template) => {
								const symbolUrl = getSymbolUrl(template.symbol);
								return (
									<TableRow key={template.template_id}>
										<TableCell>
											<div className="flex items-center gap-3">
												<div className="w-8 h-8 rounded-md bg-muted/60 border border-border/40 flex items-center justify-center shrink-0 p-1">
													{symbolUrl ? (
														<img
															src={symbolUrl}
															alt={template.name}
															className="w-full h-full object-contain"
														/>
													) : (
														<Cpu className="w-4 h-4 text-muted-foreground" />
													)}
												</div>
												<span className="font-semibold text-sm truncate">
													{template.name}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<Badge variant="outline" className="capitalize text-xs">
												{template.category}
											</Badge>
										</TableCell>
										<TableCell>
											<span className="font-mono text-xs">
												{template.template_type || "default"}
											</span>
										</TableCell>
										<TableCell>
											<span className="text-xs text-muted-foreground font-mono">
												{template.compute_id || "local"}
											</span>
										</TableCell>
										<TableCell>
											<Badge
												variant={template.builtin ? "outline" : "secondary"}
												className="text-xs"
											>
												{template.builtin ? "Built-in" : "Custom"}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											{!template.builtin && (
												<Button
													size="icon-xs"
													variant="ghost"
													className="text-destructive hover:bg-destructive/10"
													onClick={() => setTemplateToDelete(template)}
													title="Delete Template"
												>
													<Trash2 className="w-3.5 h-3.5" />
												</Button>
											)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Create Template Dialog */}
			<CreateTemplateDialog
				open={createDialogOpen}
				onOpenChange={setCreateDialogOpen}
			/>

			{/* Delete Template Confirmation */}
			<AlertDialog
				open={Boolean(templateToDelete)}
				onOpenChange={(open) => !open && setTemplateToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Template</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove template &quot;{templateToDelete?.name}&quot;? Existing nodes created from this template will not be affected.
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
