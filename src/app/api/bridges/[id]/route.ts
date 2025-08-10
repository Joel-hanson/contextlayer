import { addSecurityHeaders, requireAuth, requireBridgeOwnership } from '@/lib/api-security'
import { BridgeService } from '@/lib/bridge-service'
import { AppError, withErrorHandler } from '@/lib/error-handler'
import { apiRateLimit } from '@/lib/rate-limit'
import { BridgeConfigSchema } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/bridges/[id] - Get a specific bridge
export const GET = withErrorHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    // Apply rate limiting
    const rateLimitResult = apiRateLimit.check(request);
    if (!rateLimitResult.allowed) {
        throw new AppError('RATE_LIMIT_EXCEEDED', 'Too many requests', 429);
    }

    // Require authentication
    const session = await requireAuth();
    const { id } = await params;

    // Check bridge ownership
    await requireBridgeOwnership(id, session.user.id);
    const fullBridge = await BridgeService.getBridgeById(id, session.user.id);

    if (!fullBridge) {
        throw new AppError('BRIDGE_NOT_FOUND', 'Bridge not found', 404);
    }

    const response = NextResponse.json(fullBridge);
    return addSecurityHeaders(response);
});

// PUT /api/bridges/[id] - Update a bridge
export const PUT = withErrorHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    // Apply rate limiting
    const rateLimitResult = apiRateLimit.check(request);
    if (!rateLimitResult.allowed) {
        throw new AppError('RATE_LIMIT_EXCEEDED', 'Too many requests', 429);
    }

    // Require authentication
    const session = await requireAuth();
    const { id } = await params;

    // Check bridge ownership
    await requireBridgeOwnership(id, session.user.id);

    const body = await request.json();

    // Validate the request body
    const validationResult = BridgeConfigSchema.safeParse(body);
    if (!validationResult.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid bridge configuration', 400, {
            errors: validationResult.error.errors
        });
    }

    const updatedBridge = await BridgeService.updateBridge(id, validationResult.data, session.user.id);

    if (!updatedBridge) {
        throw new AppError('BRIDGE_NOT_FOUND', 'Bridge not found', 404);
    }

    const response = NextResponse.json(updatedBridge);
    return addSecurityHeaders(response);
});

// DELETE /api/bridges/[id] - Delete a bridge
export const DELETE = withErrorHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    // Apply rate limiting
    const rateLimitResult = apiRateLimit.check(request);
    if (!rateLimitResult.allowed) {
        throw new AppError('RATE_LIMIT_EXCEEDED', 'Too many requests', 429);
    }

    // Require authentication
    const session = await requireAuth();
    const { id } = await params;

    // Check bridge ownership
    await requireBridgeOwnership(id, session.user.id);

    await BridgeService.deleteBridge(id, session.user.id);

    const response = NextResponse.json({ success: true });
    return addSecurityHeaders(response);
});