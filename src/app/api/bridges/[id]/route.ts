import { authOptions } from '@/lib/auth'
import { BridgeService } from '@/lib/bridge-service'
import { BridgeConfigSchema } from '@/lib/types'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/bridges/[id] - Get a specific bridge
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const { id } = await params

        // Pass userId for user-specific filtering if authenticated
        const bridge = await BridgeService.getBridgeById(id, session?.user.id)

        if (!bridge) {
            return NextResponse.json(
                { error: 'Bridge not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(bridge)
    } catch (error) {
        console.error(`Error fetching bridge:`, error)
        return NextResponse.json(
            { error: 'Failed to fetch bridge' },
            { status: 500 }
        )
    }
}

// PUT /api/bridges/[id] - Update a bridge
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const { id } = await params
        const body = await request.json()

        // Validate the request body
        const validationResult = BridgeConfigSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid bridge configuration', details: validationResult.error },
                { status: 400 }
            )
        }

        const updatedBridge = await BridgeService.updateBridge(id, validationResult.data, session.user.id)

        if (!updatedBridge) {
            return NextResponse.json(
                { error: 'Bridge not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(updatedBridge)
    } catch (error) {
        console.error(`Error updating bridge:`, error)
        return NextResponse.json(
            { error: 'Failed to update bridge' },
            { status: 500 }
        )
    }
}

// DELETE /api/bridges/[id] - Delete a bridge
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const { id } = await params
        await BridgeService.deleteBridge(id, session.user.id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(`Error deleting bridge:`, error)
        return NextResponse.json(
            { error: 'Failed to delete bridge' },
            { status: 500 }
        )
    }
}