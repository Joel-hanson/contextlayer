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

        if (!session?.user.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const body = await request.json()

        // Validate the bridge configuration
        const validatedConfig = BridgeConfigSchema.parse(body)        // Generate unique ID if not provided (should be UUID)
        if (!validatedConfig.id) {
            validatedConfig.id = crypto.randomUUID()
        }

        // Set timestamps
        const now = new Date().toISOString()
        if (!validatedConfig.createdAt) {
            validatedConfig.createdAt = now
        }
        validatedConfig.updatedAt = now

        const bridge = await BridgeService.createBridge(validatedConfig, session.user.id)

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
