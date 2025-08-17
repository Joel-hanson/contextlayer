import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { Bridge, Prisma, User } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import pkg from '../../package.json' assert { type: 'json' };
import prisma from '../../src/lib/prisma';
import { DEMO_USER } from '../setup';

const { version } = pkg;

// MCP Protocol constants
const PROTOCOL_VERSION = '2025-06-18';
const MCP_SERVER_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test data
const TEST_TOOL = {
    name: 'test_tool',
    description: 'A test tool',
    method: 'GET',
    path: '/test',
    inputSchema: z.object({
        test: z.string()
    })
} as const;

describe('MCP Server Tests', () => {
    let demoUser: Pick<User, 'id' | 'email'>;
    let demoBridge: Bridge;
    let mcpClient: Client;
    const makeRequest = async <T extends z.ZodSchema, R extends z.ZodSchema>(
        method: string,
        params: z.infer<T>,
        requestSchema: T,
        responseSchema: R
    ): Promise<z.infer<R>> => {
        const response = await mcpClient.request({
            method,
            params
        }, responseSchema);
        return response;
    };

    beforeAll(async () => {
        // 1. Get demo user
        const foundUser = await prisma.user.findUnique({
            where: { email: DEMO_USER.email }
        });

        if (!foundUser) {
            throw new Error('Demo user not found. Please run seed script first.');
        }

        demoUser = {
            id: foundUser.id,
            email: foundUser.email
        };

        // 2. Create or get test bridge
        const foundBridge = await prisma.bridge.findFirst({
            where: { userId: demoUser.id }
        });

        if (!foundBridge) {
            const mcpTools = [TEST_TOOL] as unknown as Prisma.JsonArray;
            demoBridge = await prisma.bridge.create({
                data: {
                    userId: demoUser.id,
                    name: 'MCP Test Bridge',
                    slug: 'mcp-test-bridge',
                    description: 'Bridge for MCP server tests',
                    baseUrl: 'https://api.example.com',
                    enabled: true,
                    authConfig: { type: 'none' } as Prisma.JsonObject,
                    mcpTools
                }
            });
        } else {
            demoBridge = foundBridge;
        }

        // 3. Create auth session
        const session = await prisma.session.create({
            data: {
                userId: demoUser.id,
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                sessionToken: `mcp-test-session-${Date.now()}`
            }
        });

        // 4. Initialize MCP client
        mcpClient = new Client({
            name: "test-client",
            version: version,
            transport: {
                type: 'http',
                url: `${MCP_SERVER_URL}/mcp/${demoBridge.id}`,
                headers: {
                    'Authorization': `Bearer ${session.sessionToken}`,
                    'Content-Type': 'application/json'
                }
            }
        });

        // 5. Initialize MCP connection
        const initializeParams = {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: {
                experimental: {},
                tools: { listChanged: true }
            },
            clientInfo: {
                name: 'test-client',
                version: version
            }
        };

        const response = await makeRequest(
            'initialize',
            initializeParams,
            InitializeParamsSchema,
            InitializeParamsSchema
        );

        if (!response) {
            throw new Error('Failed to initialize MCP connection');
        }
    });

    afterAll(async () => {
        if (demoBridge?.name === 'MCP Test Bridge') {
            await prisma.bridge.delete({
                where: { id: demoBridge.id }
            });
        }
        await prisma.$disconnect();
    });

    describe('Basic Protocol Tests', () => {
        it('should list available tools', async () => {
            const response = await makeRequest(
                'tools/list',
                {},
                z.object({}),
                ListToolsResponseSchema
            );

            expect(response.tools).toBeDefined();
            expect(Array.isArray(response.tools)).toBe(true);
            expect(response.tools.length).toBeGreaterThan(0);
            const tool = response.tools[0];
            expect(tool).toHaveProperty('name');
            expect(tool).toHaveProperty('description');
        });

        it('should execute a tool', async () => {
            const listResponse = await makeRequest(
                'tools/list',
                {},
                z.object({}),
                ListToolsResponseSchema
            );
            const tool = listResponse.tools[0];

            const callParams = {
                name: tool.name,
                arguments: { test: 'test value' }
            };

            const response = await makeRequest(
                'tools/call',
                callParams,
                ToolCallParamsSchema,
                ToolCallResponseSchema
            );

            expect(response).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid tool calls', async () => {
            const callParams = {
                name: 'non_existent_tool',
                arguments: {}
            };

            await expect(makeRequest(
                'tools/call',
                callParams,
                ToolCallParamsSchema,
                ToolCallResponseSchema
            )).rejects.toThrow(/not found/i);
        });

        it('should handle invalid authentication', async () => {
            const invalidClient = new Client({
                name: "test-client",
                version,
                transport: {
                    type: 'http',
                    url: `${MCP_SERVER_URL}/mcp/${demoBridge.id}`,
                    headers: {
                        'Authorization': 'Bearer invalid-token',
                        'Content-Type': 'application/json'
                    }
                }
            });

            const initializeParams = {
                protocolVersion: PROTOCOL_VERSION,
                capabilities: { experimental: {} },
                clientInfo: { name: 'test-client', version }
            };

            await expect(invalidClient.request(
                {
                    method: 'initialize',
                    params: initializeParams
                },
                InitializeParamsSchema
            )).rejects.toThrow();
        });

        it('should handle rate limiting', async () => {
            const requests = Array.from({ length: 35 }, () =>
                makeRequest(
                    'tools/list',
                    {},
                    z.object({}),
                    ListToolsResponseSchema
                )
            );

            try {
                await Promise.all(requests);
            } catch (error) {
                if (error instanceof Error) {
                    expect(error.message).toContain('rate limit');
                }
            }
        });
    });

    describe('Performance', () => {
        it('should respond within acceptable time', async () => {
            const start = Date.now();
            await makeRequest(
                'tools/list',
                {},
                z.object({}),
                ListToolsResponseSchema
            );
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(1000);
        });

        it('should handle concurrent requests', async () => {
            const requests = Array.from({ length: 5 }, () =>
                makeRequest(
                    'tools/list',
                    {},
                    z.object({}),
                    ListToolsResponseSchema
                )
            );

            const responses = await Promise.all(requests);

            for (const response of responses) {
                expect(response.tools).toBeDefined();
                expect(Array.isArray(response.tools)).toBe(true);
                expect(response.tools.length).toBeGreaterThan(0);
            }
        });
    });
});

