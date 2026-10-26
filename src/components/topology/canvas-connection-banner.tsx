import { Button } from "@/components/ui/button";
import type { GNS3Node } from "@/types/gns3";
import type { ConnectingSourcePort } from "@/stores/topology-store";

interface CanvasConnectionBannerProps {
	isConnecting: boolean;
	sourceNode?: GNS3Node;
	sourcePort: ConnectingSourcePort | null;
	onCancel: () => void;
}

export function CanvasConnectionBanner({
	isConnecting,
	sourceNode,
	sourcePort,
	onCancel,
}: CanvasConnectionBannerProps) {
	if (!isConnecting || !sourceNode || !sourcePort) return null;

	return (
		<div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-card/95 border border-primary/40 shadow-xl rounded-full px-4 py-1.5 backdrop-blur-md text-xs pointer-events-auto select-none animate-in fade-in slide-in-from-top-2">
			<span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
			<span className="text-muted-foreground">Connecting from</span>
			<span className="font-semibold text-foreground">{sourceNode.name}</span>
			<span className="font-mono text-primary text-[11px] bg-primary/10 px-1.5 py-0.5 rounded font-medium">
				{sourcePort.name}
			</span>
			<span className="text-muted-foreground">→ Select destination node</span>
			<Button
				type="button"
				variant="ghost"
				size="xs"
				onClick={onCancel}
				className="h-5 px-2 text-muted-foreground hover:text-destructive text-[11px] ml-1 rounded hover:bg-muted font-medium cursor-pointer transition-colors"
			>
				Cancel (Esc)
			</Button>
		</div>
	);
}
