'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

import { FileText, Info } from 'lucide-react';
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { OpenAPIImportDialog } from './OpenAPIImportDialog';
import { type McpBridgeFormData } from './types';

interface BasicInfoTabProps {
    form: UseFormReturn<McpBridgeFormData>;
}

export function BasicInfoTab({ form }: BasicInfoTabProps) {
    const [showImportDialog, setShowImportDialog] = useState(false);
    const { toast } = useToast();

    const handleOpenAPIImport = (importData: {
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
        // MCP content from OpenAPI
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
        }>;
    }) => {
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
                mimeType: resource.mimeType
            }));
            form.setValue('mcpResources', resourcesWithDefaults);
        }

        toast({
            title: "Import Successful",
            description: `Imported ${importData.endpoints.length} endpoints, ${importData.mcpTools?.length || 0} tools, ${importData.mcpPrompts?.length || 0} prompts, and ${importData.mcpResources?.length || 0} resources from ${importData.name}`,
            variant: "default",
        });
    };

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <div className="p-1.5 bg-zinc-100 rounded">
                                <Info className="h-3 w-3 text-zinc-600" />
                            </div>
                            MCP Server Information
                        </CardTitle>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowImportDialog(true)}
                            className="text-sm"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Import OpenAPI
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-sm font-medium">
                                MCP Server Name *
                            </Label>
                            <Input
                                id="name"
                                {...form.register('name')}
                                placeholder="GitHub Tools Server"
                                className="h-9"
                            />
                            {form.formState.errors.name && (
                                <p className="text-xs text-red-600">
                                    {form.formState.errors.name.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="apiName" className="text-sm font-medium">
                                Source API Name *
                            </Label>
                            <Input
                                id="apiName"
                                {...form.register('apiConfig.name')}
                                placeholder="GitHub API"
                                className="h-9"
                            />
                            {form.formState.errors.apiConfig?.name && (
                                <p className="text-xs text-red-600">
                                    {form.formState.errors.apiConfig.name.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="baseUrl" className="text-sm font-medium">
                            Base URL *
                        </Label>
                        <Input
                            id="baseUrl"
                            {...form.register('apiConfig.baseUrl')}
                            placeholder="https://api.github.com"
                            className="font-mono text-sm h-9"
                        />
                        {form.formState.errors.apiConfig?.baseUrl && (
                            <p className="text-xs text-red-600">
                                {form.formState.errors.apiConfig.baseUrl.message}
                            </p>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-sm font-medium">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            {...form.register('description')}
                            placeholder="Describe what this bridge does..."
                            className="h-20 resize-none text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="apiDescription" className="text-sm font-medium">
                            API Description
                        </Label>
                        <Textarea
                            id="apiDescription"
                            {...form.register('apiConfig.description')}
                            placeholder="Describe the API functionality..."
                            className="h-20 resize-none text-sm"
                        />
                    </div>
                </CardContent>
            </Card>

            <OpenAPIImportDialog
                open={showImportDialog}
                onOpenChange={setShowImportDialog}
                onImport={handleOpenAPIImport}
            />
        </>
    );
}
