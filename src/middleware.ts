import { withAuth } from "next-auth/middleware";
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware(request: NextRequest) {
        // Get the response
        const response = NextResponse.next();

        // Add security headers
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.headers.set('X-XSS-Protection', '1; mode=block');

        // Content Security Policy
        const cspDirectives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://js.sentry-cdn.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://api.github.com https://accounts.google.com https://*.googleapis.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io",
            "frame-src 'self' https://accounts.google.com",
            "object-src 'none'",
            "base-uri 'self'"
        ];

        // Only add upgrade-insecure-requests in production
        if (process.env.NODE_ENV === 'production') {
            cspDirectives.push("upgrade-insecure-requests");
        }

        // Only add upgrade-insecure-requests in production (when deployed to Vercel)
        if (process.env.VERCEL_ENV === 'production') {
            cspDirectives.push("upgrade-insecure-requests");
        }

        const csp = cspDirectives.join('; ');

        response.headers.set('Content-Security-Policy', csp);

        // Add CORS headers for MCP endpoints
        if (request.nextUrl.pathname.startsWith('/mcp/')) {
            const origin = request.headers.get('origin');
            const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'];

            if (origin && allowedOrigins.includes(origin)) {
                response.headers.set('Access-Control-Allow-Origin', origin);
            }

            response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            response.headers.set('Access-Control-Max-Age', '86400');

            // Handle preflight requests
            if (request.method === 'OPTIONS') {
                return new NextResponse(null, { status: 200, headers: response.headers });
            }
        }

        // Rate limiting check for API routes
        if (request.nextUrl.pathname.startsWith('/api/')) {
            const ip = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown';
            const userAgent = request.headers.get('user-agent') || 'unknown';

            // Log suspicious activity
            if (userAgent.includes('bot') || userAgent.includes('crawler')) {
                console.warn(`Suspicious request from ${ip}: ${userAgent}`);
            }
        }

        return response;
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl;

                // Routes that require authentication
                if (pathname.startsWith('/dashboard') ||
                    pathname.startsWith('/api/bridges') ||
                    pathname.startsWith('/api/feedback') ||
                    pathname.startsWith('/api/user')) {
                    return !!token;
                }

                // Allow all other routes (public routes, auth routes, health check, etc.)
                return true;
            },
        },
        pages: {
            signIn: "/auth/signin",
        },
    }
);

export const config = {
    matcher: [
        // Apply security headers to all paths except static assets
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
};
