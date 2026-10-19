import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useProjectNodes } from "@/features/nodes/use-nodes";
import { useTopologyStore } from "@/stores/topology-store";
import { useUIStore } from "@/stores/ui-store";

interface AddConsoleDropdownContentProps {
  onSelect?: () => void;
}

export function AddConsoleDropdownContent({ onSelect }: AddConsoleDropdownContentProps) {
  const { activeProjectId } = useTopologyStore();
  const { data: nodes = [] } = useProjectNodes(activeProjectId);
  const { openConsoles, openConsoleForNode } = useUIStore();
  const [nodeSearch, setNodeSearch] = useState("");

  const availableNodes = nodes.filter((n) => !openConsoles.includes(n.node_id));
  const filteredNodes = availableNodes.filter((n) =>
    n.name.toLowerCase().includes(nodeSearch.toLowerCase().trim()),
  );

  return (
    <div className="w-64 p-2 gap-2 flex flex-col">
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
                  onSelect?.();
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
    </div>
  );
}
