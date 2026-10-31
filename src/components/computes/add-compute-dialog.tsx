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
import { useCreateCompute } from "@/features/computes/use-computes";

const addComputeSchema = z.object({
	name: z.string().optional(),
	host: z.string().min(1, "Host is required"),
	port: z.coerce.number().min(1).max(65535, "Port must be between 1 and 65535"),
	protocol: z.enum(["http", "https"]),
	user: z.string().optional(),
	password: z.string().optional(),
});

interface AddComputeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AddComputeDialog({
	open,
	onOpenChange,
}: AddComputeDialogProps) {
	const createComputeMutation = useCreateCompute();
	const [name, setName] = useState("");
	const [host, setHost] = useState("127.0.0.1");
	const [port, setPort] = useState("3080");
	const [protocol, setProtocol] = useState<"http" | "https">("http");
	const [user, setUser] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [submitError, setSubmitError] = useState<string | null>(null);

	const reset = () => {
		setName("");
		setHost("127.0.0.1");
		setPort("3080");
		setProtocol("http");
		setUser("");
		setPassword("");
		setErrors({});
		setSubmitError(null);
	};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitError(null);

		const result = addComputeSchema.safeParse({
			name: name || undefined,
			host,
			port: Number(port),
			protocol,
			user: user || undefined,
			password: password || undefined,
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
			await createComputeMutation.mutateAsync({
				name: name || undefined,
				host,
				port: Number(port),
				protocol,
				user: user || undefined,
				password: password || undefined,
			});
			reset();
			onOpenChange(false);
		} catch (err: unknown) {
			setSubmitError((err as Error).message || "Failed to add compute node");
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
					<DialogTitle>Add Compute Node</DialogTitle>
					<DialogDescription>
						Connect a remote GNS3 compute server to distribute VM and container
						emulation workloads.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={onSubmit} className="space-y-4 py-2">
					{submitError && (
						<div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
							{submitError}
						</div>
					)}

					<div className="space-y-1.5">
						<Label htmlFor="compute-name">Compute Name (Optional)</Label>
						<Input
							id="compute-name"
							placeholder="e.g. Remote Server 1"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					<div className="grid grid-cols-3 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="compute-protocol">Protocol</Label>
							<Select
								value={protocol}
								onValueChange={(val: "http" | "https") => setProtocol(val)}
							>
								<SelectTrigger id="compute-protocol">
									<SelectValue placeholder="Protocol" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="http">HTTP</SelectItem>
									<SelectItem value="https">HTTPS</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="col-span-2 space-y-1.5">
							<Label htmlFor="compute-host">Host</Label>
							<Input
								id="compute-host"
								placeholder="127.0.0.1 or domain"
								value={host}
								onChange={(e) => {
									setHost(e.target.value);
									if (errors.host) setErrors((prev) => ({ ...prev, host: "" }));
								}}
							/>
							{errors.host && (
								<p className="text-xs text-destructive">{errors.host}</p>
							)}
						</div>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="compute-port">Port</Label>
						<Input
							id="compute-port"
							type="number"
							placeholder="3080"
							value={port}
							onChange={(e) => {
								setPort(e.target.value);
								if (errors.port) setErrors((prev) => ({ ...prev, port: "" }));
							}}
						/>
						{errors.port && (
							<p className="text-xs text-destructive">{errors.port}</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="compute-user">Username</Label>
							<Input
								id="compute-user"
								placeholder="admin"
								value={user}
								onChange={(e) => setUser(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="compute-pass">Password</Label>
							<Input
								id="compute-pass"
								type="password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
					</div>

					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={createComputeMutation.isPending}>
							{createComputeMutation.isPending
								? "Connecting..."
								: "Add Compute"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
