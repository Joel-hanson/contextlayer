/* eslint-disable @typescript-eslint/no-explicit-any */
import { createMcpError, formatErrorMessage, logBridgeEvent } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { generateStandardToolName } from '@/lib/tool-name-generator';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Safely logs bridge events - avoids foreign key constraint errors
 * by checking if the bridge exists in the database first
 */
async function safeLogBridgeEvent(
    bridgeId: string,
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    metadata?: any
): Promise<void> {
    // Check if we've already verified this bridge exists
    if (!safeLogBridgeEvent.verifiedBridges) {
        safeLogBridgeEvent.verifiedBridges = new Set<string>();
    }

    try {
        // Only check database if we haven't verified this bridge before
        if (!safeLogBridgeEvent.verifiedBridges.has(bridgeId)) {
            const exists = await prisma.bridge.findUnique({
                where: { id: bridgeId },
                select: { id: true }
            }).then(bridge => !!bridge).catch(() => false);

            if (exists) {
                safeLogBridgeEvent.verifiedBridges.add(bridgeId);
            } else {
                // Bridge doesn't exist in database, just log to console
                console.log(`[${level.toUpperCase()}] ${bridgeId}: ${message}`, metadata);
                return;
            }
        }

        // Bridge exists in database, safe to log
        await logBridgeEvent(bridgeId, level, message, metadata);
    } catch (error) {
        // Fallback to console logging if anything goes wrong
        console.log(`[${level.toUpperCase()}] ${bridgeId}: ${message}`, metadata);
        console.error('Error in safeLogBridgeEvent:', error);
    }
}
// Add static property to function for verified bridges cache
safeLogBridgeEvent.verifiedBridges = new Set<string>();

// Type definitions
interface AuthConfig {
    type: 'none' | 'bearer' | 'apikey' | 'basic';
    token?: string;
    apiKey?: string;
    username?: string;
    password?: string;
    headerName?: string;
    keyLocation?: 'header' | 'query';
    paramName?: string;
}

interface EndpointConfig {
    parameters?: Array<{
        name: string;
        type: string;
        required: boolean;
        description?: string;
        defaultValue?: unknown;
        location?: 'path' | 'query' | 'body';
        style?: 'parameter' | 'replacement';
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
    timeout?: number;
}

interface Parameter {
    name: string;
    type: string;
    required: boolean;
    description?: string;
    defaultValue?: unknown;
}

interface Endpoint {
    id: string;
    name: string;
    method: string;
    path: string;
    description?: string;
    config: EndpointConfig | null;
    parameters?: Parameter[];
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
}

interface McpTool {
    name: string;         // Must be in format: method_path_normalized (e.g. get_users_list)
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
    endpointId?: string;  // Reference to the actual endpoint
}

interface Bridge {
    id: string;
    name: string;
    enabled: boolean;
    baseUrl: string;
    authConfig: AuthConfig;
    endpoints: Endpoint[];
    mcpTools?: McpTool[];
    mcpResources?: any[];
    mcpPrompts?: any[];
    headers?: Record<string, string>;
    accessConfig?: {
        authRequired?: boolean;
        apiKey?: string;
    } | null;
}

interface JsonRpcRequest {
    jsonrpc: string;
    method: string;
    params: Record<string, any>;
    id: string | number;
}

interface JsonRpcResponse {
    jsonrpc: string;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
    id: string | number | null;
}

// Error codes for MCP protocol
const MCP_ERROR_CODES = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    BRIDGE_NOT_FOUND: -32604,
    BRIDGE_DISABLED: -32605,
    AUTH_ERROR: -32606,
    TOOL_NOT_FOUND: -32607,
    API_CALL_FAILED: -32608
} as const;

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
        // Log the MCP request with safe logging
        await safeLogBridgeEvent(bridgeId, 'info', 'MCP request received', {
            method: request.method,
            url: request.url,
            timestamp: new Date().toISOString()
        });

        let bridge = null;

        // First try to find in database if bridgeId looks like a UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (uuidRegex.test(bridgeId)) {
            // Try database lookup for UUID with optimized field selection and enabled check
            const dbBridge = await prisma.bridge.findFirst({
                where: {
                    id: bridgeId,
                    enabled: true // Add this filter to avoid extra enabled check later
                },
                select: {
                    id: true,
                    name: true,
                    baseUrl: true,
                    authConfig: true,
                    headers: true,
                    accessConfig: true,
                    mcpTools: true,
                    mcpPrompts: true,
                    mcpResources: true,
                    endpoints: {
                        select: {
                            id: true,
                            name: true,
                            method: true,
                            path: true,
                            description: true,
                            config: true
                        }
                    }
                }
            });
            bridge = dbBridge ? convertDatabaseBridge(dbBridge) : null;

            // Log with our safe method
            await safeLogBridgeEvent(bridgeId, 'debug', 'Bridge lookup by UUID', {
                found: !!bridge,
                id: bridgeId
            });
        }

        // If not found in database, try slug-based lookup with optimized fields
        if (!bridge) {
            try {
                const dbBridge = await prisma.bridge.findFirst({
                    where: {
                        slug: bridgeId,
                        enabled: true // Add this filter to avoid extra enabled check later
                    },
                    select: {
                        id: true,
                        name: true,
                        baseUrl: true,
                        authConfig: true,
                        headers: true,
                        accessConfig: true,
                        mcpTools: true,
                        mcpPrompts: true,
                        mcpResources: true,
                        endpoints: {
                            select: {
                                id: true,
                                name: true,
                                method: true,
                                path: true,
                                description: true,
                                config: true
                            }
                        }
                    }
                });
                bridge = dbBridge ? convertDatabaseBridge(dbBridge) : null;
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
                        code: MCP_ERROR_CODES.INVALID_PARAMS,
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

        // Parse JSON-RPC request - moved here to have it available for error responses
        let jsonRpcRequest;
        try {
            jsonRpcRequest = await request.json();

            if (!jsonRpcRequest.jsonrpc || jsonRpcRequest.jsonrpc !== '2.0') {
                return NextResponse.json(
                    {
                        jsonrpc: '2.0',
                        error: {
                            code: MCP_ERROR_CODES.PARSE_ERROR,
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
        } catch {
            // JSON parsing failed
            return NextResponse.json(
                {
                    jsonrpc: '2.0',
                    error: {
                        code: MCP_ERROR_CODES.PARSE_ERROR,
                        message: 'Invalid JSON'
                    },
                    id: null
                },
                {
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

        console.log(accessConfig, 'Access config for bridge:', bridgeId);

        if (accessConfig?.authRequired) {
            // Extract token from request headers
            const authHeader = request.headers.get('authorization');
            let providedToken: string | null = null;

            if (authHeader) {
                if (authHeader.startsWith('Bearer ')) {
                    providedToken = authHeader.substring(7);
                } else if (authHeader.startsWith('ApiKey ')) {
                    providedToken = authHeader.substring(7);
                }
            }

            // Also check for token in X-API-Key header
            if (!providedToken) {
                providedToken = request.headers.get('x-api-key');
            }

            if (!providedToken) {
                return NextResponse.json(
                    {
                        jsonrpc: '2.0',
                        error: {
                            code: -32401,
                            message: 'Unauthorized: Missing access token',
                            data: {
                                help: 'Include your token in the Authorization header as "Bearer <token>" or in the X-API-Key header'
                            }
                        },
                        id: null
                    },
                    {
                        status: 401,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'WWW-Authenticate': 'Bearer realm="ContextLayer"'
                        }
                    }
                );
            }

            // First check the legacy apiKey for backward compatibility
            const isLegacyApiKey = accessConfig.apiKey && providedToken === accessConfig.apiKey;
            let isAuthenticated = isLegacyApiKey;

            try {
                // Look up token in database
                const accessToken = await prisma.accessToken.findFirst({
                    where: {
                        bridgeId: bridge.id,
                        token: providedToken,
                        isActive: true,
                        // Check if token hasn't expired (if it has an expiration date)
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: new Date() } }
                        ]
                    }
                });

                if (!accessToken) {
                    // Log failed authentication attempt
                    await safeLogBridgeEvent(bridge.id, 'warn', 'Authentication failed', {
                        tokenProvided: true,
                        reason: 'Invalid or expired token'
                    });

                    return NextResponse.json(
                        {
                            jsonrpc: '2.0',
                            error: {
                                code: -32401,
                                message: 'Unauthorized: Invalid or expired access token',
                                data: {
                                    help: 'Use a valid access token generated from the bridge dashboard'
                                }
                            },
                            id: jsonRpcRequest?.id || null
                        },
                        {
                            status: 401,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*',
                                'WWW-Authenticate': 'Bearer realm="ContextLayer"'
                            }
                        }
                    );
                }

                // Update lastUsedAt timestamp
                await prisma.accessToken.update({
                    where: { id: accessToken.id },
                    data: { lastUsedAt: new Date() }
                });

                // Log successful authentication
                await safeLogBridgeEvent(bridge.id, 'info', 'Authentication successful', {
                    tokenId: accessToken.id,
                    tokenName: accessToken.name
                });

                isAuthenticated = true;

            } catch (error) {
                console.error('Error verifying access token:', error);
                return NextResponse.json(
                    {
                        jsonrpc: '2.0',
                        error: {
                            code: MCP_ERROR_CODES.INTERNAL_ERROR,
                            message: 'Error verifying access token'
                        },
                        id: jsonRpcRequest?.id || null
                    },
                    {
                        status: 500,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    }
                );
            }

            // Double-check authentication status before proceeding
            if (!isAuthenticated) {
                // Log unauthorized access attempt
                await safeLogBridgeEvent(bridge.id, 'warn', 'Authentication failed', {
                    tokenProvided: true,
                    reason: 'Invalid token format or type'
                });

                return NextResponse.json(
                    {
                        jsonrpc: '2.0',
                        error: {
                            code: -32401,
                            message: 'Unauthorized: Invalid authentication',
                            data: {
                                help: 'Provide a valid access token via Bearer auth or X-API-Key header'
                            }
                        },
                        id: jsonRpcRequest?.id || null
                    },
                    {
                        status: 401,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'WWW-Authenticate': 'Bearer realm="ContextLayer"'
                        }
                    }
                );
            }
        }

        // Handle MCP protocol methods
        switch (jsonRpcRequest.method) {
            case 'initialize':
                return handleInitialize(jsonRpcRequest, bridge);

            case 'tools/list':
                return handleToolsList(jsonRpcRequest, bridge);

            case 'tools/call':
                return handleToolCall(jsonRpcRequest, bridge);

            case 'resources/list':
                await safeLogBridgeEvent(bridge.id, 'info', 'Listing resources', { bridgeId: bridge.id });
                return handleResourcesList(jsonRpcRequest, bridge);

            case 'resources/read':
                await safeLogBridgeEvent(bridge.id, 'info', 'Reading resource', { bridgeId: bridge.id, uri: jsonRpcRequest.params?.uri });
                return handleResourcesRead(jsonRpcRequest, bridge);

            case 'prompts/list':
                await safeLogBridgeEvent(bridge.id, 'info', 'Listing prompts', { bridgeId: bridge.id });
                return handlePromptsList(jsonRpcRequest, bridge);

            case 'prompts/get':
                await safeLogBridgeEvent(bridge.id, 'info', 'Getting prompt', { bridgeId: bridge.id, name: jsonRpcRequest.params?.name });
                return handlePromptsGet(jsonRpcRequest, bridge);

            default:
                return NextResponse.json(
                    {
                        jsonrpc: '2.0',
                        error: {
                            code: MCP_ERROR_CODES.METHOD_NOT_FOUND,
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
        const errorMessage = formatErrorMessage(error);
        await safeLogBridgeEvent(bridgeId, 'error', 'MCP request failed', {
            error: errorMessage,
            request: {
                method: request.method,
                url: request.url
            }
        });

        return NextResponse.json(
            createMcpError(
                MCP_ERROR_CODES.INTERNAL_ERROR,
                'Internal server error',
                {
                    details: errorMessage,
                    bridgeId,
                    timestamp: new Date().toISOString()
                }
            ),
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

async function handleInitialize(jsonRpcRequest: JsonRpcRequest, bridge: Bridge): Promise<NextResponse<JsonRpcResponse>> {
    // Check what capabilities this bridge supports based on available MCP content
    const capabilities: any = {
        tools: {},
    };

    // Add resources capability if bridge has resources
    console.log('Checking resources capability for bridge:', bridge);
    if (bridge.mcpResources && Array.isArray(bridge.mcpResources) && bridge.mcpResources.length > 0) {
        capabilities.resources = {};
    }

    // Add prompts capability if bridge has prompts
    if (bridge.mcpPrompts && Array.isArray(bridge.mcpPrompts) && bridge.mcpPrompts.length > 0) {
        capabilities.prompts = {};
    }

    return NextResponse.json(
        {
            jsonrpc: '2.0',
            result: {
                protocolVersion: '2024-11-05',
                capabilities,
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

async function handleToolsList(jsonRpcRequest: JsonRpcRequest, bridge: Bridge) {
    console.log('Listing tools for bridge:', bridge.name);
    const tools: McpTool[] = [];

    // First, add tools from MCP JSON field if available
    if (bridge.mcpTools && Array.isArray(bridge.mcpTools)) {
        tools.push(...bridge.mcpTools);
    }

    // Then, add tools generated from endpoints (if no MCP tools exist)
    if (tools.length === 0 && bridge.endpoints && bridge.endpoints.length > 0) {
        bridge.endpoints.forEach((endpoint: Endpoint) => {
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
                timeout?: number;
            } | null;

            // Create endpoint object with parsed config
            const endpointWithConfig = {
                ...endpoint,
                parameters: endpointConfig?.parameters || [],
                requestBody: endpointConfig?.requestBody,
                responseSchema: endpointConfig?.responseSchema,
                timeout: endpointConfig?.timeout,
            };

            const inputSchema = buildInputSchema(endpointWithConfig);
            tools.push({
                name: generateToolName(endpoint),
                description: buildToolDescription(endpointWithConfig),
                inputSchema: {
                    type: 'object',
                    properties: inputSchema.properties,
                    required: inputSchema.required
                },
                endpointId: endpoint.id
            });
        });
    }

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

    if (!toolName) {
        return NextResponse.json(
            {
                jsonrpc: '2.0',
                error: {
                    code: MCP_ERROR_CODES.INVALID_PARAMS,
                    message: 'Tool name is required'
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

    // First check if this is an MCP tool
    const mcpTools = bridge.mcpTools || [];
    const mcpTool = mcpTools.find((tool: McpTool) => tool.name === toolName);

    if (mcpTool) {
        // If the tool has a direct endpoint reference, use it
        let endpoint;
        if (mcpTool.endpointId) {
            endpoint = bridge.endpoints.find((ep: Endpoint) => ep.id === mcpTool.endpointId);
        } else {
            // Try to find endpoint by matching tool name with generated name or endpoint name

            endpoint = bridge.endpoints.find((ep: Endpoint) =>
                generateToolName(ep) === mcpTool.name ||
                ep.name === mcpTool.name
            );
        }

        if (endpoint) {
            // Parse endpoint config and execute
            const endpointConfig = endpoint.config || {};
            const endpointWithConfig = {
                ...endpoint,
                parameters: endpointConfig.parameters || [],
                requestBody: endpointConfig.requestBody,
                responseSchema: endpointConfig.responseSchema,
                timeout: endpointConfig.timeout,
            };

            try {
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
                console.error(error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return NextResponse.json(
                    {
                        jsonrpc: '2.0',
                        error: {
                            code: MCP_ERROR_CODES.INTERNAL_ERROR,
                            message: `API call failed: ${errorMessage}`
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
    }

    // Fallback to endpoint-based tool lookup
    const endpoint = bridge.endpoints?.find((ep: any) => {
        // Try matching by generated tool name first
        const generatedToolName = generateToolName(ep);
        if (generatedToolName === toolName) {
            return true;
        }

        // Fallback to normalized name matching
        const normalizedEndpointName = (ep.name || `${ep.method.toLowerCase()}_${ep.path}`).toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const normalizedToolName = toolName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        return normalizedEndpointName === normalizedToolName;
    });

    if (!endpoint) {
        return NextResponse.json(
            {
                jsonrpc: '2.0',
                error: {
                    code: MCP_ERROR_CODES.INVALID_PARAMS,
                    message: `Tool '${toolName}' not found in bridge '${bridge.name}'`
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

    if (!endpoint.method || !endpoint.path) {
        return NextResponse.json(
            {
                jsonrpc: '2.0',
                error: {
                    code: MCP_ERROR_CODES.INVALID_PARAMS,
                    message: `Invalid endpoint configuration for tool '${toolName}'`
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            {
                jsonrpc: '2.0',
                error: {
                    code: MCP_ERROR_CODES.INTERNAL_ERROR,
                    message: `API call failed: ${errorMessage}`
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

async function executeApiCall(bridge: Bridge, endpoint: Endpoint, args: Record<string, any>) {
    const startTime = Date.now();

    if (!endpoint || !endpoint.path) {
        await logBridgeEvent(bridge.id, 'error', 'Invalid endpoint configuration', {
            endpoint: endpoint?.name,
            args
        });
        throw new Error('Invalid endpoint configuration');
    }

    let url = endpoint.path;
    const queryParams = new URLSearchParams();

    // Handle path and query parameters
    if (endpoint.parameters && Array.isArray(endpoint.parameters)) {
        endpoint.parameters.forEach((param: any) => {
            const value = args[param.name];
            if (value !== undefined) {
                // Check parameter location and style
                if (param.location === 'path') {
                    // Path parameters with different styles
                    if (param.style === 'replacement') {
                        // Direct replacement style: {param}
                        url = url.replace(`{${param.name}}`, encodeURIComponent(String(value)));
                    } else {
                        // Parameter style: /:param
                        url = url.replace(`:${param.name}`, encodeURIComponent(String(value)));
                    }
                } else if (param.location === 'query') {
                    // Query parameters
                    queryParams.append(param.name, String(value));
                } else if (param.location === 'body') {
                    // Body parameters are handled separately in buildRequestBody
                }
            } else if (param.required) {
                throw new Error(`Required parameter '${param.name}' is missing`);
            }
        });
    }

    // Prepare headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Add authentication with support for header and query parameters
    if (bridge.authConfig) {
        const authConfig = bridge.authConfig as AuthConfig & { keyLocation?: 'header' | 'query'; paramName?: string };

        if (authConfig.type && authConfig.type !== 'none') {
            try {
                switch (authConfig.type) {
                    case 'bearer':
                        if (!authConfig.token) {
                            throw new Error('Bearer token is required but not provided');
                        }
                        headers['Authorization'] = `Bearer ${authConfig.token.trim()}`;
                        break;
                    case 'apikey':
                        console.log(`Using API key authentication for bridge`, authConfig);

                        if (!authConfig.apiKey) {
                            throw new Error('API key is required but not provided');
                        }
                        if (authConfig.keyLocation === 'query') {
                            // Add API key as query parameter
                            const paramName = authConfig.paramName || authConfig.headerName || 'api_key';
                            queryParams.append(paramName, authConfig.apiKey.trim());
                        } else {
                            // Default to header if not specified or if keyLocation is 'header'
                            const headerName = authConfig.headerName || 'X-API-Key';
                            headers[headerName] = authConfig.apiKey.trim();
                        }
                        break;
                    case 'basic':
                        if (!authConfig.username || !authConfig.password) {
                            throw new Error('Username and password are required for basic auth');
                        }
                        const credentials = btoa(`${authConfig.username.trim()}:${authConfig.password.trim()}`);
                        headers['Authorization'] = `Basic ${credentials}`;
                        break;
                }
            } catch (error) {
                throw createMcpError(MCP_ERROR_CODES.AUTH_ERROR, 'Authentication configuration error', error);
            }
        }
    }

    // Add query parameters to URL
    const queryString = queryParams.toString();
    if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
    }

    // Ensure the baseUrl has a trailing slash for proper URL resolution
    const normalizedBaseUrl = bridge.baseUrl.endsWith('/') ? bridge.baseUrl : bridge.baseUrl + '/';
    // Remove leading slash from url to avoid double slashes
    const normalizedPath = url.startsWith('/') ? url.substring(1) : url;
    const fullUrl = new URL(normalizedPath, normalizedBaseUrl).toString();

    console.log(`Executing API call: ${endpoint.method} ${fullUrl}`);

    // Add custom headers from bridge configuration
    if (bridge.headers && typeof bridge.headers === 'object') {
        Object.entries(bridge.headers).forEach(([key, value]) => {
            if (typeof value === 'string') {
                headers[key] = value;
            }
        });
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

    try {
        // Make the API call
        const response = await fetch(fullUrl, requestOptions);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Log the API call
        // Log API call completion with performance metrics
        await logBridgeEvent(bridge.id, 'info', 'API call completed', {
            endpoint: endpoint.name || endpoint.path,
            method: endpoint.method,
            fullUrl: fullUrl, // Add the full URL to the log
            responseTime,
            statusCode: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString(),
            performance: {
                totalTime: responseTime,
                threshold: 5000 // 5 second threshold for slow requests
            }
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => 'Could not read error response');
            // Log API call failure with detailed error information
            await logBridgeEvent(bridge.id, 'error', 'API call failed', {
                endpoint: endpoint.name || endpoint.path,
                statusCode: response.status,
                statusText: response.statusText,
                errorBody,
                responseTime,
                timestamp: new Date().toISOString(),
                error: {
                    type: 'HttpError',
                    details: errorBody
                }
            });
            throw new Error(`API request failed: ${response.status} ${response.statusText}\nResponse: ${errorBody}`);
        }

        const contentType = response.headers.get('content-type');
        let responseData;

        try {
            if (contentType?.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            // Log successful response
            // Log API response with detailed metrics
            await logBridgeEvent(bridge.id, 'debug', 'API response received', {
                endpoint: endpoint.name || endpoint.path,
                contentType,
                responseTime,
                responseSize: JSON.stringify(responseData).length,
                timestamp: new Date().toISOString(),
                metrics: {
                    size: JSON.stringify(responseData).length,
                    time: responseTime,
                    type: contentType
                }
            });

            return responseData;
        } catch (parseError) {
            await logBridgeEvent(bridge.id, 'error', 'Failed to parse API response', {
                endpoint: endpoint.name || endpoint.path,
                error: formatErrorMessage(parseError),
                contentType
            });
            throw new Error(`Failed to parse API response: ${formatErrorMessage(parseError)}`);
        }
    } catch (error) {
        await logBridgeEvent(bridge.id, 'error', 'API call error', {
            endpoint: endpoint.name || endpoint.path,
            error: formatErrorMessage(error),
            url: fullUrl,
            method: endpoint.method
        });
        throw error;
    }
}

function buildRequestBody(endpoint: any, args: any): any {
    const body: Record<string, any> = {};

    // First, collect any parameters marked as body location
    if (endpoint.parameters && Array.isArray(endpoint.parameters)) {
        endpoint.parameters.forEach((param: any) => {
            if (param.location === 'body' && args[param.name] !== undefined) {
                body[param.name] = args[param.name];
            }
        });
    }

    // Then handle any defined request body schema
    if (endpoint.requestBody) {
        if (endpoint.requestBody.properties) {
            Object.keys(endpoint.requestBody.properties).forEach(propName => {
                if (args[propName] !== undefined) {
                    body[propName] = args[propName];
                }
            });
        } else if (args.requestBody) {
            // If no properties defined but requestBody provided, use it directly
            return args.requestBody;
        }
    }

    return Object.keys(body).length > 0 ? body : null;
}

async function handleResourcesList(jsonRpcRequest: any, bridge: any) {
    // Load resources only when listing them
    const dbBridge = await prisma.bridge.findUnique({
        where: { id: bridge.id },
        select: { mcpResources: true }
    });
    const resources = dbBridge?.mcpResources || [];

    return NextResponse.json(
        {
            jsonrpc: '2.0',
            result: {
                resources
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

async function handleResourcesRead(jsonRpcRequest: any, bridge: any) {
    const { uri } = jsonRpcRequest.params;
    const resources = bridge.mcpResources || [];

    // Find the resource by URI
    const resource = resources.find((r: any) => r.uri === uri);

    if (!resource) {
        return NextResponse.json(
            {
                jsonrpc: '2.0',
                error: {
                    code: MCP_ERROR_CODES.INVALID_PARAMS,
                    message: `Resource with URI '${uri}' not found`
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

    // Generate appropriate content based on resource URI
    let content = '';
    let mimeType = resource.mimeType || 'text/plain';

    if (uri === 'openapi://spec/full') {
        // Return the OpenAPI spec (if we have it stored)
        content = JSON.stringify({
            openapi: '3.0.0',
            info: {
                title: bridge.name,
                description: bridge.description || '',
                version: '1.0.0'
            },
            servers: [{ url: bridge.baseUrl }],
            paths: generatePathsFromEndpoints(bridge.endpoints)
        }, null, 2);
        mimeType = 'application/json';
    } else if (uri === 'openapi://endpoints/summary') {
        content = generateEndpointsSummary(bridge.endpoints);
        mimeType = 'text/markdown';
    } else if (uri.startsWith('openapi://schema/')) {
        const schemaName = uri.replace('openapi://schema/', '');
        content = `# ${schemaName} Schema\n\nSchema information would be available here.`;
        mimeType = 'text/markdown';
    } else {
        content = resource.description || 'Resource content not available';
    }

    return NextResponse.json(
        {
            jsonrpc: '2.0',
            result: {
                contents: [
                    {
                        uri,
                        mimeType,
                        text: content
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
}

async function handlePromptsList(jsonRpcRequest: any, bridge: any) {
    // Load prompts only when listing them
    const dbBridge = await prisma.bridge.findUnique({
        where: { id: bridge.id },
        select: { mcpPrompts: true }
    });
    const prompts = dbBridge?.mcpPrompts || [];

    return NextResponse.json(
        {
            jsonrpc: '2.0',
            result: {
                prompts
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

async function handlePromptsGet(jsonRpcRequest: any, bridge: any) {
    const { name, arguments: promptArgs } = jsonRpcRequest.params;
    const prompts = bridge.mcpPrompts || [];

    // Find the prompt by name
    const prompt = prompts.find((p: any) => p.name === name);

    if (!prompt) {
        return NextResponse.json(
            {
                jsonrpc: '2.0',
                error: {
                    code: MCP_ERROR_CODES.INVALID_PARAMS,
                    message: `Prompt '${name}' not found`
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

    // Generate prompt content based on the prompt and provided arguments
    let promptText = prompt.description || `Execute ${name} workflow`;

    if (promptArgs) {
        // Add argument information to the prompt
        Object.entries(promptArgs).forEach(([key, value]) => {
            promptText += `\n - ${key}: ${value} `;
        });
    }

    return NextResponse.json(
        {
            jsonrpc: '2.0',
            result: {
                description: prompt.description,
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: promptText
                        }
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
}

function generatePathsFromEndpoints(endpoints: any[]): any {
    const paths: any = {};

    endpoints.forEach(endpoint => {
        if (!paths[endpoint.path]) {
            paths[endpoint.path] = {};
        }

        paths[endpoint.path][endpoint.method.toLowerCase()] = {
            summary: endpoint.description || `${endpoint.method} ${endpoint.path} `,
            operationId: endpoint.name,
            responses: {
                '200': {
                    description: 'Successful response'
                }
            }
        };
    });

    return paths;
}

function generateEndpointsSummary(endpoints: any[]): string {
    let summary = `# API Endpoints Summary\n\n`;

    endpoints.forEach(endpoint => {
        summary += `## ${endpoint.method} ${endpoint.path} \n`;
        summary += `** Name:** ${endpoint.name} \n`;
        if (endpoint.description) {
            summary += `** Description:** ${endpoint.description} \n`;
        }
        summary += '\n';
    });

    return summary;
}

function buildToolDescription(endpoint: any): string {
    let description = endpoint.description || `${endpoint.method} ${endpoint.path} `;

    // Add parameter information for better context
    if (endpoint.parameters && endpoint.parameters.length > 0) {
        const requiredParams = endpoint.parameters.filter((p: any) => p.required);
        const optionalParams = endpoint.parameters.filter((p: any) => !p.required);

        if (requiredParams.length > 0) {
            description += `\n\nRequired parameters: ${requiredParams.map((p: any) => `${p.name} (${p.type})`).join(', ')} `;
        }

        if (optionalParams.length > 0) {
            description += `\n\nOptional parameters: ${optionalParams.map((p: any) => `${p.name} (${p.type})`).join(', ')} `;
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
                description += `\n\nRequired body fields: ${requiredFields.join(', ')} `;
            }

            if (optionalFields.length > 0) {
                description += `\n\nOptional body fields: ${optionalFields.join(', ')} `;
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

    // Process all parameters regardless of location (path, query, body)
    if (endpoint.parameters) {
        endpoint.parameters.forEach((param: any) => {
            // Only add non-body parameters here, body parameters will be handled separately
            if (param.location !== 'body') {
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
            }
        });
    }

    // Add request body parameters for POST/PUT/PATCH operations
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        // First, handle body parameters from the parameters array
        if (endpoint.parameters) {
            endpoint.parameters
                .filter((param: any) => param.location === 'body')
                .forEach((param: any) => {
                    properties[param.name] = {
                        type: mapTypeToJsonSchema(param.type),
                        description: param.description || `${param.name} (body parameter)`,
                    };
                    if (param.required) {
                        required.push(param.name);
                    }
                });
        }

        // Then handle request body schema if it exists
        if (endpoint.requestBody) {
            if (endpoint.requestBody.properties) {
                // Add each property from request body schema
                Object.entries(endpoint.requestBody.properties).forEach(([propName, propSchema]: [string, any]) => {
                    // Skip if this property was already added as a body parameter
                    if (properties[propName]) return;

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
            } else if (!Object.keys(properties).some(key =>
                endpoint.parameters?.find((p: any) => p.location === 'body' && p.name === key))) {
                // Only add generic requestBody if no specific body parameters were found
                properties.requestBody = {
                    type: 'object',
                    description: 'Request body data',
                };
                if (endpoint.requestBody.required) {
                    required.push('requestBody');
                }
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

// Convert database bridge to our Bridge interface
function convertDatabaseBridge(dbBridge: any): Bridge {
    // We know the bridge is enabled since we filtered in the query
    return {
        id: dbBridge.id,
        name: dbBridge.name,
        enabled: true,
        baseUrl: dbBridge.baseUrl,
        authConfig: dbBridge.authConfig as AuthConfig,
        endpoints: dbBridge.endpoints.map((endpoint: any) => ({
            id: endpoint.id,
            name: endpoint.name,
            method: endpoint.method,
            path: endpoint.path,
            description: endpoint.description,
            config: endpoint.config,
            parameters: endpoint.config?.parameters || [],
            requestBody: endpoint.config?.requestBody,
            responseSchema: endpoint.config?.responseSchema
        })),
        mcpTools: dbBridge.mcpTools || [],
        mcpResources: dbBridge.mcpResources || [],  // Use the actual data from database
        mcpPrompts: dbBridge.mcpPrompts || [],      // Use the actual data from database
        headers: dbBridge.headers as Record<string, string>,
        accessConfig: dbBridge.accessConfig
    };
}

/**
 * Generates a standardized tool name from an endpoint
 * Format: method_resource_action
 * Examples: 
 * - GET /users -> get_users_list
 * - GET /users/{id} -> get_users_read
 * - POST /users -> post_users_create
 * - PUT /users/{id} -> put_users_update
 * - DELETE /users/{id} -> delete_users_delete
 */
function generateToolName(endpoint: Endpoint): string {
    return generateStandardToolName(endpoint.method, endpoint.path);
}