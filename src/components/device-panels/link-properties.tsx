import { ArrowRightLeft, Radio, RadioReceiver, Trash2 } from "lucide-react";
import { useState } from "react";
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
import {
	useDeleteLink,
	useStartLinkCapture,
	useStopLinkCapture,
} from "@/features/links/use-links";
import { useTopologyStore } from "@/stores/topology-store";
import type { GNS3Link, GNS3Node } from "@/types/gns3";

interface LinkPropertiesProps {
	link: GNS3Link;
	nodes: GNS3Node[];
}

export function LinkProperties({ link, nodes }: LinkPropertiesProps) {
	const clearSelection = useTopologyStore((s) => s.clearSelection);
	const deleteMutation = useDeleteLink(link.project_id);
	const startCaptureMutation = useStartLinkCapture(link.project_id);
	const stopCaptureMutation = useStopLinkCapture(link.project_id);

	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	const isCapturing = link.capturing;

	const endpointA = link.nodes?.[0];
	const endpointB = link.nodes?.[1];

	const nodeA = nodes.find((n) => n.node_id === endpointA?.node_id);
	const nodeB = nodes.find((n) => n.node_id === endpointB?.node_id);

	const portA = nodeA?.ports?.find(
		(p) =>
			p.adapter_number === endpointA?.adapter_number &&
			p.port_number === endpointA?.port_number,
	);
	const portB = nodeB?.ports?.find(
		(p) =>
			p.adapter_number === endpointB?.adapter_number &&
			p.port_number === endpointB?.port_number,
	);

	const handleDelete = () => {
		setIsDeleteDialogOpen(true);
	};

	return (
		<div className="flex flex-col space-y-4 text-xs">
			{/* Header */}
			<div className="flex flex-col space-y-1.5 border-b border-border/70 pb-3">
				<div className="flex items-center justify-between">
					<span className="font-semibold text-foreground flex items-center gap-1.5">
						<ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
						<span>Network Link</span>
					</span>
					<Badge
						variant={isCapturing ? "destructive" : "outline"}
						className="text-[10px]"
					>
						{isCapturing ? "Capturing" : "Normal"}
					</Badge>
				</div>
				<span className="font-mono text-[10px] text-muted-foreground truncate">
					ID: {link.link_id}
				</span>
			</div>

			{/* Endpoints */}
			<div className="flex flex-col space-y-2 border border-border/60 rounded-md p-3 bg-muted/20">
				<div className="flex items-center justify-between">
					<span className="font-semibold text-foreground truncate max-w-25">
						{nodeA?.name || "Node A"}
					</span>
					<span className="font-mono text-primary font-medium">
						{portA?.name || `Port ${endpointA?.port_number}`}
					</span>
				</div>

				<div className="flex items-center justify-center my-0.5 text-muted-foreground">
					<ArrowRightLeft className="w-3 h-3 opacity-60" />
				</div>

				<div className="flex items-center justify-between">
					<span className="font-semibold text-foreground truncate max-w-25">
						{nodeB?.name || "Node B"}
					</span>
					<span className="font-mono text-primary font-medium">
						{portB?.name || `Port ${endpointB?.port_number}`}
					</span>
				</div>
			</div>

			{/* Packet Capture Section */}
			<div className="flex flex-col space-y-2 border border-border/60 rounded-md p-2.5 bg-muted/20">
				<span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
					<Radio className="w-3.5 h-3.5 text-rose-500" />
					<span>Packet Capture (PCAP)</span>
				</span>

				{isCapturing ? (
					<Button
						size="xs"
						variant="destructive"
						className="w-full gap-1.5"
						onClick={() => stopCaptureMutation.mutate(link.link_id)}
						disabled={stopCaptureMutation.isPending}
					>
						<Radio className="w-3.5 h-3.5 animate-pulse" />
						<span>Stop Packet Capture</span>
					</Button>
				) : (
					<Button
						size="xs"
						variant="outline"
						className="w-full gap-1.5 hover:text-rose-500 hover:border-rose-500/50"
						onClick={() => startCaptureMutation.mutate(link.link_id)}
						disabled={startCaptureMutation.isPending}
					>
						<RadioReceiver className="w-3.5 h-3.5" />
						<span>Start Packet Capture</span>
					</Button>
				)}
			</div>

			{/* Delete Link Button */}
			<div className="pt-2 border-t border-border/70">
				<Button
					size="xs"
					variant="destructive"
					className="w-full gap-1.5"
					onClick={handleDelete}
					disabled={deleteMutation.isPending}
				>
					<Trash2 className="w-3.5 h-3.5" />
					<span>Delete Link</span>
				</Button>
			</div>

			{/* Alert Dialog: Delete Link */}
			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete network link</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete the network link between{" "}
							{nodeA?.name || "Node A"} and {nodeB?.name || "Node B"}?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								deleteMutation.mutate(link.link_id);
								clearSelection();
								setIsDeleteDialogOpen(false);
							}}
						>
							Delete Link
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
