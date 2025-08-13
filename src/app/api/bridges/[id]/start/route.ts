import { authOptions } from '@/lib/auth'
import { BridgeService } from '@/lib/bridge-service'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
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

        const { id: bridgeId } = await params
        const body = await request.json()
        const { bridgeConfig } = body

        // Update bridge status to enabled (with user filtering)
        await BridgeService.updateBridgeStatus(bridgeId, true, session.user.id)

        // Log the start action
        await BridgeService.addBridgeLog(
            bridgeId,
            'info',
            'Bridge started successfully',
            {
                action: 'start',
                timestamp: new Date().toISOString(),
                config: bridgeConfig,
                userId: session.user.id
            }
        )

        return NextResponse.json({
            success: true,
            message: `Bridge ${bridgeId} started successfully`,
            bridgeId: bridgeId,
        })
    } catch (error) {
        const { id: bridgeId } = await params
        console.error(`Error starting bridge ${bridgeId}:`, error)

        // Log the error
        await BridgeService.addBridgeLog(
            bridgeId,
            'error',
            'Failed to start bridge',
            {
                action: 'start',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            }
        )

        // Update bridge status to error (try without user filtering for error logging)
        try {
            await BridgeService.updateBridgeStatus(bridgeId, false)
        } catch (err) {
            console.error('Failed to update bridge status to error:', err)
        }

        return NextResponse.json(
            { error: 'Failed to start bridge' },
            { status: 500 }
        )
    }
}
