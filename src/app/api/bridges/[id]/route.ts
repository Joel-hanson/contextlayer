import { addSecurityHeaders, requireAuth, requireBridgeOwnership } from '@/lib/api-security'
import { BridgeService } from '@/lib/bridge-service'
import { apiRateLimit } from '@/lib/rate-limit'
import { BridgeConfigSchema } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/bridges/[id] - Get a specific bridge
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Apply rate limiting
        const rateLimitResult = apiRateLimit.check(request);
        if (!rateLimitResult.allowed) {
            const response = NextResponse.json(
                { error: 'Too many requests' },
                { status: 429 }
            );
            return addSecurityHeaders(response);
        }

        // Require authentication
        const authResult = await requireAuth();
        if (authResult instanceof NextResponse) {
            return addSecurityHeaders(authResult);
        }

        const { id } = await params;
        const userId = authResult.user.id;

        // Check bridge ownership
        const ownershipResult = await requireBridgeOwnership(id, userId);
        if (!ownershipResult) {
            const response = NextResponse.json(
                { error: 'Bridge not found or access denied' },
                { status: 404 }
            );
            return addSecurityHeaders(response);
        }

        const bridge = await BridgeService.getBridgeById(id, userId);

        if (!bridge) {
            const response = NextResponse.json(
                { error: 'Bridge not found' },
                { status: 404 }
            );
            return addSecurityHeaders(response);
        }

        const response = NextResponse.json(bridge);
        return addSecurityHeaders(response);
    } catch (error) {
        console.error(`Error fetching bridge:`, error);
        const response = NextResponse.json(
            { error: 'Failed to fetch bridge' },
            { status: 500 }
        );
        return addSecurityHeaders(response);
    }
}

// PUT /api/bridges/[id] - Update a bridge
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Apply rate limiting
        const rateLimitResult = apiRateLimit.check(request);
        if (!rateLimitResult.allowed) {
            const response = NextResponse.json(
                { error: 'Too many requests' },
                { status: 429 }
            );
            return addSecurityHeaders(response);
        }

        // Require authentication
        const authResult = await requireAuth();
        if (authResult instanceof NextResponse) {
            return addSecurityHeaders(authResult);
        }

        const { id } = await params;
        const userId = authResult.user.id;

        // Check bridge ownership
        const ownershipResult = await requireBridgeOwnership(id, userId);
        if (!ownershipResult) {
            const response = NextResponse.json(
                { error: 'Bridge not found or access denied' },
                { status: 404 }
            );
            return addSecurityHeaders(response);
        }

        const body = await request.json();

        // Validate the request body
        const validationResult = BridgeConfigSchema.safeParse(body);
        if (!validationResult.success) {
            const response = NextResponse.json(
                { error: 'Invalid bridge configuration', details: validationResult.error },
                { status: 400 }
            );
            return addSecurityHeaders(response);
        }

        const updatedBridge = await BridgeService.updateBridge(id, validationResult.data, userId);

        if (!updatedBridge) {
            const response = NextResponse.json(
                { error: 'Bridge not found' },
                { status: 404 }
            );
            return addSecurityHeaders(response);
        }

        const response = NextResponse.json(updatedBridge);
        return addSecurityHeaders(response);
    } catch (error) {
        console.error(`Error updating bridge:`, error);
        const response = NextResponse.json(
            { error: 'Failed to update bridge' },
            { status: 500 }
        );
        return addSecurityHeaders(response);
    }
}

// DELETE /api/bridges/[id] - Delete a bridge
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Apply rate limiting
        const rateLimitResult = apiRateLimit.check(request);
        if (!rateLimitResult.allowed) {
            const response = NextResponse.json(
                { error: 'Too many requests' },
                { status: 429 }
            );
            return addSecurityHeaders(response);
        }

        // Require authentication
        const authResult = await requireAuth();
        if (authResult instanceof NextResponse) {
            return addSecurityHeaders(authResult);
        }

        const { id } = await params;
        const userId = authResult.user.id;

        // Check bridge ownership
        const ownershipResult = await requireBridgeOwnership(id, userId);
        if (!ownershipResult) {
            const response = NextResponse.json(
                { error: 'Bridge not found or access denied' },
                { status: 404 }
            );
            return addSecurityHeaders(response);
        }

        await BridgeService.deleteBridge(id, userId);

        const response = NextResponse.json({ success: true });
        return addSecurityHeaders(response);
    } catch (error) {
        console.error(`Error deleting bridge:`, error);
        const response = NextResponse.json(
            { error: 'Failed to delete bridge' },
            { status: 500 }
        );
        return addSecurityHeaders(response);
    }
}