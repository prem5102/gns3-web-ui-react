import "@testing-library/jest-dom";

if (typeof window !== "undefined" && !window.ResizeObserver) {
	window.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	} as unknown as typeof ResizeObserver;
}
