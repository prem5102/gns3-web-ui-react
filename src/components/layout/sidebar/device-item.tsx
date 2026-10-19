import { Info } from "lucide-react";
import type React from "react";
import { resolveNodeSymbol } from "@/lib/symbols";
import type { GNS3Template } from "@/types/gns3";

interface DeviceItemProps {
  template: GNS3Template;
  onQuickAdd: (templateId: string) => void;
  onOpenDetails: (template: GNS3Template) => void;
}

export function DeviceGridItem({ template, onQuickAdd, onOpenDetails }: DeviceItemProps) {
  const symbolSrc = resolveNodeSymbol(template);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/gns3-template", template.template_id);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDoubleClick={() => onQuickAdd(template.template_id)}
      className="group relative flex flex-col items-center p-3 rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-grab active:cursor-grabbing text-xs select-none"
    >
      {/* Top Right Info Icon (Only shown when hovering) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenDetails(template);
        }}
        title="Node Model Details"
        className="absolute top-1.5 right-1.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {/* Node Symbol Graphic - No border */}
      <div className="relative w-12 h-12 flex items-center justify-center mb-2">
        <img
          src={symbolSrc}
          alt={template.name}
          className="w-12 h-12 object-contain pointer-events-none select-none transition-transform group-hover:scale-105"
          draggable={false}
        />
      </div>

      {/* Node Model Info */}
      <div className="w-full text-center min-w-0">
        <span
          className="font-semibold text-foreground truncate block text-xs"
          title={template.name}
        >
          {template.name}
        </span>
        <span className="text-[10px] text-muted-foreground capitalize truncate block mt-0.5">
          {template.category || "Device"}
        </span>
      </div>
    </div>
  );
}

export function DeviceListItem({ template, onQuickAdd, onOpenDetails }: DeviceItemProps) {
  const symbolSrc = resolveNodeSymbol(template);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/gns3-template", template.template_id);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDoubleClick={() => onQuickAdd(template.template_id)}
      className="group relative flex items-center justify-between p-2 rounded-lg border border-border/70 bg-card hover:border-primary/50 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing text-xs select-none"
    >
      <div className="flex items-center gap-2.5 min-w-0 pr-1">
        <div className="w-7 h-7 flex items-center justify-center shrink-0">
          <img
            src={symbolSrc}
            alt={template.name}
            className="w-6 h-6 object-contain pointer-events-none select-none"
            draggable={false}
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-foreground truncate">{template.name}</span>
          <span className="text-[10px] text-muted-foreground capitalize">
            {template.category || "Device"}
          </span>
        </div>
      </div>

      {/* Hover Info Icon */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenDetails(template);
        }}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
