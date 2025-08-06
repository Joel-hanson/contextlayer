<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# MCP Bridge Project Instructions

This Next.js application transforms REST APIs into Model Context Protocol (MCP) servers, enabling AI assistants to interact with any API.

## Architecture Overview

**Core Concept**: The app manages "bridges" that convert REST API endpoints into MCP tools. Each bridge configuration contains API details, authentication, and endpoint definitions.

**Critical Migration in Progress**: Moving from port-based architecture (each bridge gets a port) to path-based routing (`/mcp/{bridgeId}`). See `docs/implementation-roadmap.md` for details.

## Key Data Flow Patterns

### Bridge Lifecycle

```typescript
// All bridge operations follow this pattern:
const [bridges, setBridges] = useState<BridgeConfig[]>([]);

// Load from localStorage on mount
useEffect(() => {
  const saved = localStorage.getItem("mcp-bridges");
  if (saved) setBridges(JSON.parse(saved));
}, []);

// Save to localStorage (consistent across all pages)
const saveBridges = (newBridges: BridgeConfig[]) => {
  setBridges(newBridges);
  localStorage.setItem("mcp-bridges", JSON.stringify(newBridges));
};
```

### Server Status Management

```typescript
// Track bridge server states
const [serverStatuses, setServerStatuses] = useState<
  Record<string, ServerStatus>
>({});

// Toggle pattern (start/stop bridges)
const toggleBridge = async (bridgeId: string) => {
  const endpoint = bridge.enabled ? "stop" : "start";
  const response = await fetch(`/api/bridges/${bridgeId}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bridgeConfig: bridge }),
  });
  // Update both bridge.enabled and serverStatuses
};
```

## Project-Specific Patterns

### TypeScript Types (src/lib/types.ts)

- **BridgeConfig**: Main configuration object with nested ApiConfig
- **Use Zod schemas**: All data validation uses Zod with `.infer<>` for types
- **Port Management**: Current implementation assigns ports (being deprecated)

### Form Handling (BridgeForm.tsx)

- **React Hook Form + Zod**: Uses `zodResolver` for validation
- **Multi-tab Interface**: 4 tabs (Basic, API Config, Auth, Endpoints)
- **useFieldArray**: For dynamic endpoint management
- **Authentication Types**: 'none' | 'bearer' | 'apikey' | 'basic'

### Component Structure

- **Multiple Landing Pages**: `page.tsx` (current), `page-old.tsx`, `page-new.tsx`, `page-clean.tsx` (variants)
- **Dashboard Layout**: Uses `DashboardLayout.tsx` with sidebar navigation
- **Bridge Management**: Separate `/dashboard/bridges` page for CRUD operations

## Development Workflows

### Adding New Bridge Features

1. Update `BridgeConfig` type in `src/lib/types.ts` with Zod schema
2. Modify `BridgeForm.tsx` to include new form fields
3. Update localStorage save/load logic in all pages using bridges
4. Add API route if backend functionality needed

### Testing Bridge Functionality

```bash
# Start development server
npm run dev

# Current API endpoints (simulated)
POST /api/bridges/[id]/start  # Returns mock success
POST /api/bridges/[id]/stop   # Returns mock success

# Test bridge creation flow:
# 1. Dashboard → Create Bridge
# 2. Fill form tabs (Basic → API → Auth → Endpoints)
# 3. Save (stores in localStorage)
# 4. Toggle bridge on/off
```

### MCP Integration Points

- **Core Logic**: `src/lib/mcp-bridge.ts` - McpBridge class handles MCP protocol
- **Tool Generation**: `generateMcpTools()` converts API endpoints to MCP tools
- **Server Management**: Currently simulated, real implementation needed

## Critical Implementation Notes

### State Management

- **No Global State**: Each page manages bridge state independently
- **localStorage Key**: Always use `'mcp-bridges'` for persistence
- **ID Generation**: Use `bridge-${Date.now()}` for unique IDs

### Routing Architecture

- **Current**: Each bridge gets unique port (problematic for production)
- **Target**: Path-based routing `/mcp/{bridgeId}` (see migration plan)
- **Dashboard Routes**: `/dashboard`, `/dashboard/bridges`, `/dashboard/docs`

### Authentication Handling

```typescript
// BridgeForm authentication pattern
{
  form.watch("apiConfig.authentication.type") === "bearer" && (
    <Input
      {...form.register("apiConfig.authentication.token")}
      type="password"
    />
  );
}
// Conditional rendering based on auth type selection
```

### API Mock Responses

Current API routes return mock data - when implementing real functionality:

- Load bridge config from storage
- Create actual MCP server instance
- Manage server processes/lifecycle
- Return actual status information

## Quick Reference

**Start new bridge**: Create → Configure (4 tabs) → Save → Toggle On
**Bridge states**: enabled (config), running (server status)
**Form validation**: Zod schemas with React Hook Form
**Data persistence**: localStorage with JSON serialization
**Icons**: Lucide React icons throughout
**UI**: shadcn/ui components with Tailwind CSS

Focus on the path-based architecture migration for scalability improvements.
