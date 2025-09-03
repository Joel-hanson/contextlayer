'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle, FileText, Globe, Upload } from 'lucide-react';
import { useOpenAPIImportDialog, type OpenAPIImportData } from './use-openapi-import-dialog';

interface OpenAPIImportDialogUIProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (data: OpenAPIImportData) => void;
}

export function OpenAPIImportDialogUI({ open, onOpenChange, onImport }: OpenAPIImportDialogUIProps) {
    const {
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
    } = useOpenAPIImportDialog({ onImport });

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            handleClose();
        }
        onOpenChange(open);
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
        <Dialog open={open} onOpenChange={handleOpenChange}>
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
