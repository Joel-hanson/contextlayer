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
        keyLocation: z.enum(['header', 'query']).default('header'),
        paramName: z.string().optional(),
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
            location: z.enum(['path', 'query', 'body']).optional(),
            style: z.enum(['parameter', 'replacement']).optional(),
        })).optional(),
        requestBody: z.object({
            contentType: z.string().optional(),
            schema: z.any().optional(),
            required: z.boolean().optional(),
            properties: z.record(z.object({
                type: z.string(),
                description: z.string().optional(),
                required: z.boolean().optional(),
                enum: z.array(z.string()).optional(),
                format: z.string().optional(),
                minimum: z.number().optional(),
                maximum: z.number().optional(),
                pattern: z.string().optional(),
                items: z.any().optional(),
                properties: z.record(z.any()).optional(),
            })).optional(),
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

// MCP Resource Schema
export const McpResourceSchema = z.object({
    uri: z.string(),
    name: z.string(),
    description: z.string().optional(),
    mimeType: z.string().optional(),
});

export type McpResource = z.infer<typeof McpResourceSchema>;

// MCP Prompt Schema
export const McpPromptSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    arguments: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        required: z.boolean().default(false),
    })).optional(),
});

export type McpPrompt = z.infer<typeof McpPromptSchema>;

// Bridge Configuration
export const BridgeConfigSchema = z.object({
    id: z.string(),
    slug: z.string(), // UUID-based identifier for routing
    name: z.string(),
    description: z.string(),
    apiConfig: ApiConfigSchema,
    mcpTools: z.array(McpToolSchema),
    mcpResources: z.array(McpResourceSchema).optional().default([]),
    mcpPrompts: z.array(McpPromptSchema).optional().default([]),
    enabled: z.boolean(),

    // Access control - simplified
    access: z.object({
        public: z.boolean().default(true),
        allowedOrigins: z.array(z.string()).optional(),
        authRequired: z.boolean().default(false),
        apiKey: z.string().optional(),
        // New token-based authentication
        tokens: z.array(z.object({
            id: z.string(),
            token: z.string(),
            name: z.string(),
            description: z.string().optional(),
            permissions: z.array(z.object({
                type: z.enum(['tools', 'resources', 'prompts', 'admin']),
                actions: z.array(z.string()),
                constraints: z.object({
                    rateLimit: z.number().optional(),
                    allowedEndpoints: z.array(z.string()).optional(),
                    timeWindows: z.array(z.string()).optional(),
                }).optional(),
            })),
            expiresAt: z.string().optional(),
            createdAt: z.string(),
            lastUsedAt: z.string().optional(),
            isActive: z.boolean(),
            metadata: z.record(z.string()).optional(),
        })).optional().default([]),
        security: z.object({
            tokenAuth: z.object({
                enabled: z.boolean().default(true),
                requireToken: z.boolean().default(false),
                allowMultipleTokens: z.boolean().default(true),
                defaultExpiry: z.number().optional(),
                rotationPeriod: z.number().optional(),
            }).default({
                enabled: true,
                requireToken: false,
                allowMultipleTokens: true,
            }),
            permissions: z.object({
                defaultPermissions: z.array(z.object({
                    type: z.enum(['tools', 'resources', 'prompts', 'admin']),
                    actions: z.array(z.string()),
                })).default([]),
                requireExplicitGrants: z.boolean().default(false),
                allowSelfManagement: z.boolean().default(true),
            }).default({
                defaultPermissions: [],
                requireExplicitGrants: false,
                allowSelfManagement: true,
            }),
            audit: z.object({
                enabled: z.boolean().default(true),
                logRequests: z.boolean().default(true),
                retentionDays: z.number().default(30),
            }).default({
                enabled: true,
                logRequests: true,
                retentionDays: 30,
            }),
        }).optional().default({
            tokenAuth: {
                enabled: true,
                requireToken: false,
                allowMultipleTokens: true,
            },
            permissions: {
                defaultPermissions: [],
                requireExplicitGrants: false,
                allowSelfManagement: true,
            },
            audit: {
                enabled: true,
                logRequests: true,
                retentionDays: 30,
            },
        }),
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
        status: 'active' | 'inactive'; // Simplified status
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
