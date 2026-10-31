import { Plus, RefreshCw, RotateCw, Trash } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
	useDeleteImage,
	useImages,
	usePruneImages,
	useSyncImages,
} from "@/features/images/use-images";
import type { GNS3Image } from "@/types/gns3";
import { AddImageDialog } from "./add-image-dialog";
import { ImagesDataTable } from "./table";

export function ImageManagerView() {
	const { data: images = [], isLoading, isFetching, refetch } = useImages();
	const deleteImageMutation = useDeleteImage();
	const syncImagesMutation = useSyncImages();
	const pruneImagesMutation = usePruneImages();

	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [imageToDelete, setImageToDelete] = useState<GNS3Image | null>(null);
	const [pruneAlertOpen, setPruneAlertOpen] = useState(false);

	const imageTypes = useMemo(() => {
		const types = new Set<string>();
		images.forEach((img) => {
			if (img.image_type) types.add(img.image_type);
		});
		return Array.from(types);
	}, [images]);

	const handleDeleteConfirm = async () => {
		if (imageToDelete) {
			try {
				await deleteImageMutation.mutateAsync(imageToDelete.path);
			} finally {
				setImageToDelete(null);
			}
		}
	};

	const handlePruneConfirm = async () => {
		try {
			await pruneImagesMutation.mutateAsync();
		} finally {
			setPruneAlertOpen(false);
		}
	};

	return (
		<div className="flex-1 flex flex-col p-6 space-y-6 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Image Manager</h1>
					<p className="text-sm text-muted-foreground">
						Manage appliance ISOs, VM disks, container archives, and Cisco IOS
						firmware images.
					</p>
				</div>
				<div className="flex items-center gap-2 flex-wrap">
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
						variant="outline"
						size="sm"
						onClick={() => syncImagesMutation.mutate({})}
						disabled={syncImagesMutation.isPending}
						className="gap-2"
					>
						<RotateCw
							className={`w-4 h-4 ${syncImagesMutation.isPending ? "animate-spin" : ""}`}
						/>
						{syncImagesMutation.isPending ? "Syncing..." : "Sync Images"}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPruneAlertOpen(true)}
						disabled={pruneImagesMutation.isPending}
						className="gap-2 text-destructive hover:bg-destructive/10"
					>
						<Trash className="w-4 h-4" />
						Prune Images
					</Button>
					<Button
						size="sm"
						onClick={() => setAddDialogOpen(true)}
						className="gap-2"
					>
						<Plus className="w-4 h-4" />
						Add Image
					</Button>
				</div>
			</div>

			{/* Images Data Table (tablecn style) */}
			<ImagesDataTable
				data={images}
				imageTypes={imageTypes}
				isLoading={isLoading}
				onDelete={(img) => setImageToDelete(img)}
			/>

			{/* Add Image Dialog */}
			<AddImageDialog
				open={addDialogOpen}
				onOpenChange={setAddDialogOpen}
				onSuccess={() => refetch()}
			/>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={Boolean(imageToDelete)}
				onOpenChange={(open) => !open && setImageToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Image</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to permanently delete image &quot;
							{imageToDelete?.filename}&quot;? This operation removes the file
							from controller storage and cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
						>
							Delete Image
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Prune Confirmation Dialog */}
			<AlertDialog open={pruneAlertOpen} onOpenChange={setPruneAlertOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Prune Unused Images</AlertDialogTitle>
						<AlertDialogDescription>
							This will remove all image files in storage that are not
							associated with any existing node template or active lab device.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handlePruneConfirm}
							className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
						>
							Prune Images
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
