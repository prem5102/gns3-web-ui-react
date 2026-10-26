import { Play, Square, Terminal } from "lucide-react";
import {
	useProjectNodes,
	useStartNode,
	useStopNode,
} from "@/features/nodes/use-nodes";
import { resolveNodeSymbol } from "@/lib/symbols";
import { useTopologyStore } from "@/stores/topology-store";
import { useUIStore } from "@/stores/ui-store";

export function NodesTab() {
	const { activeProjectId, selectedNodeId, selectNode } = useTopologyStore();
	const openConsoleForNode = useUIStore((s) => s.openConsoleForNode);
	const { data: nodes = [] } = useProjectNodes(activeProjectId);
	const startNodeMutation = useStartNode(activeProjectId || "");
	const stopNodeMutation = useStopNode(activeProjectId || "");

	return (
		<div className="flex flex-col space-y-3">
			<div className="flex flex-col space-y-1.5">
				{nodes.length === 0 ? (
					<div className="text-center py-6 text-muted-foreground text-xs">
						No devices placed yet.
					</div>
				) : (
					nodes.map((n) => {
						const isSelected = n.node_id === selectedNodeId;
						const isStarted = n.status === "started";
						const symbolSrc = resolveNodeSymbol(n);

						return (
							<div
								key={n.node_id}
								onClick={() => selectNode(n.node_id)}
								className={`flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer transition-all ${
									isSelected
										? "bg-primary/10 border-primary/50 shadow-xs"
										: "bg-card hover:bg-muted/40 border-border/60"
								}`}
							>
								<div className="flex items-center gap-2.5 min-w-0 pr-1">
									<div className="w-7 h-7 shrink-0 flex items-center justify-center">
										<img
											src={symbolSrc}
											alt={n.name}
											className="w-full h-full object-contain pointer-events-none select-none"
										/>
									</div>
									<div className="flex flex-col min-w-0">
										<span className="font-semibold text-foreground truncate">
											{n.name}
										</span>
										<span className="text-[10px] text-muted-foreground font-mono">
											{n.node_type} {n.console ? `(:${n.console})` : ""}
										</span>
									</div>
								</div>

								<div className="flex items-center gap-1">
									{isStarted ? (
										<button
											type="button"
											title="Stop"
											onClick={(e) => {
												e.stopPropagation();
												stopNodeMutation.mutate(n.node_id);
											}}
											className="p-1 hover:bg-destructive/15 text-destructive rounded-xs"
										>
											<Square className="w-3 h-3 fill-current" />
										</button>
									) : (
										<button
											type="button"
											title="Start"
											onClick={(e) => {
												e.stopPropagation();
												startNodeMutation.mutate(n.node_id);
											}}
											className="p-1 hover:bg-emerald-500/15 text-emerald-500 rounded-xs"
										>
											<Play className="w-3 h-3 fill-current" />
										</button>
									)}

									<button
										type="button"
										title="Console"
										onClick={(e) => {
											e.stopPropagation();
											openConsoleForNode(n.node_id);
										}}
										className="p-1 hover:bg-muted text-foreground rounded-xs"
									>
										<Terminal className="w-3 h-3" />
									</button>
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
