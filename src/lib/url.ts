/**
 * Get the base URL for the application
 * Uses environment variable or falls back to localhost in development
 */
export function getBaseUrl(): string {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    // Server-side: check environment variables
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }

    if (process.env.NODE_ENV === 'production') {
        // In production, try to get from headers or default to localhost
        return process.env.PRODUCTION_URL || 'https://localhost:3000';
    }

    // Development fallback
    return 'http://localhost:3000';
}

/**
 * Get the full MCP URL for a bridge
 */
export function getMcpUrl(bridgeId: string): string {
    return `${getBaseUrl()}/mcp/${bridgeId}`;
}

/**
 * Get just the path part without the domain
 */
export function getMcpPath(bridgeId: string): string {
    if (typeof window !== 'undefined') {
        return `${window.location.host}/mcp/${bridgeId}`;
    }
    return `/mcp/${bridgeId}`;
}
