Looking at the rate limiting implementation, let me check where the rate limit information is being stored:

```bash
cd /Users/joelhanson/Desktop/Personal/mcp-bridge
```

Let me examine the rate limiting service:

The rate limit information is currently stored **in memory** using JavaScript Map objects, not in the database. Here's how it works:

## Current Rate Limiting Storage

```typescript
class RateLimitService {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private ipRequests = new Map<string, { count: number; resetTime: number }>();
  // ...
}
```

The rate limiting data is stored in:

1. **In-memory Map objects** within the Node.js process
2. **Not persisted** to database or external storage
3. **Resets when server restarts**

## Issues with Current Implementation

### Problems:

- **Memory-only storage**: Data lost on server restart
- **Single instance**: Won't work with multiple server instances
- **No persistence**: Rate limits reset unexpectedly
- **Scalability**: Memory usage grows over time

### For Production, You Should:

**Option 1: Database Storage (Recommended)**

```typescript
import { prisma } from "@/lib/prisma";

export class DatabaseRateLimitService {
  async checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<boolean> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs);

    // Clean up old entries
    await prisma.rateLimitEntry.deleteMany({
      where: {
        createdAt: { lt: windowStart },
      },
    });

    // Count recent requests
    const requestCount = await prisma.rateLimitEntry.count({
      where: {
        key,
        createdAt: { gte: windowStart },
      },
    });

    if (requestCount >= limit) {
      return false;
    }

    // Record this request
    await prisma.rateLimitEntry.create({
      data: { key },
    });

    return true;
  }
}
```

**Option 2: Redis Storage (High Performance)**

```typescript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export class RedisRateLimitService {
  async checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<boolean> {
    const window = Math.floor(Date.now() / windowMs);
    const redisKey = `rate_limit:${key}:${window}`;

    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, Math.ceil(windowMs / 1000));
    }

    return count <= limit;
  }
}
```

## Recommendation for Your Production Setup

Since you're already using PostgreSQL, I recommend adding rate limiting to your database schema:

```sql
-- Add to your Prisma schema
model RateLimitEntry {
  id        String   @id @default(cuid())
  key       String   // user ID, IP, or combined key
  createdAt DateTime @default(now())

  @@index([key, createdAt])
}
```

Let me create a database-backed rate limiting service for your application:

```typescript
import { prisma } from "@/lib/prisma";

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

export class PersistentRateLimitService {
  async check(
    key: string,
    limit: number,
    windowMs: number = 15 * 60 * 1000 // 15 minutes default
  ): Promise<RateLimitResult> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs);

    try {
      // Clean up old entries periodically (every 100 requests)
      if (Math.random() < 0.01) {
        await prisma.rateLimitEntry.deleteMany({
          where: {
            createdAt: { lt: new Date(now.getTime() - windowMs * 2) },
          },
        });
      }

      // Count requests in current window
      const requestCount = await prisma.rateLimitEntry.count({
        where: {
          key,
          createdAt: { gte: windowStart },
        },
      });

      const allowed = requestCount < limit;
      const remaining = Math.max(0, limit - requestCount - 1);
      const resetTime = now.getTime() + windowMs;

      if (allowed) {
        // Record this request
        await prisma.rateLimitEntry.create({
          data: { key },
        });
      }

      return {
        allowed,
        limit,
        remaining,
        resetTime,
      };
    } catch (error) {
      console.error("Rate limit check failed:", error);
      // Fail open in case of database issues
      return {
        allowed: true,
        limit,
        remaining: limit - 1,
        resetTime: now.getTime() + windowMs,
      };
    }
  }
}
```

**Summary**: Your current rate limiting is memory-based and will reset on server restarts. For production, you should implement database-backed or Redis-backed rate limiting for persistence and scalability.
