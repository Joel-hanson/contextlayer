import { z } from 'zod';

export const bridgeFormSchema = z.object({
    name: z.string().min(1, 'Bridge name is required'),
    description: z.string().optional(),
    apiConfig: z.object({
        name: z.string().min(1, 'API name is required'),
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
            path: z.string().min(1, 'Path is required'),
            name: z.string().min(1, 'Endpoint name is required'),
            method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
            parameters: z.array(z.object({
                type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
                name: z.string(),
                required: z.boolean(),
                description: z.string().optional(),
            })),
            description: z.string().optional(),
        })),
    }),
    mcpTools: z.array(z.object({
        name: z.string().min(1, 'Tool name is required'),
        description: z.string().min(1, 'Tool description is required'),
        inputSchema: z.object({
            type: z.literal('object'),
            properties: z.record(z.any()),
            required: z.array(z.string()).optional(),
        }),
    })),
    mcpResources: z.array(z.object({
        uri: z.string().min(1, 'URI is required'),
        name: z.string().min(1, 'Resource name is required'),
        description: z.string().optional(),
        mimeType: z.string().optional(),
    })),
    mcpPrompts: z.array(z.object({
        name: z.string().min(1, 'Prompt name is required'),
        description: z.string().optional(),
        arguments: z.array(z.object({
            name: z.string().min(1, 'Argument name is required'),
            description: z.string().optional(),
            required: z.boolean(),
        })).optional(),
    })),
    routing: z.object({
        type: z.literal('http'),
        customDomain: z.string().optional(),
        pathPrefix: z.string().optional(),
    }).optional(),
    access: z.object({
        public: z.boolean(),
        allowedOrigins: z.array(z.string()).optional(),
        authRequired: z.boolean(),
        apiKey: z.string().optional(),
    }).optional(),
});

export type BridgeFormData = z.infer<typeof bridgeFormSchema>;
