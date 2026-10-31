import { Download, FileText, FolderOpen, RefreshCw, Save } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { gns3Api } from "@/lib/gns3-api";

interface NodeFileManagerDialogProps {
	projectId: string;
	nodeId: string;
	nodeName?: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function NodeFileManagerDialog({
	projectId,
	nodeId,
	nodeName,
	open,
	onOpenChange,
}: NodeFileManagerDialogProps) {
	const [files, setFiles] = useState<Array<{ name: string }>>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedFile, setSelectedFile] = useState<string | null>(null);
	const [fileContent, setFileContent] = useState<string>("");
	const [isContentLoading, setIsContentLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);

	const loadFiles = async () => {
		if (!projectId || !nodeId) return;
		setIsLoading(true);
		setStatusMessage(null);
		try {
			const res = await gns3Api.getNodeFiles(projectId, nodeId);
			setFiles(res || []);
		} catch (err: unknown) {
			setStatusMessage((err as Error).message || "Failed to load node files");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (open) {
			loadFiles();
			setSelectedFile(null);
			setFileContent("");
		}
	}, [open, projectId, nodeId]);

	const handleSelectFile = async (filename: string) => {
		setSelectedFile(filename);
		setIsContentLoading(true);
		setStatusMessage(null);
		try {
			const content = await gns3Api.getNodeFileContent(
				projectId,
				nodeId,
				filename,
			);
			setFileContent(content);
		} catch (err: unknown) {
			setStatusMessage(
				(err as Error).message || `Failed to read file ${filename}`,
			);
		} finally {
			setIsContentLoading(false);
		}
	};

	const handleSaveContent = async () => {
		if (!selectedFile) return;
		setIsSaving(true);
		setStatusMessage(null);
		try {
			await gns3Api.saveNodeFileContent(
				projectId,
				nodeId,
				selectedFile,
				fileContent,
			);
			setStatusMessage("File saved successfully");
		} catch (err: unknown) {
			setStatusMessage((err as Error).message || "Failed to save file content");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDownload = () => {
		if (!selectedFile) return;
		const blob = new Blob([fileContent], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = selectedFile;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FolderOpen className="w-5 h-5 text-primary" />
						Node File Manager
					</DialogTitle>
					<DialogDescription>
						Browse configurations, startup scripts, and disk files for &quot;
						{nodeName || nodeId}&quot;.
					</DialogDescription>
				</DialogHeader>

				{statusMessage && (
					<div className="p-2.5 text-xs rounded-md bg-muted text-foreground border border-border">
						{statusMessage}
					</div>
				)}

				<div className="flex-1 min-h-80 grid grid-cols-3 gap-3 border border-border/60 rounded-lg overflow-hidden">
					{/* Left File List */}
					<div className="border-r border-border/60 bg-muted/20 flex flex-col">
						<div className="p-2.5 border-b border-border/60 flex items-center justify-between">
							<span className="text-xs font-semibold text-muted-foreground">
								Files
							</span>
							<Button
								size="icon-xs"
								variant="ghost"
								onClick={loadFiles}
								disabled={isLoading}
								title="Refresh File List"
							>
								<RefreshCw
									className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
								/>
							</Button>
						</div>

						<div className="flex-1 overflow-y-auto p-1 space-y-0.5">
							{isLoading ? (
								<p className="p-4 text-xs text-muted-foreground text-center">
									Loading files...
								</p>
							) : files.length === 0 ? (
								<p className="p-4 text-xs text-muted-foreground text-center">
									No files found on node.
								</p>
							) : (
								files.map((file) => (
									<button
										key={file.name}
										type="button"
										onClick={() => handleSelectFile(file.name)}
										className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center gap-2 transition-colors ${
											selectedFile === file.name
												? "bg-primary text-primary-foreground font-medium"
												: "hover:bg-muted text-foreground"
										}`}
									>
										<FileText className="w-3.5 h-3.5 shrink-0" />
										<span className="truncate">{file.name}</span>
									</button>
								))
							)}
						</div>
					</div>

					{/* Right Content Editor */}
					<div className="col-span-2 flex flex-col bg-card">
						{selectedFile ? (
							<>
								<div className="p-2 border-b border-border/60 flex items-center justify-between">
									<span className="text-xs font-mono font-medium truncate max-w-xs">
										{selectedFile}
									</span>
									<div className="flex items-center gap-1">
										<Button
											size="xs"
											variant="ghost"
											onClick={handleDownload}
											title="Download File"
											className="gap-1 text-xs"
										>
											<Download className="w-3.5 h-3.5" />
											Download
										</Button>
										<Button
											size="xs"
											variant="default"
											onClick={handleSaveContent}
											disabled={isSaving || isContentLoading}
											className="gap-1 text-xs"
										>
											<Save className="w-3.5 h-3.5" />
											{isSaving ? "Saving..." : "Save"}
										</Button>
									</div>
								</div>

								<div className="flex-1 p-2">
									{isContentLoading ? (
										<div className="h-full flex items-center justify-center text-xs text-muted-foreground">
											<RefreshCw className="w-4 h-4 animate-spin mr-2" />
											Loading file content...
										</div>
									) : (
										<Textarea
											value={fileContent}
											onChange={(e) => setFileContent(e.target.value)}
											className="font-mono text-xs h-full min-h-65 resize-none"
											placeholder="File content..."
										/>
									)}
								</div>
							</>
						) : (
							<div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
								<FileText className="w-8 h-8 mb-2 stroke-1 opacity-50" />
								<p className="text-xs font-medium">
									Select a file to inspect or edit
								</p>
							</div>
						)}
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onOpenChange(false)}
					>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
