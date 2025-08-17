import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

const DEMO_USER_ID = 'ede33bad-c911-476b-8268-5657a3454a02'; // Replace with actual demo user ID
const DEMO_EMAIL = 'demo@contextlayer.app';
const DEMO_PASSWORD = 'demo123';

describe('Bridge API Tests', () => {
    let testBridgeId: string;

    let demoUser: { id: string; email: string };

    // Generate test data
    const mockBridgeInput = {
        name: `Test Bridge ${Date.now()}`,
        description: 'Test Bridge Description',
        baseUrl: 'https://api.example.com',
        authConfig: { type: 'none' as const },
        mcpTools: [{
            name: 'test_tool',
            description: 'Test tool',
            inputSchema: {
                type: 'object',
                properties: {
                    test: { type: 'string' }
                }
            }
        }],
        enabled: true,
        slug: uuidv4() // Generate a unique slug for the test bridge
    };

    beforeEach(async () => {
        // Get the demo user that should have been created by the seed script
        const foundUser = await prisma.user.findUnique({
            where: { email: DEMO_EMAIL }
        });

        if (!foundUser) {
            throw new Error('Demo user not found. Please run `npx prisma db seed` first.');
        }

        demoUser = { id: foundUser.id, email: foundUser.email };

        // Clean up test data from previous runs
        await prisma.bridge.deleteMany({
            where: {
                name: { startsWith: 'Test Bridge' },
                userId: demoUser.id
            }
        });
    });

    describe('POST /api/bridges', () => {
        it('should create a new bridge', async () => {
            // Create a session first
            const session = await prisma.session.create({
                data: {
                    userId: demoUser.id,
                    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    sessionToken: `test-session-${Date.now()}`
                }
            });

            // Create a bridge using the API
            const request = new NextRequest('http://localhost:3000/api/bridges', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.sessionToken}`
                },
                body: JSON.stringify(mockBridgeInput)
            });

            const { POST: createBridge } = await import('@/app/api/bridges/route');
            const response = await createBridge(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data).toMatchObject({
                ...mockBridgeInput,
                userId: DEMO_USER_ID
            });

            testBridgeId = data.id;

            // Verify in database
            const createdBridge = await prisma.bridge.findUnique({
                where: { id: testBridgeId }
            });

            expect(createdBridge).toBeDefined();
            expect(createdBridge?.name).toBe(mockBridgeInput.name);
        });
    });

    describe('PUT /api/bridges/[id]', () => {
        it('should update an existing bridge', async () => {
            // First create a bridge if not exists
            if (!testBridgeId) {
                const bridge = await prisma.bridge.create({
                    data: {
                        ...mockBridgeInput,
                        userId: DEMO_USER_ID
                    }
                });
                testBridgeId = bridge.id;
            }

            // Create a session first
            const session = await prisma.session.create({
                data: {
                    userId: demoUser.id,
                    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    sessionToken: `test-session-${Date.now()}`
                }
            });

            // Update via API
            const updates = { name: `Updated Bridge ${Date.now()}` };
            const request = new NextRequest(`http://localhost:3000/api/bridges/${testBridgeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.sessionToken}`
                },
                body: JSON.stringify(updates)
            });

            const { PUT: updateBridge } = await import('@/app/api/bridges/[id]/route');
            const response = await updateBridge(request, { params: Promise.resolve({ id: testBridgeId }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.name).toBe(updates.name);

            // Verify in database
            const updatedBridge = await prisma.bridge.findUnique({
                where: { id: testBridgeId }
            });

            expect(updatedBridge).toBeDefined();
            expect(updatedBridge?.name).toBe(updates.name);
        });
    });

    describe('DELETE /api/bridges/[id]', () => {
        it('should delete a bridge', async () => {
            // First create a bridge if not exists
            if (!testBridgeId) {
                const bridge = await prisma.bridge.create({
                    data: {
                        ...mockBridgeInput,
                        userId: DEMO_USER_ID
                    }
                });
                testBridgeId = bridge.id;
            }

            // Create a session first
            const session = await prisma.session.create({
                data: {
                    userId: demoUser.id,
                    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    sessionToken: `test-session-${Date.now()}`
                }
            });

            // Delete via API
            const request = new NextRequest(`http://localhost:3000/api/bridges/${testBridgeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.sessionToken}`
                }
            });

            const { DELETE: deleteBridge } = await import('@/app/api/bridges/[id]/route');
            const response = await deleteBridge(request, { params: Promise.resolve({ id: testBridgeId }) });

            expect(response.status).toBe(200);

            // Verify deletion in database
            const deletedBridge = await prisma.bridge.findUnique({
                where: { id: testBridgeId }
            });

            expect(deletedBridge).toBeNull();
        });
    });

    afterAll(async () => {
        // Cleanup any test bridges
        if (testBridgeId) {
            try {
                await prisma.bridge.delete({
                    where: { id: testBridgeId }
                });
            } catch {
                // Ignore if bridge was already deleted
            }
        }
    });
});
