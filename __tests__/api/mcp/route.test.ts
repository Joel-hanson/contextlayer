import { POST as handleMcp } from '@/app/mcp/[bridgeId]/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        bridge: {
            findUnique: vi.fn()
        }
    }
}));

// Mock next-auth
vi.mock('next-auth', () => ({
    getServerSession: vi.fn()
}));

describe('MCP API Tests', () => {
    const mockBridge = {
        id: 'test-bridge-id',
        name: 'Test Bridge',
        enabled: true,
        userId: 'test-user-id',
        apiConfig: {
            baseUrl: 'https://api.example.com',
            authentication: { type: 'none' },
            endpoints: [{
                method: 'GET',
                path: '/test',
                name: 'Test Endpoint'
            }]
        }
    };

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Mock bridge lookup
        (prisma.bridge.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockBridge);
    });

    describe('Initialize Request', () => {
        it('should handle initialize request', async () => {
            const { req } = createMocks({
                method: 'POST',
                body: {
                    jsonrpc: '2.0',
                    method: 'initialize',
                    id: 1
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response = await handleMcp(req, { params: Promise.resolve({ bridgeId: 'test-bridge-id' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual({
                jsonrpc: '2.0',
                id: 1,
                result: {
                    initialized: true,
                    serverInfo: {
                        name: mockBridge.name,
                        version: '1.0.0'
                    }
                }
            });
        });
    });

    describe('Tools List Request', () => {
        it('should return available tools', async () => {
            const { req } = createMocks({
                method: 'POST',
                body: {
                    jsonrpc: '2.0',
                    method: 'tools/list',
                    id: 2
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response = await handleMcp(req, { params: Promise.resolve({ bridgeId: 'test-bridge-id' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.jsonrpc).toBe('2.0');
            expect(data.id).toBe(2);
            expect(Array.isArray(data.result)).toBe(true);
        });
    });

    describe('Authentication', () => {
        it('should require authentication when bridge is not public', async () => {
            // Mock private bridge
            (prisma.bridge.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                ...mockBridge,
                access: { public: false, authRequired: true }
            });

            const { req } = createMocks({
                method: 'POST',
                body: {
                    jsonrpc: '2.0',
                    method: 'tools/list',
                    id: 3
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response = await handleMcp(req, { params: Promise.resolve({ bridgeId: 'test-bridge-id' }) });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBeDefined();
            expect(data.error.code).toBe(-32001);
        });

        it('should accept valid authentication', async () => {
            // Mock authenticated session
            (getServerSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                user: { id: mockBridge.userId }
            });

            const { req } = createMocks({
                method: 'POST',
                body: {
                    jsonrpc: '2.0',
                    method: 'tools/list',
                    id: 4
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer valid-token'
                }
            });

            const response = await handleMcp(req, { params: Promise.resolve({ bridgeId: 'test-bridge-id' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.error).toBeUndefined();
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid JSON-RPC requests', async () => {
            const { req } = createMocks({
                method: 'POST',
                body: Buffer.from('invalid json'),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response = await handleMcp(req, { params: Promise.resolve({ bridgeId: 'test-bridge-id' }) });
            const data = await response.json();

            expect(response.status).toBe(200); // JSON-RPC spec requires 200
            expect(data.error.code).toBe(-32700);
        });

        it('should handle non-existent methods', async () => {
            const { req } = createMocks({
                method: 'POST',
                body: {
                    jsonrpc: '2.0',
                    method: 'non_existent_method',
                    id: 5
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response = await handleMcp(req, { params: Promise.resolve({ bridgeId: 'test-bridge-id' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.error.code).toBe(-32601);
        });
    });
});
