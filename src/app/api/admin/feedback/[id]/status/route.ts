import { addSecurityHeaders, requireAuth } from '@/lib/api-security';
import { prisma } from '@/lib/prisma';
import { apiRateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const statusSchema = z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'DUPLICATE'])
});

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Apply rate limiting
        const rateLimitResult = apiRateLimit.check(request);
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: 'Too many requests' },
                { status: 429 }
            );
        }

        // Check authentication
        const session = await requireAuth();

        // Check if user is admin
        const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
        if (!session.user.email || !adminEmails.includes(session.user.email)) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        // Get feedback ID from route params - access directly from params
        const { id } = await params
        const feedbackId = id;
        if (!feedbackId) {
            return NextResponse.json(
                { error: 'Feedback ID is required' },
                { status: 400 }
            );
        }

        // Validate request body
        const body = await request.json();
        const validatedData = statusSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            );
        }

        const { status } = validatedData.data;

        // Update feedback status
        const updateData: Record<string, unknown> = {
            status,
            updatedAt: new Date(),
        };

        // If status is resolved, set resolvedAt timestamp
        if (status === 'RESOLVED') {
            updateData.resolvedAt = new Date();
        }

        // Update the feedback record
        const updatedFeedback = await prisma.feedback.update({
            where: { id: feedbackId },
            data: updateData,
            select: {
                id: true,
                status: true,
                updatedAt: true,
                resolvedAt: true,
            },
        });

        const response = NextResponse.json({
            success: true,
            feedback: updatedFeedback,
        });

        return addSecurityHeaders(response);
    } catch (error) {
        console.error('Error updating feedback status:', error);
        return NextResponse.json(
            { error: 'Failed to update feedback status' },
            { status: 500 }
        );
    }
}