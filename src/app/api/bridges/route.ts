import { addSecurityHeaders, requireAuth } from '@/lib/api-security'
import { BridgeService } from '@/lib/bridge-service'
import { AppError, withErrorHandler } from '@/lib/error-handler'
import { apiRateLimit } from '@/lib/rate-limit'
import { checkUserLimits } from '@/lib/rate-limiter'
import { BridgeConfigSchema } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/bridges - Get all bridges
export const GET = withErrorHandler(async (request: NextRequest) => {
    // Apply rate limiting
    const rateLimitResult = apiRateLimit.check(request);
    if (!rateLimitResult.allowed) {
        throw new AppError('RATE_LIMIT_EXCEEDED', 'Too many requests', 429, {
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime
        });
    }

    // Require authentication
    const session = await requireAuth();
    const bridges = await BridgeService.getAllBridges(session.user.id);

    const response = NextResponse.json(bridges);
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());

    return addSecurityHeaders(response);
});

// POST /api/bridges - Create a new bridge
export const POST = withErrorHandler(async (request: NextRequest) => {
    // Apply rate limiting
    const rateLimitResult = apiRateLimit.check(request);
    if (!rateLimitResult.allowed) {
        throw new AppError('RATE_LIMIT_EXCEEDED', 'Too many requests', 429, {
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime
        });
    }

    // Require authentication
    const session = await requireAuth();
    const userId = session.user.id;

    // Check if user can create more bridges
    const userLimitCheck = await checkUserLimits(userId, 'bridge');
    if (!userLimitCheck.allowed) {
        throw new AppError('BRIDGE_LIMIT_EXCEEDED', userLimitCheck.message || 'Bridge limit exceeded', 403);
    }

    const body = await request.json();

    // Validate the bridge configuration using Zod schema
    const validatedConfig = BridgeConfigSchema.parse(body);

    // Generate unique ID if not provided
    if (!validatedConfig.id) {
        validatedConfig.id = crypto.randomUUID();
    }

    // Set timestamps
    const now = new Date().toISOString();
    if (!validatedConfig.createdAt) {
        validatedConfig.createdAt = now;
    }
    validatedConfig.updatedAt = now;

    const bridge = await BridgeService.createBridge(validatedConfig, userId);

    const response = NextResponse.json(bridge, { status: 201 });
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());

    return addSecurityHeaders(response);
});