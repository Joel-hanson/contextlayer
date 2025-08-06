import { z } from 'zod';

// API Configuration Schema
export const ApiConfigSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Name is required'),
    baseUrl: z.string().url('Must be a valid URL'),
    description: z.string().optional(),
    headers: z.record(z.string()).optional(),
    authentication: z.object({
        type: z.enum(['none', 'bearer', 'apikey', 'basic']),
        token: z.string().optional(),
        apiKey: z.string().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
        headerName: z.string().optional(),
    }).optional(),
    endpoints: z.array(z.object({
        id: z.string(),
        name: z.string(),
        method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
        path: z.string(),
        description: z.string().optional(),
        parameters: z.array(z.object({
            name: z.string(),
            type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
            required: z.boolean(),
            description: z.string().optional(),
            defaultValue: z.any().optional(),
        })).optional(),
        requestBody: z.object({
            contentType: z.string(),
            schema: z.any(),
        }).optional(),
        responseSchema: z.any().optional(),
    })),
});

export type ApiConfig = z.infer<typeof ApiConfigSchema>;

// MCP Tool Schema
export const McpToolSchema = z.object({
    name: z.string(),
    description: z.string(),
    inputSchema: z.object({
        type: z.literal('object'),
        properties: z.record(z.any()),
        required: z.array(z.string()).optional(),
    }),
});

export type McpTool = z.infer<typeof McpToolSchema>;

// Bridge Configuration
export const BridgeConfigSchema = z.object({
    id: z.string(),
    slug: z.string().optional(), // URL-friendly version of name
    name: z.string(),
    description: z.string(),
    apiConfig: ApiConfigSchema,
    mcpTools: z.array(McpToolSchema),
    enabled: z.boolean(),

    // Routing configuration (path-based)
    routing: z.object({
        type: z.enum(['path', 'subdomain', 'websocket']).default('path'),
        customDomain: z.string().optional(),
        pathPrefix: z.string().optional(),
    }).optional(),

    // Access control
    access: z.object({
        public: z.boolean().default(true),
        allowedOrigins: z.array(z.string()).optional(),
        authRequired: z.boolean().default(false),
        apiKey: z.string().optional(),
    }).optional(),

    // Performance settings
    performance: z.object({
        rateLimiting: z.object({
            requestsPerMinute: z.number().default(60),
            burstLimit: z.number().default(10),
        }),
        caching: z.object({
            enabled: z.boolean().default(false),
            ttl: z.number().default(300), // seconds
        }),
        timeout: z.number().default(30000), // milliseconds
    }).optional(),

    createdAt: z.string(),
    updatedAt: z.string(),
});

export type BridgeConfig = z.infer<typeof BridgeConfigSchema>;

// Server Status
export interface ServerStatus {
    id: string;
    running: boolean;
    url?: string; // Full URL for path-based access
    uptime?: number;
    lastError?: string;
    metrics?: {
        requestCount: number;
        responseTime: number;
        errorRate: number;
        lastRequestAt?: string;
    };
}

// Bridge Discovery API
export interface BridgeDiscoveryResponse {
    bridges: {
        id: string;
        name: string;
        description: string;
        url: string; // Full URL to access the bridge
        status: 'active' | 'inactive' | 'error';
        version: string;
        capabilities: string[];
        lastUpdated: string;
    }[];
    metadata: {
        total: number;
        active: number;
        version: string;
    };
}

// Standardized API response format
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    metadata?: {
        timestamp: string;
        requestId: string;
        version: string;
    };
}
