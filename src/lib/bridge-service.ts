import { ApiEndpoint, AuthenticationType, Bridge, BridgeLog, BridgeStatus, HttpMethod } from '@prisma/client'
import prisma from './prisma'
import { BridgeConfig } from './types'

// Type for endpoint parameter
interface EndpointParameter {
    name: string
    type: string
    required: boolean
    description?: string
    defaultValue?: unknown
}

// Transform Prisma Bridge to BridgeConfig
function transformBridgeToBridgeConfig(bridge: Bridge & { endpoints: ApiEndpoint[] }): BridgeConfig {
    return {
        id: bridge.id,
        slug: bridge.slug || bridge.id, // Fallback to id if slug is somehow missing
        name: bridge.name,
        description: bridge.description || '',
        apiConfig: {
            id: bridge.id,
            name: bridge.name,
            baseUrl: bridge.baseUrl,
            description: bridge.description || '',
            headers: bridge.headers as Record<string, string> || {},
            authentication: {
                type: bridge.authType as 'none' | 'bearer' | 'apikey' | 'basic',
                token: bridge.authToken || undefined,
                apiKey: bridge.authApiKey || undefined,
                username: bridge.authUsername || undefined,
                password: bridge.authPassword || undefined,
                headerName: bridge.authHeaderName || undefined,
            },
            endpoints: bridge.endpoints.map((endpoint: ApiEndpoint) => ({
                id: endpoint.id,
                name: endpoint.name,
                method: endpoint.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
                path: endpoint.path,
                description: endpoint.description || undefined,
                parameters: endpoint.parameters ? (endpoint.parameters as unknown as EndpointParameter[]).map(p => ({
                    name: p.name,
                    type: p.type as 'string' | 'number' | 'boolean' | 'object' | 'array',
                    required: p.required,
                    description: p.description,
                    defaultValue: p.defaultValue,
                })) : [],
                requestBody: endpoint.requestBody as { contentType: string; schema: unknown } | undefined,
                responseSchema: endpoint.responseSchema as unknown,
            })),
        },
        mcpTools: [], // Generated dynamically
        enabled: bridge.enabled,

        // Path-based routing configuration
        routing: {
            type: bridge.routingType as 'path' | 'subdomain' | 'websocket',
            customDomain: bridge.customDomain || undefined,
            pathPrefix: bridge.pathPrefix || undefined,
        },

        // Access control
        access: {
            public: bridge.isPublic,
            allowedOrigins: bridge.allowedOrigins as string[] || undefined,
            authRequired: bridge.authRequired,
            apiKey: bridge.apiKey || undefined,
        },

        // Performance settings
        performance: bridge.performanceConfig as {
            rateLimiting: { requestsPerMinute: number; burstLimit: number };
            caching: { enabled: boolean; ttl: number };
            timeout: number;
        } || {
            rateLimiting: { requestsPerMinute: 60, burstLimit: 10 },
            caching: { enabled: false, ttl: 300 },
            timeout: 30000,
        },

        createdAt: bridge.createdAt.toISOString(),
        updatedAt: bridge.updatedAt.toISOString(),
    }
}

// Transform BridgeConfig to Prisma data
function transformBridgeConfigToPrismaData(config: BridgeConfig) {
    return {
        id: config.id,
        name: config.name,
        slug: config.slug, // Now always provided as UUID
        description: config.description,
        baseUrl: config.apiConfig.baseUrl,
        headers: config.apiConfig.headers || {},
        authType: config.apiConfig.authentication?.type as AuthenticationType || 'none',
        authToken: config.apiConfig.authentication?.token,
        authApiKey: config.apiConfig.authentication?.apiKey,
        authUsername: config.apiConfig.authentication?.username,
        authPassword: config.apiConfig.authentication?.password,
        authHeaderName: config.apiConfig.authentication?.headerName,
        enabled: config.enabled,

        // Path-based routing configuration
        routingType: config.routing?.type || 'path',
        customDomain: config.routing?.customDomain,
        pathPrefix: config.routing?.pathPrefix,

        // Access control
        isPublic: config.access?.public ?? true,
        allowedOrigins: config.access?.allowedOrigins || [],
        authRequired: config.access?.authRequired ?? false,
        apiKey: config.access?.apiKey,

        // Performance settings as JSONB
        performanceConfig: config.performance || {
            rateLimiting: { requestsPerMinute: 60, burstLimit: 10 },
            caching: { enabled: false, ttl: 300 },
            timeout: 30000,
        },
    }
}

export class BridgeService {
    // Get all bridges for a specific user
    static async getAllBridges(userId?: string): Promise<BridgeConfig[]> {
        try {
            const bridges = await prisma.bridge.findMany({
                where: userId ? { userId } : undefined,
                include: {
                    endpoints: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            })

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
                            parameters: endpoint.parameters || [],
                            requestBody: endpoint.requestBody,
                            responseSchema: endpoint.responseSchema,
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

    // Update bridge (with user filtering)
    static async updateBridge(id: string, config: BridgeConfig, userId?: string): Promise<BridgeConfig> {
        try {
            const bridgeData = transformBridgeConfigToPrismaData(config)

            // Delete existing endpoints and create new ones (for simplicity)
            await prisma.apiEndpoint.deleteMany({
                where: { bridgeId: id },
            })

            const bridge = await prisma.bridge.update({
                where: {
                    id,
                    ...(userId && { userId })
                },
                data: {
                    ...bridgeData,
                    endpoints: {
                        create: config.apiConfig.endpoints.map(endpoint => ({
                            id: endpoint.id,
                            name: endpoint.name,
                            method: endpoint.method as HttpMethod,
                            path: endpoint.path,
                            description: endpoint.description,
                            parameters: endpoint.parameters || [],
                            requestBody: endpoint.requestBody,
                            responseSchema: endpoint.responseSchema,
                        })),
                    },
                },
                include: {
                    endpoints: true,
                },
            })

            return transformBridgeToBridgeConfig(bridge)
        } catch (error) {
            console.error(`Error updating bridge ${id}:`, error)
            throw new Error('Failed to update bridge')
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

    // Update bridge status (with user filtering)
    static async updateBridgeStatus(id: string, enabled: boolean, status: BridgeStatus = 'inactive', userId?: string): Promise<void> {
        try {
            await prisma.bridge.update({
                where: {
                    id,
                    ...(userId && { userId })
                },
                data: {
                    enabled,
                    status,
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
                    ...data,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    headers: data.headers as any,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    body: data.body as any,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    response: data.response as any,
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
