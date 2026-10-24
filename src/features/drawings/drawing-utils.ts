/**
 * Drawing utilities, SVG generators, parsers, and GNS3 semantic color schemes.
 */

export interface DrawingStyleProps {
	fill?: string;
	fillOpacity?: number;
	stroke?: string;
	strokeWidth?: number;
	strokeStyle?: "solid" | "dashed" | "dotted";
	cornerRadius?: number;
	fontSize?: number;
	fontFamily?: string;
	fontWeight?: "normal" | "bold";
	fontStyle?: "normal" | "italic";
	text?: string;
	width?: number;
	height?: number;
	rotation?: number;
	locked?: boolean;
	z?: number;
	href?: string;
	arrowType?: "single" | "double";
}

export type DrawingType =
	| "rectangle"
	| "ellipse"
	| "text"
	| "line"
	| "arrow"
	| "cloud"
	| "pen"
	| "image"
	| "custom";

export const NETWORK_COLOR_PRESETS = [
	{
		id: "CORE_BACKBONE",
		name: "Core / Backbone (Area 0)",
		fill: "#3b82f6",
		fillOpacity: 0.15,
		stroke: "#2563eb",
	},
	{
		id: "NORMAL_AREA",
		name: "Routing Area (OSPF/IS-IS)",
		fill: "#10b981",
		fillOpacity: 0.15,
		stroke: "#059669",
	},
	{
		id: "ISOLATION",
		name: "VLAN / VRF / MPLS",
		fill: "#8b5cf6",
		fillOpacity: 0.15,
		stroke: "#7c3aed",
	},
	{
		id: "HIGH_AVAILABILITY",
		name: "HA / HSRP / VRRP",
		fill: "#06b6d4",
		fillOpacity: 0.15,
		stroke: "#0891b2",
	},
	{
		id: "EXTERNAL",
		name: "Internet / DMZ",
		fill: "#ef4444",
		fillOpacity: 0.15,
		stroke: "#dc2626",
	},
	{
		id: "SECURITY",
		name: "Security / VPN",
		fill: "#f59e0b",
		fillOpacity: 0.15,
		stroke: "#d97706",
	},
	{
		id: "MANAGEMENT",
		name: "Management / OOB",
		fill: "#64748b",
		fillOpacity: 0.15,
		stroke: "#475569",
	},
	{
		id: "CLOUD",
		name: "Cloud / Tunnel",
		fill: "#0284c7",
		fillOpacity: 0.15,
		stroke: "#0369a1",
	},
];

export function getStrokeDashArray(
	style?: "solid" | "dashed" | "dotted",
	strokeWidth = 2,
): string | undefined {
	if (style === "dashed") return `${strokeWidth * 3},${strokeWidth * 2}`;
	if (style === "dotted") return `${strokeWidth},${strokeWidth * 2}`;
	return undefined;
}

export function parseStrokeDashArray(
	dash?: string,
): "solid" | "dashed" | "dotted" {
	if (!dash || dash === "none") return "solid";
	const parts = dash.split(/[\s,]+/).map(Number);
	if (parts.length >= 2 && parts[0] <= parts[1]) return "dotted";
	return "dashed";
}

// -------------------------------------------------------------
// SVG Generators
// -------------------------------------------------------------

export function generateRectangleSvg(opts: {
	width: number;
	height: number;
	fill?: string;
	fillOpacity?: number;
	stroke?: string;
	strokeWidth?: number;
	strokeStyle?: "solid" | "dashed" | "dotted";
	cornerRadius?: number;
}): string {
	const {
		width,
		height,
		fill = "#3b82f6",
		fillOpacity = 0.15,
		stroke = "#2563eb",
		strokeWidth = 2,
		strokeStyle = "solid",
		cornerRadius = 8,
	} = opts;

	const dashAttr = getStrokeDashArray(strokeStyle, strokeWidth);
	const dashStr = dashAttr ? ` stroke-dasharray="${dashAttr}"` : "";

	const pad = Math.ceil(strokeWidth / 2);
	const totalWidth = width + strokeWidth;
	const totalHeight = height + strokeWidth;

	return `<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${pad}" y="${pad}" width="${width}" height="${height}" rx="${cornerRadius}" ry="${cornerRadius}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${strokeWidth}"${dashStr} />
</svg>`;
}

export function generateEllipseSvg(opts: {
	width: number;
	height: number;
	fill?: string;
	fillOpacity?: number;
	stroke?: string;
	strokeWidth?: number;
	strokeStyle?: "solid" | "dashed" | "dotted";
}): string {
	const {
		width,
		height,
		fill = "#8b5cf6",
		fillOpacity = 0.15,
		stroke = "#7c3aed",
		strokeWidth = 2,
		strokeStyle = "solid",
	} = opts;

	const dashAttr = getStrokeDashArray(strokeStyle, strokeWidth);
	const dashStr = dashAttr ? ` stroke-dasharray="${dashAttr}"` : "";

	const totalWidth = width + strokeWidth;
	const totalHeight = height + strokeWidth;
	const cx = totalWidth / 2;
	const cy = totalHeight / 2;
	const rx = width / 2;
	const ry = height / 2;

	return `<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${strokeWidth}"${dashStr} />
</svg>`;
}

export function generateTextSvg(opts: {
	text: string;
	fontSize?: number;
	fontFamily?: string;
	fontWeight?: "normal" | "bold";
	fontStyle?: "normal" | "italic";
	color?: string;
	fill?: string;
	fillOpacity?: number;
	stroke?: string;
	strokeWidth?: number;
}): string {
	const {
		text,
		fontSize = 14,
		fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
		fontWeight = "bold",
		fontStyle = "normal",
		color = "#3b82f6",
		fill = "transparent",
		fillOpacity = 0,
		stroke = "transparent",
		strokeWidth = 0,
	} = opts;

	const lines = text.split("\n");
	const maxLineLength = Math.max(...lines.map((l) => l.length), 1);
	const charWidth = fontSize * 0.65;
	const lineHeight = fontSize * 1.35;
	const textWidth = Math.max(80, Math.ceil(maxLineLength * charWidth + 24));
	const textHeight = Math.max(36, Math.ceil(lines.length * lineHeight + 16));

	const escapedLines = lines
		.map(
			(line, idx) =>
				`<tspan x="12" y="${20 + idx * lineHeight}">${escapeXml(line || " ")}</tspan>`,
		)
		.join("");

	return `<svg width="${textWidth}" height="${textHeight}" viewBox="0 0 ${textWidth} ${textHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect x="1" y="1" width="${textWidth - 2}" height="${textHeight - 2}" rx="4" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${strokeWidth}" />
  <text font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" font-style="${fontStyle}" fill="${color}" xml:space="preserve">${escapedLines}</text>
</svg>`;
}

export function generateLineSvg(opts: {
	width: number;
	height: number;
	stroke?: string;
	strokeWidth?: number;
	strokeStyle?: "solid" | "dashed" | "dotted";
}): string {
	const {
		width = 160,
		height = 40,
		stroke = "#64748b",
		strokeWidth = 2,
		strokeStyle = "solid",
	} = opts;

	const dashAttr = getStrokeDashArray(strokeStyle, strokeWidth);
	const dashStr = dashAttr ? ` stroke-dasharray="${dashAttr}"` : "";

	const totalWidth = Math.max(width, 20);
	const totalHeight = Math.max(height, 20);

	return `<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <line x1="${strokeWidth}" y1="${totalHeight / 2}" x2="${totalWidth - strokeWidth}" y2="${totalHeight / 2}" stroke="${stroke}" stroke-width="${strokeWidth}"${dashStr} stroke-linecap="round" />
</svg>`;
}

export function generateArrowSvg(opts: {
	width: number;
	height: number;
	stroke?: string;
	strokeWidth?: number;
	strokeStyle?: "solid" | "dashed" | "dotted";
	arrowType?: "single" | "double";
}): string {
	const {
		width = 180,
		height = 40,
		stroke = "#2563eb",
		strokeWidth = 2,
		strokeStyle = "solid",
		arrowType = "single",
	} = opts;

	const dashAttr = getStrokeDashArray(strokeStyle, strokeWidth);
	const dashStr = dashAttr ? ` stroke-dasharray="${dashAttr}"` : "";

	const totalWidth = Math.max(width, 30);
	const totalHeight = Math.max(height, 24);
	const cy = totalHeight / 2;
	const arrowSize = strokeWidth * 3 + 4;

	const endArrow = `<polygon points="${totalWidth - strokeWidth},${cy} ${totalWidth - strokeWidth - arrowSize},${cy - arrowSize * 0.6} ${totalWidth - strokeWidth - arrowSize},${cy + arrowSize * 0.6}" fill="${stroke}" />`;
	const startArrow =
		arrowType === "double"
			? `<polygon points="${strokeWidth},${cy} ${strokeWidth + arrowSize},${cy - arrowSize * 0.6} ${strokeWidth + arrowSize},${cy + arrowSize * 0.6}" fill="${stroke}" />`
			: "";

	const startX =
		arrowType === "double" ? strokeWidth + arrowSize * 0.8 : strokeWidth;
	const endX = totalWidth - strokeWidth - arrowSize * 0.8;

	return `<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <line x1="${startX}" y1="${cy}" x2="${endX}" y2="${cy}" stroke="${stroke}" stroke-width="${strokeWidth}"${dashStr} />
  ${endArrow}
  ${startArrow}
</svg>`;
}

export function generateCloudSvg(opts: {
	width: number;
	height: number;
	fill?: string;
	fillOpacity?: number;
	stroke?: string;
	strokeWidth?: number;
	strokeStyle?: "solid" | "dashed" | "dotted";
}): string {
	const {
		width = 240,
		height = 140,
		fill = "#0284c7",
		fillOpacity = 0.15,
		stroke = "#0284c7",
		strokeWidth = 2,
		strokeStyle = "solid",
	} = opts;

	const dashAttr = getStrokeDashArray(strokeStyle, strokeWidth);
	const dashStr = dashAttr ? ` stroke-dasharray="${dashAttr}"` : "";

	// Cloud path scaled to width and height
	// Baseline path on 100x60 viewBox:
	// M 25,50 A 20,20 0 0,1 45,20 A 25,25 0 0,1 80,25 A 20,20 0 0,1 90,50 A 15,15 0 0,1 80,55 L 25,55 A 15,15 0 0,1 25,50 Z
	const totalWidth = width + strokeWidth * 2;
	const totalHeight = height + strokeWidth * 2;

	return `<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 100 65" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M 22 52 C 14 52 8 46 8 38 C 8 31 13 25 20 24 C 22 14 31 7 42 7 C 51 7 59 12 63 19 C 67 17 71 16 75 16 C 85 16 93 23 93 33 C 93 34 93 35 93 36 C 96 38 98 42 98 46 C 98 51 94 55 89 55 L 22 55 Z" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${(strokeWidth / width) * 100}"${dashStr} />
</svg>`;
}

export function generatePenSvg(opts: {
	points: Array<{ x: number; y: number }>;
	stroke?: string;
	strokeWidth?: number;
}): string {
	const { points, stroke = "#ef4444", strokeWidth = 3 } = opts;
	if (points.length === 0) return "<svg></svg>";

	const minX = Math.min(...points.map((p) => p.x));
	const maxX = Math.max(...points.map((p) => p.x));
	const minY = Math.min(...points.map((p) => p.y));
	const maxY = Math.max(...points.map((p) => p.y));

	const pad = strokeWidth * 2;
	const width = Math.max(maxX - minX + pad * 2, 20);
	const height = Math.max(maxY - minY + pad * 2, 20);

	let d = `M ${points[0].x - minX + pad} ${points[0].y - minY + pad}`;
	for (let i = 1; i < points.length; i++) {
		d += ` L ${points[i].x - minX + pad} ${points[i].y - minY + pad}`;
	}

	return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <path d="${d}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;
}

export function generateImageSvg(opts: {
	width: number;
	height: number;
	href: string;
}): string {
	const { width, height, href } = opts;
	return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="${width}" height="${height}" href="${href}" xlink:href="${href}" preserveAspectRatio="none" />
</svg>`;
}

// -------------------------------------------------------------
// SVG Parser & Inspect Helpers
// -------------------------------------------------------------

export function parseSvgContent(svgString: string): {
	type: DrawingType;
	width: number;
	height: number;
	fill?: string;
	fillOpacity?: number;
	stroke?: string;
	strokeWidth?: number;
	strokeStyle?: "solid" | "dashed" | "dotted";
	cornerRadius?: number;
	text?: string;
	fontSize?: number;
	fontFamily?: string;
	fontWeight?: "normal" | "bold";
	fontStyle?: "normal" | "italic";
	href?: string;
	arrowType?: "single" | "double";
} {
	if (!svgString) {
		return { type: "custom", width: 100, height: 100 };
	}

	try {
		const parser = new DOMParser();
		const doc = parser.parseFromString(svgString, "image/svg+xml");
		const svgEl = doc.querySelector("svg");

		let width =
			Number.parseInt(svgEl?.getAttribute("width") || "100", 10) || 100;
		let height =
			Number.parseInt(svgEl?.getAttribute("height") || "100", 10) || 100;

		const viewBox = svgEl?.getAttribute("viewBox");
		if (viewBox && (width <= 0 || height <= 0)) {
			const parts = viewBox.split(/[\s,]+/).map(Number);
			if (parts.length === 4) {
				width = parts[2];
				height = parts[3];
			}
		}

		if (width <= 0) width = 100;
		if (height <= 0) height = 40;

		// Check for Text
		const textEl = doc.querySelector("text");
		if (textEl) {
			const tspans = Array.from(textEl.querySelectorAll("tspan"));
			const textContent =
				tspans.length > 0
					? tspans.map((t) => t.textContent || "").join("\n")
					: textEl.textContent || "";

			const rectEl = doc.querySelector("rect");

			return {
				type: "text",
				width,
				height,
				text: textContent,
				fill: rectEl?.getAttribute("fill") || undefined,
				fillOpacity: rectEl
					? Number.parseFloat(rectEl.getAttribute("fill-opacity") || "1")
					: undefined,
				stroke: textEl.getAttribute("fill") || "#3b82f6",
				strokeWidth: 0,
				fontSize:
					Number.parseInt(textEl.getAttribute("font-size") || "14", 10) || 14,
				fontFamily: textEl.getAttribute("font-family") || "monospace",
				fontWeight:
					(textEl.getAttribute("font-weight") as "normal" | "bold") || "normal",
				fontStyle:
					(textEl.getAttribute("font-style") as "normal" | "italic") ||
					"normal",
			};
		}

		// Check for Image
		const imageEl = doc.querySelector("image");
		if (imageEl) {
			return {
				type: "image",
				width,
				height,
				href:
					imageEl.getAttribute("href") ||
					imageEl.getAttribute("xlink:href") ||
					"",
			};
		}

		// Check for Cloud
		const pathEl = doc.querySelector("path");
		if (pathEl) {
			const d = pathEl.getAttribute("d") || "";
			if (d.includes("C") && d.includes("L 22 55")) {
				return {
					type: "cloud",
					width,
					height,
					fill: pathEl.getAttribute("fill") || "#0284c7",
					fillOpacity: Number.parseFloat(
						pathEl.getAttribute("fill-opacity") || "0.15",
					),
					stroke: pathEl.getAttribute("stroke") || "#0284c7",
					strokeWidth:
						Number.parseInt(pathEl.getAttribute("stroke-width") || "2", 10) ||
						2,
					strokeStyle: parseStrokeDashArray(
						pathEl.getAttribute("stroke-dasharray") || undefined,
					),
				};
			}
			return {
				type: "pen",
				width,
				height,
				stroke: pathEl.getAttribute("stroke") || "#ef4444",
				strokeWidth:
					Number.parseInt(pathEl.getAttribute("stroke-width") || "3", 10) || 3,
			};
		}

		// Check for Arrow (line + polygon)
		const polyEl = doc.querySelector("polygon");
		const lineEl = doc.querySelector("line");
		if (polyEl && lineEl) {
			const polys = doc.querySelectorAll("polygon");
			return {
				type: "arrow",
				width,
				height,
				stroke: lineEl.getAttribute("stroke") || "#2563eb",
				strokeWidth:
					Number.parseInt(lineEl.getAttribute("stroke-width") || "2", 10) || 2,
				arrowType: polys.length > 1 ? ("double" as const) : ("single" as const),
				strokeStyle: parseStrokeDashArray(
					lineEl.getAttribute("stroke-dasharray") || undefined,
				),
			};
		}

		// Check for Line
		if (lineEl) {
			return {
				type: "line",
				width,
				height,
				stroke: lineEl.getAttribute("stroke") || "#64748b",
				strokeWidth:
					Number.parseInt(lineEl.getAttribute("stroke-width") || "2", 10) || 2,
				strokeStyle: parseStrokeDashArray(
					lineEl.getAttribute("stroke-dasharray") || undefined,
				),
			};
		}

		// Check for Ellipse
		const ellipseEl = doc.querySelector("ellipse");
		if (ellipseEl) {
			return {
				type: "ellipse",
				width,
				height,
				fill: ellipseEl.getAttribute("fill") || "#8b5cf6",
				fillOpacity: Number.parseFloat(
					ellipseEl.getAttribute("fill-opacity") || "0.15",
				),
				stroke: ellipseEl.getAttribute("stroke") || "#7c3aed",
				strokeWidth:
					Number.parseInt(ellipseEl.getAttribute("stroke-width") || "2", 10) ||
					2,
				strokeStyle: parseStrokeDashArray(
					ellipseEl.getAttribute("stroke-dasharray") || undefined,
				),
			};
		}

		// Check for Rectangle
		const rectEl = doc.querySelector("rect");
		if (rectEl) {
			return {
				type: "rectangle",
				width,
				height,
				fill: rectEl.getAttribute("fill") || "#3b82f6",
				fillOpacity: Number.parseFloat(
					rectEl.getAttribute("fill-opacity") || "0.15",
				),
				stroke: rectEl.getAttribute("stroke") || "#2563eb",
				strokeWidth:
					Number.parseInt(rectEl.getAttribute("stroke-width") || "2", 10) || 2,
				strokeStyle: parseStrokeDashArray(
					rectEl.getAttribute("stroke-dasharray") || undefined,
				),
				cornerRadius:
					Number.parseInt(rectEl.getAttribute("rx") || "8", 10) || 8,
			};
		}

		return { type: "custom", width, height };
	} catch {
		return { type: "custom", width: 100, height: 100 };
	}
}

export function updateSvgDimensions(
	svgString: string,
	newWidth: number,
	newHeight: number,
): string {
	const parsed = parseSvgContent(svgString);
	if (parsed.type === "rectangle") {
		return generateRectangleSvg({
			width: Math.max(newWidth, 20),
			height: Math.max(newHeight, 20),
			fill: parsed.fill,
			fillOpacity: parsed.fillOpacity,
			stroke: parsed.stroke,
			strokeWidth: parsed.strokeWidth,
			strokeStyle: parsed.strokeStyle,
			cornerRadius: parsed.cornerRadius,
		});
	}

	if (parsed.type === "ellipse") {
		return generateEllipseSvg({
			width: Math.max(newWidth, 20),
			height: Math.max(newHeight, 20),
			fill: parsed.fill,
			fillOpacity: parsed.fillOpacity,
			stroke: parsed.stroke,
			strokeWidth: parsed.strokeWidth,
			strokeStyle: parsed.strokeStyle,
		});
	}

	if (parsed.type === "cloud") {
		return generateCloudSvg({
			width: Math.max(newWidth, 40),
			height: Math.max(newHeight, 30),
			fill: parsed.fill,
			fillOpacity: parsed.fillOpacity,
			stroke: parsed.stroke,
			strokeWidth: parsed.strokeWidth,
			strokeStyle: parsed.strokeStyle,
		});
	}

	if (parsed.type === "line") {
		return generateLineSvg({
			width: Math.max(newWidth, 20),
			height: Math.max(newHeight, 20),
			stroke: parsed.stroke,
			strokeWidth: parsed.strokeWidth,
			strokeStyle: parsed.strokeStyle,
		});
	}

	if (parsed.type === "arrow") {
		return generateArrowSvg({
			width: Math.max(newWidth, 30),
			height: Math.max(newHeight, 24),
			stroke: parsed.stroke,
			strokeWidth: parsed.strokeWidth,
			strokeStyle: parsed.strokeStyle,
		});
	}

	if (parsed.type === "image" && parsed.href) {
		return generateImageSvg({
			width: Math.max(newWidth, 20),
			height: Math.max(newHeight, 20),
			href: parsed.href,
		});
	}

	// For custom or text, scale SVG container width and height
	try {
		return svgString
			.replace(/width="[^"]*"/, `width="${newWidth}"`)
			.replace(/height="[^"]*"/, `height="${newHeight}"`);
	} catch {
		return svgString;
	}
}

function escapeXml(unsafe: string): string {
	return unsafe.replace(/[<>&'"]/g, (c) => {
		switch (c) {
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			case "&":
				return "&amp;";
			case "'":
				return "&apos;";
			case '"':
				return "&quot;";
			default:
				return c;
		}
	});
}
