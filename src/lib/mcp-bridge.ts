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
}

interface EndpointDefinition {
    name: string;
    method: string;
    path: string;
    description?: string;
    parameters?: EndpointParameter[];
    requestBody?: unknown;
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
                tools: this.apiConfig.endpoints.map((endpoint) => ({
                    name: endpoint.name,
                    description: endpoint.description || `Call ${endpoint.method} ${endpoint.path}`,
                    inputSchema: {
                        type: 'object',
                        properties: this.buildInputSchema(endpoint),
                        required: endpoint.parameters?.filter(p => p.required).map(p => p.name) || [],
                    },
                })),
            };
        });
    }

    private buildInputSchema(endpoint: EndpointDefinition) {
        const properties: Record<string, unknown> = {};

        // Add path parameters
        if (endpoint.parameters) {
            endpoint.parameters.forEach((param: EndpointParameter) => {
                properties[param.name] = {
                    type: param.type,
                    description: param.description,
                };
            });
        }

        // Add request body if applicable
        if (endpoint.requestBody && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
            properties.requestBody = {
                type: 'object',
                description: 'Request body data',
            };
        }

        return properties;
    }

    private async callApi(endpoint: EndpointDefinition, args: Record<string, unknown>) {
        let url = `${this.apiConfig.baseUrl}${endpoint.path}`;

        // Replace path parameters
        if (endpoint.parameters) {
            endpoint.parameters.forEach((param: EndpointParameter) => {
                if (args[param.name] !== undefined) {
                    url = url.replace(`{${param.name}}`, String(args[param.name]));
                }
            });
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

        // Add request body for POST/PUT/PATCH
        if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && args.requestBody) {
            requestOptions.body = JSON.stringify(args.requestBody);
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

    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
    }

    async stop() {
        await this.server.close();
    }
}
