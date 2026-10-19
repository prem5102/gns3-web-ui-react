import type { FitAddon } from "@xterm/addon-fit";
import type { Terminal } from "@xterm/xterm";
import {
  ChevronDown,
  Moon,
  Plus,
  Power,
  RotateCw,
  Sun,
  Terminal as TerminalIcon,
  Trash2,
  X,
} from "lucide-react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { AddConsoleDropdownContent } from "@/components/console/add-console-dropdown";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
              "absolute inset-0 z-10 flex flex-col items-center justify-center text-xs space-y-3 p-4 transition-colors",
              theme === "dark" ? "bg-[#09090b]/95 text-zinc-400" : "bg-white/95 text-zinc-600",
            )}
          >
            <Power
              className={cn(
                "w-8 h-8 opacity-40",
                theme === "dark" ? "text-zinc-500" : "text-zinc-400",
              )}
            />
            <div className="text-center">
              <p
                className={cn("font-medium", theme === "dark" ? "text-zinc-200" : "text-zinc-800")}
              >
                "{node?.name || nodeId}" is stopped
              </p>
              {node?.console && (
                <p
                  className={cn(
                    "text-[11px] font-mono mt-0.5",
                    theme === "dark" ? "text-zinc-400" : "text-zinc-500",
                  )}
                >
                  Port: {node.console}
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => startNodeMutation.mutate(nodeId)}
              disabled={startNodeMutation.isPending}
              className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 gap-1.5"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Start Node to Connect Console</span>
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
    theme,
    toggleTheme,
  } = useUIStore();
  const { activeProjectId } = useTopologyStore();

  const { data: nodes = [] } = useProjectNodes(activeProjectId);

  const terminalViewportRef = useRef<TerminalViewportHandle>(null);

  const [addDropdownOpen, setAddDropdownOpen] = useState(false);

  const activeNode = nodes.find((n) => n.node_id === activeConsoleNodeId);

  const activeNodeStarted = activeNode?.status === "started";

  // Automatically close the bottom drawer if all consoles are closed
  useEffect(() => {
    if (openConsoles.length === 0 && bottomPanelOpen && activeBottomTab === "consoles") {
      setBottomPanelOpen(false);
    }
  }, [openConsoles.length, bottomPanelOpen, activeBottomTab, setBottomPanelOpen]);

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
    <div
      className={cn(
        "flex flex-col h-full w-full overflow-hidden transition-colors",
        theme === "dark" ? "bg-[#09090b]" : "bg-white",
      )}
    >
      <div className="flex items-center justify-between border-b p-1.5 text-xs select-none shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto min-w-0 flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {openConsoles.map((nodeId) => {
            const node = nodes.find((n) => n.node_id === nodeId);
            const isActive = nodeId === activeConsoleNodeId;
            const nodeName = node?.name || nodeId.substring(0, 8);
            return (
              <div
                key={nodeId}
                onClick={() => setActiveConsoleNodeId(nodeId)}
                className={cn(
                  "group flex items-center gap-1.5 px-2.5 py-1 border rounded-sm text-xs cursor-pointer transition-all",
                  isActive
                    ? "bg-muted border-border text-foreground font-medium shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                <span className="truncate text-xs">{nodeName}</span>

                <Button
                  size="icon-xs"
                  variant="ghost"
                  title="Close console"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeConsoleForNode(nodeId);
                  }}
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-opacity"
                >
                  <X className="w-2.5 h-2.5" />
                </Button>
              </div>
            );
          })}

          {/* Plus icon button to open more node consoles */}
          <Popover open={addDropdownOpen} onOpenChange={setAddDropdownOpen}>
            <PopoverTrigger asChild>
              <Button size="icon-xs" variant="outline" title="Open Node Console">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0 shadow-lg">
              <AddConsoleDropdownContent onSelect={() => setAddDropdownOpen(false)} />
            </PopoverContent>
          </Popover>
        </div>

        {/* Console Controls on the Right */}
        <div className="flex items-center gap-0.5 shrink-0 pl-1 border-l border-border/60">
          <Button
            size="icon-xs"
            variant="ghost"
            title="Reconnect Active Console"
            onClick={() => terminalViewportRef.current?.reconnect()}
            disabled={!activeConsoleNodeId || !activeNodeStarted}
            className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="icon-xs"
            variant="ghost"
            title={theme === "dark" ? "Switch to light terminal" : "Switch to dark terminal"}
            onClick={toggleTheme}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </Button>

          {activeConsoleNodeId && (
            <Button
              size="icon-xs"
              variant="ghost"
              title="Clear active terminal"
              onClick={() => terminalViewportRef.current?.clear()}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="w-3.5 h-3.5" />
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
              <X className="w-3.5 h-3.5" />
            </Button>
          )}

          <Button
            size="icon-xs"
            variant="ghost"
            title="Minimize Drawer"
            onClick={() => setBottomPanelOpen(false)}
            className="text-muted-foreground hover:text-foreground h-6 w-6"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </Button>
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
