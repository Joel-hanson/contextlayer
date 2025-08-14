import { randomUUID } from 'crypto';
import { z } from 'zod';
import { ApiConfig, McpPrompt, McpResource, McpTool } from './types';

// Fallback for environments where crypto is not available
function generateId(): string {
    if (typeof randomUUID === 'function') {
        return randomUUID();
    }
    // Fallback UUID generation
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
        // MCP-specific content generated from OpenAPI
        mcpTools: McpTool[];
        mcpPrompts: McpPrompt[];
        mcpResources: McpResource[];
    };
    error?: string;
    warnings?: string[];
}

export class OpenAPIParser {
    static parseSpec(spec: OpenAPISpec): ParsedOpenAPIResult {
        try {
            const warnings: string[] = [];

            // Extract basic info
            const name = spec.info.title;
            const description = spec.info.description || '';

            // Get base URL - prefer first server URL
            let baseUrl = '';
            if (spec.servers && spec.servers.length > 0) {
                baseUrl = spec.servers[0].url;
            } else {
                return {
                    success: false,
                    error: 'No server URLs found in the OpenAPI spec. Please add at least one server URL.',
                };
            }

            // Parse authentication
            const authentication = this.parseAuthentication(spec);

            // Parse endpoints
            const endpoints = this.parseEndpoints(spec);

            if (endpoints.length === 0) {
                warnings.push('No valid endpoints found in the OpenAPI spec');
            }

            // Generate MCP content based on the OpenAPI spec
            const mcpTools = this.generateMcpTools(endpoints);
            const mcpPrompts = this.generateMcpPrompts(spec, endpoints);
            const mcpResources = this.generateMcpResources(spec);

            // Extract common headers (if any)
            const headers: Record<string, string> = {};

            return {
                success: true,
                data: {
                    name,
                    description,
                    baseUrl,
                    endpoints,
                    authentication,
                    headers,
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

    private static parseAuthentication(spec: OpenAPISpec): ApiConfig['authentication'] {
        // Check global security requirements
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
                    return {
                        type: 'bearer',
                        token: '', // User will need to fill this in
                    };
                } else if (securityScheme.scheme === 'basic') {
                    return {
                        type: 'basic',
                        username: '',
                        password: '',
                    };
                }
                break;

            case 'apiKey':
                return {
                    type: 'apikey',
                    apiKey: '',
                    headerName: securityScheme.in === 'header' ? securityScheme.name : 'X-API-Key',
                };
        }

        return { type: 'none' };
    }

    private static parseEndpoints(spec: OpenAPISpec): ApiConfig['endpoints'] {
        const endpoints: ApiConfig['endpoints'] = [];

        for (const [path, pathItem] of Object.entries(spec.paths)) {
            for (const [method, operation] of Object.entries(pathItem)) {
                const httpMethod = method.toUpperCase();

                // Only process HTTP methods
                if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(httpMethod)) {
                    continue;
                }

                const endpoint = {
                    id: generateId(),
                    name: operation.operationId || `${httpMethod} ${path}`,
                    method: httpMethod as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
                    path: path,
                    description: operation.summary || operation.description || '',
                    parameters: this.parseParameters(operation.parameters || []),
                    requestBody: this.parseRequestBody(operation.requestBody),
                    responseSchema: this.parseResponses(operation.responses),
                };

                endpoints.push(endpoint);
            }
        }

        return endpoints;
    }

    private static parseParameters(parameters: Array<{
        name: string;
        in: string;
        required?: boolean;
        description?: string;
        schema?: { type?: string; default?: unknown };
    }>): ApiConfig['endpoints'][0]['parameters'] {
        return parameters
            .filter(param => param.in !== 'header') // Skip header parameters as they're handled separately
            .map(param => ({
                name: param.name,
                type: this.mapOpenAPITypeToSimpleType(param.schema?.type || 'string'),
                required: param.required === true,
                description: param.description || '',
                defaultValue: param.schema?.default,
            }));
    }

    private static parseRequestBody(requestBody: {
        description?: string;
        required?: boolean;
        content?: Record<string, { schema?: unknown }>;
    } | undefined): ApiConfig['endpoints'][0]['requestBody'] {
        if (!requestBody || !requestBody.content) {
            return undefined;
        }

        // Get the first content type (usually application/json)
        const contentTypes = Object.keys(requestBody.content);
        const contentType = contentTypes.find(ct => ct.includes('json')) || contentTypes[0];

        if (!contentType) {
            return undefined;
        }

        const schema = requestBody.content[contentType]?.schema;
        const result: ApiConfig['endpoints'][0]['requestBody'] = {
            contentType,
            schema,
            required: requestBody.required,
        };

        // If schema is an object with properties, extract them for individual parameter handling
        if (schema && typeof schema === 'object' && 'properties' in schema) {
            const schemaObj = schema as {
                properties?: Record<string, unknown>;
                required?: string[];
                type?: string;
            };

            if (schemaObj.properties) {
                const properties: Record<string, {
                    type: string;
                    description?: string;
                    required?: boolean;
                    enum?: string[];
                    format?: string;
                    minimum?: number;
                    maximum?: number;
                    pattern?: string;
                    items?: unknown;
                    properties?: Record<string, unknown>;
                }> = {};

                const requiredFields = schemaObj.required || [];

                Object.entries(schemaObj.properties).forEach(([propName, propSchema]) => {
                    if (typeof propSchema === 'object' && propSchema !== null) {
                        const prop = propSchema as Record<string, unknown>;
                        const propertyDef: {
                            type: string;
                            description?: string;
                            required?: boolean;
                            enum?: string[];
                            format?: string;
                            minimum?: number;
                            maximum?: number;
                            pattern?: string;
                            items?: unknown;
                            properties?: Record<string, unknown>;
                        } = {
                            type: this.mapOpenAPITypeToSimpleType(String(prop.type || 'string')),
                            description: String(prop.description || ''),
                            required: requiredFields.includes(propName),
                        };

                        if (prop.enum && Array.isArray(prop.enum)) {
                            propertyDef.enum = prop.enum.map(String);
                        }
                        if (prop.format) {
                            propertyDef.format = String(prop.format);
                        }
                        if (typeof prop.minimum === 'number') {
                            propertyDef.minimum = prop.minimum;
                        }
                        if (typeof prop.maximum === 'number') {
                            propertyDef.maximum = prop.maximum;
                        }
                        if (prop.pattern) {
                            propertyDef.pattern = String(prop.pattern);
                        }
                        if (prop.items) {
                            propertyDef.items = prop.items;
                        }
                        if (prop.properties) {
                            propertyDef.properties = prop.properties as Record<string, unknown>;
                        }

                        properties[propName] = propertyDef;
                    }
                });

                result.properties = properties;
            }
        }

        return result;
    }

    private static parseResponses(responses: Record<string, {
        description: string;
        content?: Record<string, { schema?: unknown }>;
    }> | undefined): unknown {
        if (!responses) return undefined;

        // Look for successful response (200, 201, etc.)
        for (const [statusCode, response] of Object.entries(responses)) {
            if (statusCode.startsWith('2') && typeof response === 'object' && response !== null) {
                if (response.content) {
                    const contentTypes = Object.keys(response.content);
                    const contentType = contentTypes.find(ct => ct.includes('json')) || contentTypes[0];
                    if (contentType && response.content[contentType]?.schema) {
                        return response.content[contentType].schema;
                    }
                }
            }
        }

        return undefined;
    }

    private static mapOpenAPITypeToSimpleType(openApiType: string): 'string' | 'number' | 'boolean' | 'object' | 'array' {
        switch (openApiType) {
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

    /**
     * Generate MCP tools based on API endpoints
     */
    public static generateMcpTools(endpoints: ApiConfig['endpoints']): McpTool[] {
        return endpoints.map(endpoint => {
            // Build input schema for the tool
            const properties: Record<string, {
                type: string;
                description: string;
                default?: unknown;
                enum?: string[];
            }> = {};
            const required: string[] = [];

            // Add path parameters, query parameters, etc.
            if (endpoint.parameters) {
                endpoint.parameters.forEach(param => {
                    properties[param.name] = {
                        type: param.type,
                        description: param.description || `Parameter: ${param.name}`,
                    };

                    if (param.defaultValue !== undefined) {
                        properties[param.name].default = param.defaultValue;
                    }

                    if (param.required) {
                        required.push(param.name);
                    }
                });
            }

            // Add request body properties for POST/PUT/PATCH methods
            if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.requestBody?.properties) {
                Object.entries(endpoint.requestBody.properties).forEach(([propName, propSchema]) => {
                    properties[propName] = {
                        type: propSchema.type,
                        description: propSchema.description || `Request body field: ${propName}`,
                    };

                    if (propSchema.enum) {
                        properties[propName].enum = propSchema.enum;
                    }

                    if (propSchema.required) {
                        required.push(propName);
                    }
                });
            }

            return {
                name: this.sanitizeToolName(endpoint.name),
                description: endpoint.description || `${endpoint.method} ${endpoint.path}`,
                inputSchema: {
                    type: 'object' as const,
                    properties,
                    required: required.length > 0 ? required : undefined,
                },
            };
        });
    }

    /**
     * Generate MCP prompts based on API operations and common use cases
     */
    private static generateMcpPrompts(spec: OpenAPISpec, endpoints: ApiConfig['endpoints']): McpPrompt[] {
        const prompts: McpPrompt[] = [];

        // Group endpoints by tags for better organization
        const endpointsByTag: Record<string, typeof endpoints> = {};
        endpoints.forEach(endpoint => {
            // Find the original OpenAPI operation to get tags
            for (const [path, pathItem] of Object.entries(spec.paths)) {
                for (const [method, operation] of Object.entries(pathItem)) {
                    if (endpoint.path === path && endpoint.method === method.toUpperCase()) {
                        const tags = operation.tags || ['default'];
                        tags.forEach(tag => {
                            if (!endpointsByTag[tag]) {
                                endpointsByTag[tag] = [];
                            }
                            endpointsByTag[tag].push(endpoint);
                        });
                    }
                }
            }
        });

        // Generate prompts for each tag/category
        Object.entries(endpointsByTag).forEach(([tag, tagEndpoints]) => {
            // Create operation prompts
            const readOperations = tagEndpoints.filter(e => e.method === 'GET');
            const writeOperations = tagEndpoints.filter(e => ['POST', 'PUT', 'PATCH'].includes(e.method));
            const deleteOperations = tagEndpoints.filter(e => e.method === 'DELETE');

            if (readOperations.length > 0) {
                prompts.push({
                    name: `query_${tag}_data`,
                    description: `Query and retrieve ${tag} data from the API`,
                    arguments: [
                        {
                            name: 'operation',
                            description: `The type of query operation (${readOperations.map(op => op.name).join(', ')})`,
                            required: true,
                        },
                        {
                            name: 'parameters',
                            description: 'Query parameters and filters',
                            required: false,
                        }
                    ],
                });
            }

            if (writeOperations.length > 0) {
                prompts.push({
                    name: `manage_${tag}_data`,
                    description: `Create, update, or modify ${tag} data via the API`,
                    arguments: [
                        {
                            name: 'operation',
                            description: `The management operation (${writeOperations.map(op => op.name).join(', ')})`,
                            required: true,
                        },
                        {
                            name: 'data',
                            description: 'The data to create or update',
                            required: false,
                        }
                    ],
                });
            }

            if (deleteOperations.length > 0) {
                prompts.push({
                    name: `delete_${tag}_data`,
                    description: `Delete ${tag} data from the API`,
                    arguments: [
                        {
                            name: 'identifier',
                            description: 'The identifier of the resource to delete',
                            required: true,
                        },
                        {
                            name: 'confirmation',
                            description: 'Confirmation for the delete operation',
                            required: false,
                        }
                    ],
                });
            }
        });

        // Add general-purpose prompts
        prompts.push({
            name: 'api_workflow',
            description: `Execute a workflow using the ${spec.info.title} API`,
            arguments: [
                {
                    name: 'workflow_description',
                    description: 'Description of the workflow to execute',
                    required: true,
                },
                {
                    name: 'steps',
                    description: 'Ordered list of API operations to perform',
                    required: false,
                }
            ],
        });

        prompts.push({
            name: 'api_analysis',
            description: `Analyze data or perform operations using the ${spec.info.title} API`,
            arguments: [
                {
                    name: 'analysis_type',
                    description: 'Type of analysis to perform',
                    required: true,
                },
                {
                    name: 'data_sources',
                    description: 'API endpoints to use as data sources',
                    required: false,
                }
            ],
        });

        return prompts;
    }

    /**
     * Generate MCP resources based on API documentation and schemas
     */
    private static generateMcpResources(spec: OpenAPISpec): McpResource[] {
        const resources: McpResource[] = [];

        // API Documentation resource
        resources.push({
            uri: 'openapi://spec/full',
            name: `${spec.info.title} API Specification`,
            description: `Complete OpenAPI specification for ${spec.info.title}`,
            mimeType: 'application/json',
        });

        // Schema documentation
        if (spec.components?.schemas && Object.keys(spec.components.schemas).length > 0) {
            resources.push({
                uri: 'openapi://schemas/all',
                name: 'API Data Schemas',
                description: 'All data schemas and models defined in the API',
                mimeType: 'application/json',
            });

            // Individual schema resources
            Object.keys(spec.components.schemas).forEach(schemaName => {
                resources.push({
                    uri: `openapi://schema/${schemaName}`,
                    name: `${schemaName} Schema`,
                    description: `Schema definition for ${schemaName}`,
                    mimeType: 'application/json',
                });
            });
        }

        // Endpoint documentation
        resources.push({
            uri: 'openapi://endpoints/summary',
            name: 'API Endpoints Summary',
            description: 'Summary of all available API endpoints and their capabilities',
            mimeType: 'text/markdown',
        });

        // Authentication guide
        if (spec.components?.securitySchemes) {
            resources.push({
                uri: 'openapi://auth/guide',
                name: 'Authentication Guide',
                description: 'Guide for authenticating with the API',
                mimeType: 'text/markdown',
            });
        }

        // Examples resource
        resources.push({
            uri: 'openapi://examples/common',
            name: 'Common Usage Examples',
            description: 'Examples of common API usage patterns and workflows',
            mimeType: 'text/markdown',
        });

        return resources;
    }

    /**
     * Sanitize tool names to be valid MCP tool identifiers
     */
    private static sanitizeToolName(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    static async parseFromUrl(url: string): Promise<ParsedOpenAPIResult> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                return {
                    success: false,
                    error: `Failed to fetch OpenAPI spec from URL: ${response.status} ${response.statusText}`,
                };
            }

            const spec = await response.json();
            return this.parseFromObject(spec);
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch OpenAPI specification from URL',
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
                    error: 'Invalid OpenAPI specification format. Please ensure it follows OpenAPI 3.0 or Swagger 2.0 schema.',
                };
            }
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to parse OpenAPI specification',
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
                error: 'Invalid JSON format. Please provide a valid JSON OpenAPI specification.',
            };
        }
    }

    static parseFromYaml(): ParsedOpenAPIResult {
        // For now, we'll ask users to convert YAML to JSON
        // In a full implementation, you'd add a YAML parser like js-yaml
        return {
            success: false,
            error: 'YAML parsing not yet supported. Please convert your OpenAPI spec to JSON format and try again.',
        };
    }
}
