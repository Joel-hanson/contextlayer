import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ApiConfig } from './types';

interface EndpointParameter {
    name: string;
    type: string;
    description?: string;
    required?: boolean;
    defaultValue?: unknown;
}

interface RequestBodySchema {
    contentType?: string;
    schema?: unknown;
    required?: boolean;
    properties?: Record<string, {
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
    }>;
}

interface EndpointDefinition {
    name: string;
    method: string;
    path: string;
    description?: string;
    parameters?: EndpointParameter[];
    requestBody?: RequestBodySchema;
    responseSchema?: unknown;
}

export class McpBridge {
    private server: Server;
    private apiConfig: ApiConfig;

    constructor(apiConfig: ApiConfig) {
        this.apiConfig = apiConfig;
        this.server = new Server(
            {
                name: apiConfig.name,
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupHandlers();
    }

    private setupHandlers() {
        // Add tool handlers for each endpoint
        this.apiConfig.endpoints.forEach((endpoint) => {
            this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
                if (request.params.name !== endpoint.name) {
                    throw new Error(`Unknown tool: ${request.params.name}`);
                }

                try {
                    const result = await this.callApi(endpoint, request.params.arguments || {});
                    return {
                        content: [
                            {
                                type: 'text',
                                text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
                            },
                        ],
                    };
                } catch (error) {
                    throw new Error(`API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            });
        });

        // Add tool listing handler
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: this.apiConfig.endpoints.map((endpoint) => {
                    const inputSchema = this.buildInputSchema(endpoint);
                    return {
                        name: endpoint.name,
                        description: this.buildToolDescription(endpoint),
                        inputSchema: {
                            type: 'object',
                            properties: inputSchema.properties,
                            required: inputSchema.required,
                        },
                    };
                }),
            };
        });
    }

    private buildInputSchema(endpoint: EndpointDefinition) {
        const properties: Record<string, unknown> = {};
        const required: string[] = [];

        // Add path and query parameters
        if (endpoint.parameters) {
            endpoint.parameters.forEach((param: EndpointParameter) => {
                properties[param.name] = {
                    type: this.mapTypeToJsonSchema(param.type),
                    description: param.description || `${param.name} parameter`,
                };

                if (param.required) {
                    required.push(param.name);
                }

                if (param.defaultValue !== undefined) {
                    (properties[param.name] as Record<string, unknown>).default = param.defaultValue;
                }
            });
        }

        // Add request body schema for POST/PUT/PATCH operations
        if (endpoint.requestBody && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
            const requestBodySchema = this.buildRequestBodySchema(endpoint.requestBody);

            if (requestBodySchema) {
                // If the request body has a defined schema, use it
                if (endpoint.requestBody.properties) {
                    // Add each property from request body as individual parameters
                    Object.entries(endpoint.requestBody.properties).forEach(([propName, propSchema]) => {
                        const baseProps: Record<string, unknown> = {
                            type: propSchema.type,
                            description: propSchema.description || `${propName} field`,
                        };

                        if (propSchema.enum) baseProps.enum = propSchema.enum;
                        if (propSchema.format) baseProps.format = propSchema.format;
                        if (propSchema.minimum !== undefined) baseProps.minimum = propSchema.minimum;
                        if (propSchema.maximum !== undefined) baseProps.maximum = propSchema.maximum;
                        if (propSchema.pattern) baseProps.pattern = propSchema.pattern;
                        if (propSchema.items && typeof propSchema.items === 'object') baseProps.items = propSchema.items;

                        properties[propName] = baseProps;

                        if (propSchema.required) {
                            required.push(propName);
                        }
                    });
                } else {
                    // Fallback: single request body parameter
                    properties.requestBody = requestBodySchema;
                    if (endpoint.requestBody.required) {
                        required.push('requestBody');
                    }
                }
            }
        }

        return { properties, required };
    }

    private buildToolDescription(endpoint: EndpointDefinition): string {
        let description = endpoint.description || `${endpoint.method} ${endpoint.path}`;

        // Add parameter information for better context
        if (endpoint.parameters && endpoint.parameters.length > 0) {
            const requiredParams = endpoint.parameters.filter(p => p.required);
            const optionalParams = endpoint.parameters.filter(p => !p.required);

            if (requiredParams.length > 0) {
                description += `\n\nRequired parameters: ${requiredParams.map(p => `${p.name} (${p.type})`).join(', ')}`;
            }

            if (optionalParams.length > 0) {
                description += `\n\nOptional parameters: ${optionalParams.map(p => `${p.name} (${p.type})`).join(', ')}`;
            }
        }

        // Add request body information for POST/PUT/PATCH
        if (endpoint.requestBody && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
            if (endpoint.requestBody.properties) {
                const requiredFields = Object.entries(endpoint.requestBody.properties)
                    .filter(([, prop]) => prop.required)
                    .map(([name, prop]) => `${name} (${prop.type})`);

                const optionalFields = Object.entries(endpoint.requestBody.properties)
                    .filter(([, prop]) => !prop.required)
                    .map(([name, prop]) => `${name} (${prop.type})`);

                if (requiredFields.length > 0) {
                    description += `\n\nRequired body fields: ${requiredFields.join(', ')}`;
                }

                if (optionalFields.length > 0) {
                    description += `\n\nOptional body fields: ${optionalFields.join(', ')}`;
                }
            } else {
                description += `\n\nAccepts JSON request body`;
            }
        }

        return description;
    }

    private buildRequestBodySchema(requestBody: RequestBodySchema): unknown {
        if (!requestBody) return null;

        if (requestBody.schema) {
            return this.convertOpenAPISchemaToJSONSchema(requestBody.schema);
        }

        if (requestBody.properties) {
            return {
                type: 'object',
                properties: Object.fromEntries(
                    Object.entries(requestBody.properties).map(([key, value]) => {
                        const propSchema: Record<string, unknown> = {
                            type: value.type,
                            description: value.description,
                        };

                        if (value.enum) propSchema.enum = value.enum;
                        if (value.format) propSchema.format = value.format;
                        if (value.minimum !== undefined) propSchema.minimum = value.minimum;
                        if (value.maximum !== undefined) propSchema.maximum = value.maximum;
                        if (value.pattern) propSchema.pattern = value.pattern;
                        if (value.items && typeof value.items === 'object') propSchema.items = value.items;

                        return [key, propSchema];
                    })
                ),
                required: Object.entries(requestBody.properties)
                    .filter(([, value]) => value.required)
                    .map(([key]) => key),
                description: 'Request body data',
            };
        }

        return {
            type: 'object',
            description: 'Request body data',
        };
    }

    private convertOpenAPISchemaToJSONSchema(schema: unknown): unknown {
        if (!schema || typeof schema !== 'object') {
            return schema;
        }

        const schemaObj = schema as Record<string, unknown>;
        const jsonSchema: Record<string, unknown> = { ...schemaObj };

        // Convert OpenAPI specific fields to JSON Schema equivalents
        if (schemaObj.type === 'array' && schemaObj.items) {
            jsonSchema.items = this.convertOpenAPISchemaToJSONSchema(schemaObj.items);
        }

        if (schemaObj.type === 'object' && schemaObj.properties) {
            const properties = schemaObj.properties as Record<string, unknown>;
            jsonSchema.properties = Object.fromEntries(
                Object.entries(properties).map(([key, value]) => [
                    key,
                    this.convertOpenAPISchemaToJSONSchema(value)
                ])
            );
        }

        return jsonSchema;
    }

    private mapTypeToJsonSchema(type: string): string {
        switch (type) {
            case 'integer':
                return 'number';
            case 'int32':
            case 'int64':
                return 'number';
            case 'float':
            case 'double':
                return 'number';
            case 'byte':
            case 'binary':
                return 'string';
            case 'date':
            case 'date-time':
                return 'string';
            default:
                return type;
        }
    }

    private async callApi(endpoint: EndpointDefinition, args: Record<string, unknown>) {
        let url = `${this.apiConfig.baseUrl}${endpoint.path}`;
        const queryParams = new URLSearchParams();

        // Handle path and query parameters
        if (endpoint.parameters) {
            endpoint.parameters.forEach((param: EndpointParameter) => {
                const value = args[param.name];
                if (value !== undefined) {
                    // Path parameters
                    if (url.includes(`{${param.name}}`)) {
                        url = url.replace(`{${param.name}}`, String(value));
                    } else {
                        // Query parameters
                        queryParams.append(param.name, String(value));
                    }
                }
            });
        }

        // Add query parameters to URL
        const queryString = queryParams.toString();
        if (queryString) {
            url += (url.includes('?') ? '&' : '?') + queryString;
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Add authentication headers
        if (this.apiConfig.authentication) {
            const auth = this.apiConfig.authentication;
            if (auth.type === 'bearer' && auth.token) {
                headers['Authorization'] = `Bearer ${auth.token}`;
            } else if (auth.type === 'apikey' && auth.apiKey) {
                if (auth.headerName) {
                    headers[auth.headerName] = auth.apiKey;
                } else {
                    headers['X-API-Key'] = auth.apiKey;
                }
            } else if (auth.type === 'basic' && auth.username && auth.password) {
                const credentials = btoa(`${auth.username}:${auth.password}`);
                headers['Authorization'] = `Basic ${credentials}`;
            }
        }

        // Add custom headers
        if (this.apiConfig.headers) {
            Object.assign(headers, this.apiConfig.headers);
        }

        const requestOptions: RequestInit = {
            method: endpoint.method,
            headers,
        };

        // Build request body for POST/PUT/PATCH
        if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
            const requestBody = this.buildRequestBody(endpoint, args);
            if (requestBody) {
                requestOptions.body = JSON.stringify(requestBody);
            }
        }

        const response = await fetch(url, requestOptions);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return await response.text();
        }
    }

    private buildRequestBody(endpoint: EndpointDefinition, args: Record<string, unknown>): unknown {
        if (!endpoint.requestBody) {
            return null;
        }

        // If request body has defined properties, build from individual arguments
        if (endpoint.requestBody.properties) {
            const body: Record<string, unknown> = {};

            Object.keys(endpoint.requestBody.properties).forEach(propName => {
                if (args[propName] !== undefined) {
                    body[propName] = args[propName];
                }
            });

            return Object.keys(body).length > 0 ? body : null;
        }

        // Fallback: look for a requestBody argument
        return args.requestBody || null;
    }

    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
    }

    async stop() {
        await this.server.close();
    }
}
