# Modern GNS3 Web UI Replacement

A high-performance, modern web interface replacing the legacy GNS3 Web UI. Built for network engineers managing real network labs on **GNS3 Server 3.1.x**, this UI provides a responsive desktop-grade lab management experience with interactive topology visualization, real-time terminal consoles, configuration editing, and live WebSocket telemetry.

---

## 1. Architecture & Technology Stack

The application is a **UI replacement only** that interfaces directly with the official GNS3 Controller REST API and WebSocket transports without requiring a separate backend or database.

- **Framework:** [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) with Vite bundler.
- **Topology Canvas:** [@xyflow/react](https://reactflow.dev/) (React Flow) with custom device nodes, port handles, and interface-labeled edges.
- **State Management:**
  - **Local UI & Canvas State:** [Zustand](https://github.com/pmndrs/zustand) (`src/stores/ui-store.ts`, `src/stores/topology-store.ts`).
  - **Server Data & Mutations:** [TanStack Query](https://tanstack.com/query) (`@tanstack/react-query`) with automatic cache invalidation and query deduplication.
- **Terminal Consoles:** [@xterm/xterm](https://xtermjs.org/) with `@xterm/addon-fit` and `@xterm/addon-attach` communicating over binary WebSocket frames.
- **Configuration Editing:** [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react) (VS Code Monaco engine) with syntax highlighting, search/replace, and live save back to the controller.
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) accessible primitives powered by `radix-ui` and Tailwind CSS.
- **Validation:** [Zod](https://zod.dev/) runtime schema validation.
- **Icons:** [Lucide React](https://lucide.dev/).
- **Testing:** [Vitest](https://vitest.dev/) for unit & integration testing; [Playwright](https://playwright.dev/) for end-to-end testing.

---

## 2. Main Application Layout

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  TOP NAVIGATION: Logo | Controller Status (v3.1) | Project Selector | Theme | Settings  │
├───────────────┬────────────────────────────────────────────────────────┬───────────────┤
│ LEFT SIDEBAR  │ TOPOLOGY CANVAS (@xyflow/react)                        │ RIGHT PANEL   │
│ - Projects    │ • Pan, Zoom, Fit-View, Snap-to-Grid                    │ (Contextual   │
│ - Device Lib  │ • Custom Device Nodes (Router, Switch, Firewall, Host) │  Inspector)   │
│ - Active Nodes│ • Multi-port Handles & Dynamic Wire Creation           │ • Node Spec   │
│ - Connections │ • Interface Label Tags on Endpoints (e0, e0/1)         │ • Console Info│
│ - Consoles    │ • Live Packet Capture Pulse Indicator (PCAP)           │ • Port List   │
│               │ • Drag-and-drop Templates from Library                 │ • Link Props  │
├───────────────┴────────────────────────────────────────────────────────┴───────────────┤
│ BOTTOM PANEL (Collapsible Drawer)                                                      │
│ [Consoles (xterm.js)]  [Configuration Editor (Monaco)]  [Controller Event Log]        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Verified GNS3 3.1 Controller API Endpoints

The API integration was verified against the live **GNS3 Server 3.1.0a6** instance running on the controller:

| Resource | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Version** | `GET` | `/v3/version` | Controller version and server status (unauthenticated) |
| **Auth** | `POST` | `/v3/access/users/login` | Authenticate using `x-www-form-urlencoded` returning JWT access & refresh tokens |
| **Auth** | `POST` | `/v3/access/users/refresh`| Transparently renew expired JWT access tokens |
| **User** | `GET` | `/v3/access/users/me` | Fetch currently authenticated user details |
| **Projects** | `GET` | `/v3/projects` | List all available lab projects |
| **Projects** | `POST` | `/v3/projects` | Create a new project (`{ name }`) |
| **Projects** | `GET` | `/v3/projects/{id}` | Retrieve specific project details |
| **Projects** | `POST` | `/v3/projects/{id}/open` | Open project and load topology into memory |
| **Projects** | `POST` | `/v3/projects/{id}/close` | Close project |
| **Projects** | `DELETE`| `/v3/projects/{id}` | Permanently delete a project |
| **Nodes** | `GET` | `/v3/projects/{id}/nodes` | Fetch all nodes, status, ports, and canvas positions |
| **Nodes** | `POST` | `/v3/projects/{id}/nodes` | Create a generic node |
| **Nodes** | `PUT` | `/v3/projects/{id}/nodes/{node_id}` | Update node name, coordinates (`x`, `y`), or label |
| **Nodes** | `DELETE`| `/v3/projects/{id}/nodes/{node_id}` | Remove device from project |
| **Lifecycle** | `POST` | `/v3/projects/{id}/nodes/{node_id}/start` | Start device process |
| **Lifecycle** | `POST` | `/v3/projects/{id}/nodes/{node_id}/stop` | Stop device process |
| **Lifecycle** | `POST` | `/v3/projects/{id}/nodes/{node_id}/suspend` | Suspend device state |
| **Lifecycle** | `POST` | `/v3/projects/{id}/nodes/{node_id}/reload` | Restart device process |
| **Lifecycle** | `POST` | `/v3/projects/{id}/nodes/start` | Start all nodes in the topology |
| **Lifecycle** | `POST` | `/v3/projects/{id}/nodes/stop` | Stop all nodes in the topology |
| **Templates** | `GET` | `/v3/templates` | Fetch device templates (Routers, Switches, PCs, Firewalls) |
| **Templates** | `POST` | `/v3/projects/{id}/templates/{template_id}` | Instantiate device from template at `(x, y)` |
| **Links** | `GET` | `/v3/projects/{id}/links` | List all links with endpoints and capture status |
| **Links** | `POST` | `/v3/projects/{id}/links` | Connect two node interfaces |
| **Links** | `DELETE`| `/v3/projects/{id}/links/{link_id}` | Disconnect link |
| **Captures** | `POST` | `/v3/projects/{id}/links/{link_id}/capture/start` | Start Wireshark / PCAP capture |
| **Captures** | `POST` | `/v3/projects/{id}/links/{link_id}/capture/stop` | Stop packet capture |
| **Files** | `GET` | `/v3/projects/{id}/nodes/{node_id}/files` | List configuration files for Monaco editor |
| **Files** | `GET` | `/v3/projects/{id}/nodes/{node_id}/files/{path}` | Read configuration file text |
| **Files** | `POST` | `/v3/projects/{id}/nodes/{node_id}/files/{path}` | Write modified configuration file |
| **Console WS** | `WS` | `/v3/projects/{id}/nodes/{node_id}/console/ws?token=...` | Interactive xterm.js terminal stream with binary `{ cols, rows }` resize frames |
| **Events WS** | `WS` | `/v3/projects/{id}/notifications/ws?token=...` | Live controller telemetry feed |

---

## 4. Getting Started

### Prerequisites

- **Node.js:** v20+ (tested on Node v22.22.1)
- **Package Manager:** `pnpm` (v10+ or v12+)
- **GNS3 Controller:** GNS3 Server 3.1.x (defaults to `http://127.0.0.1:80`)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd gns3-web-ui-react

# Install dependencies
pnpm install
```

### Development Server

```bash
# Starts Vite dev server on port 3000 with controller proxy enabled
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Automated Tests

```bash
# Run unit & integration tests with Vitest
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run Playwright End-to-End tests
pnpm test:e2e
```

### Production Build

```bash
# Create optimized production build
pnpm build

# Preview production build locally
pnpm preview
```

---

## 5. Controller Configuration & Networking

The controller connection is managed through `src/lib/gns3-api.ts`.

### Proxy Architecture

In development, Vite proxies requests from `/api/gns3/*` to the GNS3 Server on port 80:

```ts
// vite.config.ts
server: {
  port: 3000,
  proxy: {
    '/api/gns3': {
      target: process.env.GNS3_CONTROLLER_URL || 'http://127.0.0.1:80',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/gns3/, ''),
      ws: true,
    },
  },
}
```

### Runtime Settings

Click the **Settings** (gear icon) in the Top Navigation bar to configure:
1. **Controller URL:** Change between `/api/gns3` (default local proxy) or any external controller IP (`http://192.168.1.100:80`).
2. **Authentication:** Superadmin username (default: `admin`) and password.
3. **Live Test & Connect:** Immediately validates API accessibility and reports the controller version. Settings persist in browser `localStorage`.

---

## 6. Device Console Protocol & Transport

GNS3 Server 3.1 exposes a WebSocket console proxy at:
```
ws://<controller-host>:<port>/v3/projects/{project_id}/nodes/{node_id}/console/ws?token=<jwt_token>
```

- **Interactive Data:** Terminal text frames travel bidirectionally using xterm's AttachAddon.
- **Terminal Resize:** When the browser viewport or panel is resized, the client sends a binary WebSocket control frame containing JSON `{ cols: number, rows: number }`. The controller translates this into telnet NAWS (Negotiate About Window Size), SSH PTY resize, or docker exec resize.

---

## 7. Known Compatibility Limitations

1. **Direct Telnet Ports:** Devices exposing raw TCP telnet ports on loopback interfaces (`127.0.0.1:5000+`) require the controller's WebSocket console proxy for in-browser access. The UI uses the WebSocket proxy automatically.
2. **Drawing Annotations:** Basic SVG drawings are stored on the controller. Full vector drawing shape manipulation tools will be expanded in future releases.
