/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Handle MCP JSON-RPC protocol requests
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ bridgeId: string }> }
) {
    const { bridgeId } = await params;
    return handleMcpJsonRpc(request, bridgeId);
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
        },
    });
}

async function handleMcpJsonRpc(
    request: NextRequest,
    bridgeId: string
) {
    try {
        let bridge = null;

        // First try to find in database if bridgeId looks like a UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (uuidRegex.test(bridgeId)) {
            // Try database lookup for UUID
            bridge = await prisma.bridge.findFirst({
                where: {
                    id: bridgeId
                },
                include: {
                    endpoints: true
                }
            });
        }

        // If not found in database, try slug-based lookup
        if (!bridge) {
            try {
                bridge = await prisma.bridge.findFirst({
                    where: {
                        slug: bridgeId
                    },
                    include: {
                        endpoints: true
                    }
                });
            } catch {
                // If slug lookup fails, bridge doesn't exist in database
                console.log('Bridge not found in database, this is expected for localStorage-based bridges');
            }
        }

        // If still not found, return appropriate error
        if (!bridge) {
            return NextResponse.json(
                {
                    jsonrpc: '2.0',
                    error: {
                        code: -32602,
                        message: 'Bridge not found. Please ensure the bridge is properly saved and enabled in the dashboard.'
                    },
                    id: null
                },
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    }
                }
            );
        }

        if (!bridge.enabled) {
            return NextResponse.json(
                {
                    jsonrpc: '2.0',
                    error: {
                        code: -32602,
                        message: 'Bridge is disabled'
                    },
                    id: null
                },
                {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    }
                }
            );
        }

        // Check bridge access control authentication
        const accessConfig = bridge.accessConfig as {
            authRequired?: boolean;
            apiKey?: string;
        } | null;

        if (accessConfig?.authRequired) {
            if (!accessConfig.apiKey) {
                return NextResponse.json(
                    {
                        jsonrpc: '2.0',
                        error: {
                            code: -32603,
                            message: 'Bridge access control is enabled but no API key is configured'
                        },
                        id: null
                    },
                    {
                        status: 500,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                        }
                    }
                );
            }

            // Check for API key in Authorization header (Bearer token format)
            const authHeader = request.headers.get('authorization');
            let providedApiKey: string | null = null;

            if (authHeader) {
                if (authHeader.startsWith('Bearer ')) {
                    providedApiKey = authHeader.substring(7);
                } else if (authHeader.startsWith('ApiKey ')) {
                    providedApiKey = authHeader.substring(7);
                }
            }

            // Also check for API key in X-API-Key header
            if (!providedApiKey) {
                providedApiKey = request.headers.get('x-api-key');
            }

            // Validate the API key
            if (!providedApiKey || providedApiKey !== accessConfig.apiKey) {
                return NextResponse.json(
                    {
                        jsonrpc: '2.0',
                        error: {
                            code: -32401,
                            message: 'Unauthorized: Invalid or missing API key',
                            data: {
                                help: 'Include your API key in the Authorization header as "Bearer <api-key>" or in the X-API-Key header'
                            }
                        },
                        id: null
                    },
                    {
                        status: 401,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'WWW-Authenticate': 'Bearer realm="MCP Bridge"'
                        }
                    }
                );
            }
        }

        // Parse JSON-RPC request
        const jsonRpcRequest = await request.json();

        if (!jsonRpcRequest.jsonrpc || jsonRpcRequest.jsonrpc !== '2.0') {
            return NextResponse.json(
                {
                    jsonrpc: '2.0',
                    error: {
                        code: -32600,
                        message: 'Invalid Request'
                    },
                    id: jsonRpcRequest.id || null
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    }
                }
            );
        }

        // Handle MCP protocol methods
        switch (jsonRpcRequest.method) {
            case 'initialize':
                return handleInitialize(jsonRpcRequest, bridge);

            case 'tools/list':
                return handleToolsList(jsonRpcRequest, bridge);

            case 'tools/call':
                return handleToolCall(jsonRpcRequest, bridge);

            default:
                return NextResponse.json(
                    {
                        jsonrpc: '2.0',
                        error: {
                            code: -32601,
                            message: 'Method not found'
                        },
                        id: jsonRpcRequest.id
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                        }
                    }
                );
        }

    } catch (error) {
        console.error('MCP JSON-RPC error:', error);
        return NextResponse.json(
            {
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal error',
                    data: error instanceof Error ? error.message : 'Unknown error'
                },
                id: null
            },
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                }
            }
        );
    }
}

async function handleInitialize(jsonRpcRequest: any, bridge: any) {
    return NextResponse.json(
        {
            jsonrpc: '2.0',
            result: {
                protocolVersion: '2024-11-05',
                capabilities: {
                    tools: {}
                },
                serverInfo: {
                    name: bridge.name,
                    version: '1.0.0'
                }
            },
            id: jsonRpcRequest.id
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            }
        }
    );
}

async function handleToolsList(jsonRpcRequest: any, bridge: any) {
    console.log('Listing tools for bridge:', bridge.name);
    const tools = bridge.endpoints.map((endpoint: any) => {
        // Parse endpoint config from the database JSON structure
        const endpointConfig = endpoint.config as {
            parameters?: Array<{
                name: string;
                type: string;
                required: boolean;
                description?: string;
                defaultValue?: unknown;
            }>;
            requestBody?: {
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
            };
            responseSchema?: unknown;
        } | null;

        // Create endpoint object with parsed config
        const endpointWithConfig = {
            ...endpoint,
            parameters: endpointConfig?.parameters || [],
            requestBody: endpointConfig?.requestBody,
            responseSchema: endpointConfig?.responseSchema,
        };

        const inputSchema = buildInputSchema(endpointWithConfig);
        return {
            name: endpoint.name || `${endpoint.method.toLowerCase()}_${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
            description: buildToolDescription(endpointWithConfig),
            inputSchema: {
                type: 'object',
                properties: inputSchema.properties,
                required: inputSchema.required
            }
        };
    });

    return NextResponse.json(
        {
            jsonrpc: '2.0',
            result: {
                tools
            },
            id: jsonRpcRequest.id
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            }
        }
    );
}

async function handleToolCall(jsonRpcRequest: any, bridge: any) {
    const { name: toolName, arguments: toolArgs } = jsonRpcRequest.params;

    // Find the matching endpoint
    const endpoint = bridge.endpoints.find((ep: any) => {
        const endpointName = ep.name || `${ep.method.toLowerCase()}_${ep.path.replace(/[^a-zA-Z0-9]/g, '_')}`;
        return endpointName === toolName;
    });

    if (!endpoint) {
        return NextResponse.json(
            {
                jsonrpc: '2.0',
                error: {
                    code: -32602,
                    message: `Tool '${toolName}' not found`
                },
                id: jsonRpcRequest.id
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                }
            }
        );
    }

    // Parse endpoint config from the database JSON structure
    const endpointConfig = endpoint.config as {
        parameters?: Array<{
            name: string;
            type: string;
            required: boolean;
            description?: string;
            defaultValue?: unknown;
        }>;
        requestBody?: {
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
        };
        responseSchema?: unknown;
    } | null;

    // Create endpoint object with parsed config
    const endpointWithConfig = {
        ...endpoint,
        parameters: endpointConfig?.parameters || [],
        requestBody: endpointConfig?.requestBody,
        responseSchema: endpointConfig?.responseSchema,
    };

    try {
        // Execute the API call
        const result = await executeApiCall(bridge, endpointWithConfig, toolArgs || {});

        return NextResponse.json(
            {
                jsonrpc: '2.0',
                result: {
                    content: [
                        {
                            type: 'text',
                            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                        }
                    ]
                },
                id: jsonRpcRequest.id
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                }
            }
        );
    } catch (error) {
        return NextResponse.json(
            {
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'API call failed',
                    data: error instanceof Error ? error.message : 'Unknown error'
                },
                id: jsonRpcRequest.id
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                }
            }
        );
    }
}

function buildToolDescription(endpoint: any): string {
    let description = endpoint.description || `${endpoint.method} ${endpoint.path}`;

    // Add parameter information for better context
    if (endpoint.parameters && endpoint.parameters.length > 0) {
        const requiredParams = endpoint.parameters.filter((p: any) => p.required);
        const optionalParams = endpoint.parameters.filter((p: any) => !p.required);

        if (requiredParams.length > 0) {
            description += `\n\nRequired parameters: ${requiredParams.map((p: any) => `${p.name} (${p.type})`).join(', ')}`;
        }

        if (optionalParams.length > 0) {
            description += `\n\nOptional parameters: ${optionalParams.map((p: any) => `${p.name} (${p.type})`).join(', ')}`;
        }
    }

    // Add request body information for POST/PUT/PATCH
    if (endpoint.requestBody && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        if (endpoint.requestBody.properties) {
            const requiredFields = Object.entries(endpoint.requestBody.properties)
                .filter(([, prop]: [string, any]) => prop.required)
                .map(([name, prop]: [string, any]) => `${name} (${prop.type})`);

            const optionalFields = Object.entries(endpoint.requestBody.properties)
                .filter(([, prop]: [string, any]) => !prop.required)
                .map(([name, prop]: [string, any]) => `${name} (${prop.type})`);

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

function buildInputSchema(endpoint: any) {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    // Add path and query parameters
    if (endpoint.parameters) {
        endpoint.parameters.forEach((param: any) => {
            properties[param.name] = {
                type: mapTypeToJsonSchema(param.type),
                description: param.description || `${param.name} parameter`,
            };

            if (param.required) {
                required.push(param.name);
            }

            if (param.defaultValue !== undefined) {
                properties[param.name].default = param.defaultValue;
            }
        });
    }

    // Add request body schema for POST/PUT/PATCH operations
    if (endpoint.requestBody && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        if (endpoint.requestBody.properties) {
            // Add each property from request body as individual parameters
            Object.entries(endpoint.requestBody.properties).forEach(([propName, propSchema]: [string, any]) => {
                const baseProps: Record<string, any> = {
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
            properties.requestBody = {
                type: 'object',
                description: 'Request body data',
            };
            if (endpoint.requestBody.required) {
                required.push('requestBody');
            }
        }
    }

    return { properties, required };
}

function mapTypeToJsonSchema(type: string): string {
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

async function executeApiCall(bridge: any, endpoint: any, args: any) {
    let url = endpoint.path;
    const queryParams = new URLSearchParams();

    // Handle path and query parameters
    if (endpoint.parameters) {
        endpoint.parameters.forEach((param: any) => {
            const value = args[param.name];
            if (value !== undefined) {
                // Path parameters
                if (url.includes(`{${param.name}}`)) {
                    url = url.replace(`{${param.name}}`, encodeURIComponent(String(value)));
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

    const fullUrl = new URL(url, bridge.baseUrl).toString();

    // Prepare headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Add custom headers from bridge configuration
    if (bridge.headers && typeof bridge.headers === 'object') {
        Object.entries(bridge.headers).forEach(([key, value]) => {
            if (typeof value === 'string') {
                headers[key] = value;
            }
        });
    }

    // Add authentication - Updated to work with new authConfig structure
    if (bridge.authConfig) {
        const authConfig = bridge.authConfig as {
            type: 'none' | 'bearer' | 'apikey' | 'basic';
            token?: string;
            apiKey?: string;
            username?: string;
            password?: string;
            headerName?: string;
        };

        if (authConfig.type && authConfig.type !== 'none') {
            switch (authConfig.type) {
                case 'bearer':
                    if (authConfig.token) {
                        headers['Authorization'] = `Bearer ${authConfig.token}`;
                    }
                    break;
                case 'apikey':
                    if (authConfig.apiKey && authConfig.headerName) {
                        headers[authConfig.headerName] = authConfig.apiKey;
                    } else if (authConfig.apiKey) {
                        headers['X-API-Key'] = authConfig.apiKey;
                    }
                    break;
                case 'basic':
                    if (authConfig.username && authConfig.password) {
                        const credentials = btoa(`${authConfig.username}:${authConfig.password}`);
                        headers['Authorization'] = `Basic ${credentials}`;
                    }
                    break;
            }
        }
    }

    // Prepare request options
    const requestOptions: RequestInit = {
        method: endpoint.method,
        headers,
    };

    // Build request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        const requestBody = buildRequestBody(endpoint, args);
        if (requestBody) {
            requestOptions.body = JSON.stringify(requestBody);
        }
    }

    // Make the API call
    const response = await fetch(fullUrl, requestOptions);

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return await response.json();
    } else {
        return await response.text();
    }
}

function buildRequestBody(endpoint: any, args: any): any {
    if (!endpoint.requestBody) {
        return null;
    }

    // If request body has defined properties, build from individual arguments
    if (endpoint.requestBody.properties) {
        const body: Record<string, any> = {};

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
