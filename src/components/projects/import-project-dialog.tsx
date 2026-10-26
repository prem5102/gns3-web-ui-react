import { FileArchive, Loader2, Upload } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
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
import { useCreateProject } from "@/features/projects/use-projects";
import type { GNS3Project } from "@/types/gns3";
import { renameProjectSchema } from "./project-schemas";

interface ImportProjectDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: (project: GNS3Project) => void;
}

export function ImportProjectDialog({
	open,
	onOpenChange,
	onSuccess,
}: ImportProjectDialogProps) {
	const [name, setName] = useState("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const createProjectMutation = useCreateProject();

	const handleClose = () => {
		setName("");
		setSelectedFile(null);
		setError(null);
		onOpenChange(false);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setSelectedFile(file);
			if (!name.trim()) {
				// Strip file extension for default project name
				const cleanName = file.name
					.replace(/\.gns3(project)?$/i, "")
					.replace(/[^a-zA-Z0-9_\- ]/g, "_");
				setName(cleanName);
			}
			setError(null);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const validation = renameProjectSchema.safeParse({ name });
		if (!validation.success) {
			setError(validation.error.issues[0]?.message || "Invalid project name");
			return;
		}

		setError(null);

		createProjectMutation.mutate(
			{ name: validation.data.name },
			{
				onSuccess: (newProj) => {
					handleClose();
					if (onSuccess && newProj) {
						onSuccess(newProj);
					}
				},
				onError: (err: Error) => {
					setError(err.message || "Failed to import project");
				},
			},
		);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Upload className="w-4 h-4 text-primary" />
						Import Project
					</DialogTitle>
					<DialogDescription>
						Import a portable <code className="font-mono text-xs">.gns3</code> or{" "}
						<code className="font-mono text-xs">.gns3project</code> topology archive.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 pt-2">
					{error && (
						<div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
							{error}
						</div>
					)}

					<div className="space-y-1.5">
						<Label htmlFor="import-project-name" className="text-xs font-medium">
							Project Name
						</Label>
						<Input
							id="import-project-name"
							placeholder="e.g. Enterprise-Core-Network"
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								if (error) setError(null);
							}}
							className="h-8 text-xs"
							disabled={createProjectMutation.isPending}
						/>
					</div>

					{/* File drop / select container */}
					<input
						type="file"
						ref={fileInputRef}
						onChange={handleFileChange}
						accept=".gns3,.gns3project,.zip"
						className="hidden"
					/>

					<div
						onClick={() => fileInputRef.current?.click()}
						className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-5 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/30"
					>
						{selectedFile ? (
							<div className="flex items-center justify-center gap-2 text-foreground font-medium text-xs">
								<FileArchive className="w-5 h-5 text-primary" />
								<span className="truncate max-w-50">{selectedFile.name}</span>
								<span className="text-[10px] text-muted-foreground font-mono">
									({(selectedFile.size / 1024).toFixed(1)} KB)
								</span>
							</div>
						) : (
							<div className="space-y-1">
								<Upload className="w-6 h-6 mx-auto text-muted-foreground/80 mb-1" />
								<p className="font-medium text-xs text-foreground">
									Click to choose or drop topology file
								</p>
								<p className="text-[11px] text-muted-foreground">
									Supports .gns3project and .gns3 files
								</p>
							</div>
						)}
					</div>

					<DialogFooter className="gap-2 sm:gap-0 pt-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleClose}
							disabled={createProjectMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							disabled={!name.trim() || createProjectMutation.isPending}
							className="gap-1.5"
						>
							{createProjectMutation.isPending ? (
								<>
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
									Importing...
								</>
							) : (
								"Import & Open"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
