import {
	CheckCircle2,
	HardDrive,
	Plus,
	RefreshCw,
	RotateCw,
	Search,
	Trash,
	Trash2,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	useDeleteImage,
	useImages,
	usePruneImages,
	useSyncImages,
} from "@/features/images/use-images";
import { formatBytes } from "@/lib/utils";
import type { GNS3Image } from "@/types/gns3";
import { AddImageDialog } from "./add-image-dialog";

export function ImageManagerView() {
	const { data: images = [], isLoading, isFetching, refetch } = useImages();
	const deleteImageMutation = useDeleteImage();
	const syncImagesMutation = useSyncImages();
	const pruneImagesMutation = usePruneImages();

	const [searchText, setSearchText] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [imageToDelete, setImageToDelete] = useState<GNS3Image | null>(null);
	const [pruneAlertOpen, setPruneAlertOpen] = useState(false);

	const totalSize = useMemo(
		() => images.reduce((acc, img) => acc + (img.image_size || 0), 0),
		[images],
	);

	const imageTypes = useMemo(() => {
		const types = new Set<string>();
		images.forEach((img) => {
			if (img.image_type) types.add(img.image_type);
		});
		return Array.from(types);
	}, [images]);

	const filteredImages = useMemo(() => {
		return images.filter((img) => {
			const query = searchText.toLowerCase().trim();
			const matchesSearch =
				!query ||
				img.filename.toLowerCase().includes(query) ||
				img.path.toLowerCase().includes(query) ||
				(img.checksum && img.checksum.toLowerCase().includes(query));

			const matchesType =
				typeFilter === "all" || img.image_type === typeFilter;

			return matchesSearch && matchesType;
		});
	}, [images, searchText, typeFilter]);

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
						Manage appliance ISOs, VM disks, container archives, and Cisco IOS firmware images.
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
						<RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
						Refresh
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => syncImagesMutation.mutate({})}
						disabled={syncImagesMutation.isPending}
						className="gap-2"
					>
						<RotateCw className={`w-4 h-4 ${syncImagesMutation.isPending ? "animate-spin" : ""}`} />
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

			{/* Metric Stat Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<Card className="border-border/60 shadow-xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">Registered Images</p>
							<p className="text-2xl font-bold">{images.length}</p>
						</div>
						<div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
							<HardDrive className="w-5 h-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60 shadow-xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">Total Storage Consumed</p>
							<p className="text-2xl font-bold">{formatBytes(totalSize)}</p>
						</div>
						<div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
							<CheckCircle2 className="w-5 h-5" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filter & Search Bar */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Search by filename, path, or checksum..."
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						className="pl-9"
					/>
				</div>

				<div className="flex items-center gap-2">
					<Select value={typeFilter} onValueChange={setTypeFilter}>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Image type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All types</SelectItem>
							{imageTypes.map((t) => (
								<SelectItem key={t} value={t}>
									{t.toUpperCase()}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Images Table */}
			<div className="rounded-lg border border-border/60 bg-card overflow-hidden shadow-xs">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-80">Filename</TableHead>
							<TableHead className="w-28">Type</TableHead>
							<TableHead className="w-32">Size</TableHead>
							<TableHead>Path / Location</TableHead>
							<TableHead className="w-48">Checksum</TableHead>
							<TableHead className="w-20 text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
									<RefreshCw className="w-5 h-5 animate-spin inline mr-2 text-primary" />
									Loading image library...
								</TableCell>
							</TableRow>
						) : filteredImages.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="h-36 text-center">
									<div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
										<HardDrive className="w-8 h-8 stroke-1 text-muted-foreground/60" />
										<p className="font-medium text-foreground">No images found</p>
										<p className="text-xs">
											{searchText || typeFilter !== "all"
												? "No images match your filter criteria."
												: "Upload virtual disk images or firmware binaries to populate the library."}
										</p>
										{!searchText && typeFilter === "all" && (
											<Button
												size="sm"
												variant="outline"
												onClick={() => setAddDialogOpen(true)}
												className="mt-2 gap-2"
											>
												<Plus className="w-4 h-4" />
												Upload Image
											</Button>
										)}
									</div>
								</TableCell>
							</TableRow>
						) : (
							filteredImages.map((image) => (
								<TableRow key={image.path}>
									<TableCell>
										<div className="flex items-center gap-2.5">
											<HardDrive className="w-4 h-4 text-muted-foreground shrink-0" />
											<span className="font-semibold text-sm truncate" title={image.filename}>
												{image.filename}
											</span>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant="secondary" className="font-mono text-xs uppercase">
											{image.image_type}
										</Badge>
									</TableCell>
									<TableCell>
										<span className="text-xs font-medium">
											{formatBytes(image.image_size)}
										</span>
									</TableCell>
									<TableCell>
										<span className="font-mono text-xs text-muted-foreground truncate block max-w-sm" title={image.path}>
											{image.path}
										</span>
									</TableCell>
									<TableCell>
										{image.checksum ? (
											<span
												className="font-mono text-xs text-muted-foreground truncate block max-w-32"
												title={image.checksum}
											>
												{image.checksum.slice(0, 12)}...
											</span>
										) : (
											<span className="text-xs text-muted-foreground italic">-</span>
										)}
									</TableCell>
									<TableCell className="text-right">
										<Button
											size="icon-xs"
											variant="ghost"
											className="text-destructive hover:bg-destructive/10"
											title="Delete Image"
											onClick={() => setImageToDelete(image)}
										>
											<Trash2 className="w-3.5 h-3.5" />
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Add Image Dialog */}
			<AddImageDialog
				open={addDialogOpen}
				onOpenChange={setAddDialogOpen}
				onSuccess={() => refetch()}
			/>

			{/* Delete Image Confirmation */}
			<AlertDialog
				open={Boolean(imageToDelete)}
				onOpenChange={(open) => !open && setImageToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Image File</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to permanently delete image &quot;{imageToDelete?.filename}&quot; from server storage? This cannot be undone.
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

			{/* Prune Images Confirmation */}
			<AlertDialog open={pruneAlertOpen} onOpenChange={setPruneAlertOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Prune Unused Images</AlertDialogTitle>
						<AlertDialogDescription>
							Pruning will scan disk storage and remove orphaned temporary files and unused images not referenced by any templates.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handlePruneConfirm}
							className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
						>
							Prune Unused Files
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
