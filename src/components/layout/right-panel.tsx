import { SlidersHorizontal, X } from "lucide-react";
import { DeviceProperties } from "@/components/device-panels/device-properties";
import { LinkProperties } from "@/components/device-panels/link-properties";
import { ProjectProperties } from "@/components/device-panels/project-properties";
import { Button } from "@/components/ui/button";
import { useProjectLinks } from "@/features/links/use-links";
import { useProjectNodes } from "@/features/nodes/use-nodes";
import { useTopologyStore } from "@/stores/topology-store";
import { useUIStore } from "@/stores/ui-store";

export function RightPanel() {
	const { rightPanelOpen, setRightPanelOpen } = useUIStore();
	const { activeProjectId, selectedNodeId, selectedLinkId } =
		useTopologyStore();

	const { data: nodes = [] } = useProjectNodes(activeProjectId);
	const { data: links = [] } = useProjectLinks(activeProjectId);

	const selectedNode = nodes.find((n) => n.node_id === selectedNodeId);
	const selectedLink = links.find((l) => l.link_id === selectedLinkId);

	if (!rightPanelOpen) {
		return (
			<div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
				<Button
					size="icon-xs"
					variant="secondary"
					onClick={() => setRightPanelOpen(true)}
					className="rounded-l-md rounded-r-none border-l border-y border-border shadow-md"
					title="Open Properties Panel"
				>
					<SlidersHorizontal className="w-3.5 h-3.5" />
				</Button>
			</div>
		);
	}

	return (
		<aside className="w-72 md:w-80 h-full border-l border-border bg-card/95 backdrop-blur-md flex flex-col shadow-lg z-20 transition-all select-none">
			{/* Header */}
			<div className="flex items-center justify-between px-3 py-2 border-b border-border/80 bg-muted/30">
				<div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
					<SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
					<span>
						{selectedNode
							? "Device Inspector"
							: selectedLink
								? "Link Inspector"
								: "Project Overview"}
					</span>
				</div>

				<Button
					size="icon-xs"
					variant="ghost"
					onClick={() => setRightPanelOpen(false)}
					className="hover:bg-muted"
				>
					<X className="w-3.5 h-3.5" />
				</Button>
			</div>

			{/* Content Area */}
			<div className="flex-1 overflow-y-auto p-3">
				{selectedNode ? (
					<DeviceProperties
						key={selectedNode.node_id}
						node={selectedNode}
						links={links}
						allNodes={nodes}
					/>
				) : selectedLink ? (
					<LinkProperties
						key={selectedLink.link_id}
						link={selectedLink}
						nodes={nodes}
					/>
				) : activeProjectId ? (
					<ProjectProperties projectId={activeProjectId} />
				) : (
					<div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-xs p-4">
						<SlidersHorizontal className="w-8 h-8 opacity-30 mb-2" />
						<p>
							Select any device, connection, or project to inspect and modify
							properties.
						</p>
					</div>
				)}
			</div>
		</aside>
	);
}
