import { randomBytes } from 'crypto';

export interface McpAccessToken {
    id: string;
    token: string;
    name: string;
    description?: string;
    permissions: TokenPermission[];
    expiresAt?: Date;
    createdAt: Date;
    lastUsedAt?: Date;
    isActive: boolean;
    metadata: {
        userAgent?: string;
        ipAddress?: string;
        createdBy?: string;
    };
}

export interface TokenPermission {
    type: 'tools' | 'resources' | 'prompts' | 'admin';
    actions: string[]; // ['read', 'write', 'execute'] or specific tool names
    constraints?: {
        rateLimit?: number;
        allowedEndpoints?: string[];
        timeWindows?: string[];
    };
}

export interface McpSecurityConfig {
    tokenAuth: {
        enabled: boolean;
        requireToken: boolean;
        allowMultipleTokens: boolean;
        defaultExpiry?: number; // days
        rotationPeriod?: number; // days
    };
    permissions: {
        defaultPermissions: TokenPermission[];
        requireExplicitGrants: boolean;
        allowSelfManagement: boolean;
    };
    audit: {
        enabled: boolean;
        logRequests: boolean;
        retentionDays: number;
    };
}

/**
 * Generates a cryptographically secure access token
 */
export function generateAccessToken(): string {
    // Generate 32 random bytes and encode as base64url
    const buffer = randomBytes(32);
    return buffer.toString('base64url');
}

/**
 * Creates a prefixed MCP token with metadata
 */
export function createMcpToken(prefix: string = 'mcp'): string {
    const token = generateAccessToken();
    const timestamp = Date.now().toString(36);
    return `${prefix}_${timestamp}_${token}`;
}

/**
 * Validates token format and structure
 */
export function validateTokenFormat(token: string): boolean {
    // Match pattern: prefix_timestamp_token
    const tokenPattern = /^[a-z]+_[0-9a-z]+_[A-Za-z0-9_-]+$/;
    return tokenPattern.test(token);
}

/**
 * Extracts metadata from token
 */
export function parseTokenMetadata(token: string): {
    prefix: string;
    timestamp: number;
    valid: boolean;
} | null {
    if (!validateTokenFormat(token)) {
        return null;
    }

    const parts = token.split('_');
    if (parts.length < 3) {
        return null;
    }

    const prefix = parts[0];
    const timestampStr = parts[1];

    try {
        const timestamp = parseInt(timestampStr, 36);
        return {
            prefix,
            timestamp,
            valid: true
        };
    } catch {
        return null;
    }
}

/**
 * Creates default security configuration
 */
export function createDefaultSecurityConfig(): McpSecurityConfig {
    return {
        tokenAuth: {
            enabled: true,
            requireToken: true,
            allowMultipleTokens: true,
            defaultExpiry: 90, // 90 days
            rotationPeriod: 30, // 30 days
        },
        permissions: {
            defaultPermissions: [
                {
                    type: 'tools',
                    actions: ['execute'],
                    constraints: {
                        rateLimit: 100, // requests per minute
                    }
                },
                {
                    type: 'resources',
                    actions: ['read'],
                },
                {
                    type: 'prompts',
                    actions: ['read', 'execute'],
                }
            ],
            requireExplicitGrants: false,
            allowSelfManagement: true,
        },
        audit: {
            enabled: true,
            logRequests: true,
            retentionDays: 30,
        }
    };
}

/**
 * Creates a new access token with permissions
 */
export function createAccessToken(
    name: string,
    description?: string,
    permissions?: TokenPermission[],
    expiresInDays?: number
): McpAccessToken {
    const now = new Date();
    const expiresAt = expiresInDays
        ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined;

    return {
        id: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        token: createMcpToken(),
        name,
        description,
        permissions: permissions || createDefaultSecurityConfig().permissions.defaultPermissions,
        expiresAt,
        createdAt: now,
        isActive: true,
        metadata: {}
    };
}

/**
 * Validates if token has required permissions
 */
export function hasPermission(
    token: McpAccessToken,
    requiredType: TokenPermission['type'],
    requiredAction: string,
    endpoint?: string
): boolean {
    if (!token.isActive) {
        return false;
    }

    if (token.expiresAt && token.expiresAt < new Date()) {
        return false;
    }

    const permission = token.permissions.find(p => p.type === requiredType);
    if (!permission) {
        return false;
    }

    // Check if action is allowed
    const hasAction = permission.actions.includes(requiredAction) ||
        permission.actions.includes('*');

    if (!hasAction) {
        return false;
    }

    // Check endpoint constraints
    if (endpoint && permission.constraints?.allowedEndpoints) {
        const isAllowed = permission.constraints.allowedEndpoints.some(pattern => {
            // Support wildcards
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                return regex.test(endpoint);
            }
            return pattern === endpoint;
        });

        if (!isAllowed) {
            return false;
        }
    }

    return true;
}

/**
 * Rate limiting check
 */
export function checkRateLimit(
    token: McpAccessToken,
    type: TokenPermission['type']
): { allowed: boolean; limit?: number; remaining?: number } {
    const permission = token.permissions.find(p => p.type === type);

    if (!permission?.constraints?.rateLimit) {
        return { allowed: true };
    }

    // This would be implemented with actual rate limiting store (Redis, memory, etc.)
    // For now, return allowed with limits
    return {
        allowed: true,
        limit: permission.constraints.rateLimit,
        remaining: permission.constraints.rateLimit
    };
}

/**
 * Security headers for MCP responses
 */
export function getMcpSecurityHeaders(token?: McpAccessToken) {
    const headers: Record<string, string> = {
        'X-MCP-Version': '2024-11-05',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
    };

    if (token) {
        headers['X-MCP-Token-ID'] = token.id;
        headers['X-MCP-Permissions'] = token.permissions.map(p => p.type).join(',');
    }

    return headers;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
    id: string;
    tokenId?: string;
    bridgeId: string;
    action: string;
    resource: string;
    timestamp: Date;
    success: boolean;
    error?: string;
    metadata: {
        userAgent?: string;
        ipAddress?: string;
        requestId?: string;
        duration?: number;
    };
}

/**
 * Creates audit log entry
 */
export function createAuditLogEntry(
    bridgeId: string,
    action: string,
    resource: string,
    success: boolean,
    tokenId?: string,
    error?: string,
    metadata?: Record<string, unknown>
): AuditLogEntry {
    return {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tokenId,
        bridgeId,
        action,
        resource,
        timestamp: new Date(),
        success,
        error,
        metadata: metadata || {}
    };
}
