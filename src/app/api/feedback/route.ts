import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const feedbackSchema = z.object({
    type: z.enum(['BUG', 'FEATURE', 'GENERAL', 'SUPPORT', 'SECURITY']),
    subject: z.string().min(1, 'Subject is required').max(200),
    message: z.string().min(1, 'Message is required').max(5000),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
    contactEmail: z.union([z.string().email(), z.literal('')]).transform(val => val === '' ? undefined : val).optional(),
    pageUrl: z.union([z.string().url(), z.literal('')]).transform(val => val === '' ? undefined : val).optional(),
    userAgent: z.string().optional(),
    metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedData = feedbackSchema.parse(body);

        // Create feedback record
        const feedback = await prisma.feedback.create({
            data: {
                userId: session.user.id,
                type: validatedData.type,
                subject: validatedData.subject,
                message: validatedData.message,
                priority: validatedData.priority,
                contactEmail: validatedData.contactEmail,
                pageUrl: validatedData.pageUrl,
                userAgent: validatedData.userAgent,
                metadata: validatedData.metadata,
                status: 'OPEN',
            },
        });

        return NextResponse.json(
            {
                success: true,
                feedbackId: feedback.id,
                message: 'Feedback submitted successfully',
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error submitting feedback:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: error.errors,
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
        const status = searchParams.get('status');
        const type = searchParams.get('type');

        const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'DUPLICATE'];
        const validTypes = ['BUG', 'FEATURE', 'GENERAL', 'SUPPORT', 'SECURITY'];

        // Build where clause dynamically
        const whereClause: Record<string, unknown> = {
            userId: session.user.id,
        };

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
                },
            }),
            prisma.feedback.count({ where: whereClause }),
        ]);

        return NextResponse.json({
            feedback,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
