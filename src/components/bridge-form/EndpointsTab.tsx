'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { UseFieldArrayReturn, UseFormReturn, useFieldArray } from 'react-hook-form';

interface BridgeFormData {
    name: string;
    description?: string;
    apiConfig: {
        name: string;
        baseUrl: string;
        description?: string;
        headers?: Record<string, string>;
        authentication?: {
            type: 'none' | 'bearer' | 'apikey' | 'basic';
            token?: string;
            apiKey?: string;
            username?: string;
            password?: string;
            headerName?: string;
        };
        endpoints: Array<{
            name: string;
            method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
            path: string;
            description?: string;
            parameters?: Array<{
                name: string;
                type: 'string' | 'number' | 'boolean' | 'object' | 'array';
                required: boolean;
                description?: string;
            }>;
        }>;
    };
    routing?: {
        type: 'path' | 'subdomain' | 'websocket';
        customDomain?: string;
        pathPrefix?: string;
    };
    access?: {
        public: boolean;
        allowedOrigins?: string[];
        authRequired: boolean;
        apiKey?: string;
    };
}

interface EndpointsTabProps {
    form: UseFormReturn<BridgeFormData>;
    endpointFields: UseFieldArrayReturn<BridgeFormData, "apiConfig.endpoints", "id">;
    testingEndpoint?: string | null;
    onTestEndpoint?: (endpoint: BridgeFormData['apiConfig']['endpoints'][0]) => Promise<void>;
}

// Component for managing parameters within each endpoint
interface ParametersSectionProps {
    form: UseFormReturn<BridgeFormData>;
    endpointIndex: number;
}

function ParametersSection({ form, endpointIndex }: ParametersSectionProps) {
    const parameterFields = useFieldArray({
        control: form.control,
        name: `apiConfig.endpoints.${endpointIndex}.parameters`,
    });

    const { fields: parameters, append, remove } = parameterFields;

    const addParameter = () => {
        append({
            name: '',
            type: 'string',
            required: false,
            description: '',
        });
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Parameters</Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addParameter}
                    className="h-7 text-xs"
                >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Parameter
                </Button>
            </div>

            {parameters.length === 0 ? (
                <div className="text-xs text-muted-foreground p-3 bg-gray-50 rounded-md border-dashed border">
                    No parameters defined. Add parameters that MCP clients should provide when calling this endpoint.
                </div>
            ) : (
                <div className="space-y-2">
                    {parameters.map((param, paramIndex) => (
                        <Card key={param.id} className="border border-gray-200">
                            <CardContent className="p-3 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Parameter Name</Label>
                                        <Input
                                            {...form.register(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.name`)}
                                            placeholder="id, title, etc."
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Type</Label>
                                        <Select
                                            value={form.watch(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.type`)}
                                            onValueChange={(value) =>
                                                form.setValue(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.type`, value as 'string' | 'number' | 'boolean' | 'object' | 'array')
                                            }
                                        >
                                            <SelectTrigger className="h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="string">String</SelectItem>
                                                <SelectItem value="number">Number</SelectItem>
                                                <SelectItem value="boolean">Boolean</SelectItem>
                                                <SelectItem value="object">Object</SelectItem>
                                                <SelectItem value="array">Array</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Description</Label>
                                    <Input
                                        {...form.register(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.description`)}
                                        placeholder="Describe this parameter..."
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={form.watch(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.required`)}
                                            onCheckedChange={(checked) =>
                                                form.setValue(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.required`, checked)
                                            }
                                        />
                                        <Label className="text-xs font-medium">Required</Label>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => remove(paramIndex)}
                                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export function EndpointsTab({ form, endpointFields, testingEndpoint, onTestEndpoint }: EndpointsTabProps) {
    const { fields, append, remove } = endpointFields;

    const addEndpoint = () => {
        append({
            name: '',
            method: 'GET',
            path: '',
            description: '',
            parameters: [],
        });
    };

    const getMethodBadgeColor = (method: string) => {
        const colors = {
            GET: 'bg-blue-100 text-blue-800 border-blue-200',
            POST: 'bg-green-100 text-green-800 border-green-200',
            PUT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            DELETE: 'bg-red-100 text-red-800 border-red-200',
            PATCH: 'bg-purple-100 text-purple-800 border-purple-200',
        };
        return colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">API Endpoints</h3>
                    <p className="text-sm text-muted-foreground">
                        Define the endpoints that will be available through MCP tools
                    </p>
                </div>
                <Button onClick={addEndpoint} size="sm" className="h-8">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Endpoint
                </Button>
            </div>

            {fields.length === 0 ? (
                <Card className="border-dashed border-orange-200 bg-orange-50">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertTriangle className="h-8 w-8 text-orange-600 mb-3" />
                        <div className="text-center space-y-2">
                            <p className="font-medium text-orange-900">
                                No endpoints configured
                            </p>
                            <p className="text-sm text-orange-700 max-w-md">
                                Without endpoints, this bridge won&apos;t provide any tools to MCP clients.
                                Add at least one endpoint to make your API accessible through the Model Context Protocol.
                            </p>
                        </div>
                        <Button onClick={addEndpoint} className="mt-4" variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Endpoint
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <Card key={field.id} className="relative">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Badge
                                            variant="outline"
                                            className={`px-2 py-1 text-xs font-mono ${getMethodBadgeColor(
                                                form.watch(`apiConfig.endpoints.${index}.method`) || 'GET'
                                            )}`}
                                        >
                                            {form.watch(`apiConfig.endpoints.${index}.method`) || 'GET'}
                                        </Badge>
                                        Endpoint {index + 1}
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => remove(index)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium">Endpoint Name *</Label>
                                        <Input
                                            {...form.register(`apiConfig.endpoints.${index}.name`)}
                                            placeholder="Get Repository"
                                            className="h-9"
                                        />
                                        {form.formState.errors.apiConfig?.endpoints?.[index]?.name && (
                                            <p className="text-xs text-red-600">
                                                {form.formState.errors.apiConfig.endpoints[index]?.name?.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium">HTTP Method</Label>
                                        <Select
                                            value={form.watch(`apiConfig.endpoints.${index}.method`)}
                                            onValueChange={(value) =>
                                                form.setValue(`apiConfig.endpoints.${index}.method`, value as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')
                                            }
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="GET">GET</SelectItem>
                                                <SelectItem value="POST">POST</SelectItem>
                                                <SelectItem value="PUT">PUT</SelectItem>
                                                <SelectItem value="DELETE">DELETE</SelectItem>
                                                <SelectItem value="PATCH">PATCH</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Path *</Label>
                                    <Input
                                        {...form.register(`apiConfig.endpoints.${index}.path`)}
                                        placeholder="/repos/{owner}/{repo}"
                                        className="font-mono text-sm h-9"
                                    />
                                    {form.formState.errors.apiConfig?.endpoints?.[index]?.path && (
                                        <p className="text-xs text-red-600">
                                            {form.formState.errors.apiConfig.endpoints[index]?.path?.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Description</Label>
                                    <Input
                                        {...form.register(`apiConfig.endpoints.${index}.description`)}
                                        placeholder="Retrieve repository information"
                                        className="h-9"
                                    />
                                </div>

                                {/* Parameters Section */}
                                <div className="pt-2 border-t">
                                    <ParametersSection form={form} endpointIndex={index} />
                                </div>

                                {onTestEndpoint && (
                                    <div className="pt-2 border-t">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onTestEndpoint(form.watch(`apiConfig.endpoints.${index}`))}
                                            disabled={testingEndpoint === form.watch(`apiConfig.endpoints.${index}.name`)}
                                            className="h-8"
                                        >
                                            {testingEndpoint === form.watch(`apiConfig.endpoints.${index}.name`) ? 'Testing...' : 'Test Endpoint'}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
