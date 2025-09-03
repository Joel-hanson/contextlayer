import { OpenAPIParser } from '@/lib/openapi-parser';
import { BridgeConfig } from '@/lib/types';
import { McpBridgeFormData, McpEndpoint, McpPrompt, McpResource } from './types';

/**
 * Transforms form data into a BridgeConfig object for saving to the database
 */
export function transformFormDataToBridgeConfig(
    data: McpBridgeFormData,
    existingBridge?: BridgeConfig
): BridgeConfig {
    // Generate UUID for the bridge
    const bridgeId = existingBridge?.id || crypto.randomUUID();

    // Process endpoints to extract body parameters
    const processedEndpoints = data.apiConfig.endpoints.map((endpoint: McpEndpoint, index: number) => {
        // Preserve existing endpoint IDs when editing
        const existingEndpoint = existingBridge?.apiConfig.endpoints?.[index];

        // Build request body from parameters marked as 'body'
        const bodyParameters = endpoint.parameters?.filter(param => param.location === 'body') || [];
        const requestBody = bodyParameters.length > 0 ? {
            properties: bodyParameters.reduce((acc, param) => ({
                ...acc,
                [param.name]: {
                    type: param.type,
                    description: param.description,
                    required: param.required
                }
            }), {})
        } : undefined;

        return {
            ...endpoint,
            id: existingEndpoint?.id || crypto.randomUUID(),
            parameters: endpoint.parameters?.filter(param => param.location !== 'body') || [],
            requestBody: requestBody,
            responseSchema: undefined,
        };
    });

    // Generate MCP tools from endpoints
    const processedEndpointsForTools = data.apiConfig.endpoints.map(endpoint => {
        const bodyParameters = endpoint.parameters?.filter(p => p.location === 'body') || [];
        const requestBody = bodyParameters.length > 0 ? {
            properties: bodyParameters.reduce((acc, param) => ({
                ...acc,
                [param.name]: {
                    type: param.type,
                    description: param.description,
                    required: param.required
                }
            }), {})
        } : undefined;

        return {
            ...endpoint,
            parameters: endpoint.parameters?.filter(p => p.location !== 'body') || [],
            requestBody
        };
    });

    // Transform resources
    const resources = data.mcpResources?.map((resource: McpResource) => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description || '',
        mimeType: resource.mimeType || 'application/json',
        content: resource.content || ''
    })) || [];

    // Transform prompts
    const prompts = data.mcpPrompts?.map((prompt: McpPrompt) => ({
        name: prompt.name,
        description: prompt.description || '',
        content: prompt.content || '',
        arguments: prompt.arguments?.map((arg: { name: string; description: string; required: boolean }) => ({
            name: arg.name,
            description: arg.description || '',
            required: arg.required
        })) || []
    })) || [];

    return {
        id: bridgeId,
        slug: bridgeId, // Use UUID as slug
        name: data.name,
        description: data.description || '',
        apiConfig: {
            id: existingBridge?.apiConfig.id || crypto.randomUUID(),
            name: data.apiConfig.name,
            baseUrl: data.apiConfig.baseUrl,
            description: data.apiConfig.description || '',
            headers: data.apiConfig.headers || {},
            authentication: data.apiConfig.authentication,
            endpoints: processedEndpoints,
        },
        mcpTools: OpenAPIParser.generateMcpTools(processedEndpointsForTools),
        mcpResources: resources,
        mcpPrompts: prompts,
        enabled: existingBridge?.enabled ?? true, // Default to enabled for new bridges
        isPublic: data.isPublic ?? false, // Default to private

        // Access control - simplified
        access: {
            authRequired: data.access?.requiresAuthentication ?? false,
            apiKey: data.access?.apiKey,
            allowedOrigins: data.access?.allowedOrigins,
            tokens: [], // Tokens are now managed separately via API
            security: {
                tokenAuth: {
                    enabled: true,
                    requireToken: data.access?.requiresAuthentication ?? false,
                    allowMultipleTokens: true,
                },
                permissions: {
                    defaultPermissions: [],
                    requireExplicitGrants: false,
                    allowSelfManagement: true,
                },
                audit: {
                    enabled: true,
                    logRequests: true,
                    retentionDays: 30,
                },
            }
        },

        // Performance settings - simplified with defaults
        performance: {
            rateLimiting: { requestsPerMinute: 60, burstLimit: 10 },
            caching: { enabled: false, ttl: 300 },
            timeout: 30000,
        },

        createdAt: existingBridge?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Creates a default access token for a new bridge
 */
export async function createDefaultAccessToken(
    bridgeId: string,
    bridgeName: string
): Promise<{ success: boolean; message: string }> {
    try {
        const response = await fetch(`/api/bridges/${bridgeId}/tokens`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: `${bridgeName} Access Token`,
                description: 'Auto-generated access token for authentication',
                expiresInDays: undefined, // Never expires
                permissions: [],
            }),
        });

        const result = await response.json();
        return {
            success: result.success,
            message: result.success
                ? "Bridge created with a default access token"
                : "Failed to create access token"
        };
    } catch (error) {
        console.error('Failed to create default token:', error);
        return {
            success: false,
            message: "Bridge created successfully, but failed to create access token"
        };
    }
}
