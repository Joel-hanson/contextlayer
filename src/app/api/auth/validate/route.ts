import { McpAccessToken, checkRateLimit, createAuditLogEntry, getMcpSecurityHeaders, hasPermission } from '@/lib/security';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

interface AuthValidationRequest {
    token: string;
    bridgeId: string;
    action: string;
    resource: string;
    endpoint?: string;
}

interface AuthValidationResponse {
    valid: boolean;
    permissions?: string[];
    rateLimited?: boolean;
    remainingRequests?: number;
    error?: string;
}

/**
 * Validates MCP access tokens for bridge authentication
 * POST /api/auth/validate
 */
export async function POST(request: NextRequest): Promise<NextResponse<AuthValidationResponse>> {
    try {
        const { token, bridgeId, action, resource, endpoint }: AuthValidationRequest = await request.json();

        if (!token || !bridgeId || !action || !resource) {
            return NextResponse.json({
                valid: false,
                error: 'Missing required fields'
            }, { status: 400 });
        }

        // In a production environment, you would fetch this from a database
        // For now, we'll simulate token lookup from localStorage or database
        const tokens = await getTokensForBridge(bridgeId);
        const accessToken = tokens.find(t => t.token === token);

        if (!accessToken) {
            // Log failed authentication attempt
            const auditEntry = createAuditLogEntry(
                bridgeId,
                'auth_failed',
                resource,
                false,
                undefined,
                'Token not found'
            );
            await logAuditEntry(auditEntry as unknown as Record<string, unknown>);

            return NextResponse.json({
                valid: false,
                error: 'Invalid token'
            }, { status: 401 });
        }

        // Check token validity
        if (!accessToken.isActive) {
            return NextResponse.json({
                valid: false,
                error: 'Token is inactive'
            }, { status: 401 });
        }

        if (accessToken.expiresAt && accessToken.expiresAt < new Date()) {
            return NextResponse.json({
                valid: false,
                error: 'Token has expired'
            }, { status: 401 });
        }

        // Check permissions
        const permissionType = mapResourceToPermissionType(resource);
        const hasAccess = hasPermission(accessToken, permissionType, action, endpoint);

        if (!hasAccess) {
            const auditEntry = createAuditLogEntry(
                bridgeId,
                'permission_denied',
                resource,
                false,
                accessToken.id,
                'Insufficient permissions'
            );
            await logAuditEntry(auditEntry as unknown as Record<string, unknown>);

            return NextResponse.json({
                valid: false,
                error: 'Insufficient permissions'
            }, { status: 403 });
        }

        // Check rate limits
        const rateLimit = checkRateLimit(accessToken, permissionType);
        if (!rateLimit.allowed) {
            const auditEntry = createAuditLogEntry(
                bridgeId,
                'rate_limited',
                resource,
                false,
                accessToken.id,
                'Rate limit exceeded'
            );
            await logAuditEntry(auditEntry as unknown as Record<string, unknown>);

            return NextResponse.json({
                valid: false,
                rateLimited: true,
                error: 'Rate limit exceeded'
            }, { status: 429 });
        }

        // Update last used timestamp
        await updateTokenLastUsed(accessToken.id);

        // Log successful authentication
        const auditEntry = createAuditLogEntry(
            bridgeId,
            action,
            resource,
            true,
            accessToken.id
        );
        await logAuditEntry(auditEntry as unknown as Record<string, unknown>);

        // Return success with security headers
        const headers = getMcpSecurityHeaders(accessToken);

        return NextResponse.json({
            valid: true,
            permissions: accessToken.permissions.map(p => p.type),
            remainingRequests: rateLimit.remaining
        }, {
            status: 200,
            headers
        });

    } catch (error) {
        console.error('Token validation error:', error);
        return NextResponse.json({
            valid: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

/**
 * Maps MCP resource types to permission types
 */
function mapResourceToPermissionType(resource: string): 'tools' | 'resources' | 'prompts' | 'admin' {
    if (resource.startsWith('tool/')) return 'tools';
    if (resource.startsWith('resource/')) return 'resources';
    if (resource.startsWith('prompt/')) return 'prompts';
    return 'admin';
}

/**
 * Mock function to get tokens for a bridge
 * In production, this would query your database
 */
async function getTokensForBridge(_bridgeId: string): Promise<McpAccessToken[]> {
    // This is a placeholder - in reality you would query your database
    // For now, return empty array as tokens are stored in localStorage
    console.log('Fetching tokens for bridge:', _bridgeId);
    return [];
}

/**
 * Mock function to log audit entries
 * In production, this would save to your database
 */
async function logAuditEntry(entry: Record<string, unknown>): Promise<void> {
    // This is a placeholder - in reality you would save to your database
    console.log('Audit entry:', entry);
}

/**
 * Mock function to update token last used timestamp
 * In production, this would update your database
 */
async function updateTokenLastUsed(tokenId: string): Promise<void> {
    // This is a placeholder - in reality you would update your database
    console.log('Updated last used for token:', tokenId);
}

/**
 * Generate a new access token for a bridge
 * POST /api/auth/generate
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        const { bridgeId, name, description, permissions, expiresInDays } = await request.json();

        if (!bridgeId || !name) {
            return NextResponse.json({
                error: 'Bridge ID and token name are required'
            }, { status: 400 });
        }

        // In production, you would create and store the token in your database
        const newToken = {
            id: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            token: `mcp_${Date.now().toString(36)}_${randomBytes(32).toString('base64url')}`,
            name,
            description,
            permissions: permissions || [],
            expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : undefined,
            createdAt: new Date(),
            isActive: true,
            metadata: {}
        };

        // Store token in database (placeholder)
        await storeToken(bridgeId, newToken);

        return NextResponse.json({
            token: newToken,
            success: true
        });

    } catch (error) {
        console.error('Token generation error:', error);
        return NextResponse.json({
            error: 'Failed to generate token'
        }, { status: 500 });
    }
}

async function storeToken(bridgeId: string, token: McpAccessToken): Promise<void> {
    // Placeholder for database storage
    console.log('Storing token for bridge:', bridgeId, token);
}

// Import crypto at top level for Node.js compatibility
function randomBytes(size: number): Buffer {
    if (typeof window !== 'undefined') {
        // Browser environment - use Web Crypto API
        const array = new Uint8Array(size);
        crypto.getRandomValues(array);
        return Buffer.from(array);
    } else {
        return crypto.randomBytes(size);
    }
}
