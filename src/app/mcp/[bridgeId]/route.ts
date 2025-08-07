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
        if (bridge.authRequired) {
            if (!bridge.apiKey) {
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
            if (!providedApiKey || providedApiKey !== bridge.apiKey) {
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
    const tools = bridge.endpoints.map((endpoint: any) => ({
        name: endpoint.name || `${endpoint.method.toLowerCase()}_${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
        description: endpoint.description || `Call ${endpoint.method} ${endpoint.path} on ${bridge.baseUrl}`,
        inputSchema: {
            type: 'object',
            properties: buildInputSchema(endpoint),
            required: endpoint.parameters?.filter((p: any) => p.required).map((p: any) => p.name) || []
        }
    }));

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

    try {
        // Execute the API call
        const result = await executeApiCall(bridge, endpoint, toolArgs || {});

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

function buildInputSchema(endpoint: any) {
    const properties: Record<string, any> = {};

    // Add path parameters
    if (endpoint.parameters) {
        endpoint.parameters.forEach((param: any) => {
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
            description: 'Request body data'
        };
    }

    return properties;
}

async function executeApiCall(bridge: any, endpoint: any, args: any) {
    // Build the full URL
    let url = endpoint.path;

    // Handle path parameters
    if (endpoint.parameters) {
        endpoint.parameters.forEach((param: any) => {
            if (args[param.name] !== undefined) {
                url = url.replace(`{${param.name}}`, encodeURIComponent(args[param.name]));
            }
        });
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

    // Add authentication - Updated to work with database structure
    if (bridge.authType && bridge.authType !== 'none') {
        switch (bridge.authType) {
            case 'bearer':
                if (bridge.authToken) {
                    headers['Authorization'] = `Bearer ${bridge.authToken}`;
                }
                break;
            case 'apikey':
                if (bridge.authApiKey && bridge.authHeaderName) {
                    headers[bridge.authHeaderName] = bridge.authApiKey;
                }
                break;
            case 'basic':
                if (bridge.authUsername && bridge.authPassword) {
                    const credentials = btoa(`${bridge.authUsername}:${bridge.authPassword}`);
                    headers['Authorization'] = `Basic ${credentials}`;
                }
                break;
        }
    }

    // Prepare request options
    const requestOptions: RequestInit = {
        method: endpoint.method,
        headers,
    };

    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && args.requestBody) {
        requestOptions.body = JSON.stringify(args.requestBody);
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
