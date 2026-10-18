import { useState } from "react";
import {
	Cpu,
	Info,
	Layers,
	Plus,
	Search,
	Server,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateNodeFromTemplate } from "@/features/templates/use-templates";
import {
	GNS3_SYMBOLS,
	getSymbolUrl,
	resolveNodeSymbol,
} from "@/lib/symbols";
import { useTopologyStore } from "@/stores/topology-store";
import type { GNS3Template } from "@/types/gns3";

export interface NodeModelModalProps {
	template: GNS3Template | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function NodeModelModal({
	template,
	open,
	onOpenChange,
}: NodeModelModalProps) {
	const activeProjectId = useTopologyStore((s) => s.activeProjectId);
	const createFromTemplateMutation = useCreateNodeFromTemplate(
		activeProjectId || "",
	);

	const [selectedSymbolId, setSelectedSymbolId] = useState<string | null>(null);
	const [symbolSearch, setSymbolSearch] = useState("");
	const [activeTab, setActiveTab] = useState<"specs" | "symbols">("specs");

	if (!template) return null;

	const defaultSymbolUrl = resolveNodeSymbol(template);
	const currentSymbolUrl = selectedSymbolId
		? getSymbolUrl(selectedSymbolId, "blue")
		: defaultSymbolUrl;

	const handleAddToCanvas = () => {
		if (!activeProjectId) return;
		createFromTemplateMutation.mutate(
			{
				templateId: template.template_id,
				x: Math.floor(Math.random() * 200) + 150,
				y: Math.floor(Math.random() * 200) + 150,
			},
			{
				onSuccess: () => {
					onOpenChange(false);
				},
			},
		);
	};

	const filteredSymbols = GNS3_SYMBOLS.filter((s) => {
		const q = symbolSearch.toLowerCase();
		return (
			s.name.toLowerCase().includes(q) ||
			s.category.toLowerCase().includes(q) ||
			s.id.toLowerCase().includes(q)
		);
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[560px] p-0 overflow-hidden border-border bg-card shadow-2xl">
				{/* Modal Top Bar Banner */}
				<div className="bg-muted/40 border-b border-border p-4 flex items-start gap-4">
					{/* Large Symbol Display - No border box */}
					<div className="relative w-16 h-16 flex items-center justify-center shrink-0">
						<img
							src={currentSymbolUrl}
							alt={template.name}
							className="w-16 h-16 object-contain select-none pointer-events-none transition-transform group-hover:scale-105"
						/>
					</div>

					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap">
							<Badge variant="default" className="text-[10px] capitalize">
								{template.category || "Device"}
							</Badge>
							<Badge variant="outline" className="text-[10px] font-mono">
								{template.template_type || "Generic"}
							</Badge>
							{template.builtin && (
								<Badge variant="secondary" className="text-[10px]">
									Built-in
								</Badge>
							)}
						</div>

						<h2 className="text-lg font-bold text-foreground mt-1 truncate">
							{template.name}
						</h2>
						<p className="text-xs text-muted-foreground font-mono truncate">
							Template ID: {template.template_id}
						</p>
					</div>
				</div>

				{/* Navigation Tabs */}
				<div className="flex border-b border-border px-4">
					<button
						type="button"
						onClick={() => setActiveTab("specs")}
						className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
							activeTab === "specs"
								? "border-primary text-foreground"
								: "border-transparent text-muted-foreground hover:text-foreground"
						}`}
					>
						Node Model Specifications
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("symbols")}
						className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
							activeTab === "symbols"
								? "border-primary text-foreground"
								: "border-transparent text-muted-foreground hover:text-foreground"
						}`}
					>
						<span>Symbol Catalog</span>
						<Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
							64
						</Badge>
					</button>
				</div>

				{/* Tab Content Body */}
				<div className="p-4 max-h-[300px] overflow-y-auto">
					{activeTab === "specs" && (
						<div className="flex flex-col space-y-3 text-xs">
							<div className="grid grid-cols-2 gap-2.5">
								<div className="p-2.5 rounded-lg border border-border/80 bg-muted/20 flex flex-col gap-1">
									<div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
										<Server className="w-3.5 h-3.5 text-primary" />
										<span>Compute Engine</span>
									</div>
									<span className="font-semibold text-foreground font-mono">
										{template.compute_id || "local"}
									</span>
								</div>

								<div className="p-2.5 rounded-lg border border-border/80 bg-muted/20 flex flex-col gap-1">
									<div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
										<Cpu className="w-3.5 h-3.5 text-primary" />
										<span>Virtualization Type</span>
									</div>
									<span className="font-semibold text-foreground font-mono uppercase">
										{template.template_type || "Generic"}
									</span>
								</div>

								<div className="p-2.5 rounded-lg border border-border/80 bg-muted/20 flex flex-col gap-1">
									<div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
										<Layers className="w-3.5 h-3.5 text-primary" />
										<span>Device Category</span>
									</div>
									<span className="font-semibold text-foreground capitalize">
										{template.category || "Unassigned"}
									</span>
								</div>

								<div className="p-2.5 rounded-lg border border-border/80 bg-muted/20 flex flex-col gap-1">
									<div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
										<Info className="w-3.5 h-3.5 text-primary" />
										<span>Active Symbol Path</span>
									</div>
									<span
										className="font-semibold text-foreground font-mono text-[10px] truncate"
										title={currentSymbolUrl}
									>
										{currentSymbolUrl}
									</span>
								</div>
							</div>

							{template.usage && (
								<div className="p-3 rounded-lg border border-border/70 bg-card flex flex-col gap-1">
									<span className="font-semibold text-foreground text-[11px]">
										Usage Guidelines:
									</span>
									<p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
										{template.usage}
									</p>
								</div>
							)}

							<div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
								<Info className="w-4 h-4 shrink-0" />
								<span>
									Drag and drop this model from the Device Library directly onto the
									canvas or click "Add to Topology" below.
								</span>
							</div>
						</div>
					)}

					{activeTab === "symbols" && (
						<div className="flex flex-col space-y-3">
							<div className="relative">
								<Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
								<Input
									placeholder="Filter 64 GNS3 symbols..."
									value={symbolSearch}
									onChange={(e) => setSymbolSearch(e.target.value)}
									className="h-8 pl-8 text-xs"
								/>
							</div>

							<div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
								{filteredSymbols.map((sym) => {
									const url = getSymbolUrl(sym.id, "blue");
									const isSelected = selectedSymbolId === sym.id;

									return (
										<button
											key={sym.id}
											type="button"
											onClick={() => setSelectedSymbolId(sym.id)}
											className={`flex flex-col items-center p-2 rounded-lg border transition-all cursor-pointer text-center group ${
												isSelected
													? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
													: "border-border/70 bg-card hover:bg-muted/40 hover:border-primary/40"
											}`}
											title={`${sym.name} (${sym.category})`}
										>
											<div className="w-8 h-8 flex items-center justify-center mb-1">
												<img
													src={url}
													alt={sym.name}
													className="w-7 h-7 object-contain drop-shadow-xs pointer-events-none select-none transition-transform group-hover:scale-110"
												/>
											</div>
											<span className="text-[10px] font-medium text-foreground truncate max-w-full">
												{sym.name}
											</span>
										</button>
									);
								})}
							</div>
						</div>
					)}
				</div>

				{/* Modal Footer Actions */}
				<div className="p-3 border-t border-border bg-muted/30 flex items-center justify-between">
					<div className="text-[11px] text-muted-foreground font-mono truncate max-w-[240px]">
						{activeProjectId ? "Active project ready" : "Open a project first"}
					</div>

					<div className="flex items-center gap-2">
						<Button
							size="xs"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>

						<Button
							size="xs"
							variant="default"
							onClick={handleAddToCanvas}
							disabled={!activeProjectId || createFromTemplateMutation.isPending}
							className="gap-1.5"
						>
							<Plus className="w-3.5 h-3.5" />
							<span>
								{createFromTemplateMutation.isPending
									? "Adding..."
									: "Add to Topology"}
							</span>
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
