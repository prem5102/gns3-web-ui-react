import { LayoutGrid, List, SearchIcon } from "lucide-react";
import { useState } from "react";
import { NodeModelModal } from "@/components/topology/node-model-modal";
import { Badge } from "@/components/ui/badge";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	useCreateNodeFromTemplate,
	useTemplates,
} from "@/features/templates/use-templates";
import { BUILTIN_NODE_MODELS } from "@/lib/symbols";
import { useTopologyStore } from "@/stores/topology-store";
import type { GNS3Template } from "@/types/gns3";
import { DeviceGridItem, DeviceListItem } from "./device-item";

export function DevicesTab() {
	const { activeProjectId } = useTopologyStore();
	const { data: templates = [] } = useTemplates();
	const createFromTemplateMutation = useCreateNodeFromTemplate(
		activeProjectId || "",
	);

	const [deviceSearch, setDeviceSearch] = useState("");
	const [deviceCategory, setDeviceCategory] = useState<
		"all" | "router" | "switch" | "guest" | "firewall"
	>("all");
	const [libraryViewMode, setLibraryViewMode] = useState<"grid" | "list">(
		"grid",
	);
	const [activeModalTemplate, setActiveModalTemplate] =
		useState<GNS3Template | null>(null);
	const [nodeModalOpen, setNodeModalOpen] = useState(false);

	const availableTemplates: GNS3Template[] =
		templates.length > 0 ? templates : BUILTIN_NODE_MODELS;

	const filteredTemplates = availableTemplates.filter((tpl) => {
		const matchesSearch = tpl.name
			.toLowerCase()
			.includes(deviceSearch.toLowerCase());
		const matchesCategory =
			deviceCategory === "all" ||
			tpl.category?.toLowerCase().includes(deviceCategory);
		return matchesSearch && matchesCategory;
	});

	const handleQuickAddTemplate = (templateId: string) => {
		if (!activeProjectId) return;
		createFromTemplateMutation.mutate({
			templateId,
			x: Math.floor(Math.random() * 150) + 150,
			y: Math.floor(Math.random() * 150) + 150,
		});
	};

	const handleOpenModelDetails = (tpl: GNS3Template) => {
		setActiveModalTemplate(tpl);
		setNodeModalOpen(true);
	};

	return (
		<>
			<NodeModelModal
				template={activeModalTemplate}
				open={nodeModalOpen}
				onOpenChange={setNodeModalOpen}
			/>

			<div className="flex flex-col space-y-3 flex-1 min-h-0">
				{/* Search Bar */}
				<div className="shrink-0">
					<InputGroup>
						<InputGroupInput
							value={deviceSearch}
							placeholder="Search node models..."
							onChange={(e) => setDeviceSearch(e.target.value)}
						/>
						<InputGroupAddon>
							<SearchIcon />
						</InputGroupAddon>
					</InputGroup>
				</div>

				{/* Category Filter Pills */}
				<div className="flex flex-wrap gap-1 shrink-0">
					{(["all", "router", "switch", "guest", "firewall"] as const).map(
						(cat) => (
							<Badge
								key={cat}
								variant={deviceCategory === cat ? "default" : "outline"}
								onClick={() => setDeviceCategory(cat)}
								className="cursor-pointer"
							>
								{cat.charAt(0).toUpperCase() + cat.slice(1)}
							</Badge>
						),
					)}
				</div>

				{/* Toolbar: View Mode Switcher */}
				<div className="flex items-center justify-between text-xs shrink-0">
					<span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
						Templates ({filteredTemplates.length})
					</span>

					<div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-md border border-border/70">
						<button
							onClick={() => setLibraryViewMode("grid")}
							className={`p-1 rounded-md transition-colors ${
								libraryViewMode === "grid"
									? "bg-card text-foreground shadow-2xs font-semibold"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<LayoutGrid className="w-3.5 h-3.5" />
						</button>
						<button
							onClick={() => setLibraryViewMode("list")}
							className={`p-1 rounded-md transition-colors ${
								libraryViewMode === "list"
									? "bg-card text-foreground shadow-2xs font-semibold"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<List className="w-3.5 h-3.5" />
						</button>
					</div>
				</div>

				{/* Device Library Template Nodes inside shadcn ScrollArea */}
				<ScrollArea className="flex-1 min-h-0 -mr-2 pr-2">
					{filteredTemplates.length === 0 ? (
						<div className="text-center py-6 text-muted-foreground text-xs">
							No templates match filter.
						</div>
					) : libraryViewMode === "grid" ? (
						/* Grid of Icons with Node Model */
						<div className="grid grid-cols-2 gap-2 pb-4 pr-1">
							{filteredTemplates.map((tpl) => (
								<DeviceGridItem
									key={tpl.template_id}
									template={tpl}
									onQuickAdd={handleQuickAddTemplate}
									onOpenDetails={handleOpenModelDetails}
								/>
							))}
						</div>
					) : (
						/* Compact List View */
						<div className="flex flex-col space-y-1.5 pb-4 pr-1">
							{filteredTemplates.map((tpl) => (
								<DeviceListItem
									key={tpl.template_id}
									template={tpl}
									onQuickAdd={handleQuickAddTemplate}
									onOpenDetails={handleOpenModelDetails}
								/>
							))}
						</div>
					)}
				</ScrollArea>
			</div>
		</>
	);
}
