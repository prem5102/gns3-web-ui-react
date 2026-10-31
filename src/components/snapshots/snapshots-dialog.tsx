import { Camera, Plus, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	useCreateSnapshot,
	useDeleteSnapshot,
	useRestoreSnapshot,
	useSnapshots,
} from "@/features/snapshots/use-snapshots";
import type { GNS3Snapshot } from "@/types/gns3";

interface SnapshotsDialogProps {
	projectId: string;
	projectName?: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function SnapshotsDialog({
	projectId,
	projectName,
	open,
	onOpenChange,
}: SnapshotsDialogProps) {
	const { data: snapshots = [], isLoading } = useSnapshots(projectId);
	const createSnapshotMutation = useCreateSnapshot(projectId);
	const restoreSnapshotMutation = useRestoreSnapshot(projectId);
	const deleteSnapshotMutation = useDeleteSnapshot(projectId);

	const [newSnapshotName, setNewSnapshotName] = useState("");
	const [snapshotToRestore, setSnapshotToRestore] = useState<GNS3Snapshot | null>(null);
	const [snapshotToDelete, setSnapshotToDelete] = useState<GNS3Snapshot | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newSnapshotName.trim()) return;
		setError(null);
		try {
			await createSnapshotMutation.mutateAsync(newSnapshotName.trim());
			setNewSnapshotName("");
		} catch (err: unknown) {
			setError((err as Error).message || "Failed to create snapshot");
		}
	};

	const handleRestore = async () => {
		if (!snapshotToRestore) return;
		try {
			await restoreSnapshotMutation.mutateAsync(snapshotToRestore.snapshot_id);
		} finally {
			setSnapshotToRestore(null);
		}
	};

	const handleDelete = async () => {
		if (!snapshotToDelete) return;
		try {
			await deleteSnapshotMutation.mutateAsync(snapshotToDelete.snapshot_id);
		} finally {
			setSnapshotToDelete(null);
		}
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Camera className="w-5 h-5 text-primary" />
							Project Snapshots
						</DialogTitle>
						<DialogDescription>
							Save or restore checkpoints for topology &quot;{projectName || projectId}&quot;.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						{error && (
							<div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
								{error}
							</div>
						)}

						{/* Create Snapshot Form */}
						<form onSubmit={handleCreate} className="flex items-center gap-2">
							<Input
								placeholder="New snapshot name (e.g. Initial OSPF Config)"
								value={newSnapshotName}
								onChange={(e) => setNewSnapshotName(e.target.value)}
								className="text-xs"
								disabled={createSnapshotMutation.isPending}
							/>
							<Button
								type="submit"
								size="sm"
								disabled={!newSnapshotName.trim() || createSnapshotMutation.isPending}
								className="gap-1.5 shrink-0"
							>
								<Plus className="w-4 h-4" />
								{createSnapshotMutation.isPending ? "Saving..." : "Take Snapshot"}
							</Button>
						</form>

						{/* Snapshots Table */}
						<div className="rounded-lg border border-border/60 bg-card overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Snapshot Name</TableHead>
										<TableHead className="w-36">Created</TableHead>
										<TableHead className="w-24 text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{isLoading ? (
										<TableRow>
											<TableCell colSpan={3} className="h-24 text-center text-muted-foreground text-xs">
												<RefreshCw className="w-4 h-4 animate-spin inline mr-2 text-primary" />
												Loading snapshots...
											</TableCell>
										</TableRow>
									) : snapshots.length === 0 ? (
										<TableRow>
											<TableCell colSpan={3} className="h-24 text-center text-muted-foreground text-xs">
												No snapshots recorded yet.
											</TableCell>
										</TableRow>
									) : (
										snapshots.map((snap) => (
											<TableRow key={snap.snapshot_id}>
												<TableCell className="font-medium text-xs">
													{snap.name}
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">
													{new Date(snap.created_at * 1000).toLocaleString()}
												</TableCell>
												<TableCell className="text-right">
													<div className="flex items-center justify-end gap-1">
														<Button
															size="icon-xs"
															variant="ghost"
															title="Restore Snapshot"
															onClick={() => setSnapshotToRestore(snap)}
														>
															<RotateCcw className="w-3.5 h-3.5 text-primary" />
														</Button>
														<Button
															size="icon-xs"
															variant="ghost"
															title="Delete Snapshot"
															className="text-destructive hover:bg-destructive/10"
															onClick={() => setSnapshotToDelete(snap)}
														>
															<Trash2 className="w-3.5 h-3.5" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Restore Snapshot Confirmation */}
			<AlertDialog
				open={Boolean(snapshotToRestore)}
				onOpenChange={(open) => !open && setSnapshotToRestore(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Restore Snapshot</AlertDialogTitle>
						<AlertDialogDescription>
							Restoring &quot;{snapshotToRestore?.name}&quot; will revert the project canvas, node states, and configurations to this checkpoint. All running nodes will be stopped.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleRestore}
							className="bg-primary hover:bg-primary/90"
						>
							Restore Checkpoint
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Delete Snapshot Confirmation */}
			<AlertDialog
				open={Boolean(snapshotToDelete)}
				onOpenChange={(open) => !open && setSnapshotToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Snapshot</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete snapshot &quot;{snapshotToDelete?.name}&quot;? This cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
						>
							Delete Snapshot
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
