import { Upload, X } from "lucide-react";
import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { gns3Api } from "@/lib/gns3-api";

interface AddImageDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function AddImageDialog({
	open,
	onOpenChange,
	onSuccess,
}: AddImageDialogProps) {
	const [imageType, setImageType] = useState<string>("qemu");
	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setFile(e.target.files[0]);
			setErrorMessage(null);
		}
	};

	const handleUpload = async () => {
		if (!file) {
			setErrorMessage("Please select an image file to upload");
			return;
		}

		setUploading(true);
		setProgress(0);
		setErrorMessage(null);

		try {
			const token = gns3Api.getAuthToken();
			const baseUrl = gns3Api.getBaseUrl();
			const encodedFilename = encodeURIComponent(file.name);
			const url = `${baseUrl}/v3/images/upload/${imageType}/${encodedFilename}?install_appliances=true`;

			const xhr = new XMLHttpRequest();
			xhr.open("POST", url, true);

			if (token) {
				xhr.setRequestHeader("Authorization", `Bearer ${token}`);
			}

			xhr.upload.onprogress = (evt) => {
				if (evt.lengthComputable) {
					const pct = Math.round((evt.loaded / evt.total) * 100);
					setProgress(pct);
				}
			};

			xhr.onload = () => {
				setUploading(false);
				if (xhr.status >= 200 && xhr.status < 300) {
					onSuccess?.();
					onOpenChange(false);
					setFile(null);
				} else {
					setErrorMessage(`Upload failed with HTTP ${xhr.status}: ${xhr.statusText}`);
				}
			};

			xhr.onerror = () => {
				setUploading(false);
				setErrorMessage("Network error occurred during image upload");
			};

			xhr.send(file);
		} catch (err: unknown) {
			setUploading(false);
			setErrorMessage((err as Error).message || "Failed to start image upload");
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!uploading) {
					if (!next) {
						setFile(null);
						setErrorMessage(null);
					}
					onOpenChange(next);
				}
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add Appliance Image</DialogTitle>
					<DialogDescription>
						Upload a virtual disk image (.qcow2, .img), IOS bin, or IOU image to the GNS3 storage library.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{errorMessage && (
						<div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
							{errorMessage}
						</div>
					)}

					<div className="space-y-1.5">
						<Label htmlFor="image-type-select">Target Emulator Type</Label>
						<Select value={imageType} onValueChange={setImageType} disabled={uploading}>
							<SelectTrigger id="image-type-select">
								<SelectValue placeholder="Select type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="qemu">QEMU (qcow2, img, vmdk, iso)</SelectItem>
								<SelectItem value="dynamips">Dynamips (Cisco IOS .bin, .image)</SelectItem>
								<SelectItem value="iou">IOS on Unix (IOU / IOL)</SelectItem>
								<SelectItem value="docker">Docker Container tarball</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label>Select Image File</Label>
						<div className="border-2 border-dashed border-border/80 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors bg-muted/20">
							<Upload className="w-8 h-8 text-muted-foreground mb-2 stroke-1" />
							{file ? (
								<div className="flex items-center gap-2 text-sm font-medium text-foreground">
									<span className="truncate max-w-xs">{file.name}</span>
									<span className="text-xs text-muted-foreground">
										({(file.size / (1024 * 1024)).toFixed(1)} MB)
									</span>
									{!uploading && (
										<Button
											size="icon-xs"
											variant="ghost"
											onClick={(e) => {
												e.stopPropagation();
												setFile(null);
											}}
										>
											<X className="w-3.5 h-3.5" />
										</Button>
									)}
								</div>
							) : (
								<>
									<p className="text-xs text-muted-foreground mb-2">
										Drag and drop or browse from your computer
									</p>
									<Input
										id="file-input"
										type="file"
										className="max-w-xs text-xs"
										onChange={handleFileSelect}
										disabled={uploading}
									/>
								</>
							)}
						</div>
					</div>

					{uploading && (
						<div className="space-y-2 pt-1">
							<div className="flex items-center justify-between text-xs font-medium">
								<span>Uploading image...</span>
								<span>{progress}%</span>
							</div>
							<div className="w-full bg-muted rounded-full h-2 overflow-hidden">
								<div
									className="bg-primary h-2 rounded-full transition-all duration-200"
									style={{ width: `${progress}%` }}
								/>
							</div>
						</div>
					)}
				</div>

				<DialogFooter className="pt-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={uploading}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleUpload}
						disabled={!file || uploading}
					>
						{uploading ? `Uploading (${progress}%)` : "Upload Image"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
