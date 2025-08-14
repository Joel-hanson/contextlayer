import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';

// In-memory store for rate limiting (in production, use Redis)
const requestStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
    requestsPerMinute: number;
    maxBridges: number;
    maxEndpointsPerBridge: number;
    maxMcpTools: number;
    maxMcpResources: number;
    maxMcpPrompts: number;
    allowedMethods: string[];
}

// Demo user restrictions
export const DEMO_USER_LIMITS: RateLimitConfig = {
    requestsPerMinute: 30,
    maxBridges: 2,
    maxEndpointsPerBridge: 5,
    maxMcpTools: 3,
    maxMcpResources: 2,
    maxMcpPrompts: 2,
    allowedMethods: ['GET', 'POST'] // No DELETE, PUT, PATCH for demo
};

// Regular user limits (more generous)
export const REGULAR_USER_LIMITS: RateLimitConfig = {
    requestsPerMinute: 100,
    maxBridges: 10,
    maxEndpointsPerBridge: 20,
    maxMcpTools: 15,
    maxMcpResources: 10,
    maxMcpPrompts: 10,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
};

export async function checkRateLimit(
    identifier: string,
    limits: RateLimitConfig
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const key = `rate_limit:${identifier}`;

    const existing = requestStore.get(key);

    if (!existing || now > existing.resetTime) {
        // Reset window
        const resetTime = now + windowMs;
        requestStore.set(key, { count: 1, resetTime });
        return {
            success: true,
            remaining: limits.requestsPerMinute - 1,
            resetTime
        };
    }

    if (existing.count >= limits.requestsPerMinute) {
        return {
            success: false,
            remaining: 0,
            resetTime: existing.resetTime
        };
    }

    existing.count++;
    requestStore.set(key, existing);

    return {
        success: true,
        remaining: limits.requestsPerMinute - existing.count,
        resetTime: existing.resetTime
    };
}

export async function getUserLimits(userId: string): Promise<RateLimitConfig> {
    // Check if this is the demo user
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
    });

    if (user?.email === 'demo@contextlayer.app') {
        return DEMO_USER_LIMITS;
    }

    return REGULAR_USER_LIMITS;
}

export async function checkUserLimits(
    userId: string,
    action: 'bridge' | 'endpoint' | 'mcp_tool' | 'mcp_resource' | 'mcp_prompt',
    bridgeId?: string
): Promise<{ allowed: boolean; message?: string }> {
    const limits = await getUserLimits(userId);

    switch (action) {
        case 'bridge':
            const bridgeCount = await prisma.bridge.count({
                where: { userId }
            });

            if (bridgeCount >= limits.maxBridges) {
                return {
                    allowed: false,
                    message: `Bridge limit reached. Demo users can create up to ${limits.maxBridges} bridges.`
                };
            }
            break;

        case 'endpoint':
            if (!bridgeId) return { allowed: true };

            const endpointCount = await prisma.apiEndpoint.count({
                where: {
                    bridgeId,
                    bridge: { userId }
                }
            });

            if (endpointCount >= limits.maxEndpointsPerBridge) {
                return {
                    allowed: false,
                    message: `Endpoint limit reached. Demo users can create up to ${limits.maxEndpointsPerBridge} endpoints per bridge.`
                };
            }
            break;

        case 'mcp_tool':
        case 'mcp_resource':
        case 'mcp_prompt':
            // These would be checked when updating bridge MCP content
            // Implementation depends on how MCP content is structured
            break;
    }

    return { allowed: true };
}

export async function rateLimitMiddleware() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return { success: true, headers: {} }; // Allow unauthenticated requests
    }

    const limits = await getUserLimits(session.user.id);
    const result = await checkRateLimit(session.user.id, limits);

    const headers = {
        'X-RateLimit-Limit': limits.requestsPerMinute.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    };

    return { success: result.success, headers };
}

// Cleanup function to remove expired entries (call periodically)
export function cleanupRateLimitStore() {
    const now = Date.now();
    for (const [key, value] of requestStore.entries()) {
        if (now > value.resetTime) {
            requestStore.delete(key);
        }
    }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
