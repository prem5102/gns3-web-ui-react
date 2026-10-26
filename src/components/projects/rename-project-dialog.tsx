import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
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
import { projectKeys } from "@/features/query-keys";
import { gns3Api } from "@/lib/gns3-api";
import type { GNS3Project } from "@/types/gns3";
import { renameProjectSchema } from "./project-schemas";

interface RenameProjectDialogProps {
	project: GNS3Project | null;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function RenameProjectDialog({
	project,
	onOpenChange,
	onSuccess,
}: RenameProjectDialogProps) {
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (project) {
			setName(project.name);
			setError(null);
		}
	}, [project]);

	const handleClose = () => {
		setError(null);
		onOpenChange(false);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!project) return;

		const validation = renameProjectSchema.safeParse({ name });
		if (!validation.success) {
			setError(validation.error.issues[0]?.message || "Invalid project name");
			return;
		}

		setError(null);
		setIsSubmitting(true);

		try {
			await gns3Api.updateProject(project.project_id, {
				name: validation.data.name,
			});
			await queryClient.invalidateQueries({ queryKey: projectKeys.all });
			await queryClient.invalidateQueries({
				queryKey: projectKeys.detail(project.project_id),
			});
			handleClose();
			onSuccess?.();
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Failed to rename project");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={Boolean(project)} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Pencil className="w-4 h-4 text-primary" />
						Rename Project
					</DialogTitle>
					<DialogDescription>
						Update the display name of this network emulation lab.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 pt-2">
					<div className="space-y-1.5">
						<Label htmlFor="rename-project-name" className="text-xs font-medium">
							Project Name
						</Label>
						<Input
							id="rename-project-name"
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								if (error) setError(null);
							}}
							className={`h-8 text-xs ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
							autoFocus
							disabled={isSubmitting}
						/>
						{error && <p className="text-[11px] text-destructive">{error}</p>}
					</div>

					<DialogFooter className="gap-2 sm:gap-0 pt-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleClose}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							disabled={!name.trim() || isSubmitting}
							className="gap-1.5"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
									Saving...
								</>
							) : (
								"Save Changes"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
