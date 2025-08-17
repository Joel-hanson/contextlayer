import prisma from '@/lib/prisma';
import { beforeAll, describe, expect, it } from 'vitest';
import { DEMO_USER, getAuthHeaders } from '../setup';

describe('MCP Bridge Integration Tests', () => {
    let demoBridge: any;

    beforeAll(async () => {
        // Get the first bridge owned by demo user
        demoBridge = await prisma.bridge.findFirst({
            where: {
                user: {
                    email: DEMO_USER.email
                }
            }
        });

        if (!demoBridge) {
            throw new Error('No bridges found for demo user. Please run `npm run db:seed` first.');
        }
    });

    describe('MCP Protocol', () => {
        it('should initialize connection with demo bridge', async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mcp/${demoBridge.id}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'initialize',
                    id: 1
                })
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.jsonrpc).toBe('2.0');
            expect(data.result.initialized).toBe(true);
        });

        it('should respect rate limits for demo user', async () => {
            // Demo user is limited to 30 requests per minute
            const promises = Array.from({ length: 35 }, (_, i) =>
                fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mcp/${demoBridge.id}`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'tools/list',
                        id: i + 1
                    })
                })
            );

            const responses = await Promise.all(promises);
            const rateLimited = responses.filter(r => r.status === 429);
            expect(rateLimited.length).toBeGreaterThan(0);
        });

        it('should list available tools', async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mcp/${demoBridge.id}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'tools/list',
                    id: 2
                })
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(Array.isArray(data.result)).toBe(true);
            expect(data.result.length).toBeGreaterThan(0);
        });

        it('should execute a demo tool', async () => {
            // First get available tools
            const toolsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mcp/${demoBridge.id}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'tools/list',
                    id: 3
                })
            });

            const toolsData = await toolsResponse.json();
            const firstTool = toolsData.result[0];

            // Execute the first available tool
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mcp/${demoBridge.id}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'tools/invoke',
                    params: {
                        name: firstTool.name,
                        parameters: {}
                    },
                    id: 4
                })
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.error).toBeUndefined();
            expect(data.result).toBeDefined();
        });
    });

    describe('Bridge Management', () => {
        it('should get bridge details', async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/bridges/${demoBridge.id}`, {
                headers: getAuthHeaders()
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.id).toBe(demoBridge.id);
        });

        it('should update bridge configuration', async () => {
            const updatedConfig = {
                ...demoBridge,
                description: `Updated at ${new Date().toISOString()}`
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/bridges/${demoBridge.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedConfig)
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.description).toBe(updatedConfig.description);
        });

        it('should enforce demo user bridge limits', async () => {
            // Demo user is limited to 2 bridges
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/bridges`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: 'Test Bridge',
                    description: 'This should fail due to bridge limit',
                    baseUrl: 'https://api.example.com',
                    authConfig: { type: 'none' }
                })
            });

            expect(response.status).toBe(403);
            const data = await response.json();
            expect(data.error).toContain('bridge limit');
        });
    });
});
