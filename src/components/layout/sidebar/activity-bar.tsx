import {
	Activity,
	Cpu,
	Folder,
	Layers,
	Settings,
	Terminal,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { AddConsoleDropdownContent } from "@/components/console/add-console-dropdown";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { type SidebarTab, useUIStore } from "@/stores/ui-store";

export function SidebarActivityBar() {
	const {
		sidebarOpen,
		setSidebarOpen,
		activeSidebarTab,
		setActiveSidebarTab,
		setSettingsModalOpen,
		bottomPanelOpen,
		setBottomPanelOpen,
		activeBottomTab,
		setActiveBottomTab,
		openConsoles,
	} = useUIStore();

	const [consoleDropdownOpen, setConsoleDropdownOpen] = useState(false);

	const navItems: Array<{
		id: SidebarTab;
		label: string;
		icon: React.ReactNode;
	}> = [
		{
			id: "projects",
			label: "Projects",
			icon: <Folder className="size-5" />,
		},
		{
			id: "devices",
			label: "Device Library",
			icon: <Layers className="size-5" />,
		},
		{
			id: "nodes",
			label: "Active Devices",
			icon: <Cpu className="size-5" />,
		},
	];

	const handleActivityBarClick = (tabId: SidebarTab) => {
		if (sidebarOpen && activeSidebarTab === tabId) {
			setSidebarOpen(false);
		} else {
			setActiveSidebarTab(tabId);
			setSidebarOpen(true);
		}
	};

	const handleBottomPanelClick = (tabId: "events" | "consoles") => {
		if (bottomPanelOpen && activeBottomTab === tabId) {
			setBottomPanelOpen(false);
		} else {
			setActiveBottomTab(tabId);
		}
	};

	return (
		<div className="w-14 h-full border-r border-border bg-card/90 flex flex-col justify-between items-center p-1.5">
			<div className="flex flex-col items-center gap-1.5 w-full">
				{navItems.map((item) => {
					const isActive = sidebarOpen && activeSidebarTab === item.id;
					return (
						<Button
							key={item.id}
							size="icon-lg"
							variant={isActive ? "secondary" : "ghost"}
							onClick={() => handleActivityBarClick(item.id)}
							title={item.label}
						>
							{item.icon}
						</Button>
					);
				})}
			</div>

			<div className="flex flex-col items-center gap-1.5 w-full">
				{openConsoles.length === 0 ? (
					<Popover
						open={consoleDropdownOpen}
						onOpenChange={setConsoleDropdownOpen}
					>
						<PopoverTrigger asChild>
							<Button
								size="icon-lg"
								variant={consoleDropdownOpen ? "secondary" : "ghost"}
								title="Consoles"
							>
								<Terminal className="size-5" />
							</Button>
						</PopoverTrigger>
						<PopoverContent
							side="right"
							align="end"
							className="w-auto p-0 shadow-lg"
						>
							<AddConsoleDropdownContent
								onSelect={() => setConsoleDropdownOpen(false)}
							/>
						</PopoverContent>
					</Popover>
				) : (
					<Button
						size="icon-lg"
						variant={
							bottomPanelOpen && activeBottomTab === "consoles"
								? "secondary"
								: "ghost"
						}
						onClick={() => handleBottomPanelClick("consoles")}
						title="Consoles"
					>
						<Terminal className="size-5" />
					</Button>
				)}

				<Button
					size="icon-lg"
					variant={
						bottomPanelOpen && activeBottomTab === "events"
							? "secondary"
							: "ghost"
					}
					onClick={() => handleBottomPanelClick("events")}
					title="Controller Events"
				>
					<Activity className="size-5" />
				</Button>

				<Separator />

				<Button
					size="icon-lg"
					variant="ghost"
					onClick={() => setSettingsModalOpen(true)}
					title="Settings & Preferences"
				>
					<Settings className="size-5" />
				</Button>
			</div>
		</div>
	);
}
