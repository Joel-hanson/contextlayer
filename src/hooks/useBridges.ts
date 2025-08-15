import { BridgeConfig, ServerStatus } from '@/lib/types'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseBridgesReturn {
    bridges: BridgeConfig[]
    setBridges: (bridges: BridgeConfig[]) => void
    loading: boolean
    error: string | null
    createBridge: (config: BridgeConfig) => Promise<void>
    updateBridge: (id: string, config: BridgeConfig) => Promise<void>
    deleteBridge: (id: string) => Promise<void>
    startBridge: (id: string, config: BridgeConfig) => Promise<void>
    stopBridge: (id: string) => Promise<void>
    refreshBridges: () => Promise<void>
    clearError: () => void
    serverStatuses: Record<string, ServerStatus>
}

export function useBridges(): UseBridgesReturn {
    const [bridges, setBridges] = useState<BridgeConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [serverStatuses, setServerStatuses] = useState<Record<string, ServerStatus>>({})
    const isFetchingRef = useRef(false)

    // Fetch all bridges with debounce
    const fetchBridges = useCallback(async () => {
        // Prevent multiple simultaneous calls
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        try {
            setLoading(true)
            setError(null)

            const response = await fetch('/api/bridges', {
                // Add cache control headers
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            })
            if (!response.ok) {
                throw new Error(`Failed to fetch bridges: ${response.statusText}`)
            }

            const data = await response.json()
            setBridges(data)

            // Update server statuses based on bridge enabled state
            const statuses: Record<string, ServerStatus> = {}
            data.forEach((bridge: BridgeConfig) => {
                statuses[bridge.id] = {
                    id: bridge.id,
                    running: bridge.enabled,
                    uptime: bridge.enabled ? Date.now() - new Date(bridge.updatedAt).getTime() : undefined,
                }
            })
            setServerStatuses(statuses)

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch bridges')
        } finally {
            setLoading(false)
            isFetchingRef.current = false;
        }
    }, [])

    // Create a new bridge
    const createBridge = useCallback(async (config: BridgeConfig) => {
        try {
            setError(null)

            const response = await fetch('/api/bridges', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config),
            })

            if (!response.ok) {
                const errorData = await response.json()
                // API returns: { error: { code, message, details } }
                const errorMessage = errorData.error?.message || errorData.message || 'Failed to create bridge'
                const error = new Error(errorMessage)
                setError(errorMessage)
                throw error
            }

            // Refresh bridges list
            await fetchBridges()
        } catch (err) {
            // If it's already our custom error with message, use it
            if (err instanceof Error) {
                setError(err.message)
                throw err
            }
            // Fallback for unexpected errors
            const fallbackMessage = 'Failed to create bridge'
            setError(fallbackMessage)
            throw new Error(fallbackMessage)
        }
    }, [fetchBridges])

    // Update an existing bridge
    const updateBridge = useCallback(async (id: string, config: BridgeConfig) => {
        try {
            setError(null)

            const response = await fetch(`/api/bridges/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config),
            })

            if (!response.ok) {
                const errorData = await response.json()
                // API returns: { error: { code, message, details } }
                const errorMessage = errorData.error?.message || errorData.message || 'Failed to update bridge'
                const error = new Error(errorMessage)
                setError(errorMessage)
                throw error
            }

            // Refresh bridges list
            await fetchBridges()
        } catch (err) {
            // If it's already our custom error with message, use it
            if (err instanceof Error) {
                setError(err.message)
                throw err
            }
            // Fallback for unexpected errors
            const fallbackMessage = 'Failed to update bridge'
            setError(fallbackMessage)
            throw new Error(fallbackMessage)
        }
    }, [fetchBridges])

    // Delete a bridge
    const deleteBridge = useCallback(async (id: string) => {
        try {
            setError(null)

            const response = await fetch(`/api/bridges/${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error?.message || errorData.message || 'Failed to delete bridge')
            }

            // Remove from local state immediately for better UX
            setBridges(prev => prev.filter(bridge => bridge.id !== id))
            setServerStatuses(prev => {
                const newStatuses = { ...prev }
                delete newStatuses[id]
                return newStatuses
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete bridge')
            throw err
        }
    }, [])

    // Start a bridge
    const startBridge = useCallback(async (id: string, config: BridgeConfig) => {
        try {
            setError(null)

            // Optimistically update status
            setServerStatuses(prev => ({
                ...prev,
                [id]: { ...prev[id], running: true, uptime: 0 }
            }))

            const response = await fetch(`/api/bridges/${id}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bridgeConfig: config }),
            })

            if (!response.ok) {
                // Revert optimistic update
                setServerStatuses(prev => ({
                    ...prev,
                    [id]: { ...prev[id], running: false, uptime: undefined }
                }))

                const errorData = await response.json()
                throw new Error(errorData.error?.message || errorData.message || 'Failed to start bridge')
            }

            // Refresh bridges to get updated status
            await fetchBridges()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start bridge')
            throw err
        }
    }, [fetchBridges])

    // Stop a bridge
    const stopBridge = useCallback(async (id: string) => {
        try {
            setError(null)

            // Optimistically update status
            setServerStatuses(prev => ({
                ...prev,
                [id]: { ...prev[id], running: false, uptime: undefined }
            }))

            const response = await fetch(`/api/bridges/${id}/stop`, {
                method: 'POST',
            })

            if (!response.ok) {
                // Revert optimistic update
                setServerStatuses(prev => ({
                    ...prev,
                    [id]: { ...prev[id], running: true }
                }))

                const errorData = await response.json()
                throw new Error(errorData.error?.message || errorData.message || 'Failed to stop bridge')
            }

            // Refresh bridges to get updated status
            await fetchBridges()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to stop bridge')
            throw err
        }
    }, [fetchBridges])

    // Refresh bridges (alias for fetchBridges)
    const refreshBridges = useCallback(async () => {
        await fetchBridges()
    }, [fetchBridges])

    // Clear error state
    const clearError = useCallback(() => {
        setError(null)
    }, [])

    // Initial fetch on mount
    useEffect(() => {
        fetchBridges()
    }, [fetchBridges])

    return {
        bridges,
        setBridges,
        loading,
        error,
        createBridge,
        updateBridge,
        deleteBridge,
        startBridge,
        stopBridge,
        refreshBridges,
        clearError,
        serverStatuses,
    }
}
