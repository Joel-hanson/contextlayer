// Environment variable validation for security
const requiredEnvVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DATABASE_URL'
] as const;

export function validateEnvironment() {
    const missing: string[] = [];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}\n` +
            'Please check your .env.local file and ensure all required variables are set.'
        );
    }

    // Validate NEXTAUTH_SECRET length (should be at least 32 characters)
    const secret = process.env.NEXTAUTH_SECRET;
    if (secret && secret.length < 32) {
        console.warn(
            'WARNING: NEXTAUTH_SECRET should be at least 32 characters long for security. ' +
            'Generate a secure secret with: openssl rand -base64 32'
        );
    }

    // Validate URLs
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    if (nextAuthUrl && !isValidUrl(nextAuthUrl)) {
        throw new Error('NEXTAUTH_URL must be a valid URL');
    }

    return true;
}

function isValidUrl(string: string): boolean {
    try {
        new URL(string);
        return true;
    } catch {
        return false;
    }
}

// Security configuration constants
export const SECURITY_CONFIG = {
    // Session configuration
    SESSION_MAX_AGE: 30 * 24 * 60 * 60, // 30 days

    // Rate limiting
    API_RATE_LIMIT: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100
    },

    DEMO_RATE_LIMIT: {
        windowMs: 60 * 60 * 1000, // 1 hour  
        maxRequests: 50
    },

    AUTH_RATE_LIMIT: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5
    },

    // Content Security Policy
    CSP_DIRECTIVES: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'", 'https://accounts.google.com', 'https://js.sentry-cdn.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'https:', 'blob:'],
        'connect-src': ["'self'", 'https://api.github.com', 'https://accounts.google.com', 'https://*.googleapis.com', 'https://*.ingest.sentry.io', 'https://*.ingest.de.sentry.io'],
        'frame-src': ["'self'", 'https://accounts.google.com'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'upgrade-insecure-requests': []
    },

    // Security headers
    SECURITY_HEADERS: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-XSS-Protection': '1; mode=block',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }
} as const;

// Initialize environment validation
if (typeof window === 'undefined') {
    // Only validate on server-side
    validateEnvironment();
}
