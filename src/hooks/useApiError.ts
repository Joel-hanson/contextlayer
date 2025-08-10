import { useCallback, useState } from 'react'
import { useToast } from './use-toast'

interface ApiError {
    code: string
    message: string
    details?: Record<string, unknown>
}

export function useApiError() {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const handleApiCall = useCallback(async <T>(
        apiCall: () => Promise<T>,
        options?: {
            successMessage?: string
            onSuccess?: (data: T) => void
            onError?: (error: ApiError) => void
            showErrorToast?: boolean
        }
    ): Promise<T | null> => {
        setIsLoading(true)

        try {
            const result = await apiCall()

            if (options?.successMessage) {
                toast({
                    title: 'Success',
                    description: options.successMessage
                })
            }

            if (options?.onSuccess) {
                options.onSuccess(result)
            }

            return result
        } catch (error: unknown) {
            let apiError: ApiError

            // Handle different error formats
            if (error && typeof error === 'object' && 'response' in error) {
                const responseError = error as { response: { data: { error: ApiError } } }
                apiError = responseError.response.data.error
            } else if (error instanceof Error) {
                apiError = {
                    code: 'UNKNOWN_ERROR',
                    message: error.message || 'An unexpected error occurred'
                }
            } else {
                apiError = {
                    code: 'UNKNOWN_ERROR',
                    message: 'An unexpected error occurred'
                }
            }

            if (options?.onError) {
                options.onError(apiError)
            } else if (options?.showErrorToast !== false) {
                // Default error handling with toast
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: apiError.message
                })
            }

            console.error('API Error:', apiError)
            return null
        } finally {
            setIsLoading(false)
        }
    }, [toast])

    const handleError = useCallback((error: unknown) => {
        let apiError: ApiError

        if (error && typeof error === 'object' && 'response' in error) {
            const responseError = error as { response: { data: { error: ApiError } } }
            apiError = responseError.response.data.error
        } else if (error instanceof Error) {
            apiError = {
                code: 'UNKNOWN_ERROR',
                message: error.message
            }
        } else {
            apiError = {
                code: 'UNKNOWN_ERROR',
                message: 'An unexpected error occurred'
            }
        }

        toast({
            variant: 'destructive',
            title: 'Error',
            description: apiError.message
        })

        console.error('API Error:', apiError)
        return apiError
    }, [toast])

    return {
        handleApiCall,
        handleError,
        isLoading
    }
}
