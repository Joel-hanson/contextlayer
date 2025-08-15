import { Prisma } from '@prisma/client';
import { LogQueue } from './log-queue';

// Define valid log levels
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// Type for structured metadata that can be safely serialized
type LogMetadata = Prisma.InputJsonValue;

// Initialize the log queue
const logQueue = new LogQueue();

export async function logBridgeEvent(
    bridgeId: string,
    level: LogLevel,
    message: string,
    metadata?: LogMetadata
): Promise<void> {
    // When running in development, also log to console
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${level.toUpperCase()}] ${bridgeId}: ${message}`, metadata);
    }

    // Queue the log for batch processing
    await logQueue.add({
        bridgeId,
        level,
        message,
        metadata
    });
}

/**
 * Formats an error into a consistent string representation
 * @param error - The error to format
 * @returns A formatted error message string
 */
export function formatErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ''}`;
    }
    return String(error);
}

/**
 * Creates a standardized MCP JSON-RPC error response
 * @param code - The error code (must be a valid MCP error code)
 * @param message - A human-readable error message
 * @param data - Optional additional error data
 */
export function createMcpError(
    code: number,
    message: string,
    data?: unknown
): {
    jsonrpc: '2.0';
    error: {
        code: number;
        message: string;
        data?: unknown;
    };
    id: null;
} {
    return {
        jsonrpc: '2.0',
        error: {
            code,
            message,
            data
        },
        id: null
    };
}
