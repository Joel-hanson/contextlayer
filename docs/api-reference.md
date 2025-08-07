# API Reference

> **Document Version**: 1.0  
> **Last Updated**: August 4, 2025  
> **Base URL**: `http://localhost:3000/api`

## Overview

The MCP Bridge API provides endpoints for managing API bridges, their lifecycle, and monitoring their performance. All endpoints follow RESTful conventions and return JSON responses.

## Authentication

Currently, the API does not require authentication for local development. In production deployments, authentication will be required.

**Planned Authentication Methods:**

- Bearer tokens for API access
- Session-based authentication for web interface
- API keys for programmatic access

## Response Format

All API responses follow a consistent format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId?: string;
    version?: string;
  };
}
```

### Success Response Example

```json
{
  "success": true,
  "data": {
    "id": "bridge-123",
    "name": "GitHub API Bridge",
    "status": "running"
  },
  "metadata": {
    "timestamp": "2025-08-04T10:00:00Z",
    "version": "1.0.0"
  }
}
```

### Error Response Example

```json
{
  "success": false,
  "error": {
    "code": "BRIDGE_NOT_FOUND",
    "message": "Bridge with ID 'bridge-123' not found",
    "details": {
      "bridgeId": "bridge-123"
    }
  },
  "metadata": {
    "timestamp": "2025-08-04T10:00:00Z"
  }
}
```

## Bridge Management Endpoints

### Start Bridge

Starts a bridge server with the specified configuration.

**Endpoint:** `POST /api/bridges/{id}/start`

**Parameters:**

- `id` (path, required): Bridge identifier

**Request Body:**

```typescript
interface StartBridgeRequest {
  bridgeConfig: BridgeConfig;
}
```

**Response:**

```typescript
interface StartBridgeResponse {
  bridgeId: string;
  port: number;
  status: "starting" | "running";
  pid?: number;
}
```

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/bridges/bridge-123/start \
  -H "Content-Type: application/json" \
  -d '{
    "bridgeConfig": {
      "id": "bridge-123",
      "name": "GitHub API Bridge",
      "apiConfig": {
        "baseUrl": "https://api.github.com",
        "authentication": {
          "type": "bearer",
          "token": "ghp_xxxxxxxxxxxx"
        },
        "endpoints": [...]
      },
      "port": 3000
    }
  }'
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "bridgeId": "bridge-123",
    "port": 3000,
    "status": "running",
    "pid": 12345
  }
}
```

### Stop Bridge

Stops a running bridge server.

**Endpoint:** `POST /api/bridges/{id}/stop`

**Parameters:**

- `id` (path, required): Bridge identifier

**Request Body:** None

**Response:**

```typescript
interface StopBridgeResponse {
  bridgeId: string;
  status: "stopping" | "stopped";
  message?: string;
}
```

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/bridges/bridge-123/stop
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "bridgeId": "bridge-123",
    "status": "stopped",
    "message": "Bridge stopped successfully"
  }
}
```

## Planned API Endpoints

The following endpoints are planned for future implementation:

### List Bridges

**Endpoint:** `GET /api/bridges`

**Query Parameters:**

- `status` (optional): Filter by bridge status
- `limit` (optional): Number of results to return
- `offset` (optional): Pagination offset

**Response:**

```typescript
interface ListBridgesResponse {
  bridges: BridgeConfig[];
  total: number;
  limit: number;
  offset: number;
}
```

### Create Bridge

**Endpoint:** `POST /api/bridges`

**Request Body:**

```typescript
interface CreateBridgeRequest {
  name: string;
  description?: string;
  apiConfig: ApiConfig;
  port?: number;
}
```

### Get Bridge

**Endpoint:** `GET /api/bridges/{id}`

**Response:**

```typescript
interface GetBridgeResponse {
  bridge: BridgeConfig;
  status: ServerStatus;
  metrics?: BridgeMetrics;
}
```

### Update Bridge

**Endpoint:** `PUT /api/bridges/{id}`

**Request Body:**

```typescript
interface UpdateBridgeRequest {
  name?: string;
  description?: string;
  apiConfig?: Partial<ApiConfig>;
  port?: number;
}
```

### Delete Bridge

**Endpoint:** `DELETE /api/bridges/{id}`

**Response:**

```typescript
interface DeleteBridgeResponse {
  bridgeId: string;
  deleted: boolean;
}
```

### Test Bridge Connectivity

**Endpoint:** `POST /api/bridges/{id}/test`

**Request Body:**

```typescript
interface TestBridgeRequest {
  endpoint?: string; // Test specific endpoint
  timeout?: number; // Test timeout in milliseconds
}
```

**Response:**

```typescript
interface TestBridgeResponse {
  connectivity: boolean;
  responseTime: number;
  endpoints: {
    [endpointName: string]: {
      status: "success" | "error";
      responseTime: number;
      statusCode?: number;
      error?: string;
    };
  };
}
```

### Get Bridge Logs

**Endpoint:** `GET /api/bridges/{id}/logs`

**Query Parameters:**

- `level` (optional): Filter by log level
- `limit` (optional): Number of log entries
- `since` (optional): ISO timestamp for log filtering

**Response:**

```typescript
interface GetBridgeLogsResponse {
  logs: LogEntry[];
  total: number;
  hasMore: boolean;
}

interface LogEntry {
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  component: string;
  metadata?: Record<string, any>;
}
```

### Get Bridge Metrics

**Endpoint:** `GET /api/bridges/{id}/metrics`

**Query Parameters:**

- `timeRange` (optional): Time range for metrics (1h, 24h, 7d)
- `granularity` (optional): Data granularity (1m, 5m, 1h)

**Response:**

```typescript
interface GetBridgeMetricsResponse {
  timeRange: string;
  metrics: {
    requestCount: TimeSeriesData[];
    responseTime: TimeSeriesData[];
    errorRate: TimeSeriesData[];
    statusCodes: StatusCodeDistribution;
    endpoints: EndpointMetrics[];
  };
}

interface TimeSeriesData {
  timestamp: string;
  value: number;
}

interface StatusCodeDistribution {
  [statusCode: string]: number;
}

interface EndpointMetrics {
  endpoint: string;
  requestCount: number;
  avgResponseTime: number;
  errorRate: number;
}
```

## Template Management Endpoints

### List Templates

**Endpoint:** `GET /api/templates`

**Response:**

```typescript
interface ListTemplatesResponse {
  templates: BridgeTemplate[];
  categories: string[];
}

interface BridgeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  apiConfig: Partial<ApiConfig>;
  parameters: TemplateParameter[];
}

interface TemplateParameter {
  name: string;
  type: "string" | "number" | "boolean";
  required: boolean;
  description: string;
  defaultValue?: any;
}
```

### Create Bridge from Template

**Endpoint:** `POST /api/templates/{templateId}/create-bridge`

**Request Body:**

```typescript
interface CreateFromTemplateRequest {
  name: string;
  parameters: Record<string, any>;
  port?: number;
}
```

## OpenAPI Integration Endpoints

### Import from OpenAPI Specification

**Endpoint:** `POST /api/openapi/import`

**Request Body:**

```typescript
interface ImportOpenAPIRequest {
  source: "url" | "file";
  url?: string;
  content?: string; // OpenAPI spec content
  bridgeName: string;
  selectiveImport?: {
    paths?: string[];
    methods?: string[];
  };
}
```

**Response:**

```typescript
interface ImportOpenAPIResponse {
  bridgeConfig: BridgeConfig;
  importedEndpoints: number;
  skippedEndpoints: string[];
  warnings: string[];
}
```

### Validate OpenAPI Specification

**Endpoint:** `POST /api/openapi/validate`

**Request Body:**

```typescript
interface ValidateOpenAPIRequest {
  source: "url" | "file";
  url?: string;
  content?: string;
}
```

**Response:**

```typescript
interface ValidateOpenAPIResponse {
  valid: boolean;
  version: string;
  endpoints: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
```

## Health and Status Endpoints

### Health Check

**Endpoint:** `GET /api/health`

**Response:**

```typescript
interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: "up" | "down";
    redis?: "up" | "down";
  };
}
```

### System Status

**Endpoint:** `GET /api/status`

**Response:**

```typescript
interface SystemStatusResponse {
  bridges: {
    total: number;
    running: number;
    stopped: number;
    errors: number;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
  };
  performance: {
    avgResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
}
```

## Error Codes

| Code                     | Description                   | HTTP Status |
| ------------------------ | ----------------------------- | ----------- |
| `VALIDATION_ERROR`       | Request validation failed     | 400         |
| `BRIDGE_NOT_FOUND`       | Bridge does not exist         | 404         |
| `BRIDGE_ALREADY_RUNNING` | Bridge is already running     | 409         |
| `BRIDGE_NOT_RUNNING`     | Bridge is not running         | 409         |
| `SERVER_START_FAILED`    | Failed to start bridge server | 500         |
| `SERVER_STOP_FAILED`     | Failed to stop bridge server  | 500         |
| `API_CONNECTION_FAILED`  | Cannot connect to target API  | 502         |
| `AUTHENTICATION_FAILED`  | API authentication failed     | 401         |
| `RATE_LIMIT_EXCEEDED`    | Too many requests             | 429         |
| `INTERNAL_SERVER_ERROR`  | Unexpected server error       | 500         |

## Rate Limiting

API endpoints are subject to rate limiting to prevent abuse:

- **Default Limit**: 100 requests per minute per IP
- **Bridge Operations**: 10 start/stop operations per minute
- **Testing Endpoints**: 20 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1691151600
```

## WebSocket Events (Planned)

For real-time updates, WebSocket connections will be available:

**Connection:** `ws://localhost:3000/api/ws`

**Event Types:**

```typescript
interface WebSocketEvent {
  type: "bridge_status" | "bridge_logs" | "metrics_update";
  bridgeId?: string;
  data: any;
  timestamp: string;
}
```

**Bridge Status Events:**

```typescript
interface BridgeStatusEvent {
  type: "bridge_status";
  bridgeId: string;
  data: {
    status: "starting" | "running" | "stopping" | "stopped" | "error";
    port?: number;
    error?: string;
  };
}
```

**Log Events:**

```typescript
interface BridgeLogEvent {
  type: "bridge_logs";
  bridgeId: string;
  data: LogEntry;
}
```

## SDK and Client Libraries (Planned)

Client libraries will be available for common programming languages:

```typescript
// JavaScript/TypeScript SDK
import { McpBridgeClient } from '@mcp-bridge/client';

const client = new McpBridgeClient({
  baseUrl: 'http://localhost:3000/api',
  apiKey: 'your-api-key'
});

// Create and start a bridge
const bridge = await client.bridges.create({
  name: 'My API Bridge',
  apiConfig: { ... }
});

await client.bridges.start(bridge.id);
```

This API reference provides comprehensive documentation for current and planned endpoints. As the project evolves, this documentation will be updated to reflect new features and changes.
