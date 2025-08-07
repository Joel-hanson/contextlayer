import { authOptions } from '@/lib/auth'
import { BridgeService } from '@/lib/bridge-service'
import { BridgeConfigSchema } from '@/lib/types'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/bridges - Get all bridges
export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        // For now, return all bridges if no session (for development)
        // In production, you might want to require authentication
        const bridges = await BridgeService.getAllBridges(session?.user.id)
        return NextResponse.json(bridges)
    } catch (error) {
        console.error('Error fetching bridges:', error)
        return NextResponse.json(
            { error: 'Failed to fetch bridges' },
            { status: 500 }
        )
    }
}

// POST /api/bridges - Create a new bridge
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        let userId: string;

        if (!session?.user.id) {
            // For development: use the existing seeded user
            console.log('No session found, using development mode...');

            // Use the user we created earlier
            const { PrismaClient } = await import('@prisma/client');
            const prisma = new PrismaClient();

            try {
                const defaultUser = await prisma.user.findFirst({
                    where: { email: 'dev@example.com' }
                });

                if (!defaultUser) {
                    console.error('No development user found! Please seed the database first.');
                    return NextResponse.json(
                        { error: 'No development user found. Please seed the database.' },
                        { status: 500 }
                    );
                }

                userId = defaultUser.id;
                console.log('Found and using development user:', defaultUser.id);
                await prisma.$disconnect();
            } catch (dbError) {
                console.error('Database error creating/finding user:', dbError);
                return NextResponse.json(
                    { error: 'Database connection failed. Please check your database setup.', details: dbError },
                    { status: 500 }
                );
            }
        } else {
            userId = session.user.id;
            console.log('Using session userId:', userId);
        }

        const body = await request.json()

        // Validate the bridge configuration
        const validatedConfig = BridgeConfigSchema.parse(body)

        // Generate unique ID if not provided (should be UUID)
        if (!validatedConfig.id) {
            validatedConfig.id = crypto.randomUUID()
        }

        // Set timestamps
        const now = new Date().toISOString()
        if (!validatedConfig.createdAt) {
            validatedConfig.createdAt = now
        }
        validatedConfig.updatedAt = now

        console.log('About to create bridge with userId:', userId);
        console.log('Bridge config ID:', validatedConfig.id);
        console.log('Bridge config slug:', validatedConfig.slug);

        // Double-check that the user exists before creating bridge
        const { PrismaClient } = await import('@prisma/client');
        const checkPrisma = new PrismaClient();
        const userExists = await checkPrisma.user.findUnique({
            where: { id: userId }
        });
        console.log('User exists check:', userExists ? 'YES' : 'NO');
        if (userExists) {
            console.log('Found user:', userExists.email, userExists.id);
        }
        await checkPrisma.$disconnect();

        const bridge = await BridgeService.createBridge(validatedConfig, userId)

        return NextResponse.json(bridge, { status: 201 })
    } catch (error) {
        console.error('Error creating bridge:', error)

        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid bridge configuration', details: error.message },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to create bridge' },
            { status: 500 }
        )
    }
}
