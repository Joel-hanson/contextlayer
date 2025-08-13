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

        // Update bridge status to disabled (with user filtering)
        await BridgeService.updateBridgeStatus(bridgeId, false, session.user.id)

        // Log the stop action
        await BridgeService.addBridgeLog(
            bridgeId,
            'info',
            'Bridge stopped successfully',
            {
                action: 'stop',
                timestamp: new Date().toISOString(),
                userId: session.user.id
            }
        )

        return NextResponse.json({
            success: true,
            message: `Bridge ${bridgeId} stopped successfully`
        })
    } catch (error) {
        const { id: bridgeId } = await params
        console.error(`Error stopping bridge ${bridgeId}:`, error)

        // Log the error
        await BridgeService.addBridgeLog(
            bridgeId,
            'error',
            'Failed to stop bridge',
            {
                action: 'stop',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            }
        )

        return NextResponse.json(
            { success: false, error: 'Failed to stop bridge' },
            { status: 500 }
        )
    }
}
