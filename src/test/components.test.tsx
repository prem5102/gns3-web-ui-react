import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

describe("UI Primitives", () => {
	it("renders Badge with custom variants", () => {
		const { rerender } = render(<Badge variant="success">Running</Badge>);
		expect(screen.getByText("Running")).toBeDefined();

		rerender(<Badge variant="destructive">Stopped</Badge>);
		expect(screen.getByText("Stopped")).toBeDefined();
	});

	it("renders Button and handles click events", () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Click Me</Button>);

		const button = screen.getByText("Click Me");
		button.click();
		expect(handleClick).toHaveBeenCalledTimes(1);
	});
});
