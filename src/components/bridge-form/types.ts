import { z } from 'zod';

/**
 * Schema Definitions for MCP Bridge
 */

// Core Parameter Schema
export const mcpParameterSchema = z.object({
    type: z.enum(['string', 'number', 'boolean', 'object', 'array']).default('string'),
    name: z.string(),
    required: z.boolean().default(false),
    description: z.string().default(''),
    location: z.enum(['path', 'query', 'body']).default('query'),
    style: z.enum(['parameter', 'replacement']).default('parameter'),
});

// Endpoint Schema
export const mcpEndpointSchema = z.object({
    id: z.string().default(() => `endpoint-${Date.now()}`),
    path: z.string().min(1, 'Path is required'),
    name: z.string().min(1, 'Endpoint name is required'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
    parameters: z.array(mcpParameterSchema).default([]),
    description: z.string().default(''),
});

// Resource Schema
export const mcpResourceSchema = z.object({
    uri: z.string(),
    name: z.string(),
    description: z.string().default(''),
    mimeType: z.string().default('application/json'),
});

// Prompt Schema
export const mcpPromptSchema = z.object({
    name: z.string().min(1, 'Prompt name is required'),
    description: z.string().default(''),
    arguments: z.array(z.object({
        name: z.string().min(1, 'Argument name is required'),
        description: z.string().default(''),
        required: z.boolean().default(false),
    })).default([]),
});

// Tool Schema
export const mcpToolSchema = z.object({
    name: z.string()
        .min(1, 'Tool name is required')
        .regex(
            /^(get|post|put|patch|delete)_[a-z0-9_\.]+_(list|read|create|update|delete|[a-z0-9_]+)$/,
            'Tool name must follow format: method_resource_action (e.g., get_users_list)'
        ),
    description: z.string().min(1, 'Tool description is required'),
    inputSchema: z.object({
        type: z.literal('object'),
        properties: z.record(z.object({
            type: z.string(),
            description: z.string().optional(),
            format: z.string().optional(),
            enum: z.array(z.string()).optional(),
            minimum: z.number().optional(),
            maximum: z.number().optional(),
            pattern: z.string().optional(),
            items: z.lazy(() => z.object({
                type: z.string(),
                description: z.string().optional(),
                format: z.string().optional(),
                enum: z.array(z.string()).optional()
            }).optional())
        })),
        required: z.array(z.string()).default([]),
    }),
    endpointId: z.string().optional(),
});

// Authentication Schema
export const mcpAuthSchema = z.object({
    type: z.enum(['none', 'bearer', 'apikey', 'basic']).default('none'),
    token: z.string().optional(),
    apiKey: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    headerName: z.string().optional(),
    keyLocation: z.enum(['header', 'query']).default('header'),
    paramName: z.string().optional(),
});

// Access Control Schema

// Access Control Schema
export const mcpAccessSchema = z.object({
    allowedOrigins: z.array(z.string()).default([]),
    authRequired: z.boolean().default(false),
    apiKey: z.string().optional(),
});

// API Configuration Schema
export const mcpApiConfigSchema = z.object({
    name: z.string().min(1, 'API name is required'),
    baseUrl: z.string().url('Must be a valid URL'),
    description: z.string().default(''),
    headers: z.record(z.string()).default({}),
    authentication: mcpAuthSchema.default({ type: 'none' }),
    endpoints: z.array(mcpEndpointSchema).default([]),
});

// Bridge Form Schema
export const mcpBridgeFormSchema = z.object({
    name: z.string().min(1, 'Bridge name is required'),
    description: z.string(),
    apiConfig: z.object({
        name: z.string().min(1, 'API name is required'),
        baseUrl: z.string().url('Must be a valid URL'),
        description: z.string(),
        headers: z.record(z.string()),
        authentication: z.object({
            type: z.enum(['none', 'bearer', 'apikey', 'basic']),
            token: z.string().optional(),
            apiKey: z.string().optional(),
            username: z.string().optional(),
            password: z.string().optional(),
            headerName: z.string().optional(),
            keyLocation: z.enum(['header', 'query']).default('header'),
            paramName: z.string().optional(),
        }),
        endpoints: z.array(mcpEndpointSchema),
    }),
    mcpTools: z.array(mcpToolSchema),
    mcpResources: z.array(mcpResourceSchema).default([]),
    mcpPrompts: z.array(mcpPromptSchema).default([]),
    access: z.object({
        allowedOrigins: z.array(z.string()),
        authRequired: z.boolean(),
        apiKey: z.string().optional(),
    }),
}).strict();

// Type Exports
export type McpParameter = z.infer<typeof mcpParameterSchema>;
export type McpEndpoint = z.infer<typeof mcpEndpointSchema>;
export type McpTool = z.infer<typeof mcpToolSchema>;
export type McpResource = z.infer<typeof mcpResourceSchema>;
export type McpPrompt = z.infer<typeof mcpPromptSchema>;
export type McpAccess = z.infer<typeof mcpAccessSchema>;
export type McpAuth = z.infer<typeof mcpAuthSchema>;
export type McpApiConfig = z.infer<typeof mcpApiConfigSchema>;
export type McpBridgeFormData = z.infer<typeof mcpBridgeFormSchema>;

