import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export type ErrorCode =
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'VALIDATION_ERROR'
    | 'RATE_LIMIT_EXCEEDED'
    | 'DATABASE_ERROR'
    | 'INTERNAL_ERROR'
    | 'BAD_REQUEST'
    | 'BRIDGE_NOT_FOUND'
    | 'BRIDGE_LIMIT_EXCEEDED'
    | 'INVALID_CONFIGURATION'

export interface ApiError {
    code: ErrorCode
    message: string
    details?: Record<string, unknown>
    statusCode: number
}

export class AppError extends Error {
    public readonly code: ErrorCode
    public readonly statusCode: number
    public readonly details?: Record<string, unknown>

    constructor(code: ErrorCode, message: string, statusCode: number, details?: Record<string, unknown>) {
        super(message)
        this.code = code
        this.statusCode = statusCode
        this.details = details
        this.name = 'AppError'
    }
}

export function createApiError(error: unknown): ApiError {
    // Handle known error types
    if (error instanceof AppError) {
        return {
            code: error.code,
            message: error.message,
            statusCode: error.statusCode,
            details: error.details
        }
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
        return {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            statusCode: 400,
            details: {
                errors: error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }))
            }
        }
    }

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                return {
                    code: 'VALIDATION_ERROR',
                    message: 'A record with this information already exists',
                    statusCode: 409,
                    details: { field: error.meta?.target }
                }
            case 'P2025':
                return {
                    code: 'NOT_FOUND',
                    message: 'Record not found',
                    statusCode: 404
                }
            case 'P2003':
                return {
                    code: 'VALIDATION_ERROR',
                    message: 'Foreign key constraint violation',
                    statusCode: 400
                }
            default:
                console.error('Prisma error:', error)
                return {
                    code: 'DATABASE_ERROR',
                    message: 'Database operation failed',
                    statusCode: 500
                }
        }
    }

    // Handle fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
            code: 'INTERNAL_ERROR',
            message: 'Network request failed',
            statusCode: 503
        }
    }

    // Handle generic errors
    if (error instanceof Error) {
        return {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
            statusCode: 500,
            details: process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
        }
    }

    // Handle unknown errors
    return {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        statusCode: 500
    }
}

export function createErrorResponse(error: unknown): NextResponse {
    const apiError = createApiError(error)

    // Log errors for monitoring
    console.error('API Error:', {
        code: apiError.code,
        message: apiError.message,
        statusCode: apiError.statusCode,
        details: apiError.details,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
        {
            error: {
                code: apiError.code,
                message: apiError.message,
                ...(apiError.details && { details: apiError.details })
            }
        },
        { status: apiError.statusCode }
    )
}

// Async wrapper for API handlers
export function withErrorHandler<T extends unknown[]>(
    handler: (...args: T) => Promise<Response>
) {
    return async (...args: T): Promise<Response> => {
        try {
            return await handler(...args)
        } catch (error) {
            return createErrorResponse(error)
        }
    }
}
