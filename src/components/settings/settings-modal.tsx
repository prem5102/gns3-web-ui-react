import { AlertCircle, Check, RefreshCw } from "lucide-react";
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
	useControllerMe,
	useControllerVersion,
} from "@/features/controller/use-controller";
import { gns3Api } from "@/lib/gns3-api";
import { useUIStore } from "@/stores/ui-store";

export function SettingsModal() {
	const {
		settingsModalOpen,
		setSettingsModalOpen,
		controllerUrl,
		controllerUsername,
		setControllerConfig,
		addEvent,
	} = useUIStore();

	const [url, setUrl] = useState(controllerUrl);
	const [username, setUsername] = useState(controllerUsername);
	const [password, setPassword] = useState("admin");
	const [testing, setTesting] = useState(false);
	const [testResult, setTestResult] = useState<{
		success: boolean;
		message: string;
		version?: string;
	} | null>(null);

	const { refetch: refetchVersion } = useControllerVersion();
	const { refetch: refetchMe } = useControllerMe();

	const handleTestAndSave = async () => {
		setTesting(true);
		setTestResult(null);

		try {
			// Configure API client with new URL
			gns3Api.setConfig({ baseUrl: url });

			// Test login
			await gns3Api.login(username, password);

			// Fetch version
			const ver = await gns3Api.getVersion();

			setTestResult({
				success: true,
				message: "Successfully connected and authenticated!",
				version: ver.version,
			});

			setControllerConfig(url, username);

			addEvent({
				level: "success",
				message: `Controller updated: ${url} (GNS3 ${ver.version})`,
				source: "Settings",
			});

			refetchVersion();
			refetchMe();
		} catch (err: unknown) {
			const msg = (err as Error).message || "Connection failed";
			setTestResult({
				success: false,
				message: msg,
			});
			addEvent({
				level: "error",
				message: `Controller connection failed: ${msg}`,
				source: "Settings",
			});
		} finally {
			setTesting(false);
		}
	};

	return (
		<Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Controller Settings</DialogTitle>
					<DialogDescription>
						Configure GNS3 Controller URL and authentication credentials.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col space-y-4 py-2 text-xs">
					<div className="flex flex-col space-y-1.5">
						<Label htmlFor="ctrl-url" className="text-xs">
							Controller Base URL / Proxy Path
						</Label>
						<Input
							id="ctrl-url"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder="/api/gns3 or http://127.0.0.1:80"
							className="h-8 font-mono text-xs"
						/>
						<span className="text-[10px] text-muted-foreground">
							Use default{" "}
							<code className="bg-muted px-1 py-0.5 rounded">/api/gns3</code> to
							route through local proxy, or enter external controller URL.
						</span>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="flex flex-col space-y-1.5">
							<Label htmlFor="ctrl-user" className="text-xs">
								Username
							</Label>
							<Input
								id="ctrl-user"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder="admin"
								className="h-8 text-xs"
							/>
						</div>

						<div className="flex flex-col space-y-1.5">
							<Label htmlFor="ctrl-pass" className="text-xs">
								Password
							</Label>
							<Input
								id="ctrl-pass"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
								className="h-8 text-xs"
							/>
						</div>
					</div>

					{testResult && (
						<div
							className={`flex items-start gap-2 p-2.5 rounded-md border text-xs ${
								testResult.success
									? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
									: "bg-destructive/10 border-destructive/30 text-destructive"
							}`}
						>
							{testResult.success ? (
								<Check className="w-4 h-4 mt-0.5 shrink-0" />
							) : (
								<AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
							)}
							<div className="flex flex-col">
								<span className="font-semibold">{testResult.message}</span>
								{testResult.version && (
									<span className="text-[11px] font-mono mt-0.5">
										Controller Version: GNS3 {testResult.version}
									</span>
								)}
							</div>
						</div>
					)}
				</div>

				<DialogFooter className="flex items-center justify-between sm:justify-end gap-2">
					<Button
						size="sm"
						variant="outline"
						onClick={() => setSettingsModalOpen(false)}
					>
						Close
					</Button>
					<Button
						size="sm"
						onClick={handleTestAndSave}
						disabled={testing}
						className="gap-1.5"
					>
						{testing ? (
							<>
								<RefreshCw className="w-3.5 h-3.5 animate-spin" />
								<span>Testing...</span>
							</>
						) : (
							<span>Save & Connect</span>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
