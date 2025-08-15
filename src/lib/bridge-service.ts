import { ApiEndpoint, Bridge, BridgeLog, HttpMethod } from '@prisma/client';
import prisma from './prisma';
import { BridgeConfig } from './types';

// Transform Prisma Bridge to BridgeConfig
function transformBridgeToBridgeConfig(bridge: Bridge & { endpoints: ApiEndpoint[] }): BridgeConfig {
    // Parse auth config from JSON
    const authConfig = bridge.authConfig as {
        type: 'none' | 'bearer' | 'apikey' | 'basic';
        token?: string;
        apiKey?: string;
        username?: string;
        password?: string;
        headerName?: string;
    } | null;

    // Parse access config from JSON
    const accessConfig = bridge.accessConfig as {
        public?: boolean;
        authRequired?: boolean;
        apiKey?: string;
    } | null;

    return {
        id: bridge.id,
        name: bridge.name,
        slug: bridge.slug,
        description: bridge.description || '',
        enabled: bridge.enabled,
        createdAt: bridge.createdAt.toISOString(),
        updatedAt: bridge.updatedAt.toISOString(),
        apiConfig: {
            id: bridge.id,
            name: bridge.name,
            baseUrl: bridge.baseUrl,
            description: bridge.description || '',
            headers: bridge.headers as Record<string, string> || undefined,
            authentication: authConfig || { type: 'none' },
            endpoints: bridge.endpoints.map(endpoint => {
                const config = endpoint.config as {
                    parameters?: unknown[];
                    requestBody?: unknown;
                    responseSchema?: unknown;
                } | null;
                return {
                    id: endpoint.id,
                    name: endpoint.name,
                    method: endpoint.method,
                    path: endpoint.path,
                    description: endpoint.description || '',
                    parameters: (config?.parameters || []) as Array<{
                        name: string;
                        type: 'string' | 'number' | 'boolean' | 'object' | 'array';
                        required: boolean;
                        description?: string;
                        defaultValue?: unknown;
                    }>,
                    requestBody: config?.requestBody as { contentType: string; schema?: unknown } | undefined,
                    responseSchema: config?.responseSchema,
                }
            }),
        },
        mcpTools: (bridge.mcpTools as Array<{
            name: string;
            description: string;
            inputSchema: {
                type: 'object';
                properties: Record<string, unknown>;
                required?: string[];
            };
        }>) || [],
        mcpResources: (bridge.mcpResources as Array<{
            uri: string;
            name: string;
            description?: string;
            mimeType?: string;
        }>) || [],
        mcpPrompts: (bridge.mcpPrompts as Array<{
            name: string;
            description?: string;
            arguments?: Array<{
                name: string;
                required: boolean;
                description?: string;
            }>;
        }>) || [],
        access: {
            public: accessConfig?.public ?? true,
            authRequired: accessConfig?.authRequired ?? false,
            apiKey: accessConfig?.apiKey,
            tokens: [], // Required by type but managed separately
            security: {  // Using default security settings
                tokenAuth: {
                    enabled: true,
                    requireToken: false,
                    allowMultipleTokens: true
                },
                permissions: {
                    defaultPermissions: [],
                    requireExplicitGrants: false,
                    allowSelfManagement: true
                },
                audit: {
                    enabled: true,
                    logRequests: true,
                    retentionDays: 30
                }
            }
        },
        performance: {  // Using default performance settings
            timeout: 30000,
            rateLimiting: { requestsPerMinute: 60, burstLimit: 10 },
            caching: { enabled: false, ttl: 300 }
        }
    }
}

// Transform BridgeConfig to Prisma Bridge data
function transformBridgeConfigToPrismaData(config: BridgeConfig) {
    return {
        id: config.id,
        name: config.name,
        slug: config.slug, // Now required UUID
        description: config.description,
        baseUrl: config.apiConfig.baseUrl,

        // Consolidate auth config - handle null properly for Prisma
        authConfig: config.apiConfig.authentication && config.apiConfig.authentication.type !== 'none' ? {
            type: config.apiConfig.authentication.type,
            token: config.apiConfig.authentication.token,
            apiKey: config.apiConfig.authentication.apiKey,
            username: config.apiConfig.authentication.username,
            password: config.apiConfig.authentication.password,
            headerName: config.apiConfig.authentication.headerName,
        } : undefined,

        headers: config.apiConfig.headers || undefined,

        // Simplified access config
        accessConfig: {
            public: config.access?.public ?? true,
            authRequired: config.access?.authRequired ?? false,
            apiKey: config.access?.apiKey || null
        },

        // MCP Content
        mcpTools: config.mcpTools && config.mcpTools.length > 0 ? config.mcpTools : undefined,
        mcpPrompts: config.mcpPrompts && config.mcpPrompts.length > 0 ? config.mcpPrompts : undefined,
        mcpResources: config.mcpResources && config.mcpResources.length > 0 ? config.mcpResources : undefined,

        enabled: config.enabled ?? true, // Default to enabled
        createdAt: config.createdAt ? new Date(config.createdAt) : new Date(),
        updatedAt: config.updatedAt ? new Date(config.updatedAt) : new Date(),
    }
}

export class BridgeService {
    // Get all bridges for a specific user with pagination
    static async getAllBridges(userId?: string, page: number = 1, limit: number = 50): Promise<BridgeConfig[]> {
        try {
            // Get bridges with pagination and caching hints
            const bridges = await prisma.bridge.findMany({
                where: userId ? { userId } : undefined,
                include: {
                    endpoints: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: limit,
                skip: (page - 1) * limit,
            });

            return bridges.map(transformBridgeToBridgeConfig)
        } catch (error) {
            console.error('Error fetching bridges:', error)
            throw new Error('Failed to fetch bridges')
        }
    }

    // Get bridge by ID (with user filtering)
    static async getBridgeById(id: string, userId?: string): Promise<BridgeConfig | null> {
        try {
            const bridge = await prisma.bridge.findUnique({
                where: {
                    id,
                    ...(userId && { userId })
                },
                include: {
                    endpoints: true,
                },
            })

            if (!bridge) return null
            return transformBridgeToBridgeConfig(bridge)
        } catch (error) {
            console.error(`Error fetching bridge ${id}:`, error)
            throw new Error('Failed to fetch bridge')
        }
    }

    // Create new bridge
    static async createBridge(config: BridgeConfig, userId: string): Promise<BridgeConfig> {
        try {
            const bridgeData = transformBridgeConfigToPrismaData(config)

            const bridge = await prisma.bridge.create({
                data: {
                    ...bridgeData,
                    userId, // Add userId to bridge creation
                    endpoints: {
                        create: config.apiConfig.endpoints.map(endpoint => ({
                            id: endpoint.id,
                            name: endpoint.name,
                            method: endpoint.method as HttpMethod,
                            path: endpoint.path,
                            description: endpoint.description,
                            config: JSON.parse(JSON.stringify({
                                parameters: endpoint.parameters || [],
                                requestBody: endpoint.requestBody,
                                responseSchema: endpoint.responseSchema,
                            }))
                        })),
                    },
                },
                include: {
                    endpoints: true,
                },
            })

            return transformBridgeToBridgeConfig(bridge)
        } catch (error) {
            console.error('Error creating bridge:', error)
            throw new Error('Failed to create bridge')
        }
    }

    // Update bridge (with user filtering) - or create if it doesn't exist
    static async updateBridge(id: string, config: BridgeConfig, userId?: string): Promise<BridgeConfig> {
        try {
            // First check if the bridge exists
            const existingBridge = await prisma.bridge.findUnique({
                where: {
                    id,
                    ...(userId && { userId })
                }
            })

            // If bridge doesn't exist, create it
            if (!existingBridge) {
                return this.createBridge(config, userId!)
            }

            const bridgeData = transformBridgeConfigToPrismaData(config)

            // Use transaction to update bridge and endpoints efficiently
            const bridge = await prisma.$transaction(async (tx) => {
                // Get existing endpoint IDs
                const existingEndpoints = await tx.apiEndpoint.findMany({
                    where: { bridgeId: id },
                    select: { id: true }
                });
                const existingIds = new Set(existingEndpoints.map(e => e.id));

                // Split endpoints into updates and creates
                const endpointsToUpdate = config.apiConfig.endpoints.filter(e => existingIds.has(e.id));
                const endpointsToCreate = config.apiConfig.endpoints.filter(e => !existingIds.has(e.id));
                const endpointIdsToKeep = new Set(config.apiConfig.endpoints.map(e => e.id));

                // Delete removed endpoints
                if (existingEndpoints.length > 0) {
                    await tx.apiEndpoint.deleteMany({
                        where: {
                            bridgeId: id,
                            id: { notIn: Array.from(endpointIdsToKeep) }
                        }
                    });
                }

                // Update existing endpoints
                await Promise.all(endpointsToUpdate.map(endpoint =>
                    tx.apiEndpoint.update({
                        where: { id: endpoint.id },
                        data: {
                            name: endpoint.name,
                            method: endpoint.method as HttpMethod,
                            path: endpoint.path,
                            description: endpoint.description,
                            config: JSON.parse(JSON.stringify({
                                parameters: endpoint.parameters || [],
                                requestBody: endpoint.requestBody,
                                responseSchema: endpoint.responseSchema,
                            }))
                        }
                    })
                ));

                // Create new endpoints
                if (endpointsToCreate.length > 0) {
                    await tx.apiEndpoint.createMany({
                        data: endpointsToCreate.map(endpoint => ({
                            id: endpoint.id,
                            bridgeId: id,
                            name: endpoint.name,
                            method: endpoint.method as HttpMethod,
                            path: endpoint.path,
                            description: endpoint.description,
                            config: JSON.parse(JSON.stringify({
                                parameters: endpoint.parameters || [],
                                requestBody: endpoint.requestBody,
                                responseSchema: endpoint.responseSchema,
                            }))
                        }))
                    });
                }

                // Update bridge
                return tx.bridge.update({
                    where: {
                        id,
                        ...(userId && { userId })
                    },
                    data: bridgeData,
                    include: {
                        endpoints: true,
                    },
                });
            });

            return transformBridgeToBridgeConfig(bridge)
        } catch (error) {
            console.error(`Error updating bridge ${id}:`, error)
            throw new Error('Failed to update bridge')
        }
    }

    // Create a copy of an existing bridge with a new ID
    static async copyBridge(sourceId: string, newConfig: BridgeConfig, userId?: string): Promise<BridgeConfig> {
        try {
            // Simply create a new bridge with the new config
            return this.createBridge(newConfig, userId!)
        } catch (error) {
            console.error(`Error copying bridge ${sourceId}:`, error)
            throw new Error('Failed to copy bridge')
        }
    }

    // Delete bridge (with user filtering)
    static async deleteBridge(id: string, userId?: string): Promise<void> {
        try {
            await prisma.bridge.delete({
                where: {
                    id,
                    ...(userId && { userId })
                },
            })
        } catch (error) {
            console.error(`Error deleting bridge ${id}:`, error)
            throw new Error('Failed to delete bridge')
        }
    }

    // Update bridge status (with user filtering) - Simplified since we removed status field
    static async updateBridgeStatus(id: string, enabled: boolean, userId?: string): Promise<void> {
        try {
            await prisma.bridge.update({
                where: {
                    id,
                    ...(userId && { userId })
                },
                data: {
                    enabled,
                    updatedAt: new Date(),
                },
            })
        } catch (error) {
            console.error(`Error updating bridge status ${id}:`, error)
            throw new Error('Failed to update bridge status')
        }
    }

    // Add bridge log
    static async addBridgeLog(bridgeId: string, level: string, message: string, metadata?: Record<string, unknown>): Promise<void> {
        try {
            await prisma.bridgeLog.create({
                data: {
                    bridgeId,
                    level,
                    message,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    metadata: metadata as any,
                },
            })
        } catch (error) {
            console.error('Error adding bridge log:', error)
            // Don't throw error for logging failures
        }
    }

    // Get bridge logs
    static async getBridgeLogs(bridgeId: string, limit: number = 100): Promise<BridgeLog[]> {
        try {
            return await prisma.bridgeLog.findMany({
                where: { bridgeId },
                orderBy: { createdAt: 'desc' },
                take: limit,
            })
        } catch (error) {
            console.error(`Error fetching logs for bridge ${bridgeId}:`, error)
            return []
        }
    }

    // Record API request
    static async recordApiRequest(data: {
        bridgeId: string
        endpointId?: string
        method: string
        path: string
        headers?: Record<string, unknown>
        body?: Record<string, unknown>
        response?: Record<string, unknown>
        statusCode?: number
        responseTime?: number
        success: boolean
        errorMessage?: string
    }): Promise<void> {
        try {
            await prisma.apiRequest.create({
                data: {
                    bridgeId: data.bridgeId,
                    endpointId: data.endpointId,
                    method: data.method,
                    path: data.path,
                    requestData: (data.headers || data.body) ? JSON.parse(JSON.stringify({
                        headers: data.headers || {},
                        body: data.body || {},
                        query: {}
                    })) : null,
                    responseData: data.response ? JSON.parse(JSON.stringify({
                        body: data.response,
                        headers: {},
                        statusCode: data.statusCode || 0
                    })) : null,
                    responseTime: data.responseTime,
                    success: data.success,
                    errorMessage: data.errorMessage,
                },
            })
        } catch (error) {
            console.error('Error recording API request:', error)
            // Don't throw error for request recording failures
        }
    }

    // Get API request stats
    static async getApiRequestStats(bridgeId: string, hours: number = 24) {
        try {
            const since = new Date(Date.now() - hours * 60 * 60 * 1000)

            const [totalRequests, successfulRequests, failedRequests, avgResponseTime] = await Promise.all([
                prisma.apiRequest.count({
                    where: { bridgeId, createdAt: { gte: since } },
                }),
                prisma.apiRequest.count({
                    where: { bridgeId, success: true, createdAt: { gte: since } },
                }),
                prisma.apiRequest.count({
                    where: { bridgeId, success: false, createdAt: { gte: since } },
                }),
                prisma.apiRequest.aggregate({
                    where: { bridgeId, responseTime: { not: null }, createdAt: { gte: since } },
                    _avg: { responseTime: true },
                }),
            ])

            return {
                totalRequests,
                successfulRequests,
                failedRequests,
                successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
                avgResponseTime: avgResponseTime._avg.responseTime || 0,
            }
        } catch (error) {
            console.error(`Error fetching stats for bridge ${bridgeId}:`, error)
            return {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                successRate: 0,
                avgResponseTime: 0,
            }
        }
    }
}
