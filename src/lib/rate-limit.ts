import { NextRequest } from 'next/server';

interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store (in production, use Redis or similar)
const store = new Map<string, RateLimitEntry>();

export class RateLimiter {
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = config;
    }

    private getIdentifier(request: NextRequest): string {
        // Use IP address or user session as identifier
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // Include user agent to prevent simple IP spoofing
        const userAgent = request.headers.get('user-agent') || 'unknown';

        return `${ip}-${Buffer.from(userAgent).toString('base64').slice(0, 16)}`;
    }

    private cleanExpiredEntries(): void {
        const now = Date.now();
        for (const [key, entry] of store.entries()) {
            if (now >= entry.resetTime) {
                store.delete(key);
            }
        }
    }

    check(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
        this.cleanExpiredEntries();

        const identifier = this.getIdentifier(request);
        const now = Date.now();
        const resetTime = now + this.config.windowMs;

        let entry = store.get(identifier);

        if (!entry || now >= entry.resetTime) {
            // First request or window expired
            entry = {
                count: 1,
                resetTime
            };
            store.set(identifier, entry);

            return {
                allowed: true,
                remaining: this.config.maxRequests - 1,
                resetTime
            };
        }

        if (entry.count >= this.config.maxRequests) {
            // Rate limit exceeded
            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.resetTime
            };
        }

        // Increment count
        entry.count++;
        store.set(identifier, entry);

        return {
            allowed: true,
            remaining: this.config.maxRequests - entry.count,
            resetTime: entry.resetTime
        };
    }
}

// Default rate limiters
export const apiRateLimit = new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
});

export const demoRateLimit = new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50 // More restrictive for demo users
});

export const authRateLimit = new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5 // Very restrictive for auth attempts
});
