import {
	Check,
	FileCode2,
	FolderOpen,
	Network,
	Play,
	RotateCw,
	Square,
	Terminal,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { NodeFileManagerDialog } from "@/components/files/node-file-manager-dialog";
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
import { Input } from "@/components/ui/input";
import {
	useDeleteNode,
	useReloadNode,
	useStartNode,
	useStopNode,
	useUpdateNode,
} from "@/features/nodes/use-nodes";
import { resolveNodeSymbol } from "@/lib/symbols";
import { useTopologyStore } from "@/stores/topology-store";
import { useUIStore } from "@/stores/ui-store";
import type { GNS3Link, GNS3Node } from "@/types/gns3";

interface DevicePropertiesProps {
	node: GNS3Node;
	links: GNS3Link[];
	allNodes: GNS3Node[];
}

export function DeviceProperties({
	node,
	links,
	allNodes,
}: DevicePropertiesProps) {
	const [name, setName] = useState(node.name);
	const [isEditingName, setIsEditingName] = useState(false);
	const [fileManagerOpen, setFileManagerOpen] = useState(false);

	const startMutation = useStartNode(node.project_id);
	const stopMutation = useStopNode(node.project_id);
	const reloadMutation = useReloadNode(node.project_id);
	const deleteMutation = useDeleteNode(node.project_id);
	const updateMutation = useUpdateNode(node.project_id);

	const openConsoleForNode = useUIStore((s) => s.openConsoleForNode);
	const openEditorForNode = useUIStore((s) => s.openEditorForNode);
	const clearSelection = useTopologyStore((s) => s.clearSelection);

	const isStarted = node.status === "started";
	const isSuspended = node.status === "suspended";
	const symbolSrc = resolveNodeSymbol(node);

	// Find all links connected to this node
	const connectedLinks = links.filter((l) =>
		l.nodes?.some((endpoint) => endpoint.node_id === node.node_id),
	);

	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	const handleSaveName = () => {
		if (name.trim() && name !== node.name) {
			updateMutation.mutate({
				nodeId: node.node_id,
				data: { name: name.trim() },
			});
		}
		setIsEditingName(false);
	};

	const handleDelete = () => {
		setIsDeleteDialogOpen(true);
	};

	return (
		<div className="flex flex-col space-y-4 text-xs">
			{/* Header with Symbol, Name & Status */}
			<div className="flex flex-col space-y-2 border-b border-border/70 pb-3">
				<div className="flex items-center justify-between">
					<Badge
						variant={isStarted ? "success" : isSuspended ? "warning" : "muted"}
						className="uppercase font-mono text-[10px]"
					>
						{node.status}
					</Badge>
					<span className="text-[10px] text-muted-foreground font-mono truncate max-w-35">
						{node.node_type}
					</span>
				</div>

				<div className="flex items-center gap-2.5 pt-1">
					<div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
						<img
							src={symbolSrc}
							alt={node.name}
							className="w-full h-full object-contain pointer-events-none select-none"
						/>
					</div>

					<div className="flex flex-col min-w-0 flex-1">
						{isEditingName ? (
							<div className="flex items-center gap-1.5">
								<Input
									value={name}
									onChange={(e) => setName(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
									className="h-7 text-xs font-semibold"
									autoFocus
								/>
								<Button
									size="icon-xs"
									variant="default"
									onClick={handleSaveName}
								>
									<Check className="w-3 h-3" />
								</Button>
							</div>
						) : (
							<h3
								onClick={() => setIsEditingName(true)}
								className="text-base font-bold text-foreground hover:text-primary cursor-pointer truncate"
								title="Click to rename"
							>
								{node.name}
							</h3>
						)}

						<span className="text-[10px] text-muted-foreground font-mono truncate">
							ID: {node.node_id.substring(0, 8)}...
						</span>
					</div>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="grid grid-cols-2 gap-1.5">
				{isStarted ? (
					<Button
						size="xs"
						variant="outline"
						className="text-destructive hover:bg-destructive/10 gap-1.5"
						onClick={() => stopMutation.mutate(node.node_id)}
						disabled={stopMutation.isPending}
					>
						<Square className="w-3 h-3 fill-current" />
						<span>Stop</span>
					</Button>
				) : (
					<Button
						size="xs"
						variant="outline"
						className="text-emerald-500 hover:bg-emerald-500/10 gap-1.5"
						onClick={() => startMutation.mutate(node.node_id)}
						disabled={startMutation.isPending}
					>
						<Play className="w-3 h-3 fill-current" />
						<span>Start</span>
					</Button>
				)}

				<Button
					size="xs"
					variant="outline"
					className="gap-1.5"
					onClick={() => reloadMutation.mutate(node.node_id)}
					disabled={reloadMutation.isPending || !isStarted}
				>
					<RotateCw className="w-3 h-3" />
					<span>Reload</span>
				</Button>

				<Button
					size="xs"
					variant="outline"
					className="gap-1.5"
					onClick={() => openConsoleForNode(node.node_id)}
				>
					<Terminal className="w-3 h-3" />
					<span>Console</span>
				</Button>

				<Button
					size="xs"
					variant="outline"
					className="gap-1.5"
					onClick={() => openEditorForNode(node.node_id)}
				>
					<FileCode2 className="w-3 h-3" />
					<span>Config</span>
				</Button>

				<Button
					size="xs"
					variant="outline"
					className="gap-1.5"
					onClick={() => setFileManagerOpen(true)}
				>
					<FolderOpen className="w-3 h-3" />
					<span>Files</span>
				</Button>
			</div>

			{/* Console Information */}
			<div className="flex flex-col space-y-1.5 border border-border/60 rounded-md p-2.5 bg-muted/20">
				<span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
					<Terminal className="w-3.5 h-3.5 text-primary" />
					<span>Console Session</span>
				</span>
				<div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
					<span>Type:</span>
					<span className="font-mono text-foreground capitalize">
						{node.console_type || "telnet"}
					</span>
					<span>Port:</span>
					<span className="font-mono text-foreground font-semibold">
						{node.console || "None"}
					</span>
					<span>Host:</span>
					<span className="font-mono text-foreground">
						{node.console_host || "127.0.0.1"}
					</span>
				</div>
			</div>

			{/* Connected Interfaces & Links */}
			<div className="flex flex-col space-y-1.5">
				<span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
					<Network className="w-3.5 h-3.5 text-primary" />
					<span>Interfaces ({node.ports?.length || 0})</span>
				</span>

				<div className="flex flex-col space-y-1 max-h-36 overflow-y-auto">
					{node.ports && node.ports.length > 0 ? (
						node.ports.map((port) => {
							// Find if this port is connected to another node
							const link = connectedLinks.find((l) =>
								l.nodes?.some(
									(ep) =>
										ep.node_id === node.node_id &&
										ep.adapter_number === port.adapter_number &&
										ep.port_number === port.port_number,
								),
							);

							let peerInfo = "Disconnected";
							if (link) {
								const peerEp = link.nodes?.find(
									(ep) => ep.node_id !== node.node_id,
								);
								if (peerEp) {
									const peerNode = allNodes.find(
										(n) => n.node_id === peerEp.node_id,
									);
									peerInfo = `→ ${peerNode?.name || "Device"} (e${peerEp.port_number})`;
								}
							}

							return (
								<div
									key={`${port.adapter_number}-${port.port_number}`}
									className="flex items-center justify-between p-1.5 rounded-sm bg-muted/30 border border-border/40 text-[11px]"
								>
									<span className="font-mono font-medium text-foreground">
										{port.name}
									</span>
									<span
										className={`font-mono text-[10px] truncate max-w-30 ${
											link
												? "text-primary font-semibold"
												: "text-muted-foreground"
										}`}
									>
										{peerInfo}
									</span>
								</div>
							);
						})
					) : (
						<span className="text-muted-foreground text-[11px]">
							No interfaces found.
						</span>
					)}
				</div>
			</div>

			{/* Delete Device Button */}
			<div className="pt-2 border-t border-border/70">
				<Button
					size="xs"
					variant="destructive"
					className="w-full gap-1.5"
					onClick={handleDelete}
					disabled={deleteMutation.isPending}
				>
					<Trash2 className="w-3.5 h-3.5" />
					<span>Delete Node</span>
				</Button>
			</div>

			{/* Alert Dialog: Delete Node */}
			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete node</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete node &quot;{node.name}&quot;? All
							connected links will also be removed.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								deleteMutation.mutate(node.node_id);
								clearSelection();
								setIsDeleteDialogOpen(false);
							}}
						>
							Delete Node
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Node File Manager Dialog */}
			<NodeFileManagerDialog
				projectId={node.project_id}
				nodeId={node.node_id}
				nodeName={node.name}
				open={fileManagerOpen}
				onOpenChange={setFileManagerOpen}
			/>
		</div>
	);
}
