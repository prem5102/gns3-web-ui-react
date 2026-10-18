import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useCreateLink, useProjectLinks } from "@/features/links/use-links";
import { useProjectNodes } from "@/features/nodes/use-nodes";
import { useTopologyStore } from "@/stores/topology-store";
import type { NodePort } from "@/types/gns3";

export function LinkDialog() {
	const {
		linkDialogOpen,
		pendingLinkConnection,
		closeLinkDialog,
		activeProjectId,
	} = useTopologyStore();

	const { data: nodes = [] } = useProjectNodes(activeProjectId);
	const { data: links = [] } = useProjectLinks(activeProjectId);
	const createLinkMutation = useCreateLink(activeProjectId || "");

	const [selectedSourcePort, setSelectedSourcePort] = useState<NodePort | null>(
		null,
	);
	const [selectedTargetPort, setSelectedTargetPort] = useState<NodePort | null>(
		null,
	);

	const sourceNode = nodes.find(
		(n) => n.node_id === pendingLinkConnection?.sourceNodeId,
	);
	const targetNode = nodes.find(
		(n) => n.node_id === pendingLinkConnection?.targetNodeId,
	);

	// Helper to check if a port is already connected in any link
	const isPortConnected = useCallback(
		(nodeId: string, adapter: number, port: number) => {
			return links.some((l) =>
				l.nodes?.some(
					(endpoint) =>
						endpoint.node_id === nodeId &&
						endpoint.adapter_number === adapter &&
						endpoint.port_number === port,
				),
			);
		},
		[links],
	);

	// Reset selected ports when dialog opens
	useEffect(() => {
		if (sourceNode?.ports && sourceNode.ports.length > 0) {
			const free = sourceNode.ports.find(
				(p) =>
					!isPortConnected(sourceNode.node_id, p.adapter_number, p.port_number),
			);
			setSelectedSourcePort(free || sourceNode.ports[0]);
		}
		if (targetNode?.ports && targetNode.ports.length > 0) {
			const free = targetNode.ports.find(
				(p) =>
					!isPortConnected(targetNode.node_id, p.adapter_number, p.port_number),
			);
			setSelectedTargetPort(free || targetNode.ports[0]);
		}
	}, [sourceNode, targetNode, isPortConnected]);

	const handleConnect = async () => {
		if (
			!sourceNode ||
			!targetNode ||
			!selectedSourcePort ||
			!selectedTargetPort
		)
			return;

		await createLinkMutation.mutateAsync([
			{
				node_id: sourceNode.node_id,
				adapter_number: selectedSourcePort.adapter_number,
				port_number: selectedSourcePort.port_number,
			},
			{
				node_id: targetNode.node_id,
				adapter_number: selectedTargetPort.adapter_number,
				port_number: selectedTargetPort.port_number,
			},
		]);

		closeLinkDialog();
	};

	if (!sourceNode || !targetNode) return null;

	return (
		<Dialog
			open={linkDialogOpen}
			onOpenChange={(open) => !open && closeLinkDialog()}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Connect Network Link</DialogTitle>
					<DialogDescription>
						Select available network interfaces between {sourceNode.name} and{" "}
						{targetNode.name}.
					</DialogDescription>
				</DialogHeader>

				<div className="grid grid-cols-2 gap-4 py-3">
					{/* Source Node Ports */}
					<div className="flex flex-col space-y-2 border border-border/70 rounded-md p-3 bg-muted/20">
						<span className="text-sm font-semibold truncate text-foreground">
							{sourceNode.name}
						</span>
						<div className="flex flex-col space-y-1 max-h-48 overflow-y-auto">
							{sourceNode.ports && sourceNode.ports.length > 0 ? (
								sourceNode.ports.map((p) => {
									const busy = isPortConnected(
										sourceNode.node_id,
										p.adapter_number,
										p.port_number,
									);
									const isSelected =
										selectedSourcePort?.adapter_number === p.adapter_number &&
										selectedSourcePort?.port_number === p.port_number;

									return (
										<button
											key={`${p.adapter_number}-${p.port_number}`}
											type="button"
											disabled={busy}
											onClick={() => setSelectedSourcePort(p)}
											className={`flex items-center justify-between px-2.5 py-1.5 rounded-sm text-xs font-mono transition-colors ${
												isSelected
													? "bg-primary text-primary-foreground font-semibold"
													: busy
														? "text-muted-foreground line-through opacity-50 cursor-not-allowed"
														: "hover:bg-accent text-foreground"
											}`}
										>
											<span>{p.name}</span>
											{busy && (
												<span className="text-[10px] font-sans">connected</span>
											)}
										</button>
									);
								})
							) : (
								<span className="text-xs text-muted-foreground">
									No ports available
								</span>
							)}
						</div>
					</div>

					{/* Target Node Ports */}
					<div className="flex flex-col space-y-2 border border-border/70 rounded-md p-3 bg-muted/20">
						<span className="text-sm font-semibold truncate text-foreground">
							{targetNode.name}
						</span>
						<div className="flex flex-col space-y-1 max-h-48 overflow-y-auto">
							{targetNode.ports && targetNode.ports.length > 0 ? (
								targetNode.ports.map((p) => {
									const busy = isPortConnected(
										targetNode.node_id,
										p.adapter_number,
										p.port_number,
									);
									const isSelected =
										selectedTargetPort?.adapter_number === p.adapter_number &&
										selectedTargetPort?.port_number === p.port_number;

									return (
										<button
											key={`${p.adapter_number}-${p.port_number}`}
											type="button"
											disabled={busy}
											onClick={() => setSelectedTargetPort(p)}
											className={`flex items-center justify-between px-2.5 py-1.5 rounded-sm text-xs font-mono transition-colors ${
												isSelected
													? "bg-primary text-primary-foreground font-semibold"
													: busy
														? "text-muted-foreground line-through opacity-50 cursor-not-allowed"
														: "hover:bg-accent text-foreground"
											}`}
										>
											<span>{p.name}</span>
											{busy && (
												<span className="text-[10px] font-sans">connected</span>
											)}
										</button>
									);
								})
							) : (
								<span className="text-xs text-muted-foreground">
									No ports available
								</span>
							)}
						</div>
					</div>
				</div>

				<DialogFooter className="flex items-center justify-between sm:justify-end gap-2">
					<Button variant="outline" size="sm" onClick={closeLinkDialog}>
						Cancel
					</Button>
					<Button
						size="sm"
						onClick={handleConnect}
						disabled={
							!selectedSourcePort ||
							!selectedTargetPort ||
							createLinkMutation.isPending
						}
					>
						{createLinkMutation.isPending
							? "Connecting..."
							: "Connect Interface"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
