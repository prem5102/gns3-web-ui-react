import { useState } from "react";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateTemplate } from "@/features/templates/use-templates";

const createTemplateSchema = z.object({
	name: z.string().min(1, "Template name is required"),
	category: z.enum(["router", "switch", "guest", "firewall"]),
	template_type: z.enum([
		"qemu",
		"docker",
		"dynamips",
		"vpcs",
		"iou",
		"ethernet_switch",
		"ethernet_hub",
		"cloud",
	]),
	default_name_format: z.string().optional(),
	usage: z.string().optional(),
});

interface CreateTemplateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CreateTemplateDialog({
	open,
	onOpenChange,
}: CreateTemplateDialogProps) {
	const createTemplateMutation = useCreateTemplate();
	const [name, setName] = useState("");
	const [category, setCategory] = useState<
		"router" | "switch" | "guest" | "firewall"
	>("router");
	const [templateType, setTemplateType] = useState<
		| "qemu"
		| "docker"
		| "dynamips"
		| "vpcs"
		| "iou"
		| "ethernet_switch"
		| "ethernet_hub"
		| "cloud"
	>("qemu");
	const [defaultNameFormat, setDefaultNameFormat] = useState("{name}-{0}");
	const [usage, setUsage] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [submitError, setSubmitError] = useState<string | null>(null);

	const reset = () => {
		setName("");
		setCategory("router");
		setTemplateType("qemu");
		setDefaultNameFormat("{name}-{0}");
		setUsage("");
		setErrors({});
		setSubmitError(null);
	};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitError(null);

		const result = createTemplateSchema.safeParse({
			name,
			category,
			template_type: templateType,
			default_name_format: defaultNameFormat || undefined,
			usage: usage || undefined,
		});

		if (!result.success) {
			const formatted: Record<string, string> = {};
			for (const issue of result.error.issues) {
				const field = issue.path[0] as string;
				formatted[field] = issue.message;
			}
			setErrors(formatted);
			return;
		}

		try {
			await createTemplateMutation.mutateAsync({
				name,
				category,
				template_type: templateType,
				default_name_format: defaultNameFormat || undefined,
				usage: usage || undefined,
				builtin: false,
			});
			reset();
			onOpenChange(false);
		} catch (err: unknown) {
			setSubmitError(
				(err as Error).message || "Failed to create appliance template",
			);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) {
					reset();
				}
				onOpenChange(next);
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>New Custom Template</DialogTitle>
					<DialogDescription>
						Configure an appliance template blueprint for network topologies.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={onSubmit} className="space-y-4 py-2">
					{submitError && (
						<div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
							{submitError}
						</div>
					)}

					<div className="space-y-1.5">
						<Label htmlFor="template-name">Template Name</Label>
						<Input
							id="template-name"
							placeholder="e.g. Cisco IOSv 15.6, Alpine Linux"
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
							}}
						/>
						{errors.name && (
							<p className="text-xs text-destructive">{errors.name}</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="template-category">Category</Label>
							<Select
								value={category}
								onValueChange={(
									val: "router" | "switch" | "guest" | "firewall",
								) => setCategory(val)}
							>
								<SelectTrigger id="template-category">
									<SelectValue placeholder="Category" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="router">Routers</SelectItem>
									<SelectItem value="switch">Switches</SelectItem>
									<SelectItem value="guest">End Devices</SelectItem>
									<SelectItem value="firewall">Security Devices</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="template-type">Emulator Type</Label>
							<Select
								value={templateType}
								onValueChange={(
									val:
										| "qemu"
										| "docker"
										| "dynamips"
										| "vpcs"
										| "iou"
										| "ethernet_switch"
										| "ethernet_hub"
										| "cloud",
								) => setTemplateType(val)}
							>
								<SelectTrigger id="template-type">
									<SelectValue placeholder="Type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="qemu">QEMU VM</SelectItem>
									<SelectItem value="docker">Docker Container</SelectItem>
									<SelectItem value="dynamips">Dynamips IOS</SelectItem>
									<SelectItem value="iou">IOS on Unix (IOU)</SelectItem>
									<SelectItem value="vpcs">VPCS Host</SelectItem>
									<SelectItem value="ethernet_switch">
										Ethernet Switch
									</SelectItem>
									<SelectItem value="ethernet_hub">Ethernet Hub</SelectItem>
									<SelectItem value="cloud">Cloud Node</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="default-format">Default Node Name Format</Label>
						<Input
							id="default-format"
							placeholder="{name}-{0}"
							value={defaultNameFormat}
							onChange={(e) => setDefaultNameFormat(e.target.value)}
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="template-usage">Usage Instructions</Label>
						<Textarea
							id="template-usage"
							placeholder="Login credentials, default IP settings, or notes..."
							rows={3}
							value={usage}
							onChange={(e) => setUsage(e.target.value)}
						/>
					</div>

					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={createTemplateMutation.isPending}>
							{createTemplateMutation.isPending
								? "Creating..."
								: "Create Template"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
