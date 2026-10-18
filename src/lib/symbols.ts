/**
 * GNS3 Symbols Utility & Registry
 * Provides symbol mapping, resolution, and metadata for GNS3 Affinity Square symbols.
 * Symbols are located in /symbols/{blue,gray,green,red}/
 */

export type SymbolColor = "blue" | "gray" | "green" | "red";

export type SymbolCategory =
	| "router"
	| "switch"
	| "security"
	| "endpoint"
	| "server"
	| "cloud"
	| "wireless"
	| "misc";

export interface SymbolDefinition {
	id: string; // Base id, e.g. "router", "switch", "client"
	name: string; // Friendly name, e.g. "Router", "Switch"
	category: SymbolCategory;
	description?: string;
}

export const GNS3_SYMBOLS: SymbolDefinition[] = [
	// Routers & WAN
	{ id: "router", name: "Router", category: "router", description: "Standard Network Router" },
	{ id: "router2", name: "Router 2", category: "router", description: "Alternative Router Symbol" },
	{ id: "router_cloud", name: "Cloud Router", category: "router", description: "Virtual / Cloud Router" },
	{ id: "dslam", name: "DSLAM", category: "router", description: "Digital Subscriber Line Access Multiplexer" },
	{ id: "interconnect", name: "Interconnect", category: "router", description: "Network Interconnect Hub" },
	{ id: "vrf", name: "VRF", category: "router", description: "Virtual Routing and Forwarding" },

	// Switches & LAN
	{ id: "switch", name: "Ethernet Switch", category: "switch", description: "Layer 2 Ethernet Switch" },
	{ id: "switch_multilayer", name: "Multilayer Switch", category: "switch", description: "Layer 3 / Core Switch" },
	{ id: "hub", name: "Ethernet Hub", category: "switch", description: "Layer 1 Ethernet Hub" },
	{ id: "rj45", name: "RJ45 Port", category: "switch", description: "Ethernet Interface Connector" },
	{ id: "optical", name: "Optical Interface", category: "switch", description: "Fiber Optical Switch" },
	{ id: "isdn", name: "ISDN Switch", category: "switch", description: "Integrated Services Digital Network" },

	// Security & Firewalls
	{ id: "firewall", name: "Firewall", category: "security", description: "Network Security Firewall" },
	{ id: "firewall3", name: "Firewall 3D", category: "security", description: "Perimeter Security Gateway" },
	{ id: "shield", name: "Security Shield", category: "security", description: "Security Appliance / Guard" },
	{ id: "inspect", name: "Inspection Tool", category: "security", description: "Packet Inspection Engine" },
	{ id: "inspect2", name: "Deep Inspector", category: "security", description: "Deep Packet Inspection" },
	{ id: "fingerprint", name: "Fingerprint Auth", category: "security", description: "Identity & Access Control" },

	// Endpoints & Clients
	{ id: "client", name: "Desktop Client", category: "endpoint", description: "PC / Workstation Host" },
	{ id: "client_vm", name: "Client VM", category: "endpoint", description: "Virtual Desktop Host" },
	{ id: "laptop", name: "Laptop", category: "endpoint", description: "Mobile Computer" },
	{ id: "tablet", name: "Tablet", category: "endpoint", description: "Mobile Touch Device" },
	{ id: "ip_phone", name: "IP Phone", category: "endpoint", description: "VoIP Telephony Terminal" },
	{ id: "phone_cloud", name: "Cloud Phone", category: "endpoint", description: "Hosted PBX Telephony" },
	{ id: "phone_old", name: "Analog Phone", category: "endpoint", description: "POTS Analog Terminal" },
	{ id: "phone_wireless", name: "Wireless Phone", category: "endpoint", description: "DECT / Wi-Fi Phone" },
	{ id: "printer", name: "Network Printer", category: "endpoint", description: "Office Network Printer" },
	{ id: "camera", name: "IP Camera", category: "endpoint", description: "Network Surveillance Camera" },
	{ id: "camera_dome", name: "Dome Camera", category: "endpoint", description: "Ceiling Dome Camera" },
	{ id: "user", name: "User / Admin", category: "endpoint", description: "User Endpoint Identity" },

	// Servers & Cloud Services
	{ id: "server", name: "Server", category: "server", description: "Dedicated Compute Server" },
	{ id: "servercluster", name: "Server Cluster", category: "server", description: "High-Availability Cluster" },
	{ id: "vm", name: "Virtual Machine", category: "server", description: "Hypervisor Guest VM" },
	{ id: "cloud", name: "Internet Cloud", category: "cloud", description: "External Network / WAN" },
	{ id: "storage", name: "SAN Storage", category: "server", description: "Storage Area Network" },
	{ id: "nas", name: "NAS Appliance", category: "server", description: "Network Attached Storage" },
	{ id: "loadbalancer", name: "Load Balancer", category: "server", description: "Traffic Load Balancer" },
	{ id: "ldap", name: "LDAP Directory", category: "server", description: "Authentication Server" },
	{ id: "xml", name: "XML / API Gateway", category: "server", description: "Web Service Gateway" },

	// Wireless & Telecom
	{ id: "wifi", name: "Wi-Fi AP", category: "wireless", description: "Wireless Access Point" },
	{ id: "wlc", name: "Wireless Controller", category: "wireless", description: "Wireless LAN Controller" },
	{ id: "satellite", name: "Satellite", category: "wireless", description: "Orbital Telecom Link" },
	{ id: "satellite_dish", name: "Satellite Dish", category: "wireless", description: "Ground Station Receiver" },

	// General & Utilities
	{ id: "template", name: "Generic Template", category: "misc", description: "Device Blueprint" },
	{ id: "link", name: "Network Link", category: "misc", description: "Link Interface" },
	{ id: "globe", name: "Global WAN", category: "cloud", description: "Worldwide Network" },
	{ id: "coffee", name: "Break / Coffee", category: "misc", description: "Admin Workstation Marker" },
	{ id: "bug", name: "Bug / Debug", category: "misc", description: "Debug Test Node" },
	{ id: "cog", name: "Config / Settings", category: "misc", description: "Management Appliance" },
	{ id: "communications", name: "Communications", category: "misc", description: "Comm Gateway" },
	{ id: "conversation", name: "Chat / Messaging", category: "misc", description: "Collaboration Service" },
	{ id: "dna", name: "DNA Center", category: "misc", description: "Network Architecture" },
	{ id: "dna2", name: "Cisco DNA", category: "misc", description: "Controller Platform" },
	{ id: "factory", name: "Industrial / IoT", category: "misc", description: "OT Factory Device" },
	{ id: "grid", name: "Smart Grid", category: "misc", description: "SCADA / Utility Grid" },
	{ id: "grid2", name: "Grid System", category: "misc", description: "Industrial Substation" },
	{ id: "health", name: "Health Monitor", category: "misc", description: "Network Health Monitor" },
	{ id: "house", name: "Home Network", category: "misc", description: "SOHO Gateway" },
	{ id: "light_bulb", name: "IoT Device", category: "misc", description: "Smart Light / IoT Endpoint" },
	{ id: "office", name: "Branch Office", category: "misc", description: "Remote Office Gateway" },
	{ id: "pinpoint", name: "Location Pin", category: "misc", description: "Geographic Location" },
	{ id: "scull", name: "Threat / Attacker", category: "security", description: "Penetration Testing / Rogue Host" },
	{ id: "statistics", name: "Telemetry", category: "misc", description: "Metrics & Statistics Engine" },
	{ id: "tree", name: "Tree Topology", category: "misc", description: "Hierarchical Topology" },
];

export const SYMBOL_MAP = new Map<string, SymbolDefinition>(
	GNS3_SYMBOLS.map((s) => [s.id, s]),
);

/**
 * Builds the URL to the SVG symbol file in /symbols/{color}/
 * Note that in gray, filenames are `sq_${id}.svg` (no `_gray` suffix),
 * while in blue, green, and red, filenames are `sq_${id}_${color}.svg`.
 */
export function getSymbolUrl(
	symbolKeyOrPath?: string | null,
	color: SymbolColor = "blue",
): string {
	if (!symbolKeyOrPath) {
		return `/symbols/${color === "gray" ? "gray/sq_router.svg" : `${color}/sq_router_${color}.svg`}`;
	}

	const cleaned = symbolKeyOrPath.trim();

	// Direct URL to symbols directory
	if (cleaned.startsWith("/symbols/")) {
		return cleaned;
	}

	// Extract symbol name from GNS3 symbols path, e.g. ":/symbols/router.svg", ":/symbols/affinity-square-blue/router.svg", "router.svg", "sq_router_blue.svg"
	let key = cleaned
		.replace(/^:\/?symbols\/(affinity-square-[a-z]+\/|classic\/|svg\/)?/, "")
		.replace(/^\/symbols\/(blue|gray|green|red)\//, "")
		.replace(/^sq_/, "")
		.replace(/_(blue|gray|green|red)\.svg$/, "")
		.replace(/\.svg$/, "")
		.toLowerCase();

	// Strip query parameters if any
	key = key.split("?")[0];

	// Match key against catalog or normalize
	if (!SYMBOL_MAP.has(key)) {
		// Common alias mappings
		if (key.includes("switch_multi") || key.includes("multilayer")) {
			key = "switch_multilayer";
		} else if (key.includes("switch")) {
			key = "switch";
		} else if (key.includes("firewall") || key.includes("asa")) {
			key = "firewall";
		} else if (key.includes("router")) {
			key = "router";
		} else if (key.includes("server") || key.includes("docker")) {
			key = "server";
		} else if (key.includes("vpcs") || key.includes("pc") || key.includes("host") || key.includes("client")) {
			key = "client";
		} else if (key.includes("cloud") || key.includes("nat")) {
			key = "cloud";
		} else if (key.includes("hub")) {
			key = "hub";
		} else if (key.includes("wlc")) {
			key = "wlc";
		} else if (key.includes("wifi") || key.includes("wireless")) {
			key = "wifi";
		} else if (key.includes("phone")) {
			key = "ip_phone";
		} else {
			key = "router";
		}
	}

	if (color === "gray") {
		return `/symbols/gray/sq_${key}.svg`;
	}
	return `/symbols/${color}/sq_${key}_${color}.svg`;
}

export interface NodeLike {
	symbol?: string | null;
	node_type?: string;
	category?: string;
	name?: string;
	status?: string;
}

/**
 * Resolves the appropriate GNS3 SVG symbol for a node or template.
 * - When node is running ("started") -> show blue
 * - When node is not started (stopped, suspended, etc.) -> show gray
 * - Library templates default to blue
 */
export function resolveNodeSymbol(
	item: NodeLike,
	colorOverride?: SymbolColor,
): string {
	let color: SymbolColor = colorOverride || "blue";

	if (!colorOverride) {
		if (item.status) {
			if (item.status === "started") {
				color = "blue";
			} else {
				color = "gray";
			}
		} else {
			color = "blue";
		}
	}

	// If explicit symbol provided
	if (item.symbol) {
		return getSymbolUrl(item.symbol, color);
	}

	// Infer symbol from node_type, category, and name
	const lowerType = (item.node_type || "").toLowerCase();
	const lowerCat = (item.category || "").toLowerCase();
	const lowerName = (item.name || "").toLowerCase();

	let inferredKey = "router";

	if (
		lowerCat === "switch" ||
		lowerType.includes("switch") ||
		lowerType.includes("iou") ||
		lowerName.includes("sw")
	) {
		if (
			lowerName.includes("l3") ||
			lowerName.includes("multi") ||
			lowerName.includes("core") ||
			lowerType.includes("multilayer")
		) {
			inferredKey = "switch_multilayer";
		} else {
			inferredKey = "switch";
		}
	} else if (lowerType.includes("hub") || lowerName.includes("hub")) {
		inferredKey = "hub";
	} else if (
		lowerCat === "firewall" ||
		lowerType.includes("firewall") ||
		lowerType.includes("asa") ||
		lowerName.includes("fw") ||
		lowerName.includes("pfsense")
	) {
		inferredKey = "firewall";
	} else if (
		lowerType.includes("cloud") ||
		lowerType.includes("nat") ||
		lowerName.includes("internet") ||
		lowerName.includes("wan")
	) {
		inferredKey = "cloud";
	} else if (
		lowerType.includes("vpcs") ||
		lowerType.includes("pc") ||
		lowerName.includes("pc") ||
		lowerName.includes("host") ||
		lowerName.includes("client")
	) {
		inferredKey = "client";
	} else if (lowerType.includes("laptop") || lowerName.includes("laptop")) {
		inferredKey = "laptop";
	} else if (
		lowerType.includes("docker") ||
		lowerType.includes("server") ||
		lowerName.includes("srv") ||
		lowerName.includes("web")
	) {
		inferredKey = "server";
	} else if (
		lowerType.includes("qemu") ||
		lowerType.includes("virtualbox") ||
		lowerType.includes("vmware") ||
		lowerName.includes("vm")
	) {
		inferredKey = "vm";
	} else if (lowerName.includes("wlc")) {
		inferredKey = "wlc";
	} else if (lowerName.includes("wifi") || lowerName.includes("ap")) {
		inferredKey = "wifi";
	} else if (lowerName.includes("phone")) {
		inferredKey = "ip_phone";
	} else if (lowerName.includes("storage") || lowerName.includes("nas")) {
		inferredKey = "storage";
	} else if (lowerName.includes("lb") || lowerName.includes("balancer")) {
		inferredKey = "loadbalancer";
	}

	return getSymbolUrl(inferredKey, color);
}

/**
 * Built-in standard Node Models (templates) to ensure the Device Library
 * grid always presents a rich variety of devices even if none are returned by server.
 */
export interface BuiltinNodeModel {
	template_id: string;
	name: string;
	category: "router" | "switch" | "guest" | "firewall";
	template_type: string;
	symbol: string;
	compute_id: string;
	builtin: boolean;
	description: string;
	default_ports: number;
}

export const BUILTIN_NODE_MODELS: BuiltinNodeModel[] = [
	{
		template_id: "builtin-cisco-c7200",
		name: "Cisco c7200 Router",
		category: "router",
		template_type: "dynamips",
		symbol: "router",
		compute_id: "local",
		builtin: true,
		description: "High-performance enterprise Cisco 7200 Series modular router.",
		default_ports: 4,
	},
	{
		template_id: "builtin-cisco-iosv",
		name: "Cisco IOSv Virtual Router",
		category: "router",
		template_type: "qemu",
		symbol: "router2",
		compute_id: "local",
		builtin: false,
		description: "Cisco IOSv virtual router image running in QEMU hypervisor.",
		default_ports: 4,
	},
	{
		template_id: "builtin-eth-switch",
		name: "Ethernet Switch",
		category: "switch",
		template_type: "ethernet_switch",
		symbol: "switch",
		compute_id: "local",
		builtin: true,
		description: "Standard 8-port unmanaged Layer 2 Ethernet switch.",
		default_ports: 8,
	},
	{
		template_id: "builtin-multilayer-switch",
		name: "Cisco L3 Multilayer Switch",
		category: "switch",
		template_type: "iou",
		symbol: "switch_multilayer",
		compute_id: "local",
		builtin: false,
		description: "High-density Layer 3 multilayer routing and switching appliance.",
		default_ports: 16,
	},
	{
		template_id: "builtin-eth-hub",
		name: "Ethernet Hub",
		category: "switch",
		template_type: "ethernet_hub",
		symbol: "hub",
		compute_id: "local",
		builtin: true,
		description: "Broadcasting Layer 1 hub for packet inspection and sniffing.",
		default_ports: 8,
	},
	{
		template_id: "builtin-vpcs",
		name: "VPCS Workstation",
		category: "guest",
		template_type: "vpcs",
		symbol: "client",
		compute_id: "local",
		builtin: true,
		description: "Lightweight Virtual PC Simulator with ping and traceroute.",
		default_ports: 1,
	},
	{
		template_id: "builtin-linux-server",
		name: "Ubuntu Linux Server",
		category: "guest",
		template_type: "docker",
		symbol: "server",
		compute_id: "local",
		builtin: false,
		description: "Ubuntu container configured for network services and DNS.",
		default_ports: 2,
	},
	{
		template_id: "builtin-pfsense",
		name: "pfSense Security Gateway",
		category: "firewall",
		template_type: "qemu",
		symbol: "firewall",
		compute_id: "local",
		builtin: false,
		description: "Open-source firewall, router, and VPN gateway appliance.",
		default_ports: 4,
	},
	{
		template_id: "builtin-cloud-nat",
		name: "Cloud WAN / NAT",
		category: "guest",
		template_type: "cloud",
		symbol: "cloud",
		compute_id: "local",
		builtin: true,
		description: "Bridges GNS3 topology to the host network interface and Internet.",
		default_ports: 2,
	},
	{
		template_id: "builtin-wireless-controller",
		name: "Cisco vWLC Controller",
		category: "router",
		template_type: "qemu",
		symbol: "wlc",
		compute_id: "local",
		builtin: false,
		description: "Virtual Wireless LAN Controller for centralized AP management.",
		default_ports: 2,
	},
	{
		template_id: "builtin-wifi-ap",
		name: "Wi-Fi Access Point",
		category: "switch",
		template_type: "qemu",
		symbol: "wifi",
		compute_id: "local",
		builtin: false,
		description: "802.11ax dual-band enterprise wireless access point.",
		default_ports: 2,
	},
	{
		template_id: "builtin-load-balancer",
		name: "HAProxy Load Balancer",
		category: "router",
		template_type: "docker",
		symbol: "loadbalancer",
		compute_id: "local",
		builtin: false,
		description: "High-performance Layer 4/Layer 7 reverse proxy and load balancer.",
		default_ports: 2,
	},
];
