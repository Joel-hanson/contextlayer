# Data Transformation Guide

This guide explains how data flows through the Context Layer system, from OpenAPI specifications to live MCP tools.

## Overview

The Context Layer transforms REST APIs into MCP (Model Context Protocol) tools through a multi-stage process:

1. **Import**: OpenAPI spec → Parsed endpoints + Generated MCP content
2. **Storage**: Relational endpoints + JSON MCP data → Database
3. **Runtime**: Database → Live MCP server

## Transformation Pipeline

### Stage 1: OpenAPI Parsing (`openapi-parser.ts`)

```typescript
// Input: OpenAPI 3.0 specification
const openApiSpec = {
    paths: {
        "/posts": {
            "get": { operationId: "getAllPosts", ... },
            "post": { operationId: "createPost", ... }
        }
    }
};

// Processing
const result = OpenAPIParser.parseFromObject(openApiSpec);

// Output: Structured data ready for database
const output = {
    endpoints: [...],      // For ApiEndpoint table
    mcpTools: [...],       // For Bridge.mcpTools JSON
    mcpPrompts: [...],     // For Bridge.mcpPrompts JSON
    mcpResources: [...]    // For Bridge.mcpResources JSON
};
```

**Key Functions:**

- `parseEndpoints()` - Extracts REST API endpoint definitions
- `generateMcpTools()` - Creates MCP tools from endpoints
- `generateMcpPrompts()` - Creates workflow prompts by operation type
- `generateMcpResources()` - Creates documentation resources

### Stage 2: Database Storage (`bridge-service.ts`)

```typescript
// Transform form data to database format
function transformBridgeConfigToPrismaData(config: BridgeConfig) {
    return {
        // Basic bridge info
        name: config.name,
        baseUrl: config.apiConfig.baseUrl,

        // JSON storage for MCP content
        mcpTools: config.mcpTools?.length > 0 ? config.mcpTools : undefined,
        mcpPrompts: config.mcpPrompts?.length > 0 ? config.mcpPrompts : undefined,
        mcpResources: config.mcpResources?.length > 0 ? config.mcpResources : undefined,

        // Other config...
    };
}

// Create bridge with both relational and JSON data
await prisma.bridge.create({
    data: {
        ...bridgeData,
        endpoints: {
            create: config.apiConfig.endpoints.map(endpoint => ({
                name: endpoint.name,
                method: endpoint.method,
                path: endpoint.path,
                config: { parameters: endpoint.parameters, ... }
            }))
        }
    }
});
```

### Stage 3: Runtime Serving (`contextlayer.ts`)

```typescript
// Load bridge configuration
const bridge = await BridgeService.getBridgeById(bridgeId);

// MCP tools from JSON field (fast access)
const tools = bridge.mcpTools;

// API execution uses relational endpoint data
const endpoint = bridge.apiConfig.endpoints.find(e => e.name === toolName);
const apiResponse = await fetch(`${bridge.baseUrl}${endpoint.path}`, {...});
```

## Data Structure Examples

### ApiEndpoint Table Record

```json
{
    "id": "endpoint-123",
    "bridgeId": "bridge-456",
    "name": "getAllPosts",
    "method": "GET",
    "path": "/posts",
    "description": "Retrieve all posts",
    "config": {
        "parameters": [
            {
                "name": "limit",
                "type": "number",
                "required": false,
                "description": "Maximum number of posts"
            }
        ],
        "responseSchema": { "type": "array", "items": {...} }
    }
}
```

### Bridge.mcpTools JSON Field

```json
[
  {
    "name": "get_all_posts",
    "description": "Retrieve all posts from the API",
    "inputSchema": {
      "type": "object",
      "properties": {
        "limit": {
          "type": "number",
          "description": "Maximum number of posts to return",
          "default": 20
        }
      },
      "required": []
    }
  }
]
```

### Bridge.mcpPrompts JSON Field

```json
[
  {
    "name": "query_posts_data",
    "description": "Query and retrieve posts data from the API",
    "arguments": [
      {
        "name": "operation",
        "description": "The type of query operation",
        "required": true
      },
      {
        "name": "parameters",
        "description": "Query parameters and filters",
        "required": false
      }
    ]
  }
]
```

### Bridge.mcpResources JSON Field

```json
[
  {
    "uri": "openapi://spec/full",
    "name": "Posts API Specification",
    "description": "Complete OpenAPI specification for Posts API",
    "mimeType": "application/json"
  },
  {
    "uri": "openapi://endpoints/summary",
    "name": "API Endpoints Summary",
    "description": "Summary of all available API endpoints",
    "mimeType": "text/markdown"
  }
]
```

## Form Integration

### OpenAPI Import Dialog (`OpenAPIImportDialog.tsx`)

```typescript
const handleConfirmImport = () => {
  if (result?.success && result.data) {
    const transformedData = {
      // Basic API info
      name: result.data.name,
      baseUrl: result.data.baseUrl,
      endpoints: result.data.endpoints,

      // Generated MCP content
      mcpTools: result.data.mcpTools,
      mcpPrompts: result.data.mcpPrompts,
      mcpResources: result.data.mcpResources,
    };

    onImport(transformedData);
  }
};
```

### Form Handling (`BasicInfoTab.tsx`)

```typescript
const handleOpenAPIImport = (importData) => {
  // Set API endpoint data
  form.setValue("apiConfig.endpoints", importData.endpoints);

  // Set generated MCP content
  if (importData.mcpTools) {
    form.setValue("mcpTools", importData.mcpTools);
  }
  if (importData.mcpPrompts) {
    form.setValue("mcpPrompts", importData.mcpPrompts);
  }
  if (importData.mcpResources) {
    form.setValue("mcpResources", importData.mcpResources);
  }
};
```

### Form Submission (`BridgeForm.tsx`)

```typescript
const onSubmit = async (data: BridgeFormData) => {
  const bridgeConfig: BridgeConfig = {
    // API configuration (goes to ApiEndpoint table)
    apiConfig: {
      endpoints: data.apiConfig.endpoints,
      // ...
    },

    // MCP content (goes to JSON fields)
    mcpTools: data.mcpTools || [],
    mcpPrompts: data.mcpPrompts || [],
    mcpResources: data.mcpResources || [],
  };

  await BridgeService.createBridge(bridgeConfig, userId);
};
```

## Database Operations

### Creating a Bridge

```sql
-- 1. Insert main bridge record with JSON MCP content
INSERT INTO bridges (
    id, name, baseUrl,
    mcpTools, mcpPrompts, mcpResources,
    -- other fields...
) VALUES (
    'bridge-123', 'Posts API Bridge', 'https://api.example.com',
    '[{"name": "get_all_posts", ...}]',  -- JSON array
    '[{"name": "query_posts_data", ...}]', -- JSON array
    '[{"uri": "openapi://spec/full", ...}]', -- JSON array
    -- other values...
);

-- 2. Insert related endpoint records
INSERT INTO api_endpoints (id, bridgeId, name, method, path, config)
VALUES
    ('endpoint-1', 'bridge-123', 'getAllPosts', 'GET', '/posts', '{"parameters": [...]}'),
    ('endpoint-2', 'bridge-123', 'createPost', 'POST', '/posts', '{"parameters": [...]}');
```

### Querying Bridge Data

```sql
-- Get complete bridge configuration (single query)
SELECT
    b.*,
    JSON_EXTRACT(b.mcpTools, '$') as tools,
    JSON_EXTRACT(b.mcpPrompts, '$') as prompts,
    JSON_EXTRACT(b.mcpResources, '$') as resources
FROM bridges b
WHERE b.id = 'bridge-123';

-- Get related endpoints (separate query if needed)
SELECT * FROM api_endpoints WHERE bridgeId = 'bridge-123';
```

## Performance Considerations

### JSON Field Indexing

```sql
-- Index for searching MCP tools by name
CREATE INDEX idx_bridges_mcp_tools_name
ON bridges USING gin ((mcpTools->'$[*].name'));

-- Index for filtering active bridges with MCP content
CREATE INDEX idx_bridges_mcp_active
ON bridges (enabled)
WHERE mcpTools IS NOT NULL;
```

### Query Optimization

```typescript
// ✅ Efficient: Single query for all MCP data
const bridge = await prisma.bridge.findUnique({
  where: { id: bridgeId },
  select: {
    mcpTools: true,
    mcpPrompts: true,
    mcpResources: true,
    // other fields...
  },
});

// ❌ Inefficient: Multiple queries
const tools = await getMcpTools(bridgeId);
const prompts = await getMcpPrompts(bridgeId);
const resources = await getMcpResources(bridgeId);
```

## Error Handling

### JSON Validation

```typescript
function validateMcpTools(tools: unknown): McpTool[] {
    if (!Array.isArray(tools)) return [];

    return tools.filter(tool =>
        tool &&
        typeof tool.name === 'string' &&
        typeof tool.description === 'string' &&
        tool.inputSchema?.type === 'object'
    );
}

// Usage in bridge service
mcpTools: validateMcpTools(bridge.mcpTools) || [],
```

### Migration Safety

```typescript
// Handle missing MCP fields during gradual migration
function transformBridgeToBridgeConfig(bridge) {
  return {
    // ... other fields
    mcpTools: (bridge.mcpTools as McpTool[]) || [],
    mcpPrompts: (bridge.mcpPrompts as McpPrompt[]) || [],
    mcpResources: (bridge.mcpResources as McpResource[]) || [],
  };
}
```

This architecture ensures data consistency while providing optimal performance for both OpenAPI import operations and MCP server runtime operations.
