import { CheckCircle2, Menu, Moon, Settings, Sun } from "lucide-react";
import { SettingsModal } from "@/components/settings/settings-modal";
import { Button } from "@/components/ui/button";
import { useControllerVersion } from "@/features/controller/use-controller";
import { useUIStore } from "@/stores/ui-store";

export function TopNav() {
  const { theme, toggleTheme, setSettingsModalOpen, toggleSidebar } = useUIStore();

  const {
    data: versionInfo,
    isSuccess: isControllerOnline,
    isLoading: isCheckingVersion,
  } = useControllerVersion();

  return (
    <>
      <header className="h-12 border-b border-border bg-card/95 backdrop-blur-md px-3 flex items-center justify-between z-30 select-none shadow-xs">
        {/* Left Section: Logo & Brand */}
        <div className="flex items-center gap-3">
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={toggleSidebar}
            title="Toggle Sidebar"
            className="md:hidden"
          >
            <Menu className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2">
            <img src="/gns3.svg" width={22} height={22} alt="GNS3 Logo" />
            <span className="font-bold text-sm tracking-tight text-foreground leading-none">
              GNS3 <span className="text-primary font-normal text-xs">Web</span>
            </span>
          </div>

          {/* Controller Connection Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-border/60">
            <span
              className={`w-2 h-2 rounded-full ${
                isControllerOnline ? "bg-emerald-500 animate-pulse" : "bg-destructive"
              }`}
            />
            <span className="text-xs font-mono text-muted-foreground">
              {isCheckingVersion
                ? "Connecting..."
                : isControllerOnline
                  ? `v${versionInfo?.version || "3.1"}`
                  : "Offline"}
            </span>
          </div>
        </div>

        {/* Right Section: Sync Status, Theme, Settings */}
        <div className="flex items-center gap-1.5">
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-muted-foreground pr-2 border-r border-border/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Synchronized</span>
          </div>

          <Button
            size="icon-xs"
            variant="ghost"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="hover:bg-muted"
          >
            {theme === "dark" ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-700" />
            )}
          </Button>

          <Button
            size="icon-xs"
            variant="ghost"
            onClick={() => setSettingsModalOpen(true)}
            title="Controller Settings"
            className="hover:bg-muted"
          >
            <Settings className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal />
    </>
  );
}
