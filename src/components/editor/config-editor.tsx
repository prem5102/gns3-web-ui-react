import Editor from "@monaco-editor/react";
import { AlertCircle, Check, FileCode, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjectNodes } from "@/features/nodes/use-nodes";
import { gns3Api } from "@/lib/gns3-api";
import { useTopologyStore } from "@/stores/topology-store";
import { useUIStore } from "@/stores/ui-store";

export function ConfigEditor() {
	const { activeProjectId } = useTopologyStore();
	const { activeEditorNodeId, theme, addEvent } = useUIStore();
	const { data: nodes = [] } = useProjectNodes(activeProjectId);

	const node = nodes.find((n) => n.node_id === activeEditorNodeId);

	const [files, setFiles] = useState<Array<{ name: string }>>([]);
	const [selectedFile, setSelectedFile] = useState<string>("");
	const [content, setContent] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);
	const [saving, setSaving] = useState<boolean>(false);
	const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [isClient, setIsClient] = useState<boolean>(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	// Fetch node files on node selection
	useEffect(() => {
		if (!activeProjectId || !activeEditorNodeId) return;

		let isMounted = true;
		setLoading(true);
		setError(null);

		gns3Api
			.getNodeFiles(activeProjectId, activeEditorNodeId)
			.then((fileList) => {
				if (!isMounted) return;
				setFiles(fileList);
				if (fileList.length > 0) {
					setSelectedFile(fileList[0].name);
				} else {
					// If no files exposed by this node, set a default virtual config template
					setSelectedFile("startup-config");
					setContent(
						`! Configuration for ${node?.name || "Device"}\r\n!\r\nhostname ${node?.name || "Device"}\r\n!\r\nend\r\n`,
					);
				}
			})
			.catch((_err) => {
				if (!isMounted) return;
				// Fallback default config if node doesn't support file listing
				setFiles([{ name: "startup-config" }]);
				setSelectedFile("startup-config");
				setContent(
					`! Configuration for ${node?.name || "Device"}\r\n!\r\nhostname ${node?.name || "Device"}\r\n!\r\nend\r\n`,
				);
			})
			.finally(() => {
				if (isMounted) setLoading(false);
			});

		return () => {
			isMounted = false;
		};
	}, [activeProjectId, activeEditorNodeId, node?.name]);

	// Fetch file content when file changes
	useEffect(() => {
		if (!activeProjectId || !activeEditorNodeId || !selectedFile) return;

		let isMounted = true;
		setLoading(true);
		setError(null);

		gns3Api
			.getNodeFileContent(activeProjectId, activeEditorNodeId, selectedFile)
			.then((text) => {
				if (isMounted) setContent(text);
			})
			.catch((_err) => {
				if (isMounted) {
					// Provide placeholder if file is empty or new
					if (!content) {
						setContent(
							`! Configuration for ${node?.name || "Device"}\r\n!\r\nhostname ${node?.name || "Device"}\r\n!\r\nend\r\n`,
						);
					}
				}
			})
			.finally(() => {
				if (isMounted) setLoading(false);
			});

		return () => {
			isMounted = false;
		};
	}, [activeProjectId, activeEditorNodeId, selectedFile, node?.name, content]);

	const handleSave = async () => {
		if (!activeProjectId || !activeEditorNodeId || !selectedFile) return;

		setSaving(true);
		setError(null);
		try {
			await gns3Api.saveNodeFileContent(
				activeProjectId,
				activeEditorNodeId,
				selectedFile,
				content,
			);
			setSavedSuccess(true);
			setTimeout(() => setSavedSuccess(false), 2000);
			addEvent({
				level: "success",
				message: `Saved configuration for ${node?.name || "Device"} (${selectedFile})`,
				source: "Editor",
			});
		} catch (err: unknown) {
			const msg = (err as Error).message;
			setError(msg);
			addEvent({
				level: "error",
				message: `Failed to save configuration: ${msg}`,
				source: "Editor",
			});
		} finally {
			setSaving(false);
		}
	};

	if (!node) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-6 text-muted-foreground text-xs space-y-2">
				<FileCode className="w-8 h-8 opacity-30" />
				<p>No device selected for configuration editing.</p>
				<p className="text-[11px] text-muted-foreground/80">
					Click the edit icon on any device in the canvas or device panel.
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full w-full bg-card">
			{/* Editor Subheader Toolbar */}
			<div className="flex items-center justify-between px-3 py-1.5 border-b border-border/80 bg-muted/40 text-xs">
				<div className="flex items-center gap-2">
					<FileCode className="w-4 h-4 text-primary" />
					<span className="font-semibold text-foreground">{node.name}</span>

					{files.length > 1 ? (
						<select
							value={selectedFile}
							onChange={(e) => setSelectedFile(e.target.value)}
							className="bg-background text-foreground border border-border rounded px-2 py-0.5 text-xs font-mono"
						>
							{files.map((f) => (
								<option key={f.name} value={f.name}>
									{f.name}
								</option>
							))}
						</select>
					) : (
						<Badge variant="outline" className="font-mono text-[11px]">
							{selectedFile || "startup-config"}
						</Badge>
					)}

					{savedSuccess && (
						<span className="flex items-center gap-1 text-emerald-500 text-xs font-medium">
							<Check className="w-3.5 h-3.5" /> Saved
						</span>
					)}

					{error && (
						<span className="flex items-center gap-1 text-destructive text-xs">
							<AlertCircle className="w-3.5 h-3.5" /> {error}
						</span>
					)}
				</div>

				<div className="flex items-center gap-2">
					<Button
						size="xs"
						variant="default"
						onClick={handleSave}
						disabled={saving || loading}
						className="gap-1.5"
					>
						<Save className="w-3.5 h-3.5" />
						<span>{saving ? "Saving..." : "Save Config"}</span>
					</Button>
				</div>
			</div>

			{/* Monaco Editor Container */}
			<div className="flex-1 w-full min-h-[180px] overflow-hidden">
				{isClient ? (
					<Editor
						height="100%"
						language="shell"
						value={content}
						theme={theme === "dark" ? "vs-dark" : "light"}
						onChange={(val) => setContent(val || "")}
						options={{
							minimap: { enabled: false },
							fontSize: 12,
							fontFamily: 'Menlo, Monaco, "Courier New", monospace',
							lineNumbers: "on",
							scrollBeyondLastLine: false,
							automaticLayout: true,
							tabSize: 2,
							wordWrap: "on",
						}}
					/>
				) : (
					<div className="flex items-center justify-center h-full text-xs text-muted-foreground">
						Loading editor...
					</div>
				)}
			</div>
		</div>
	);
}
