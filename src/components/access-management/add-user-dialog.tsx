import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useCreateUser } from "@/features/access/use-access";

const addUserSchema = z.object({
	username: z.string().min(2, "Username must be at least 2 characters"),
	password: z.string().min(4, "Password must be at least 4 characters"),
	email: z.string().email("Invalid email").optional().or(z.literal("")),
	full_name: z.string().optional(),
	is_superadmin: z.boolean().default(false),
});

interface AddUserDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
	const createUserMutation = useCreateUser();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [email, setEmail] = useState("");
	const [fullName, setFullName] = useState("");
	const [isSuperadmin, setIsSuperadmin] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [submitError, setSubmitError] = useState<string | null>(null);

	const reset = () => {
		setUsername("");
		setPassword("");
		setEmail("");
		setFullName("");
		setIsSuperadmin(false);
		setErrors({});
		setSubmitError(null);
	};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitError(null);

		const result = addUserSchema.safeParse({
			username,
			password,
			email,
			full_name: fullName,
			is_superadmin: isSuperadmin,
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
			await createUserMutation.mutateAsync({
				username,
				password,
				email: email || undefined,
				full_name: fullName || undefined,
				is_active: true,
				is_superadmin: isSuperadmin,
			});
			reset();
			onOpenChange(false);
		} catch (err: unknown) {
			setSubmitError((err as Error).message || "Failed to create user");
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
					<DialogTitle>Add User Account</DialogTitle>
					<DialogDescription>
						Create a new account with access to the GNS3 controller and
						projects.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={onSubmit} className="space-y-4 py-2">
					{submitError && (
						<div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
							{submitError}
						</div>
					)}

					<div className="space-y-1.5">
						<Label htmlFor="user-username">Username</Label>
						<Input
							id="user-username"
							placeholder="e.g. jdoe"
							value={username}
							onChange={(e) => {
								setUsername(e.target.value);
								if (errors.username)
									setErrors((prev) => ({ ...prev, username: "" }));
							}}
						/>
						{errors.username && (
							<p className="text-xs text-destructive">{errors.username}</p>
						)}
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="user-password">Password</Label>
						<Input
							id="user-password"
							type="password"
							placeholder="••••••••"
							value={password}
							onChange={(e) => {
								setPassword(e.target.value);
								if (errors.password)
									setErrors((prev) => ({ ...prev, password: "" }));
							}}
						/>
						{errors.password && (
							<p className="text-xs text-destructive">{errors.password}</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="user-fullname">Full Name (Optional)</Label>
							<Input
								id="user-fullname"
								placeholder="John Doe"
								value={fullName}
								onChange={(e) => setFullName(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="user-email">Email (Optional)</Label>
							<Input
								id="user-email"
								type="email"
								placeholder="jdoe@example.com"
								value={email}
								onChange={(e) => {
									setEmail(e.target.value);
									if (errors.email)
										setErrors((prev) => ({ ...prev, email: "" }));
								}}
							/>
							{errors.email && (
								<p className="text-xs text-destructive">{errors.email}</p>
							)}
						</div>
					</div>

					<div className="flex items-center space-x-2 pt-1">
						<Checkbox
							id="user-superadmin"
							checked={isSuperadmin}
							onCheckedChange={(checked) => setIsSuperadmin(Boolean(checked))}
						/>
						<Label
							htmlFor="user-superadmin"
							className="text-sm font-normal cursor-pointer"
						>
							Grant Super Administrator privileges
						</Label>
					</div>

					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={createUserMutation.isPending}>
							{createUserMutation.isPending ? "Creating..." : "Create User"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
