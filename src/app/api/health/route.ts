import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

interface HealthStatus {
    status: string;
    timestamp: string;
    version: string;
    environment: string;
    uptime: number;
    memory: NodeJS.MemoryUsage;
    database?: string;
    environment_status?: string;
    missing_env_vars?: string[];
}

export async function GET() {
    try {
        // Basic health check
        const health: HealthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime(),
            memory: process.memoryUsage()
        };

        // Database connectivity check
        try {
            await prisma.$queryRaw`SELECT 1`;
            health.database = 'connected';
        } catch (dbError) {
            health.database = 'disconnected';
            health.status = 'degraded';
            console.error('Database health check failed:', dbError);
        }

        // Environment variables check
        const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
        const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);

        if (missingEnvVars.length > 0) {
            health.environment_status = 'incomplete';
            health.missing_env_vars = missingEnvVars;
            health.status = 'degraded';
        } else {
            health.environment_status = 'complete';
        }

        // Return appropriate status code
        const statusCode = health.status === 'healthy' ? 200 : 503;

        return NextResponse.json(health, { status: statusCode });

    } catch (error) {
        console.error('Health check failed:', error);

        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 503 });
    }
}
