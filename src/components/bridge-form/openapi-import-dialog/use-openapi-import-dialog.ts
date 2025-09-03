'use client';

import { useToast } from '@/hooks/use-toast';
import { OpenAPIParser, ParsedOpenAPIResult } from '@/lib/openapi-parser';
import { useState } from 'react';
import { type McpPrompt, type McpResource, type McpTool } from '../utils/types';

export interface OpenAPIImportData {
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
    mcpTools?: McpTool[];
    mcpPrompts?: McpPrompt[];
    mcpResources?: McpResource[];
}

export interface UseOpenAPIImportDialogProps {
    onImport: (data: OpenAPIImportData) => void;
}

export function useOpenAPIImportDialog({ onImport }: UseOpenAPIImportDialogProps) {
    const [activeTab, setActiveTab] = useState('url');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ParsedOpenAPIResult | null>(null);
    const { toast } = useToast();

    // Form states
    const [url, setUrl] = useState('');
    const [jsonContent, setJsonContent] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleImportFromUrl = async () => {
        if (!url.trim()) {
            toast({
                title: "URL Required",
                description: "Please enter a valid OpenAPI specification URL",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const result = await OpenAPIParser.parseFromUrl(url);
            setResult(result);

            if (result.success && result.data) {
                toast({
                    title: "Import Successful",
                    description: `Successfully imported OpenAPI spec: ${result.data.name}`,
                    variant: "default",
                });
            } else {
                toast({
                    title: "Import Failed",
                    description: result.error || "Failed to parse OpenAPI specification",
                    variant: "destructive",
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast({
                title: "Import Failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleImportFromJson = () => {
        if (!jsonContent.trim()) {
            toast({
                title: "JSON Required",
                description: "Please paste your OpenAPI specification JSON content",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        setResult(null);

        const result = OpenAPIParser.parseFromJson(jsonContent);
        setResult(result);

        if (result.success && result.data) {
            toast({
                title: "Import Successful",
                description: `Successfully imported OpenAPI spec: ${result.data.name}`,
                variant: "default",
            });
        } else {
            toast({
                title: "Import Failed",
                description: result.error || "Failed to parse OpenAPI specification",
                variant: "destructive",
            });
        }

        setIsLoading(false);
    };

    const handleImportFromFile = async () => {
        if (!file) {
            toast({
                title: "File Required",
                description: "Please select an OpenAPI specification file",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const content = await file.text();
            let result: ParsedOpenAPIResult;

            if (file.name.endsWith('.json')) {
                result = OpenAPIParser.parseFromJson(content);
            } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
                result = OpenAPIParser.parseFromYaml();
            } else {
                // Try JSON first, then YAML
                result = OpenAPIParser.parseFromJson(content);
                if (!result.success) {
                    result = OpenAPIParser.parseFromYaml();
                }
            }

            setResult(result);

            if (result.success && result.data) {
                toast({
                    title: "Import Successful",
                    description: `Successfully imported OpenAPI spec: ${result.data.name}`,
                    variant: "default",
                });
            } else {
                toast({
                    title: "Import Failed",
                    description: result.error || "Failed to parse OpenAPI specification",
                    variant: "destructive",
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast({
                title: "Import Failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmImport = () => {
        if (result?.success && result.data) {
            // Transform the data to match the expected interface
            const transformedData = {
                name: result.data.name,
                description: result.data.description,
                baseUrl: result.data.baseUrl,
                endpoints: result.data.endpoints.map(endpoint => {
                    // Start with path/query parameters
                    const parameters = endpoint.parameters?.map(param => ({
                        name: param.name,
                        type: param.type,
                        required: param.required,
                        description: param.description,
                    })) || [];

                    // Add request body properties as additional parameters
                    if (endpoint.requestBody?.properties) {
                        const requestBodyParams = Object.entries(endpoint.requestBody.properties).map(([name, schema]) => {
                            // Map schema types to allowed types
                            let paramType: 'string' | 'number' | 'boolean' | 'object' | 'array';
                            switch (schema.type) {
                                case 'integer':
                                case 'number':
                                    paramType = 'number';
                                    break;
                                case 'boolean':
                                    paramType = 'boolean';
                                    break;
                                case 'array':
                                    paramType = 'array';
                                    break;
                                case 'object':
                                    paramType = 'object';
                                    break;
                                default:
                                    paramType = 'string';
                            }

                            return {
                                name,
                                type: paramType,
                                required: schema.required || false, // Use individual property's required flag
                                description: schema.description || `Request body field: ${name}`,
                            };
                        });
                        parameters.push(...requestBodyParams);
                    }

                    return {
                        name: endpoint.name,
                        method: endpoint.method,
                        path: endpoint.path,
                        description: endpoint.description || '',
                        parameters: parameters.map(param => ({
                            ...param,
                            description: param.description || '',
                            location: 'query' as const,
                            style: 'parameter' as const
                        })),
                    };
                }),
                authentication: result.data.authentication ? {
                    ...result.data.authentication,
                    keyLocation: result.data.authentication.keyLocation || 'header',
                    paramName: result.data.authentication.paramName
                } : undefined,
                headers: result.data.headers,
                // Include generated MCP content
                mcpTools: result.data.mcpTools.map(tool => ({
                    ...tool,
                    inputSchema: {
                        ...tool.inputSchema,
                        required: tool.inputSchema.required || []
                    },
                    endpointId: undefined
                })),
                mcpPrompts: result.data.mcpPrompts.map(prompt => ({
                    name: prompt.name,
                    description: prompt.description || '',
                    content: `Prompt for ${prompt.name}`,
                    arguments: (prompt.arguments || []).map(arg => ({
                        name: arg.name,
                        description: arg.description || '',
                        required: arg.required
                    }))
                })),
                mcpResources: result.data.mcpResources?.map(resource => ({
                    name: resource.name,
                    description: resource.description || '',
                    uri: resource.uri,
                    mimeType: resource.mimeType || 'application/json',
                    content: `Resource content for ${resource.name}`
                })),
            };

            onImport(transformedData);
            handleClose();
        }
    };

    const handleClose = () => {
        setUrl('');
        setJsonContent('');
        setFile(null);
        setResult(null);
        setActiveTab('url');
    };

    return {
        activeTab,
        setActiveTab,
        isLoading,
        result,
        url,
        setUrl,
        jsonContent,
        setJsonContent,
        file,
        setFile,
        handleImportFromUrl,
        handleImportFromJson,
        handleImportFromFile,
        handleConfirmImport,
        handleClose
    };
}
