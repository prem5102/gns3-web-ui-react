import { Plus } from "lucide-react";
import { useState } from "react";
import { SettingsModal } from "@/components/settings/settings-modal";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import {
	DevicesTab,
	NodesTab,
	ProjectsTab,
	SidebarActivityBar,
	SidebarHeader,
} from "./sidebar/index";

const TAB_TITLES: Record<string, string> = {
	projects: "Projects",
	devices: "Device Library",
	nodes: "Active Devices",
};

export function Sidebar() {
	const { sidebarOpen, activeSidebarTab } = useUIStore();
	const [showNewProjectInput, setShowNewProjectInput] = useState(false);

	const activeTabLabel = TAB_TITLES[activeSidebarTab] || "Explorer";

	return (
		<>
			<SettingsModal />

			<SidebarActivityBar />

			{sidebarOpen && (
				<aside className="w-72 md:w-80 h-full border-r border-border bg-card/95 backdrop-blur-md flex flex-col shadow-sm z-20 transition-all select-none shrink-0">
					<SidebarHeader
						title={activeTabLabel}
						action={
							activeSidebarTab === "projects" ? (
								<Button
									size="xs"
									variant="outline"
									onClick={() => setShowNewProjectInput((prev) => !prev)}
								>
									<Plus className="w-3.5 h-3.5" /> <span>New</span>
								</Button>
							) : null
						}
					/>

					{/* Tab Panel Content */}
					<div
						className={`flex-1 p-3 ${
							activeSidebarTab === "devices"
								? "flex flex-col min-h-0 overflow-hidden"
								: "overflow-y-auto"
						}`}
					>
						{activeSidebarTab === "projects" && (
							<ProjectsTab
								showNewProjectInput={showNewProjectInput}
								onCloseNewProject={() => setShowNewProjectInput(false)}
							/>
						)}
						{activeSidebarTab === "devices" && <DevicesTab />}
						{activeSidebarTab === "nodes" && <NodesTab />}
					</div>
				</aside>
			)}
		</>
	);
}

export * from "./sidebar/index";
