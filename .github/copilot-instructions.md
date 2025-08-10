<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# ContextLayer Project Instructions

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
  const saved = localStorage.getItem("contextlayers");
  if (saved) setBridges(JSON.parse(saved));
}, []);

// Save to localStorage (consistent across all pages)
const saveBridges = (newBridges: BridgeConfig[]) => {
  setBridges(newBridges);
  localStorage.setItem("contextlayers", JSON.stringify(newBridges));
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

- **Core Logic**: `src/lib/contextlayer.ts` - ContextLayer class handles MCP protocol
- **Tool Generation**: `generateMcpTools()` converts API endpoints to MCP tools
- **Server Management**: Currently simulated, real implementation needed

## Critical Implementation Notes

### State Management

- **No Global State**: Each page manages bridge state independently
- **localStorage Key**: Always use `'contextlayers'` for persistence
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

- What is the strategy for releasing this project
- For now we will disable signup and will allow only sign in via google to be safe that I don't get spammed
- The frontend stucks if tried ot login with wrong cred and try again it stuck
- The frontend page has link that are note functional and says opensource
- Is the whole application secure?
- Oauth implementation
- Write automated tests for the apis.
- For testing purposes can you setup some dummy apis that has different authentication types
- I wan't a precheck logic for the contextlayer, that is when a request comes though to the endpoint the user has the capabilites to allow certain tool actions, that generally work for post, delete, patch actions

Done

- Is the database design an efficient one : Done
- quick guide, can you provide one that helps users - Done
- Can you convert all the window.confirm with Alert Dialog - Done
- Setup with openapi/swagger spec - Done
- How to deploy this to the server
- Make by default bridge running
- Rename values to that its easier to related to mcp server
- The template is not working
- The resources and prompts
- routing tab is it really worth it, does it have ws connection. Can we just have the route that are only support for mcp
- require authentication thing should create new token which customers can copy.
