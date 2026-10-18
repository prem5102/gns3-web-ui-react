import {
  Activity,
  ChevronDown,
  ChevronUp,
  FileCode2,
  LayoutGrid,
  Terminal as TerminalIcon,
  Trash2,
} from "lucide-react";
import type React from "react";
import { ConsolePanel } from "@/components/console/console-panel";
import { ConfigEditor } from "@/components/editor/config-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type BottomTab, useUIStore } from "@/stores/ui-store";

export function BottomPanel() {
  const {
    bottomPanelOpen,
    setBottomPanelOpen,
    activeBottomTab,
    setActiveBottomTab,
    bottomPanelHeight,
    events,
    clearEvents,
    openConsoles,
  } = useUIStore();

  if (!bottomPanelOpen) {
    return (
      <div className="border-t border-border bg-card/90 backdrop-blur-md px-3 py-1 flex items-center justify-between text-xs z-20">
        <div className="flex items-center gap-1.5">
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setActiveBottomTab("consoles")}
            className="gap-1.5 h-6 text-muted-foreground hover:text-foreground"
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Consoles ({openConsoles.length})</span>
          </Button>

          <Button
            size="xs"
            variant="ghost"
            onClick={() => setActiveBottomTab("editor")}
            className="gap-1.5 h-6 text-muted-foreground hover:text-foreground"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Config Editor</span>
          </Button>

          <Button
            size="xs"
            variant="ghost"
            onClick={() => setActiveBottomTab("events")}
            className="gap-1.5 h-6 text-muted-foreground hover:text-foreground"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Events ({events.length})</span>
          </Button>
        </div>

        <Button
          size="icon-xs"
          variant="ghost"
          onClick={() => setBottomPanelOpen(true)}
          title="Open Drawer"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
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
      className="flex flex-col border-t border-border bg-card/95 backdrop-blur-md shadow-xl z-20 transition-all"
    >
      {/* Tab Navigation Header: Only show for Editor/Events, omitted when Consoles is active to avoid duplicate headers */}
      {activeBottomTab !== "consoles" && (
        <div className="flex items-center justify-between px-3 border-b border-border/80 bg-muted/40 h-8 text-xs select-none">
          <div className="flex items-center gap-1">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeBottomTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveBottomTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs transition-colors font-medium ${
                    isActive
                      ? "bg-card text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 ml-0.5">
                      {tab.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            {/* Dropdown to switch drawer view if needed */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="xs"
                  variant="ghost"
                  className="gap-1 h-6 text-muted-foreground hover:text-foreground text-[11px]"
                  title="Switch Drawer View"
                >
                  <LayoutGrid className="w-3 h-3" />
                  <span>Views</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeBottomTab === tab.id;
                  return (
                    <DropdownMenuItem
                      key={tab.id}
                      onClick={() => setActiveBottomTab(tab.id)}
                      className={`flex items-center justify-between text-xs cursor-pointer ${
                        isActive ? "font-semibold text-primary" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </div>
                      {tab.count !== undefined && tab.count > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                          {tab.count}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

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
                  <span className="text-muted-foreground text-[10px] shrink-0">{ev.timestamp}</span>
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
                    <span className="text-primary font-semibold shrink-0">[{ev.source}]</span>
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
