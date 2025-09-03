import { addSecurityHeaders } from '@/lib/api-security';
import { AppError, withErrorHandler } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/public/bridges - Get public bridges for marketplace
export const GET = withErrorHandler(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'latest'; // 'latest' or 'usage'

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
        throw new AppError('BAD_REQUEST', 'Invalid pagination parameters', 400);
    }

    const skip = (page - 1) * limit;

    try {
        // Build search filter
        const searchFilter = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { description: { contains: search, mode: 'insensitive' as const } },
                ],
            }
            : {};

        // Get public bridges with their owner information
        const bridges = await prisma.bridge.findMany({
            where: {
                isPublic: true,
                enabled: true,
                ...searchFilter,
            },
            select: {
                id: true,
                slug: true,
                name: true,
                description: true,
                baseUrl: true,
                mcpTools: true,
                mcpPrompts: true,
                mcpResources: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        name: true,
                        username: true,
                        image: true,
                    },
                },
                // Include usage statistics from API requests
                _count: {
                    select: {
                        requests: {
                            where: {
                                success: true,
                            },
                        },
                    },
                },
            },
        });

        // Sort bridges based on the sort parameter
        const sortedBridges = bridges.sort((a, b) => {
            if (sort === 'usage') {
                // Sort by usage count (popularity), then by creation date
                const usageDiff = b._count.requests - a._count.requests;
                if (usageDiff !== 0) return usageDiff;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            } else {
                // Sort by creation date (latest first)
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });

        // Apply pagination to sorted results
        const paginatedBridges = sortedBridges.slice(skip, skip + limit);

        const totalCount = bridges.length;

        // Transform the data to include parsed MCP content and usage stats
        const transformedBridges = paginatedBridges.map((bridge) => {
            // Parse MCP content to get counts - safely handle JSON data
            const mcpTools = Array.isArray(bridge.mcpTools) ? bridge.mcpTools : [];
            const mcpPrompts = Array.isArray(bridge.mcpPrompts) ? bridge.mcpPrompts : [];
            const mcpResources = Array.isArray(bridge.mcpResources) ? bridge.mcpResources : [];

            return {
                id: bridge.id,
                slug: bridge.slug,
                name: bridge.name,
                description: bridge.description || '',
                baseUrl: bridge.baseUrl,
                createdAt: bridge.createdAt,
                updatedAt: bridge.updatedAt,
                owner: {
                    name: bridge.user.name || bridge.user.username || 'Anonymous',
                    username: bridge.user.username,
                    image: bridge.user.image,
                },
                stats: {
                    toolCount: mcpTools.length,
                    promptCount: mcpPrompts.length,
                    resourceCount: mcpResources.length,
                    usageCount: bridge._count.requests,
                },
                // Preview of tools/prompts/resources (first 3 of each)
                preview: {
                    tools: mcpTools.slice(0, 3)
                        .filter((tool): tool is { name: string; description: string } =>
                            tool != null && typeof tool === 'object' && 'name' in tool && 'description' in tool
                        )
                        .map((tool) => ({
                            name: tool.name,
                            description: tool.description,
                        })),
                    prompts: mcpPrompts.slice(0, 3)
                        .filter((prompt): prompt is { name: string; description: string } =>
                            prompt != null && typeof prompt === 'object' && 'name' in prompt && 'description' in prompt
                        )
                        .map((prompt) => ({
                            name: prompt.name,
                            description: prompt.description,
                        })),
                    resources: mcpResources.slice(0, 3)
                        .filter((resource): resource is { name: string; description: string; uri: string } =>
                            resource != null && typeof resource === 'object' && 'name' in resource && 'description' in resource && 'uri' in resource
                        )
                        .map((resource) => ({
                            name: resource.name,
                            description: resource.description,
                            uri: resource.uri,
                        })),
                },
            };
        });

        const response = NextResponse.json({
            bridges: transformedBridges,
            pagination: {
                page,
                limit,
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
                hasNext: page < Math.ceil(totalCount / limit),
                hasPrev: page > 1,
            },
        });

        return addSecurityHeaders(response);
    } catch (error) {
        console.error('Error fetching public bridges:', error);
        throw new AppError(
            'INTERNAL_ERROR',
            'Failed to fetch public bridges',
            500
        );
    }
});
