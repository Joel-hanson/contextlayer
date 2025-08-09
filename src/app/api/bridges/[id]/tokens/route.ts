import { prisma } from '@/lib/prisma';
import { createAccessToken } from '@/lib/security';
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id: bridgeId } = await params;

        // Fetch tokens from database
        const tokens = await prisma.accessToken.findMany({
            where: {
                bridgeId: bridgeId,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform database tokens to McpAccessToken format
        const mcpTokens = tokens.map(token => ({
            id: token.id,
            token: token.token,
            name: token.name,
            description: token.description,
            permissions: token.permissions as Array<{
                type: 'tools' | 'resources' | 'prompts' | 'admin';
                actions: string[];
                constraints?: Record<string, unknown>;
            }>,
            expiresAt: token.expiresAt?.toISOString(),
            createdAt: token.createdAt.toISOString(),
            lastUsedAt: token.lastUsedAt?.toISOString(),
            isActive: token.isActive,
            metadata: token.metadata as Record<string, unknown> || {}
        }));

        return NextResponse.json({
            success: true,
            data: mcpTokens
        });
    } catch (error) {
        console.error('Error fetching tokens:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch tokens'
        }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id: bridgeId } = await params;
        const body = await request.json();
        const { name, description, permissions, expiresInDays } = body;

        if (!name) {
            return NextResponse.json({
                success: false,
                error: 'Token name is required'
            }, { status: 400 });
        }

        // Create the access token
        const newToken = createAccessToken(name, description, permissions, expiresInDays);

        // Generate proper UUID for database
        const tokenId = randomUUID();

        // Save to database
        const dbToken = await prisma.accessToken.create({
            data: {
                id: tokenId,
                bridgeId: bridgeId,
                token: newToken.token,
                name: newToken.name,
                description: newToken.description,
                permissions: JSON.parse(JSON.stringify(newToken.permissions)),
                isActive: newToken.isActive,
                expiresAt: newToken.expiresAt ? new Date(newToken.expiresAt) : null,
                metadata: newToken.metadata || {}
            }
        });

        // Return the created token
        const responseToken = {
            ...newToken,
            id: tokenId, // Use the UUID instead of the token's original ID
            createdAt: dbToken.createdAt.toISOString(),
            updatedAt: dbToken.updatedAt.toISOString()
        };

        return NextResponse.json({
            success: true,
            data: responseToken
        });
    } catch (error) {
        console.error('Error creating token:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to create token'
        }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id: bridgeId } = await params;
        const url = new URL(request.url);
        const tokenId = url.searchParams.get('tokenId');
        const body = await request.json();

        if (!tokenId) {
            return NextResponse.json({
                success: false,
                error: 'Token ID is required'
            }, { status: 400 });
        }

        // Update token in database
        const updatedToken = await prisma.accessToken.update({
            where: {
                id: tokenId,
                bridgeId: bridgeId
            },
            data: {
                name: body.name,
                description: body.description,
                isActive: body.isActive,
                permissions: JSON.parse(JSON.stringify(body.permissions || [])),
                metadata: body.metadata || {},
                updatedAt: new Date()
            }
        });

        // Transform to response format
        const responseToken = {
            id: updatedToken.id,
            token: updatedToken.token,
            name: updatedToken.name,
            description: updatedToken.description,
            permissions: updatedToken.permissions as Array<{
                type: 'tools' | 'resources' | 'prompts' | 'admin';
                actions: string[];
                constraints?: Record<string, unknown>;
            }>,
            expiresAt: updatedToken.expiresAt?.toISOString(),
            createdAt: updatedToken.createdAt.toISOString(),
            lastUsedAt: updatedToken.lastUsedAt?.toISOString(),
            isActive: updatedToken.isActive,
            metadata: updatedToken.metadata as Record<string, unknown> || {}
        };

        return NextResponse.json({
            success: true,
            data: responseToken
        });
    } catch (error) {
        console.error('Error updating token:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to update token'
        }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id: bridgeId } = await params;
        const { searchParams } = new URL(request.url);
        const tokenId = searchParams.get('tokenId');

        if (!tokenId) {
            return NextResponse.json({
                success: false,
                error: 'Token ID is required'
            }, { status: 400 });
        }

        // Delete token from database
        await prisma.accessToken.delete({
            where: {
                id: tokenId,
                bridgeId: bridgeId
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Token deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting token:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to delete token'
        }, { status: 500 });
    }
}
