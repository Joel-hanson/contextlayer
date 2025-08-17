import '@testing-library/jest-dom';
import { beforeAll, beforeEach } from 'vitest';
import prisma from '../src/lib/prisma';

// Demo user credentials from seed.ts
export const DEMO_USER = {
    email: 'demo@contextlayer.app',
    password: 'demo123'
};

// Store the session token
let authToken: string;

// Helper function to get authentication token
async function getAuthToken() {
    // Get the demo user from the database
    const user = await prisma.user.findUnique({
        where: { email: DEMO_USER.email }
    });

    if (!user) {
        throw new Error('Demo user not found. Please run `npx prisma db seed` first.');
    }

    // Create a session for this user
    const session = await prisma.session.create({
        data: {
            userId: user.id,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),  // 24 hours
            sessionToken: `test-session-${Date.now()}`
        }
    });

    return session.sessionToken;
}

beforeAll(async () => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

    try {
        // Verify demo user exists
        const user = await prisma.user.findUnique({
            where: { email: DEMO_USER.email }
        });

        if (!user) {
            throw new Error('Demo user not found. Please run `npm run db:seed` first.');
        }

        // Create test bridge if it doesn't exist
        const existingBridge = await prisma.bridge.findFirst({
            where: { userId: user.id }
        });

        if (!existingBridge) {
            await prisma.bridge.create({
                data: {
                    userId: user.id,
                    name: 'Test Bridge',
                    slug: 'test-bridge',
                    description: 'Bridge for integration tests',
                    baseUrl: 'https://api.example.com',
                    enabled: true,
                    authConfig: { type: 'none' },
                    mcpTools: [
                        {
                            name: 'test_tool',
                            description: 'A test tool',
                            method: 'GET',
                            path: '/test'
                        }
                    ],
                }
            });
        }

        // Get authentication token
        authToken = await getAuthToken();
    } catch (error) {
        console.error('Test setup failed:', error);
        throw error;
    }
});

// Export function to get auth headers for tests
export function getAuthHeaders() {
    if (!authToken) {
        throw new Error('No auth token available. Did beforeAll run successfully?');
    }
    return {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };
}

beforeEach(async () => {
    // Clean up test data but preserve demo user's bridges
    await prisma.apiRequest.deleteMany({
        where: {
            bridge: {
                user: {
                    email: DEMO_USER.email
                }
            }
        }
    });

    await prisma.bridgeLog.deleteMany({
        where: {
            bridge: {
                user: {
                    email: DEMO_USER.email
                }
            }
        }
    });
});
