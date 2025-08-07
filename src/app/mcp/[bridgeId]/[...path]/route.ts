import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Handle all HTTP methods for MCP bridge endpoints with dynamic paths
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ bridgeId: string; path: string[] }> }
) {
    const { bridgeId, path } = await params;
    return handleMcpRequest(request, bridgeId, 'GET', path);
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ bridgeId: string; path: string[] }> }
) {
    const { bridgeId, path } = await params;
    return handleMcpRequest(request, bridgeId, 'POST', path);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ bridgeId: string; path: string[] }> }
) {
    const { bridgeId, path } = await params;
    return handleMcpRequest(request, bridgeId, 'PUT', path);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ bridgeId: string; path: string[] }> }
) {
    const { bridgeId, path } = await params;
    return handleMcpRequest(request, bridgeId, 'DELETE', path);
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ bridgeId: string; path: string[] }> }
) {
    const { bridgeId, path } = await params;
    return handleMcpRequest(request, bridgeId, 'PATCH', path);
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
        },
    });
}

async function handleMcpRequest(
    request: NextRequest,
    bridgeId: string,
    method: string,
    pathSegments?: string[]
) {
    try {
        // Find the bridge by ID or slug
        const bridge = await prisma.bridge.findFirst({
            where: {
                OR: [
                    { id: bridgeId },
                    { slug: bridgeId }
                ]
            },
            include: {
                endpoints: true
            }
        });

        if (!bridge) {
            return NextResponse.json(
                { error: 'Bridge not found' },
                { status: 404 }
            );
        }

        if (!bridge.enabled) {
            return NextResponse.json(
                { error: 'Bridge is disabled' },
                { status: 403 }
            );
        }

        // Check bridge access control authentication
        if (bridge.authRequired) {
            if (!bridge.apiKey) {
                return NextResponse.json(
                    { error: 'Bridge access control is enabled but no API key is configured' },
                    { status: 500 }
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
                        error: 'Unauthorized: Invalid or missing API key',
                        help: 'Include your API key in the Authorization header as "Bearer <api-key>" or in the X-API-Key header'
                    },
                    {
                        status: 401,
                        headers: {
                            'WWW-Authenticate': 'Bearer realm="MCP Bridge"'
                        }
                    }
                );
            }
        }

        // Construct the full API path
        const apiPath = pathSegments && pathSegments.length > 0
            ? `/${pathSegments.join('/')}`
            : '/';

        // Find matching endpoint
        const endpoint = bridge.endpoints.find(ep =>
            ep.method === method &&
            (ep.path === apiPath || matchPathPattern(ep.path, apiPath))
        );

        if (!endpoint) {
            return NextResponse.json(
                {
                    error: `No endpoint found for ${method} ${apiPath}`,
                    availableEndpoints: bridge.endpoints.map(ep => `${ep.method} ${ep.path}`)
                },
                { status: 404 }
            );
        }

        // Replace path parameters in the endpoint path with actual values
        let resolvedPath = endpoint.path;
        if (pathSegments && pathSegments.length > 0) {
            resolvedPath = resolvePathParameters(endpoint.path, `/${pathSegments.join('/')}`);
        }

        // Build the full API URL
        const apiUrl = new URL(resolvedPath, bridge.baseUrl);

        // Copy query parameters from the original request
        const url = new URL(request.url);
        url.searchParams.forEach((value, key) => {
            apiUrl.searchParams.set(key, value);
        });

        // Prepare headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Add authentication headers if configured
        if (bridge.authType === 'bearer' && bridge.authToken) {
            headers['Authorization'] = `Bearer ${bridge.authToken}`;
        } else if (bridge.authType === 'apikey' && bridge.authToken) {
            headers['X-API-Key'] = bridge.authToken;
        } else if (bridge.authType === 'basic' && bridge.authUsername && bridge.authPassword) {
            const credentials = Buffer.from(`${bridge.authUsername}:${bridge.authPassword}`).toString('base64');
            headers['Authorization'] = `Basic ${credentials}`;
        }

        // Add custom headers from bridge configuration
        if (bridge.headers) {
            const customHeaders = typeof bridge.headers === 'string'
                ? JSON.parse(bridge.headers)
                : bridge.headers;
            Object.assign(headers, customHeaders);
        }

        // Prepare request body for POST/PUT/PATCH requests
        let body: string | undefined;
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            body = await request.text();
        }

        // Make the API request
        const startTime = Date.now();
        const apiResponse = await fetch(apiUrl.toString(), {
            method,
            headers,
            body,
        });

        const responseTime = Date.now() - startTime;

        // Get response data
        const responseData = await apiResponse.text();
        let responseJson;
        try {
            responseJson = JSON.parse(responseData);
        } catch {
            responseJson = responseData;
        }

        // Log the request for analytics
        await prisma.apiRequest.create({
            data: {
                bridgeId: bridge.id,
                endpointId: endpoint.id,
                method,
                path: apiPath,
                statusCode: apiResponse.status,
                responseTime: responseTime,
                success: apiResponse.ok,
                headers: JSON.stringify(Object.fromEntries(request.headers.entries())),
                body: body ? (isValidJson(body) ? JSON.parse(body) : body) : null,
                response: responseJson,
                errorMessage: !apiResponse.ok ? `API returned ${apiResponse.status}` : null,
            },
        }).catch((error) => {
            console.error('Failed to log API request:', error);
        });

        // Return the response
        return new NextResponse(JSON.stringify(responseJson), {
            status: apiResponse.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });

    } catch (error) {
        console.error('MCP Bridge Error:', error);

        // Log the error
        await prisma.bridgeLog.create({
            data: {
                bridgeId: bridgeId,
                level: 'error',
                message: `MCP Bridge request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                metadata: {
                    error: error instanceof Error ? error.stack : String(error),
                    method,
                    path: pathSegments ? `/${pathSegments.join('/')}` : '/',
                },
            },
        }).catch(() => {
            // Ignore logging errors
        });

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Helper function to match path patterns with parameters
function matchPathPattern(pattern: string, path: string): boolean {
    // Convert pattern like '/posts/{id}' to regex
    const regexPattern = pattern.replace(/\{[^}]+\}/g, '[^/]+');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
}

// Helper function to resolve path parameters
function resolvePathParameters(pattern: string, actualPath: string): string {
    const patternSegments = pattern.split('/').filter(Boolean);
    const pathSegments = actualPath.split('/').filter(Boolean);

    if (patternSegments.length !== pathSegments.length) {
        return pattern; // Return original if segments don't match
    }

    let resolvedPath = pattern;
    for (let i = 0; i < patternSegments.length; i++) {
        const patternSegment = patternSegments[i];
        const pathSegment = pathSegments[i];

        if (patternSegment.startsWith('{') && patternSegment.endsWith('}')) {
            resolvedPath = resolvedPath.replace(patternSegment, pathSegment);
        }
    }

    return resolvedPath;
}

// Helper function to check if a string is valid JSON
function isValidJson(str: string): boolean {
    try {
        JSON.parse(str);
        return true;
    } catch {
        return false;
    }
}
