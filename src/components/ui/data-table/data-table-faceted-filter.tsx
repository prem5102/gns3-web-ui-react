import type { Column, RowData } from "@tanstack/react-table";
import { Check, PlusCircle, X } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { DataTableFeatures } from "./data-table-features";

export interface DataTableFacetedFilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

interface DataTableFacetedFilterProps<TData extends RowData, TValue> {
  column?: Column<DataTableFeatures, TData, TValue>;
  title?: string;
  options: DataTableFacetedFilterOption[];
  value?: string | string[];
  onChange?: (value: string | string[] | undefined) => void;
  multiSelect?: boolean;
}

export function DataTableFacetedFilter<TData extends RowData, TValue>({
  column,
  title,
  options,
  value: controlledValue,
  onChange,
  multiSelect = false,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const columnFilterValue = column?.getFilterValue();
  const currentValue = controlledValue ?? columnFilterValue;

  const selectedValues = React.useMemo(() => {
    if (Array.isArray(currentValue)) {
      return new Set(currentValue);
    }
    if (typeof currentValue === "string" && currentValue && currentValue !== "all") {
      return new Set([currentValue]);
    }
    return new Set<string>();
  }, [currentValue]);

  const handleSelect = (optionValue: string) => {
    if (multiSelect) {
      const next = new Set(selectedValues);
      if (next.has(optionValue)) {
        next.delete(optionValue);
      } else {
        next.add(optionValue);
      }
      const arr = Array.from(next);
      const finalVal = arr.length ? arr : undefined;
      if (column) {
        column.setFilterValue(finalVal);
      }
      onChange?.(finalVal);
    } else {
      const isCurrent = selectedValues.has(optionValue);
      const finalVal = isCurrent ? undefined : optionValue;
      if (column) {
        column.setFilterValue(finalVal);
      }
      onChange?.(finalVal);
    }
  };

  const handleClear = () => {
    if (column) {
      column.setFilterValue(undefined);
    }
    onChange?.(undefined);
  };

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchQuery]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed text-xs gap-1.5">
          <PlusCircle className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{title}</span>
          {selectedValues.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-1 h-3.5" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1.5 py-0 font-normal text-[10px] lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1.5 py-0 font-normal text-[10px]"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1.5 py-0 font-normal text-[10px]"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1.5" align="start">
        {options.length > 5 && (
          <div className="pb-1.5">
            <Input
              placeholder={`Filter ${title?.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        )}
        <div className="space-y-0.5 max-h-56 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="py-2 text-center text-xs text-muted-foreground">No results found.</div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = selectedValues.has(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-left cursor-pointer transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent/60 font-medium text-accent-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary/60 transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "opacity-40 [&_svg]:invisible",
                    )}
                  >
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  {option.icon && (
                    <option.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="flex-1 truncate">{option.label}</span>
                  {option.count !== undefined && (
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                      {option.count}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
        {selectedValues.size > 0 && (
          <>
            <div className="my-1 border-t border-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="w-full justify-center text-xs h-7 font-normal text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3 mr-1" />
              Clear filters
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
