import { addSecurityHeaders, requireAuth } from '@/lib/api-security';
import { prisma } from '@/lib/prisma';
import { apiRateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const responseSchema = z.object({
    response: z.string().min(1).max(5000)
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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
        const resolvedParams = await params;
        const feedbackId = resolvedParams.id;
        if (!feedbackId) {
            return NextResponse.json(
                { error: 'Feedback ID is required' },
                { status: 400 }
            );
        }

        // Validate request body
        const body = await request.json();
        const validatedData = responseSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: 'Invalid response data' },
                { status: 400 }
            );
        }

        const { response: adminResponseText } = validatedData.data;

        // Get current feedback status
        const currentFeedback = await prisma.feedback.findUnique({
            where: { id: feedbackId },
            select: { status: true }
        });

        if (!currentFeedback) {
            return NextResponse.json(
                { error: 'Feedback not found' },
                { status: 404 }
            );
        }

        // Set new status if currently open
        let newStatus = currentFeedback.status;
        if (newStatus === 'OPEN') {
            newStatus = 'IN_PROGRESS';
        }

        // Update the feedback record with admin response
        const updatedFeedback = await prisma.feedback.update({
            where: { id: feedbackId },
            data: {
                adminResponse: adminResponseText,
                status: newStatus,
                updatedAt: new Date(),
            },
            select: {
                id: true,
                adminResponse: true,
                status: true,
                updatedAt: true,
            },
        });

        const response = NextResponse.json({
            success: true,
            feedback: updatedFeedback,
        });

        return addSecurityHeaders(response);
    } catch (error) {
        console.error('Error adding admin response:', error);
        return NextResponse.json(
            { error: 'Failed to add admin response' },
            { status: 500 }
        );
    }
}