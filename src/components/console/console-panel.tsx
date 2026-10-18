import type { FitAddon } from "@xterm/addon-fit";
import type { Terminal } from "@xterm/xterm";
import {
  ChevronDown,
  Plus,
  Power,
  RotateCw,
  Search,
  Terminal as TerminalIcon,
  Trash2,
  X,
} from "lucide-react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useProjectNodes, useStartNode } from "@/features/nodes/use-nodes";
import { gns3Api } from "@/lib/gns3-api";
import { useTopologyStore } from "@/stores/topology-store";
import { useUIStore } from "@/stores/ui-store";

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
            theme:
              theme === "dark"
                ? {
                    background: "#09090b",
                    foreground: "#f4f4f5",
                    cursor: "#3b82f6",
                    selectionBackground: "rgba(59, 130, 246, 0.3)",
                  }
                : {
                    background: "#ffffff",
                    foreground: "#18181b",
                    cursor: "#2563eb",
                    selectionBackground: "rgba(37, 99, 235, 0.2)",
                  },
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
    }, [projectId, nodeId, isNodeStarted, sendTerminalSize, theme]);

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
      <div className="relative w-full h-full bg-[#09090b] overflow-hidden">
        {!isNodeStarted && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-zinc-400 text-xs space-y-3 bg-[#09090b]/95 p-4">
            <Power className="w-8 h-8 opacity-40 text-zinc-500" />
            <div className="text-center">
              <p className="font-medium text-zinc-200">"{node?.name || nodeId}" is stopped</p>
              {node?.console && (
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">Port: {node.console}</p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => startNodeMutation.mutate(nodeId)}
              disabled={startNodeMutation.isPending}
              className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 gap-1.5"
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
    openConsoleForNode,
    closeConsoleForNode,
    closeAllConsoles,
    setBottomPanelOpen,
  } = useUIStore();
  const { activeProjectId } = useTopologyStore();

  const { data: nodes = [] } = useProjectNodes(activeProjectId);
  const terminalViewportRef = useRef<TerminalViewportHandle>(null);

  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [nodeSearch, setNodeSearch] = useState("");

  const activeNode = nodes.find((n) => n.node_id === activeConsoleNodeId);
  const activeNodeStarted = activeNode?.status === "started";

  const availableNodes = nodes.filter((n) => !openConsoles.includes(n.node_id));

  const filteredNodes = availableNodes.filter((n) =>
    n.name.toLowerCase().includes(nodeSearch.toLowerCase().trim()),
  );

  if (!activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-muted-foreground text-xs">
        <TerminalIcon className="w-8 h-8 opacity-30 mb-2" />
        <p>No project opened. Select or open a project first.</p>
      </div>
    );
  }

  if (openConsoles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-muted-foreground text-xs space-y-2">
        <TerminalIcon className="w-8 h-8 opacity-30" />
        <p>No active console sessions.</p>
        <p className="text-[11px] text-muted-foreground/80">
          Click the console icon on any device node or open one from below.
        </p>

        <Popover open={addDropdownOpen} onOpenChange={setAddDropdownOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5 mt-2">
              <Plus className="w-3.5 h-3.5" />
              <span>Open Node Console</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center" className="w-64 p-2 gap-2 flex flex-col shadow-lg">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search nodes..."
                value={nodeSearch}
                onChange={(e) => setNodeSearch(e.target.value)}
                className="h-7 pl-8 text-xs bg-muted/40"
                autoFocus
              />
            </div>

            <div className="max-h-52 overflow-y-auto space-y-0.5">
              {filteredNodes.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">No nodes found</div>
              ) : (
                filteredNodes.map((n) => {
                  const isStarted = n.status === "started";

                  return (
                    <button
                      key={n.node_id}
                      type="button"
                      onClick={() => {
                        openConsoleForNode(n.node_id);
                        setAddDropdownOpen(false);
                        setNodeSearch("");
                      }}
                      className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-sm text-xs hover:bg-muted text-foreground transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isStarted
                              ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                              : n.status === "suspended"
                                ? "bg-amber-500"
                                : "bg-muted-foreground/40"
                          }`}
                        />
                        <span className="truncate text-xs">{n.name}</span>
                        {n.console && (
                          <span className="text-[10px] text-muted-foreground/70 font-mono shrink-0">
                            :{n.console}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className="flex flex-row h-full w-full overflow-hidden">
      <div className="w-56 sm:w-64 flex-shrink-0 flex flex-col border-r border-border/80 select-none">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/70">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-semibold text-foreground tracking-tight truncate">
              Consoles
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            {/* Add Console Dropdown */}
            <Popover open={addDropdownOpen} onOpenChange={setAddDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  title="Open Node Console"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-2 gap-2 flex flex-col shadow-lg">
                <div className="relative flex items-center">
                  <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search nodes..."
                    value={nodeSearch}
                    onChange={(e) => setNodeSearch(e.target.value)}
                    className="h-7 pl-8 text-xs bg-muted/40"
                    autoFocus
                  />
                </div>

                <div className="max-h-52 overflow-y-auto space-y-0.5">
                  {availableNodes.length === 0 ? (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      All node consoles are open
                    </div>
                  ) : filteredNodes.length === 0 ? (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      No nodes found
                    </div>
                  ) : (
                    filteredNodes.map((n) => {
                      const isStarted = n.status === "started";

                      return (
                        <button
                          key={n.node_id}
                          type="button"
                          onClick={() => {
                            openConsoleForNode(n.node_id);
                            setAddDropdownOpen(false);
                            setNodeSearch("");
                          }}
                          className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-sm text-xs hover:bg-muted text-foreground transition-colors cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isStarted
                                  ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                                  : n.status === "suspended"
                                    ? "bg-amber-500"
                                    : "bg-muted-foreground/40"
                              }`}
                            />
                            <span className="truncate text-xs font-medium">{n.name}</span>
                            {n.console && (
                              <span className="text-[10px] text-muted-foreground/70 font-mono shrink-0">
                                :{n.console}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>

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

        {/* Vertical Tabs List */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
          {openConsoles.map((nodeId) => {
            const node = nodes.find((n) => n.node_id === nodeId);
            const isActive = nodeId === activeConsoleNodeId;
            const nodeName = node?.name || nodeId.substring(0, 8);
            const isStarted = node?.status === "started";

            return (
              <div
                key={nodeId}
                onClick={() => setActiveConsoleNodeId(nodeId)}
                className={`group flex items-center justify-between gap-2 px-2.5 py-1 rounded-md text-xs cursor-pointer border transition-all ${
                  isActive
                    ? "bg-card border-primary/40 text-foreground font-medium shadow-xs ring-1 ring-primary/20"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isStarted
                        ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                        : node?.status === "suspended"
                          ? "bg-amber-500"
                          : "bg-muted-foreground/40"
                    }`}
                  />
                  <div className="flex items-center justify-between gap-1 min-w-0 flex-1">
                    <span className="truncate text-xs font-medium">{nodeName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 shrink-0 ml-1">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    title="Clear terminal"
                    onClick={(e) => {
                      e.stopPropagation();
                      terminalViewportRef.current?.clear();
                    }}
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>

                  <Button
                    size="icon-xs"
                    variant="ghost"
                    title="Close console"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeConsoleForNode(nodeId);
                    }}
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-w-0 h-full">
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
