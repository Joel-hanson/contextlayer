import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

interface BridgeData {
    id: string;
    name: string;
    description: string;
    baseUrl: string;
    enabled: boolean;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    endpoints?: Array<{
        id: string;
        name: string;
        method: string;
        path: string;
        description: string;
    }>;
}

// Authentication middleware for API routes
export async function requireAuth() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
        );
    }

    return session;
}

// Check if user owns a bridge
export async function requireBridgeOwnership(bridgeId: string, userId: string) {
    const bridge = await prisma.bridge.findFirst({
        where: {
            id: bridgeId,
            userId: userId
        }
    });

    if (!bridge) {
        return NextResponse.json(
            { error: 'Bridge not found or access denied' },
            { status: 404 }
        );
    }

    return bridge;
}

// Input validation schemas
export const createBridgeSchema = {
    name: (value: string) => {
        if (!value || value.length < 1 || value.length > 100) {
            throw new Error('Name must be between 1 and 100 characters');
        }
        if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(value)) {
            throw new Error('Name contains invalid characters');
        }
        return value.trim();
    },
    description: (value: string) => {
        if (value && value.length > 500) {
            throw new Error('Description must be less than 500 characters');
        }
        return value?.trim() || '';
    },
    baseUrl: (value: string) => {
        if (!value) {
            throw new Error('Base URL is required');
        }
        try {
            const url = new URL(value);
            // In production, only allow HTTPS
            if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
                throw new Error('HTTPS is required in production');
            }
            return value;
        } catch {
            throw new Error('Invalid URL format');
        }
    }
};

// Sanitize bridge data for client response
export function sanitizeBridgeForClient(bridge: BridgeData): BridgeData {
    return {
        id: bridge.id,
        name: bridge.name,
        description: bridge.description,
        baseUrl: bridge.baseUrl,
        enabled: bridge.enabled,
        status: bridge.status,
        createdAt: bridge.createdAt,
        updatedAt: bridge.updatedAt,
        endpoints: bridge.endpoints?.map((endpoint) => ({
            id: endpoint.id,
            name: endpoint.name,
            method: endpoint.method,
            path: endpoint.path,
            description: endpoint.description,
            // Don't expose sensitive configuration
        })) || []
        // Don't expose authConfig or other sensitive data
    };
}

// Rate limiting check with user ID
export function checkUserRateLimit(userId: string) {
    // This would integrate with your rate limiter
    // For now, return true
    console.log(`Rate limit check for user: ${userId}`);
    return true;
}

// Security headers for API responses
export function addSecurityHeaders(response: NextResponse) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
}
