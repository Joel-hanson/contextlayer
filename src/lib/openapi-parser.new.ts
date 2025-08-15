import { randomUUID } from 'crypto';
import { z } from 'zod';
import { ApiConfig, McpPrompt, McpResource, McpTool } from './types';

// Fallback for environments where crypto is not available
function generateId(): string {
    if (typeof randomUUID === 'function') {
        return randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// OpenAPI 3.0 Schema definitions
export const OpenAPISpecSchema = z.object({
    openapi: z.string().optional(),
    swagger: z.string().optional(),
    info: z.object({
        title: z.string(),
        description: z.string().optional(),
        version: z.string(),
    }),
    servers: z.array(z.object({
        url: z.string(),
        description: z.string().optional(),
    })).optional(),
    paths: z.record(z.record(z.object({
        summary: z.string().optional(),
        description: z.string().optional(),
        operationId: z.string().optional(),
        tags: z.array(z.string()).optional(),
        parameters: z.array(z.object({
            name: z.string(),
            in: z.enum(['query', 'header', 'path', 'cookie']),
            description: z.string().optional(),
            required: z.boolean().optional(),
            schema: z.any().optional(),
        })).optional(),
        requestBody: z.object({
            description: z.string().optional(),
            required: z.boolean().optional(),
            content: z.record(z.object({
                schema: z.any().optional(),
            })).optional(),
        }).optional(),
        responses: z.record(z.object({
            description: z.string(),
            content: z.record(z.object({
                schema: z.any().optional(),
            })).optional(),
        })).optional(),
        security: z.array(z.record(z.array(z.string()))).optional(),
    }))),
    components: z.object({
        securitySchemes: z.record(z.object({
            type: z.enum(['http', 'apiKey', 'oauth2', 'openIdConnect']),
            scheme: z.string().optional(),
            bearerFormat: z.string().optional(),
            in: z.enum(['query', 'header', 'cookie']).optional(),
            name: z.string().optional(),
        })).optional(),
        schemas: z.record(z.any()).optional(),
    }).optional(),
    security: z.array(z.record(z.array(z.string()))).optional(),
});

export type OpenAPISpec = z.infer<typeof OpenAPISpecSchema>;

export interface ParsedOpenAPIResult {
    success: boolean;
    data?: {
        name: string;
        description: string;
        baseUrl: string;
        endpoints: ApiConfig['endpoints'];
        authentication: ApiConfig['authentication'];
        headers: Record<string, string>;
        mcpTools: McpTool[];
        mcpPrompts: McpPrompt[];
        mcpResources: McpResource[];
    };
    error?: string;
    warnings?: string[];
}

export class OpenAPIParser {
    /**
     * Generate a standardized tool name from method and path
     * Format: method_resource_action
     */
    private static generateStandardToolName(method: string, path: string): string {
        const cleanedMethod = method.toLowerCase();

        // Remove URL parameters and split path
        const pathParts = path
            .replace(/\{[^}]+\}/g, '') // Remove URL parameters
            .split('/')
            .filter(Boolean) // Remove empty strings
            .map(part => part.toLowerCase());

        // Determine the action based on method and path
        let action = '';
        if (cleanedMethod === 'get') {
            action = path.includes('{') ? 'read' : 'list';
        } else if (cleanedMethod === 'post') {
            action = 'create';
        } else if (cleanedMethod === 'put' || cleanedMethod === 'patch') {
            action = 'update';
        } else if (cleanedMethod === 'delete') {
            action = 'delete';
        }

        // Construct the name: method_resource_action
        const resource = pathParts[pathParts.length - 1] || 'root';
        return `${cleanedMethod}_${resource}_${action}`;
    }

    static parseSpec(spec: OpenAPISpec): ParsedOpenAPIResult {
        try {
            const warnings: string[] = [];

            // Extract basic info
            const name = spec.info.title;
            const description = spec.info.description || '';

            // Get base URL
            let baseUrl = '';
            if (spec.servers && spec.servers.length > 0) {
                baseUrl = spec.servers[0].url;
            } else {
                return {
                    success: false,
                    error: 'No server URLs found in the OpenAPI spec.',
                };
            }

            // Parse authentication
            const authentication = this.parseAuthentication(spec);

            // Parse endpoints
            const endpoints = this.parseEndpoints(spec);

            if (endpoints.length === 0) {
                warnings.push('No valid endpoints found in the OpenAPI spec');
            }

            // Generate MCP content
            const mcpTools = endpoints.map(endpoint => ({
                name: this.generateStandardToolName(endpoint.method, endpoint.path),
                description: endpoint.description || `${endpoint.method} ${endpoint.path}`,
                inputSchema: {
                    type: 'object' as const,
                    properties: this.buildToolParameters(endpoint).properties,
                    required: this.buildToolParameters(endpoint).required
                }
            }));

            // Generate prompts and resources
            const mcpPrompts = this.generateMcpPrompts(spec, endpoints);
            const mcpResources = this.generateMcpResources(spec);

            return {
                success: true,
                data: {
                    name,
                    description,
                    baseUrl,
                    endpoints,
                    authentication,
                    headers: {},
                    mcpTools,
                    mcpPrompts,
                    mcpResources,
                },
                warnings: warnings.length > 0 ? warnings : undefined,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to parse OpenAPI specification',
            };
        }
    }

    private static buildToolParameters(endpoint: ApiConfig['endpoints'][0]): {
        properties: Record<string, {
            type: 'string' | 'number' | 'boolean' | 'object' | 'array';
            description: string;
            default?: unknown;
            enum?: string[];
        }>;
        required?: string[];
    } {
        const parameters: {
            properties: Record<string, {
                type: 'string' | 'number' | 'boolean' | 'object' | 'array';
                description: string;
                default?: unknown;
                enum?: string[];
            }>;
            required: string[];
        } = {
            properties: {},
            required: []
        };

        // Add path and query parameters
        endpoint.parameters?.forEach(param => {
            parameters.properties[param.name] = {
                type: this.mapOpenAPITypeToSimpleType(param.schema?.type || 'string') as 'string' | 'number' | 'boolean' | 'object' | 'array',
                description: param.description || `Parameter: ${param.name}`
            };
            if (param.required) {
                parameters.required.push(param.name);
            }
        });

        // Add request body fields
        if (endpoint.requestBody?.properties) {
            Object.entries(endpoint.requestBody.properties).forEach(([name, schema]) => {
                parameters.properties[name] = {
                    type: this.mapOpenAPITypeToSimpleType(schema.type) as 'string' | 'number' | 'boolean' | 'object' | 'array',
                    description: schema.description || `Request body field: ${name}`
                };
                if (schema.required) {
                    parameters.required.push(name);
                }
            });
        }

        return {
            properties: parameters.properties,
            required: parameters.required.length > 0 ? parameters.required : undefined
        };
    }

    private static parseAuthentication(spec: OpenAPISpec): ApiConfig['authentication'] {
        const globalSecurity = spec.security?.[0];
        if (!globalSecurity || Object.keys(globalSecurity).length === 0) {
            return { type: 'none' };
        }

        const securitySchemeName = Object.keys(globalSecurity)[0];
        const securityScheme = spec.components?.securitySchemes?.[securitySchemeName];

        if (!securityScheme) {
            return { type: 'none' };
        }

        switch (securityScheme.type) {
            case 'http':
                if (securityScheme.scheme === 'bearer') {
                    return { type: 'bearer', token: '' };
                } else if (securityScheme.scheme === 'basic') {
                    return { type: 'basic', username: '', password: '' };
                }
                break;
            case 'apiKey':
                return {
                    type: 'apikey',
                    apiKey: '',
                    headerName: securityScheme.name || 'X-API-Key'
                };
        }

        return { type: 'none' };
    }

    private static parseEndpoints(spec: OpenAPISpec): ApiConfig['endpoints'] {
        const endpoints: ApiConfig['endpoints'] = [];

        Object.entries(spec.paths).forEach(([path, pathItem]) => {
            Object.entries(pathItem).forEach(([method, operation]) => {
                const httpMethod = method.toUpperCase();
                if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(httpMethod)) {
                    return;
                }

                endpoints.push({
                    id: generateId(),
                    name: operation.operationId || `${httpMethod} ${path}`,
                    method: httpMethod as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
                    path,
                    description: operation.summary || operation.description || '',
                    parameters: this.parseParameters(operation.parameters || [])
                });
            });
        });

        return endpoints;
    }

    private static parseParameters(parameters: Array<{
        name: string;
        in: string;
        required?: boolean;
        description?: string;
        schema?: { type?: string; default?: unknown };
    }>): Array<{
        name: string;
        type: 'string' | 'number' | 'boolean' | 'object' | 'array';
        required: boolean;
        description?: string;
        defaultValue?: unknown;
    }> {
        return parameters
            .filter(param => param.in !== 'header')
            .map(param => ({
                name: param.name,
                type: this.mapOpenAPITypeToSimpleType(param.schema?.type || 'string') as 'string' | 'number' | 'boolean' | 'object' | 'array',
                required: param.required === true,
                description: param.description || '',
                defaultValue: param.schema?.default
            }));
    }

    private static mapOpenAPITypeToSimpleType(type: string): 'string' | 'number' | 'boolean' | 'object' | 'array' {
        switch (type) {
            case 'integer':
            case 'number':
                return 'number';
            case 'boolean':
                return 'boolean';
            case 'array':
                return 'array';
            case 'object':
                return 'object';
            default:
                return 'string';
        }
    }

    private static generateMcpPrompts(spec: OpenAPISpec, endpoints: ApiConfig['endpoints']): McpPrompt[] {
        const prompts: McpPrompt[] = [];
        const endpointsByResource = new Map<string, typeof endpoints>();

        // Group endpoints by resource
        endpoints.forEach(endpoint => {
            const resource = endpoint.path.split('/')[1] || 'root';
            if (!endpointsByResource.has(resource)) {
                endpointsByResource.set(resource, []);
            }
            endpointsByResource.get(resource)?.push(endpoint);
        });

        // Generate prompts for each resource
        endpointsByResource.forEach((resourceEndpoints, resource) => {
            prompts.push({
                name: `${resource}_operations`,
                description: `Guide for performing operations on ${resource}`,
                arguments: [
                    {
                        name: 'operation',
                        description: `Choose from: ${resourceEndpoints.map(e => e.method + ' ' + e.path).join(', ')}`,
                        required: true
                    },
                    {
                        name: 'parameters',
                        description: 'Operation parameters',
                        required: false
                    }
                ]
            });
        });

        return prompts;
    }

    private static generateMcpResources(spec: OpenAPISpec): McpResource[] {
        const resources: McpResource[] = [];

        // API Documentation
        resources.push({
            name: `${spec.info.title} API Specification`,
            description: `Complete OpenAPI specification for ${spec.info.title}`,
            uri: 'openapi://spec/full',
            mimeType: 'application/json'
        });

        // Schema Documentation
        if (spec.components?.schemas) {
            resources.push({
                name: 'API Data Schemas',
                description: 'Data type definitions used by the API',
                uri: 'openapi://schemas/all',
                mimeType: 'application/json'
            });

            // Individual schema resources
            Object.keys(spec.components.schemas).forEach(schemaName => {
                resources.push({
                    name: `${schemaName} Schema Definition`,
                    description: `Schema definition for ${schemaName} data type`,
                    uri: `openapi://schema/${schemaName}`,
                    mimeType: 'application/json'
                });
            });
        }

        return resources;
    }

    static async parseFromUrl(url: string): Promise<ParsedOpenAPIResult> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`);
            }
            const spec = await response.json();
            return this.parseFromObject(spec);
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch OpenAPI specification'
            };
        }
    }

    static parseFromObject(spec: unknown): ParsedOpenAPIResult {
        try {
            const validatedSpec = OpenAPISpecSchema.parse(spec);
            return this.parseSpec(validatedSpec);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    success: false,
                    error: 'Invalid OpenAPI specification format.'
                };
            }
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to parse OpenAPI specification'
            };
        }
    }

    static parseFromJson(jsonString: string): ParsedOpenAPIResult {
        try {
            const spec = JSON.parse(jsonString);
            return this.parseFromObject(spec);
        } catch {
            return {
                success: false,
                error: 'Invalid JSON format'
            };
        }
    }

    static parseFromYaml(): ParsedOpenAPIResult {
        return {
            success: false,
            error: 'YAML parsing not supported yet'
        };
    }
}
