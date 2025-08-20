import { addSecurityHeaders, requireAuth } from '@/lib/api-security';
import { AppError, withErrorHandler } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import { apiRateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
    // Apply rate limiting
    const rateLimitResult = apiRateLimit.check(request);
    if (!rateLimitResult.allowed) {
        throw new AppError('RATE_LIMIT_EXCEEDED', 'Too many requests', 429);
    }

    // Check authentication
    const session = await requireAuth();

    // Check if user is admin
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
    if (!session.user.email || !adminEmails.includes(session.user.email)) {
        throw new AppError('UNAUTHORIZED', 'Admin access required', 403);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'DUPLICATE'];
    const validTypes = ['BUG', 'FEATURE', 'GENERAL', 'SUPPORT', 'SECURITY'];

    // Build where clause dynamically
    const whereClause: Record<string, unknown> = {};

    if (status && validStatuses.includes(status)) {
        whereClause.status = status;
    }

    if (type && validTypes.includes(type)) {
        whereClause.type = type;
    }

    const [feedback, total] = await Promise.all([
        prisma.feedback.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                type: true,
                subject: true,
                message: true,
                priority: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                adminResponse: true,
                resolvedAt: true,
                userId: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                    }
                }
            },
        }),
        prisma.feedback.count({ where: whereClause }),
    ]);

    const response = NextResponse.json({
        feedback,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });

    return addSecurityHeaders(response);
});
