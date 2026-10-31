import type { ReactTable, RowData } from "@tanstack/react-table";
import { X } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { DataTableFeatures } from "./data-table-features";

interface DataTableFloatingBarProps<TData extends RowData>
	extends React.HTMLAttributes<HTMLDivElement> {
	table: ReactTable<DataTableFeatures, TData>;
	children?: React.ReactNode;
}

export function DataTableFloatingBar<TData extends RowData>({
	table,
	children,
	className,
	...props
}: DataTableFloatingBarProps<TData>) {
	const selectedRows = table.getFilteredSelectedRowModel().rows;
	const selectedCount = selectedRows.length;

	if (selectedCount === 0) return null;

	return (
		<div
			className={cn(
				"fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-border/80 bg-background/95 backdrop-blur-md shadow-2xl p-2 px-3 sm:px-4 flex items-center gap-2 sm:gap-3 text-xs animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-[calc(100vw-2rem)]",
				className,
			)}
			{...props}
		>
			<div className="flex items-center gap-1.5 font-medium shrink-0">
				<span className="flex h-5 items-center justify-center rounded-md bg-primary/10 px-2 font-mono text-[11px] font-semibold text-primary">
					{selectedCount}
				</span>
				<span className="text-muted-foreground hidden sm:inline">selected</span>
			</div>

			<Separator orientation="vertical" className="h-4" />

			<div className="flex items-center gap-1.5 overflow-x-auto">
				{children}
			</div>

			<Separator orientation="vertical" className="h-4" />

			<Button
				size="icon-xs"
				variant="ghost"
				onClick={() => table.resetRowSelection()}
				title="Clear selection"
				className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
			>
				<X className="w-3.5 h-3.5" />
				<span className="sr-only">Clear selection</span>
			</Button>
		</div>
	);
}
