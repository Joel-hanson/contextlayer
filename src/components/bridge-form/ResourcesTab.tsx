'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Database, Plus, Trash2 } from 'lucide-react';
import { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { type BridgeFormData } from './types';
interface ResourcesTabProps {
    form: UseFormReturn<BridgeFormData>;
    resourceFields: UseFieldArrayReturn<BridgeFormData, "mcpResources", "id">;
}

export function ResourcesTab({ form, resourceFields }: ResourcesTabProps) {
    const addResource = () => {
        resourceFields.append({
            uri: 'api://',
            name: '',
            description: '',
            mimeType: 'application/json',
        });
    };

    const removeResource = (index: number) => {
        resourceFields.remove(index);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        <div>
                            <CardTitle>MCP Resources</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Configure API endpoints and data to expose as MCP resources for AI model access
                            </p>
                        </div>
                    </div>
                    <Button type="button" onClick={addResource} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Resource
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {resourceFields.fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Database className="h-8 w-8 mx-auto mb-4 opacity-50" />
                        <p>No API resources configured</p>
                        <p className="text-sm">Resources expose API data as readable content for AI models</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {resourceFields.fields.map((field, index) => (
                            <Card key={field.id} className="p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">Resource {index + 1}</Badge>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeResource(index)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor={`resource-name-${index}`}>
                                            Resource Name *
                                        </Label>
                                        <Input
                                            id={`resource-name-${index}`}
                                            {...form.register(`mcpResources.${index}.name` as const)}
                                            placeholder="e.g., user-profiles, product-catalog"
                                        />
                                        {form.formState.errors.mcpResources?.[index]?.name && (
                                            <p className="text-sm text-red-600 mt-1">
                                                {form.formState.errors.mcpResources[index]?.name?.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor={`resource-uri-${index}`}>
                                            API Endpoint Pattern *
                                        </Label>
                                        <Input
                                            id={`resource-uri-${index}`}
                                            {...form.register(`mcpResources.${index}.uri` as const)}
                                            placeholder="e.g., api://users/{id}, api://products/search"
                                        />
                                        {form.formState.errors.mcpResources?.[index]?.uri && (
                                            <p className="text-sm text-red-600 mt-1">
                                                {form.formState.errors.mcpResources[index]?.uri?.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor={`resource-mime-${index}`}>
                                            Response Format
                                        </Label>
                                        <Input
                                            id={`resource-mime-${index}`}
                                            {...form.register(`mcpResources.${index}.mimeType` as const)}
                                            placeholder="e.g., application/json, text/csv"
                                        />
                                    </div>

                                    <div className="md:col-span-1">
                                        <Label htmlFor={`resource-description-${index}`}>
                                            Description
                                        </Label>
                                        <Textarea
                                            id={`resource-description-${index}`}
                                            {...form.register(`mcpResources.${index}.description` as const)}
                                            placeholder="Describe what API data this resource provides to AI models..."
                                            className="min-h-[80px]"
                                        />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-blue-900">About API Resources</p>
                            <p className="text-blue-700 mt-1">
                                Resources expose your API data as readable content for AI models. They automatically map to GET endpoints:
                            </p>
                            <ul className="list-disc list-inside mt-2 text-blue-700 space-y-1">
                                <li><strong>User Data:</strong> api://users/{'{'}userId{'}'} → GET /api/users/123</li>
                                <li><strong>Search Results:</strong> api://products/search → GET /api/products/search</li>
                                <li><strong>Reports:</strong> api://analytics/report → GET /api/analytics/report</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
