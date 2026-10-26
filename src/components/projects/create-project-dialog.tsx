import { Loader2, Plus, SlidersHorizontal } from "lucide-react";
import type React from "react";
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
import { useCreateProject } from "@/features/projects/use-projects";
import type { GNS3Project } from "@/types/gns3";
import { createProjectSchema } from "./project-schemas";

interface CreateProjectDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: (project: GNS3Project) => void;
}

export function CreateProjectDialog({
	open,
	onOpenChange,
	onSuccess,
}: CreateProjectDialogProps) {
	const [name, setName] = useState("");
	const [sceneWidth, setSceneWidth] = useState(2000);
	const [sceneHeight, setSceneHeight] = useState(1000);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const createProjectMutation = useCreateProject();

	const handleClose = () => {
		setName("");
		setSceneWidth(2000);
		setSceneHeight(1000);
		setShowAdvanced(false);
		setErrors({});
		onOpenChange(false);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const validation = createProjectSchema.safeParse({
			name,
			scene_width: sceneWidth,
			scene_height: sceneHeight,
		});

		if (!validation.success) {
			const formattedErrors: Record<string, string> = {};
			for (const issue of validation.error.issues) {
				const field = issue.path[0] as string;
				formattedErrors[field] = issue.message;
			}
			setErrors(formattedErrors);
			return;
		}

		setErrors({});

		createProjectMutation.mutate(
			{
				name: validation.data.name,
				scene_width: validation.data.scene_width,
				scene_height: validation.data.scene_height,
			},
			{
				onSuccess: (newProj) => {
					handleClose();
					if (onSuccess && newProj) {
						onSuccess(newProj);
					}
				},
				onError: (err: Error) => {
					setErrors({ form: err.message || "Failed to create project" });
				},
			},
		);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Plus className="w-4 h-4 text-primary" />
						Create New Project
					</DialogTitle>
					<DialogDescription>
						Initialize a new network emulation workspace on the GNS3 controller.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 pt-2">
					{errors.form && (
						<div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
							{errors.form}
						</div>
					)}

					<div className="space-y-1.5">
						<Label htmlFor="project-name" className="text-xs font-medium">
							Project Name
						</Label>
						<Input
							id="project-name"
							placeholder="e.g. Enterprise-Core-Network"
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								if (errors.name) {
									setErrors((prev) => {
										const next = { ...prev };
										delete next.name;
										return next;
									});
								}
							}}
							className={`h-8 text-xs ${errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
							autoFocus
							disabled={createProjectMutation.isPending}
						/>
						{errors.name && (
							<p className="text-[11px] text-destructive">{errors.name}</p>
						)}
					</div>

					{/* Optional Advanced Settings Toggle */}
					<div className="pt-1">
						<button
							type="button"
							onClick={() => setShowAdvanced(!showAdvanced)}
							className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
						>
							<SlidersHorizontal className="w-3 h-3" />
							{showAdvanced ? "Hide Canvas Dimensions" : "Custom Dimensions"}
						</button>

						{showAdvanced && (
							<div className="grid grid-cols-2 gap-3 mt-2.5 p-3 rounded-lg border border-border bg-muted/20">
								<div className="space-y-1">
									<Label htmlFor="scene-width" className="text-[11px]">
										Width (px)
									</Label>
									<Input
										id="scene-width"
										type="number"
										value={sceneWidth}
										onChange={(e) => setSceneWidth(Number(e.target.value))}
										className="h-7 text-xs font-mono"
										disabled={createProjectMutation.isPending}
									/>
									{errors.scene_width && (
										<p className="text-[10px] text-destructive">
											{errors.scene_width}
										</p>
									)}
								</div>

								<div className="space-y-1">
									<Label htmlFor="scene-height" className="text-[11px]">
										Height (px)
									</Label>
									<Input
										id="scene-height"
										type="number"
										value={sceneHeight}
										onChange={(e) => setSceneHeight(Number(e.target.value))}
										className="h-7 text-xs font-mono"
										disabled={createProjectMutation.isPending}
									/>
									{errors.scene_height && (
										<p className="text-[10px] text-destructive">
											{errors.scene_height}
										</p>
									)}
								</div>
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
									Creating...
								</>
							) : (
								"Create & Open"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
