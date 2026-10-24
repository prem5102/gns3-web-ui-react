import { ComputerTerminalIcon, EllipsisIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { FitAddon } from "@xterm/addon-fit";
import type { Terminal } from "@xterm/xterm";
import { Plus, Power, RotateCw, Terminal as TerminalIcon, Trash2, X } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { AddConsoleDropdownContent } from "@/components/console/add-console-dropdown";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjectNodes, useStartNode } from "@/features/nodes/use-nodes";
import { gns3Api } from "@/lib/gns3-api";
import { cn } from "@/lib/utils";
import { useTopologyStore } from "@/stores/topology-store";
import { useUIStore } from "@/stores/ui-store";

export const TERMINAL_DARK_THEME = {
  background: "#09090b",
  foreground: "#f4f4f5",
  cursor: "#3b82f6",
  cursorAccent: "#09090b",
  selectionBackground: "rgba(59, 130, 246, 0.3)",
  selectionForeground: "#ffffff",
  selectionInactiveBackground: "rgba(59, 130, 246, 0.15)",
  black: "#27272a",
  red: "#f87171",
  green: "#4ade80",
  yellow: "#facc15",
  blue: "#60a5fa",
  magenta: "#c084fc",
  cyan: "#38bdf8",
  white: "#f4f4f5",
  brightBlack: "#71717a",
  brightRed: "#ef4444",
  brightGreen: "#22c55e",
  brightYellow: "#eab308",
  brightBlue: "#3b82f6",
  brightMagenta: "#a855f7",
  brightCyan: "#06b6d4",
  brightWhite: "#ffffff",
};

export const TERMINAL_LIGHT_THEME = {
  background: "#ffffff",
  foreground: "#18181b",
  cursor: "#2563eb",
  cursorAccent: "#ffffff",
  selectionBackground: "rgba(37, 99, 235, 0.25)",
  selectionForeground: "#000000",
  selectionInactiveBackground: "rgba(37, 99, 235, 0.12)",
  black: "#18181b",
  red: "#dc2626",
  green: "#16a34a",
  yellow: "#ca8a04",
  blue: "#2563eb",
  magenta: "#9333ea",
  cyan: "#0891b2",
  white: "#e4e4e7",
  brightBlack: "#71717a",
  brightRed: "#b91c1c",
  brightGreen: "#15803d",
  brightYellow: "#a16207",
  brightBlue: "#1d4ed8",
  brightMagenta: "#7e22ce",
  brightCyan: "#0e7490",
  brightWhite: "#ffffff",
};

export const getTerminalTheme = (theme: "dark" | "light") =>
  theme === "dark" ? TERMINAL_DARK_THEME : TERMINAL_LIGHT_THEME;

export interface TerminalViewportHandle {
  reconnect: () => void;
  clear: () => void;
}

interface TerminalViewportProps {
  projectId: string;
  nodeId: string;
}

const TerminalViewport = forwardRef<TerminalViewportHandle, TerminalViewportProps>(
  function TerminalViewport({ projectId, nodeId }, ref) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const termInstanceRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const socketRef = useRef<WebSocket | null>(null);

    const [isClient, setIsClient] = useState(false);

    const theme = useUIStore((s) => s.theme);
    const { data: nodes = [] } = useProjectNodes(projectId);
    const node = nodes.find((n) => n.node_id === nodeId);
    const startNodeMutation = useStartNode(projectId);

    const isNodeStarted = node?.status === "started";

    const sendTerminalSize = useCallback((socket: WebSocket | null, cols: number, rows: number) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(new Blob([JSON.stringify({ cols, rows })]));
      }
    }, []);

    useEffect(() => {
      setIsClient(true);
    }, []);

    const connectTerminal = useCallback(async () => {
      if (!terminalRef.current || !isNodeStarted || typeof window === "undefined") {
        return;
      }

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      try {
        const xtermModule = await import("@xterm/xterm");
        const fitModule = await import("@xterm/addon-fit");
        const attachModule = await import("@xterm/addon-attach");
        await import("@xterm/xterm/css/xterm.css");

        const TerminalConstructor =
          xtermModule.Terminal ||
          (xtermModule as unknown as { default: { Terminal: typeof Terminal } }).default
            ?.Terminal ||
          (xtermModule as unknown as { default: typeof Terminal }).default;

        const FitAddonConstructor =
          fitModule.FitAddon || (fitModule as unknown as { default: typeof FitAddon }).default;

        const AttachAddonConstructor =
          attachModule.AttachAddon ||
          (attachModule as unknown as { default: { AttachAddon: any } }).default?.AttachAddon ||
          (attachModule as unknown as { default: any }).default;

        let term = termInstanceRef.current;

        if (!term) {
          term = new TerminalConstructor({
            cols: 90,
            rows: 24,
            cursorBlink: true,
            fontSize: 13,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: getTerminalTheme(useUIStore.getState().theme),
          });

          const fitAddon = new FitAddonConstructor();
          term.loadAddon(fitAddon);
          term.open(terminalRef.current);
          fitAddon.fit();

          termInstanceRef.current = term;
          fitAddonRef.current = fitAddon;
        } else {
          term.clear();
        }

        term.write("\r\n\x1b[36mConnecting to GNS3 Console transport...\x1b[0m\r\n");

        const wsUrl = gns3Api.getWebSocketUrl(
          `/v3/projects/${projectId}/nodes/${nodeId}/console/ws`,
        );

        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          term?.write("\r\n\x1b[32m--- Connected to Device Console ---\x1b[0m\r\n\r\n");
          if (term) {
            sendTerminalSize(socket, term.cols, term.rows);
          }
        };

        socket.onerror = () => {
          term?.write("\r\n\x1b[31mConnection error. Is the node running?\x1b[0m\r\n");
        };

        socket.onclose = () => {
          term?.write("\r\n\x1b[33mConnection closed.\x1b[0m\r\n");
        };

        const attachAddon = new AttachAddonConstructor(socket);
        term.loadAddon(attachAddon);

        term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
          sendTerminalSize(socket, cols, rows);
        });
      } catch (err: unknown) {
        termInstanceRef.current?.write(
          `\r\n\x1b[31mFailed to load terminal: ${(err as Error).message}\x1b[0m\r\n`,
        );
      }
    }, [projectId, nodeId, isNodeStarted, sendTerminalSize]);

    // Update terminal theme dynamically when user toggles dark/light mode without restarting the session
    useEffect(() => {
      if (termInstanceRef.current) {
        termInstanceRef.current.options.theme = getTerminalTheme(theme);
      }
    }, [theme]);

    useImperativeHandle(
      ref,
      () => ({
        reconnect: () => {
          connectTerminal();
        },
        clear: () => {
          termInstanceRef.current?.clear();
        },
      }),
      [connectTerminal],
    );

    useEffect(() => {
      if (isClient) {
        connectTerminal();
      }

      return () => {
        if (socketRef.current) {
          socketRef.current.close();
          socketRef.current = null;
        }
        if (termInstanceRef.current) {
          termInstanceRef.current.dispose();
          termInstanceRef.current = null;
        }
      };
    }, [isClient, connectTerminal]);

    useEffect(() => {
      const el = terminalRef.current;

      if (!el) return;

      const ro = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          try {
            fitAddonRef.current?.fit();
          } catch {
            // ignore
          }
        });
      });

      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    if (!isClient) {
      return <div className="p-4 text-xs text-muted-foreground">Initializing console...</div>;
    }

    return (
      <div
        className={cn(
          "relative w-full h-full overflow-hidden transition-colors",
          theme === "dark" ? "bg-[#09090b]" : "bg-white",
        )}
      >
        {!isNodeStarted && (
          <div
            className={cn(
              "absolute inset-0 z-10 flex flex-col items-center justify-center text-xs space-y-6 p-4 transition-colors",
              theme === "dark" ? "bg-[#09090b]/95 text-zinc-400" : "bg-white/95 text-zinc-600",
            )}
          >
            <div className="flex flex-col items-center gap-2.5">
              <Power className="size-14 text-destructive" />
              <p>{node?.name || nodeId} is stopped</p>
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => startNodeMutation.mutate(nodeId)}
              disabled={startNodeMutation.isPending}
            >
              <HugeiconsIcon icon={PlayIcon} />
              <span>Start Node</span>
            </Button>
          </div>
        )}
        <div ref={terminalRef} className="w-full h-full p-2" />
      </div>
    );
  },
);

export function ConsolePanel() {
  const {
    openConsoles,
    activeConsoleNodeId,
    setActiveConsoleNodeId,
    closeConsoleForNode,
    closeAllConsoles,
    bottomPanelOpen,
    setBottomPanelOpen,
    activeBottomTab,
  } = useUIStore();
  const { activeProjectId } = useTopologyStore();

  const { data: nodes = [] } = useProjectNodes(activeProjectId);

  const terminalViewportRef = useRef<TerminalViewportHandle>(null);

  const [addDropdownOpen, setAddDropdownOpen] = useState(false);

  const [containerWidth, setContainerWidth] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const tabWidthsRef = useRef<Map<string, number>>(new Map());

  const activeNode = nodes.find((n) => n.node_id === activeConsoleNodeId);

  const activeNodeStarted = activeNode?.status === "started";

  // Automatically close the bottom drawer if all consoles are closed
  useEffect(() => {
    if (openConsoles.length === 0 && bottomPanelOpen && activeBottomTab === "consoles") {
      setBottomPanelOpen(false);
    }
  }, [openConsoles.length, bottomPanelOpen, activeBottomTab, setBottomPanelOpen]);

  // Clean up cached widths for closed consoles
  useEffect(() => {
    const openSet = new Set(openConsoles);
    for (const key of tabWidthsRef.current.keys()) {
      if (!openSet.has(key)) {
        tabWidthsRef.current.delete(key);
      }
    }
  }, [openConsoles]);

  // Track container width to detect tab overflow
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const width = el.clientWidth;
      if (width > 0) {
        setContainerWidth(width);
      }
    };

    updateWidth();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect?.width || el.clientWidth;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    });

    observer.observe(el);
    window.addEventListener("resize", updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  // Calculate which tabs fit in visible row and which overflow
  const { visibleTabs, overflowTabs } = useMemo(() => {
    if (containerWidth <= 0 || openConsoles.length <= 1) {
      return { visibleTabs: openConsoles, overflowTabs: [] };
    }

    const defaultTabWidth = (id: string) => {
      const node = nodes.find((n) => n.node_id === id);
      const name = node?.name || id.substring(0, 8);
      return Math.max(76, Math.min(180, name.length * 8 + 44));
    };

    let totalAllTabsWidth = 0;
    for (const id of openConsoles) {
      const w = tabWidthsRef.current.get(id) || defaultTabWidth(id);
      totalAllTabsWidth += w;
    }
    const allGaps = (openConsoles.length - 1) * 6;
    const plusBtnWidth = 30;

    // If all tabs fit comfortably, return all as visible
    if (totalAllTabsWidth + allGaps + plusBtnWidth <= containerWidth) {
      return { visibleTabs: openConsoles, overflowTabs: [] };
    }

    // Tabs overflow: calculate visible tabs while reserving space for overflow button
    const overflowBtnWidth = 46;
    const availableForTabs = Math.max(70, containerWidth - plusBtnWidth - overflowBtnWidth - 18);

    let usedWidth = 0;
    const fittingTabs: string[] = [];

    for (const id of openConsoles) {
      const w = tabWidthsRef.current.get(id) || defaultTabWidth(id);
      const nextWidth = usedWidth + w + (fittingTabs.length > 0 ? 6 : 0);
      if (nextWidth <= availableForTabs) {
        usedWidth = nextWidth;
        fittingTabs.push(id);
      } else {
        break;
      }
    }

    // Ensure active tab is visible if possible
    if (activeConsoleNodeId && !fittingTabs.includes(activeConsoleNodeId)) {
      const activeWidth =
        tabWidthsRef.current.get(activeConsoleNodeId) || defaultTabWidth(activeConsoleNodeId);
      while (
        fittingTabs.length > 0 &&
        usedWidth + activeWidth + (fittingTabs.length > 1 ? 6 : 0) > availableForTabs
      ) {
        const popped = fittingTabs.pop();
        if (popped) {
          const poppedWidth = tabWidthsRef.current.get(popped) || defaultTabWidth(popped);
          usedWidth -= poppedWidth + 6;
        }
      }
      fittingTabs.push(activeConsoleNodeId);
    }

    if (fittingTabs.length === 0 && openConsoles.length > 0) {
      fittingTabs.push(activeConsoleNodeId || openConsoles[0]);
    }

    const visibleSet = new Set(fittingTabs);
    const visible = openConsoles.filter((id) => visibleSet.has(id));
    const overflow = openConsoles.filter((id) => !visibleSet.has(id));

    return { visibleTabs: visible, overflowTabs: overflow };
  }, [openConsoles, activeConsoleNodeId, containerWidth, nodes]);

  if (!activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-muted-foreground text-xs">
        <TerminalIcon className="w-8 h-8 opacity-30 mb-2" />
        <p>No project opened. Select or open a project first.</p>
      </div>
    );
  }

  if (openConsoles.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-1.5 border-b border-border/60 text-xs select-none shrink-0 min-w-0">
        <div
          ref={containerRef}
          data-slot="console-tabs-container"
          className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden"
        >
          {visibleTabs.map((nodeId) => {
            const node = nodes.find((n) => n.node_id === nodeId);
            const nodeName = node?.name || nodeId.substring(0, 8);
            const isActive = nodeId === activeConsoleNodeId;

            return (
              <div
                ref={(el) => {
                  if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0) {
                      tabWidthsRef.current.set(nodeId, rect.width);
                    }
                  }
                }}
                onClick={() => setActiveConsoleNodeId(nodeId)}
                className={cn(
                  "group relative flex items-center gap-1.5 px-2.5 py-1 border rounded-sm text-xs cursor-pointer transition-all select-none shrink-0",
                  isActive
                    ? "bg-muted text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                <div className="relative size-3.5 flex items-center justify-center shrink-0">
                  <HugeiconsIcon
                    icon={ComputerTerminalIcon}
                    className={cn(
                      "size-3.5 shrink-0 transition-opacity group-hover:opacity-0",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />

                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeConsoleForNode(nodeId);
                    }}
                    className="absolute inset-0 size-full transition-all opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>

                <span className="truncate text-xs font-medium">{nodeName}</span>
              </div>
            );
          })}

          {overflowTabs.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon-xs" variant="outline" title="Overflow consoles">
                  <HugeiconsIcon icon={EllipsisIcon} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 p-1 shadow-lg">
                <ScrollArea className="max-h-56">
                  <div>
                    {overflowTabs.map((nodeId) => {
                      const node = nodes.find((n) => n.node_id === nodeId);
                      const nodeName = node?.name || nodeId.substring(0, 8);
                      const isActive = nodeId === activeConsoleNodeId;

                      return (
                        <DropdownMenuItem
                          key={nodeId}
                          onClick={() => setActiveConsoleNodeId(nodeId)}
                          className={cn(
                            "flex items-center justify-between gap-2 px-2 py-1.5 rounded-sm text-xs cursor-pointer group",
                            isActive && "bg-muted font-medium text-foreground",
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <HugeiconsIcon
                              icon={ComputerTerminalIcon}
                              className={cn(
                                "size-3.5 shrink-0",
                                isActive
                                  ? "text-primary"
                                  : "text-muted-foreground group-hover:text-foreground",
                              )}
                            />
                            <span className="truncate text-xs">{nodeName}</span>
                          </div>

                          <Button
                            size="icon-xs"
                            variant="ghost"
                            title="Close console"
                            onClick={(e) => {
                              e.stopPropagation();
                              closeConsoleForNode(nodeId);
                            }}
                            className="size-5 p-0 opacity-60 hover:opacity-100 hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground shrink-0 rounded-xs flex items-center justify-center"
                          >
                            <X className="size-3" />
                          </Button>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Popover open={addDropdownOpen} onOpenChange={setAddDropdownOpen}>
            <PopoverTrigger asChild>
              <Button size="icon-xs" variant="outline">
                <Plus />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <AddConsoleDropdownContent onSelect={() => setAddDropdownOpen(false)} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            size="icon-xs"
            variant="ghost"
            title="Reconnect Active Console"
            onClick={() => terminalViewportRef.current?.reconnect()}
            disabled={!activeConsoleNodeId || !activeNodeStarted}
            className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <RotateCw />
          </Button>

          {activeConsoleNodeId && (
            <Button
              size="icon-xs"
              variant="ghost"
              title="Clear active terminal"
              onClick={() => terminalViewportRef.current?.clear()}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <Trash2 />
            </Button>
          )}

          {openConsoles.length > 1 && (
            <Button
              size="icon-xs"
              variant="ghost"
              title="Close all console tabs"
              onClick={closeAllConsoles}
              className="text-muted-foreground hover:text-destructive h-6 w-6"
            >
              <X />
            </Button>
          )}
        </div>
      </div>

      {/* Full-width Terminal Viewport Area */}
      <div className="flex-1 overflow-hidden min-w-0 h-full w-full">
        {activeConsoleNodeId && (
          <TerminalViewport
            key={activeConsoleNodeId}
            ref={terminalViewportRef}
            projectId={activeProjectId}
            nodeId={activeConsoleNodeId}
          />
        )}
      </div>
    </div>
  );
}
