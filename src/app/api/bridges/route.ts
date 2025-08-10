import { addSecurityHeaders, requireAuth } from '@/lib/api-security'
import { BridgeService } from '@/lib/bridge-service'
import { apiRateLimit } from '@/lib/rate-limit'
import { checkUserLimits } from '@/lib/rate-limiter'
import { BridgeConfigSchema } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/bridges - Get all bridges
export async function GET(request: NextRequest) {
    try {
        // Apply rate limiting
        const rateLimitResult = apiRateLimit.check(request);
        if (!rateLimitResult.allowed) {
            const response = NextResponse.json(
                { error: 'Too many requests' },
                { status: 429 }
            );
            response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
            response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
            return addSecurityHeaders(response);
        }

        // Require authentication
        const authResult = await requireAuth();
        if (authResult instanceof NextResponse) {
            return addSecurityHeaders(authResult);
        }

        const bridges = await BridgeService.getAllBridges(authResult.user.id);

        // Note: sanitization will be done in BridgeService if needed
        const response = NextResponse.json(bridges);
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());

        return addSecurityHeaders(response);
    } catch (error) {
        console.error('Error fetching bridges:', error)
        const response = NextResponse.json(
            { error: 'Failed to fetch bridges' },
            { status: 500 }
        );
        return addSecurityHeaders(response);
    }
}

// POST /api/bridges - Create a new bridge
export async function POST(request: NextRequest) {
    try {
        // Apply rate limiting
        const rateLimitResult = apiRateLimit.check(request);
        if (!rateLimitResult.allowed) {
            const response = NextResponse.json(
                { error: 'Too many requests' },
                { status: 429 }
            );
            response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
            response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
            return addSecurityHeaders(response);
        }

        // Require authentication
        const authResult = await requireAuth();
        if (authResult instanceof NextResponse) {
            return addSecurityHeaders(authResult);
        }

        const userId = authResult.user.id;
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

        // Check if user can create more bridges
        const userLimitCheck = await checkUserLimits(userId, 'bridge');
        if (!userLimitCheck.allowed) {
            const response = NextResponse.json(
                {
                    error: 'Bridge limit reached',
                    details: userLimitCheck.message
                },
                { status: 403 }
            );
            return addSecurityHeaders(response);
        }

        const bridge = await BridgeService.createBridge(validatedConfig, userId);

        const response = NextResponse.json(bridge, { status: 201 });
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());

        return addSecurityHeaders(response);
    } catch (error) {
        console.error('Error creating bridge:', error);

        if (error instanceof Error && error.name === 'ZodError') {
            const response = NextResponse.json(
                { error: 'Invalid bridge configuration', details: error.message },
                { status: 400 }
            );
            return addSecurityHeaders(response);
        }

        const response = NextResponse.json(
            { error: 'Failed to create bridge' },
            { status: 500 }
        );
        return addSecurityHeaders(response);
    }
}
