'use client';

import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { type McpBridgeFormData } from '../utils/types';

interface OpenAPIImportData {
    name: string;
    description: string;
    baseUrl: string;
    endpoints: Array<{
        name: string;
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
        path: string;
        description: string;
        parameters?: Array<{
            name: string;
            type: 'string' | 'number' | 'boolean' | 'object' | 'array';
            required: boolean;
            description: string;
            location: 'path' | 'query' | 'body';
            style: 'parameter' | 'replacement';
        }>;
    }>;
    authentication?: {
        type: 'none' | 'bearer' | 'apikey' | 'basic';
        token?: string;
        apiKey?: string;
        username?: string;
        password?: string;
        headerName?: string;
        keyLocation: 'header' | 'query';
        paramName?: string;
    };
    headers?: Record<string, string>;
    mcpTools?: Array<{
        name: string;
        description: string;
        inputSchema: {
            type: 'object';
            required: string[];
            properties: Record<string, {
                type: string;
                description?: string;
                format?: string;
                enum?: string[];
                minimum?: number;
                maximum?: number;
                pattern?: string;
                items?: {
                    type: string;
                    description?: string;
                    format?: string;
                    enum?: string[];
                };
            }>;
        };
        endpointId?: string;
    }>;
    mcpPrompts?: Array<{
        name: string;
        description: string;
        content?: string;
        arguments: Array<{
            name: string;
            description: string;
            required: boolean;
        }>;
    }>;
    mcpResources?: Array<{
        name: string;
        description: string;
        uri: string;
        mimeType: string;
        content?: string;
    }>;
}

export function useBasicInfoTab(form: UseFormReturn<McpBridgeFormData>) {
    const [showImportDialog, setShowImportDialog] = useState(false);
    const { toast } = useToast();

    const handleOpenAPIImport = (importData: OpenAPIImportData) => {
        // Populate form with imported data
        form.setValue('apiConfig.name', importData.name);
        form.setValue('apiConfig.baseUrl', importData.baseUrl);
        form.setValue('apiConfig.description', importData.description);

        // Auto-populate main bridge description if empty
        const currentBridgeDescription = form.getValues('description');
        if (!currentBridgeDescription && importData.description) {
            form.setValue('description', importData.description);
        }

        // Auto-generate bridge name if empty
        const currentBridgeName = form.getValues('name');
        if (!currentBridgeName) {
            form.setValue('name', `${importData.name} Bridge`);
        }

        // Handle authentication
        if (importData.authentication) {
            form.setValue('apiConfig.authentication', importData.authentication);
        }

        if (importData.headers) {
            form.setValue('apiConfig.headers', importData.headers);
        }

        // Set endpoints with proper parameters and IDs
        const endpointsWithDefaults = importData.endpoints.map((endpoint, index) => ({
            id: 'id' in endpoint ? endpoint.id as string : `endpoint-${Date.now()}-${index}`,
            name: endpoint.name,
            path: endpoint.path,
            method: endpoint.method,
            description: endpoint.description || '',
            parameters: (endpoint.parameters || []).map(param => ({
                name: param.name,
                type: param.type,
                required: param.required,
                description: param.description || '',
                location: param.location || 'query',
                style: param.style || 'parameter'
            }))
        }));
        form.setValue('apiConfig.endpoints', endpointsWithDefaults);

        // Set MCP content if provided
        if (importData.mcpTools) {
            const toolsWithDefaults = importData.mcpTools.map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: {
                    type: 'object' as const,
                    required: tool.inputSchema.required || [],
                    properties: tool.inputSchema.properties
                },
                endpointId: tool.endpointId
            }));
            form.setValue('mcpTools', toolsWithDefaults);
        }

        if (importData.mcpPrompts) {
            const promptsWithDefaults = importData.mcpPrompts.map(prompt => ({
                name: prompt.name,
                description: prompt.description,
                content: prompt.content || '',
                arguments: prompt.arguments.map(arg => ({
                    name: arg.name,
                    description: arg.description,
                    required: arg.required
                }))
            }));
            form.setValue('mcpPrompts', promptsWithDefaults);
        }

        if (importData.mcpResources) {
            const resourcesWithDefaults = importData.mcpResources.map(resource => ({
                name: resource.name,
                description: resource.description,
                uri: resource.uri,
                mimeType: resource.mimeType,
                content: resource.content || '',
            }));
            form.setValue('mcpResources', resourcesWithDefaults);
        }

        toast({
            title: "Import Successful",
            description: `Imported ${importData.endpoints.length} endpoints, ${importData.mcpTools?.length || 0} tools, ${importData.mcpPrompts?.length || 0} prompts, and ${importData.mcpResources?.length || 0} resources from ${importData.name}`,
            variant: "default",
        });
    };

    return {
        showImportDialog,
        setShowImportDialog,
        handleOpenAPIImport
    };
}
