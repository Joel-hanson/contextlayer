'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { OpenAPIParser, ParsedOpenAPIResult } from '@/lib/openapi-parser';
import { AlertTriangle, CheckCircle, FileText, Globe, Upload } from 'lucide-react';
import { useState } from 'react';
import { type McpPrompt, type McpResource, type McpTool } from './types';

interface OpenAPIImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (data: {
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
        // MCP-specific content
        mcpTools?: McpTool[];
        mcpPrompts?: McpPrompt[];
        mcpResources?: McpResource[];
    }) => void;
}

export function OpenAPIImportDialog({ open, onOpenChange, onImport }: OpenAPIImportDialogProps) {
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
                    mimeType: resource.mimeType || 'application/json'
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
        onOpenChange(false);
    };

    const renderResult = () => {
        if (!result) return null;

        if (!result.success) {
            return (
                <Alert className="mt-4 border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                        <strong>Import Failed:</strong> {result.error}
                    </AlertDescription>
                </Alert>
            );
        }

        if (!result.data) return null;

        return (
            <div className="mt-4 space-y-4">
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        <strong>Import Successful!</strong> OpenAPI specification parsed successfully.
                    </AlertDescription>
                </Alert>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-gray-900">Parsed Configuration</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-gray-600">API Name:</span>
                            <p className="text-gray-900">{result.data.name}</p>
                        </div>

                        <div>
                            <span className="font-medium text-gray-600">Base URL:</span>
                            <p className="text-gray-900">{result.data.baseUrl}</p>
                        </div>

                        <div>
                            <span className="font-medium text-gray-600">Authentication:</span>
                            <p className="text-gray-900 capitalize">{result.data.authentication?.type || 'none'}</p>
                        </div>

                        <div>
                            <span className="font-medium text-gray-600">Endpoints:</span>
                            <p className="text-gray-900">{result.data.endpoints.length} found</p>
                        </div>

                        <div>
                            <span className="font-medium text-gray-600">MCP Tools:</span>
                            <p className="text-gray-900">{result.data.mcpTools.length} generated</p>
                        </div>

                        <div>
                            <span className="font-medium text-gray-600">MCP Prompts:</span>
                            <p className="text-gray-900">{result.data.mcpPrompts.length} generated</p>
                        </div>

                        <div>
                            <span className="font-medium text-gray-600">MCP Resources:</span>
                            <p className="text-gray-900">{result.data.mcpResources.length} generated</p>
                        </div>
                    </div>

                    {result.data.description && (
                        <div>
                            <span className="font-medium text-gray-600">Description:</span>
                            <p className="text-gray-900 text-sm mt-1">{result.data.description}</p>
                        </div>
                    )}

                    {result.warnings && result.warnings.length > 0 && (
                        <Alert className="border-orange-200 bg-orange-50">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800">
                                <strong>Warnings:</strong>
                                <ul className="mt-1 ml-4 list-disc">
                                    {result.warnings.map((warning, index) => (
                                        <li key={index}>{warning}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {result.data.endpoints.length > 0 && (
                        <div>
                            <span className="font-medium text-gray-600">Endpoints Preview:</span>
                            <div className="mt-2 max-h-32 overflow-y-auto">
                                {result.data.endpoints.slice(0, 5).map((endpoint) => (
                                    <div key={endpoint.id} className="flex items-center gap-2 py-1 text-sm">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-mono">
                                            {endpoint.method}
                                        </span>
                                        <span className="font-mono text-gray-600">{endpoint.path}</span>
                                        <span className="text-gray-500">({endpoint.name})</span>
                                    </div>
                                ))}
                                {result.data.endpoints.length > 5 && (
                                    <p className="text-gray-500 text-sm mt-1">
                                        ...and {result.data.endpoints.length - 5} more endpoints
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {result.data.mcpTools && result.data.mcpTools.length > 0 && (
                        <div>
                            <span className="font-medium text-gray-600">MCP Tools Preview:</span>
                            <div className="mt-2 max-h-24 overflow-y-auto">
                                {result.data.mcpTools.slice(0, 3).map((tool, index) => (
                                    <div key={index} className="flex items-center gap-2 py-1 text-sm">
                                        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-mono">
                                            TOOL
                                        </span>
                                        <span className="font-mono text-gray-600">{tool.name}</span>
                                        <span className="text-gray-500">({tool.description})</span>
                                    </div>
                                ))}
                                {result.data.mcpTools.length > 3 && (
                                    <p className="text-gray-500 text-sm mt-1">
                                        ...and {result.data.mcpTools.length - 3} more tools
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {result.data.mcpPrompts && result.data.mcpPrompts.length > 0 && (
                        <div>
                            <span className="font-medium text-gray-600">MCP Prompts Preview:</span>
                            <div className="mt-2 max-h-24 overflow-y-auto">
                                {result.data.mcpPrompts.slice(0, 3).map((prompt, index) => (
                                    <div key={index} className="flex items-center gap-2 py-1 text-sm">
                                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-mono">
                                            PROMPT
                                        </span>
                                        <span className="font-mono text-gray-600">{prompt.name}</span>
                                        <span className="text-gray-500">({prompt.description})</span>
                                    </div>
                                ))}
                                {result.data.mcpPrompts.length > 3 && (
                                    <p className="text-gray-500 text-sm mt-1">
                                        ...and {result.data.mcpPrompts.length - 3} more prompts
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {result.data.mcpResources && result.data.mcpResources.length > 0 && (
                        <div>
                            <span className="font-medium text-gray-600">MCP Resources Preview:</span>
                            <div className="mt-2 max-h-24 overflow-y-auto">
                                {result.data.mcpResources.slice(0, 3).map((resource, index) => (
                                    <div key={index} className="flex items-center gap-2 py-1 text-sm">
                                        <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs font-mono">
                                            RESOURCE
                                        </span>
                                        <span className="font-mono text-gray-600">{resource.name}</span>
                                        <span className="text-gray-500">({resource.mimeType})</span>
                                    </div>
                                ))}
                                {result.data.mcpResources.length > 3 && (
                                    <p className="text-gray-500 text-sm mt-1">
                                        ...and {result.data.mcpResources.length - 3} more resources
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Import OpenAPI/Swagger Specification
                    </DialogTitle>
                    <DialogDescription>
                        Import your API configuration from an OpenAPI 3.0 or Swagger specification.
                        This will automatically configure endpoints, authentication, and generate MCP tools, prompts, and resources.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3 gap-1">
                            <TabsTrigger value="url" className="text-xs sm:text-sm px-2 sm:px-3">
                                <Globe className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">From URL</span>
                                <span className="sm:hidden">URL</span>
                            </TabsTrigger>
                            <TabsTrigger value="file" className="text-xs sm:text-sm px-2 sm:px-3">
                                <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Upload File</span>
                                <span className="sm:hidden">File</span>
                            </TabsTrigger>
                            <TabsTrigger value="text" className="text-xs sm:text-sm px-2 sm:px-3">
                                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Paste Text</span>
                                <span className="sm:hidden">Text</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="url" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="spec-url">OpenAPI Specification URL</Label>
                                <Input
                                    id="spec-url"
                                    type="url"
                                    placeholder="https://api.example.com/openapi.json"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                                <p className="text-sm text-gray-500">
                                    Enter the URL to your OpenAPI specification (JSON format).
                                </p>
                            </div>

                            <Button
                                onClick={handleImportFromUrl}
                                disabled={isLoading || !url.trim()}
                                className="w-full"
                            >
                                {isLoading ? 'Importing...' : 'Import from URL'}
                            </Button>
                        </TabsContent>

                        <TabsContent value="text" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="spec-json">OpenAPI Specification JSON</Label>
                                <Textarea
                                    id="spec-json"
                                    placeholder="Paste your OpenAPI specification JSON content here..."
                                    value={jsonContent}
                                    onChange={(e) => setJsonContent(e.target.value)}
                                    className="min-h-[200px] font-mono text-sm"
                                />
                                <p className="text-sm text-gray-500">
                                    Paste the complete JSON content of your OpenAPI specification.
                                </p>
                            </div>

                            <Button
                                onClick={handleImportFromJson}
                                disabled={isLoading || !jsonContent.trim()}
                                className="w-full"
                            >
                                {isLoading ? 'Parsing...' : 'Parse JSON'}
                            </Button>
                        </TabsContent>

                        <TabsContent value="file" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="spec-file">OpenAPI Specification File</Label>
                                <Input
                                    id="spec-file"
                                    type="file"
                                    accept=".json,.yaml,.yml"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                <p className="text-sm text-gray-500">
                                    Select a JSON or YAML file containing your OpenAPI specification.
                                </p>
                            </div>

                            <Button
                                onClick={handleImportFromFile}
                                disabled={isLoading || !file}
                                className="w-full"
                            >
                                {isLoading ? 'Processing...' : 'Import from File'}
                            </Button>
                        </TabsContent>
                    </Tabs>

                    {renderResult()}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    {result?.success && result.data && (
                        <Button onClick={handleConfirmImport}>
                            Import Configuration
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
