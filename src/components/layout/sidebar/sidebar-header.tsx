import type React from "react";

interface SidebarHeaderProps {
	title: string;
	action?: React.ReactNode;
}

export function SidebarHeader({ title, action }: SidebarHeaderProps) {
	return (
		<div className="pt-3 px-3 flex items-center justify-between shrink-0">
			<span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
				{title}
			</span>
			{action && <div className="flex items-center gap-1">{action}</div>}
		</div>
	);
}
