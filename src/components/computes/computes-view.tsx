import { Plus, RefreshCw } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
	useComputes,
	useConnectCompute,
	useDeleteCompute,
} from "@/features/computes/use-computes";
import type { Compute } from "@/types/gns3";
import { AddComputeDialog } from "./add-compute-dialog";
import { ComputesDataTable } from "./table";

export function ComputesView() {
	const { data: computes = [], isLoading, isFetching, refetch } = useComputes();
	const deleteComputeMutation = useDeleteCompute();
	const connectComputeMutation = useConnectCompute();

	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [computeToDelete, setComputeToDelete] = useState<Compute | null>(null);

	const handleDeleteConfirm = async () => {
		if (computeToDelete) {
			try {
				await deleteComputeMutation.mutateAsync(computeToDelete.compute_id);
			} finally {
				setComputeToDelete(null);
			}
		}
	};

	return (
		<div className="flex-1 flex flex-col p-6 space-y-6 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Compute Nodes</h1>
					<p className="text-sm text-muted-foreground">
						Manage local and remote hypervisors and container engines powering
						topology emulations.
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
						onClick={() => setAddDialogOpen(true)}
						className="gap-2"
					>
						<Plus className="w-4 h-4" />
						Add Compute
					</Button>
				</div>
			</div>

			{/* Computes Data Table (tablecn style) */}
			<ComputesDataTable
				data={computes}
				isLoading={isLoading}
				onConnect={(id) => connectComputeMutation.mutate(id)}
				onDelete={(c) => setComputeToDelete(c)}
				isConnecting={connectComputeMutation.isPending}
			/>

			{/* Add Compute Modal */}
			<AddComputeDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={Boolean(computeToDelete)}
				onOpenChange={(open) => !open && setComputeToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Compute Node</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove compute node &quot;
							{computeToDelete?.name || computeToDelete?.compute_id}&quot;?
							Network nodes allocated to this compute may become unreachable.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
						>
							Delete Compute
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
