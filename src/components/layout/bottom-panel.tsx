import {
	Activity,
	ChevronDown,
	FileCode2,
	Terminal as TerminalIcon,
	Trash2,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { ConsolePanel } from "@/components/console/console-panel";
import { ConfigEditor } from "@/components/editor/config-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type BottomTab, useUIStore } from "@/stores/ui-store";

export function BottomPanel() {
	const {
		bottomPanelOpen,
		setBottomPanelOpen,
		activeBottomTab,
		setActiveBottomTab,
		bottomPanelHeight,
		setBottomPanelHeight,
		events,
		clearEvents,
		openConsoles,
	} = useUIStore();

	const [isDragging, setIsDragging] = useState(false);

	// Automatically close the bottom drawer if all consoles are closed while on consoles tab
	useEffect(() => {
		if (
			openConsoles.length === 0 &&
			bottomPanelOpen &&
			activeBottomTab === "consoles"
		) {
			setBottomPanelOpen(false);
		}
	}, [
		openConsoles.length,
		bottomPanelOpen,
		activeBottomTab,
		setBottomPanelOpen,
	]);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			setIsDragging(true);

			const startY = e.clientY;
			const startHeight = bottomPanelHeight;

			const onMouseMove = (moveEvent: MouseEvent) => {
				const deltaY = startY - moveEvent.clientY;
				const maxHeight =
					typeof window !== "undefined"
						? Math.floor(window.innerHeight * 0.85)
						: 800;
				const newHeight = Math.min(
					Math.max(startHeight + deltaY, 120),
					maxHeight,
				);
				setBottomPanelHeight(newHeight);
			};

			const onMouseUp = () => {
				setIsDragging(false);
				window.removeEventListener("mousemove", onMouseMove);
				window.removeEventListener("mouseup", onMouseUp);
				document.body.style.removeProperty("cursor");
				document.body.style.removeProperty("user-select");
			};

			document.body.style.cursor = "row-resize";
			document.body.style.userSelect = "none";
			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", onMouseUp);
		},
		[bottomPanelHeight, setBottomPanelHeight],
	);

	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			if (e.touches.length !== 1) return;
			setIsDragging(true);

			const startY = e.touches[0].clientY;
			const startHeight = bottomPanelHeight;

			const onTouchMove = (moveEvent: TouchEvent) => {
				if (moveEvent.touches.length !== 1) return;
				const deltaY = startY - moveEvent.touches[0].clientY;
				const maxHeight =
					typeof window !== "undefined"
						? Math.floor(window.innerHeight * 0.85)
						: 800;
				const newHeight = Math.min(
					Math.max(startHeight + deltaY, 120),
					maxHeight,
				);
				setBottomPanelHeight(newHeight);
			};

			const onTouchEnd = () => {
				setIsDragging(false);
				window.removeEventListener("touchmove", onTouchMove);
				window.removeEventListener("touchend", onTouchEnd);
			};

			window.addEventListener("touchmove", onTouchMove);
			window.addEventListener("touchend", onTouchEnd);
		},
		[bottomPanelHeight, setBottomPanelHeight],
	);

	const handleDoubleClick = useCallback(() => {
		if (bottomPanelHeight > 350) {
			setBottomPanelHeight(280);
		} else {
			const expandedHeight =
				typeof window !== "undefined"
					? Math.min(520, Math.floor(window.innerHeight * 0.65))
					: 500;
			setBottomPanelHeight(expandedHeight);
		}
	}, [bottomPanelHeight, setBottomPanelHeight]);

	if (!bottomPanelOpen) {
		return null;
	}

	const tabs: Array<{
		id: BottomTab;
		label: string;
		icon: React.ElementType;
		count?: number;
	}> = [
		{
			id: "consoles",
			label: "Consoles",
			icon: TerminalIcon,
			count: openConsoles.length,
		},

		{ id: "editor", label: "Configuration Editor", icon: FileCode2 },

		{
			id: "events",
			label: "Controller Events",
			icon: Activity,
			count: events.length,
		},
	];

	// When console tab is opened, show only console and hide Config Editor and Event Tab
	const visibleTabs = tabs.filter((tab) => {
		if (activeBottomTab === "consoles") {
			return tab.id === "consoles";
		}

		if (activeBottomTab === "editor") {
			return tab.id === "editor";
		}

		if (activeBottomTab === "events") {
			return tab.id === "events";
		}

		return true;
	});

	return (
		<div
			style={{ height: `${bottomPanelHeight}px` }}
			className={`relative flex flex-col border-t border-border bg-card/95 backdrop-blur-md shadow-xl z-20 ${
				isDragging ? "transition-none select-none" : "transition-[height]"
			}`}
		>
			{/* Top Resizer Handle */}
			<div
				role="separator"
				aria-orientation="horizontal"
				aria-label="Resize drawer height"
				title="Drag to resize height (Double-click to expand or reset)"
				onMouseDown={handleMouseDown}
				onTouchStart={handleTouchStart}
				onDoubleClick={handleDoubleClick}
				className="group absolute -top-1.5 inset-x-0 h-3 flex items-center justify-center cursor-row-resize z-30 touch-none select-none"
			>
				<div
					className={`w-full h-0.5 transition-colors ${
						isDragging
							? "bg-primary"
							: "bg-transparent group-hover:bg-primary/70"
					}`}
				/>
				{/* Visual Pill Grip Handle */}
				<div
					className={`absolute top-1/2 -translate-y-1/2 h-1 rounded-full transition-all ${
						isDragging
							? "w-16 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]"
							: "w-10 bg-muted-foreground/30 group-hover:w-14 group-hover:bg-primary/80"
					}`}
				/>
			</div>

			{/* Tab Navigation Header: Only show for Editor/Events, omitted when Consoles is active to avoid duplicate headers */}
			{activeBottomTab !== "consoles" && (
				<div className="flex items-center justify-between border-b p-1.5 bg-card text-xs select-none">
					<div className="flex items-center gap-1 px-4">
						{visibleTabs.map((tab) => {
							const Icon = tab.icon;
							return (
								<div
									key={tab.id}
									className="flex items-center gap-1.5"
									onClick={() => setActiveBottomTab(tab.id)}
								>
									<Icon className="w-3.5 h-3.5" />
									<span>{tab.label}</span>
									{tab.count !== undefined && tab.count > 0 && (
										<Badge
											variant="outline"
											className="text-[10px] px-1 py-0 h-4 ml-0.5"
										>
											{tab.count}
										</Badge>
									)}
								</div>
							);
						})}
					</div>

					<div className="flex items-center gap-1">
						{activeBottomTab === "events" && events.length > 0 && (
							<Button
								size="icon-xs"
								variant="ghost"
								onClick={clearEvents}
								title="Clear Event Log"
								className="text-muted-foreground hover:text-foreground"
							>
								<Trash2 className="w-3 h-3" />
							</Button>
						)}

						<Button
							size="icon-xs"
							variant="ghost"
							onClick={() => setBottomPanelOpen(false)}
							title="Minimize Drawer"
						>
							<ChevronDown className="w-3.5 h-3.5" />
						</Button>
					</div>
				</div>
			)}

			{/* Tab Content Body */}
			<div className="flex-1 overflow-hidden">
				{activeBottomTab === "consoles" && <ConsolePanel />}
				{activeBottomTab === "editor" && <ConfigEditor />}
				{activeBottomTab === "events" && (
					<div className="flex flex-col h-full overflow-y-auto p-3 font-mono text-xs space-y-1">
						{events.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs">
								<Activity className="w-8 h-8 opacity-30 mb-2" />
								<p>No recent events received from controller.</p>
							</div>
						) : (
							events.map((ev) => (
								<div
									key={ev.id}
									className="flex items-center gap-2 py-1 px-2 rounded-xs hover:bg-muted/30 border-b border-border/30 text-[11px]"
								>
									<span className="text-muted-foreground text-[10px] shrink-0">
										{ev.timestamp}
									</span>
									<Badge
										variant={
											ev.level === "error"
												? "destructive"
												: ev.level === "warning"
													? "warning"
													: ev.level === "success"
														? "success"
														: "muted"
										}
										className="text-[9px] uppercase px-1 py-0 shrink-0 font-sans"
									>
										{ev.level}
									</Badge>
									{ev.source && (
										<span className="text-primary font-semibold shrink-0">
											[{ev.source}]
										</span>
									)}
									<span className="text-foreground truncate">{ev.message}</span>
								</div>
							))
						)}
					</div>
				)}
			</div>
		</div>
	);
}
