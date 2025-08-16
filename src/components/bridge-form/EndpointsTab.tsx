'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { generateStandardToolName } from '@/lib/tool-name-generator';
import { cn } from '@/lib/utils';
import { AlertTriangle, Bot, CheckCircle2, ChevronDown, ChevronUp, Globe2, Info, Plus, Sparkles, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { UseFieldArrayReturn, UseFormReturn, useFieldArray } from 'react-hook-form';
import { type McpBridgeFormData, type McpEndpoint } from './types';

/**
 * Generates a standardized tool name from method and path
 */
function generateToolName({ method, path }: { method: string; path: string }): string {
    return generateStandardToolName(method, path);
}

/**
 * Validates a tool name according to MCP naming conventions
 */
function validateToolName(name: string): { isValid: boolean; message?: string } {
    // Tool name should be lowercase with underscores
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
        return {
            isValid: false,
            message: "Tool name must start with a lowercase letter and contain only lowercase letters, numbers, and underscores"
        };
    }

    // Check length
    if (name.length < 3) {
        return {
            isValid: false,
            message: "Tool name must be at least 3 characters long"
        };
    }

    if (name.length > 50) {
        return {
            isValid: false,
            message: "Tool name must not exceed 50 characters"
        };
    }

    // No consecutive underscores
    if (name.includes('__')) {
        return {
            isValid: false,
            message: "Tool name must not contain consecutive underscores"
        };
    }

    // Cannot end with underscore
    if (name.endsWith('_')) {
        return {
            isValid: false,
            message: "Tool name must not end with an underscore"
        };
    }

    return { isValid: true };
}

interface EndpointsTabProps {
    form: UseFormReturn<McpBridgeFormData>;
    endpointFields: UseFieldArrayReturn<McpBridgeFormData, "apiConfig.endpoints", "id">;
    testingEndpoint?: string | null;
    onTestEndpoint?: (endpoint: McpEndpoint) => Promise<void>;
}

// Component for managing parameters within each endpoint
interface ParametersSectionProps {
    form: UseFormReturn<McpBridgeFormData>;
    endpointIndex: number;
}

function ParametersSection({ form, endpointIndex }: ParametersSectionProps) {
    const parameterFields = useFieldArray({
        control: form.control,
        name: `apiConfig.endpoints.${endpointIndex}.parameters`,
    });

    const { fields: parameters, append, remove } = parameterFields;

    const addParameter = () => {
        // Add a new parameter with default values that match both form and API schemas
        const newParameter: McpEndpoint['parameters'][0] = {
            name: '',
            type: 'string',
            required: false,
            description: '',
            location: 'query',
            style: 'parameter', // Default style
        };
        append(newParameter);
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
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={form.watch(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.required`)}
                                                onCheckedChange={(checked) =>
                                                    form.setValue(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.required`, checked)
                                                }
                                            />
                                            <Label className="text-xs font-medium">Required</Label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Select
                                                value={form.watch(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.location`) || 'query'}
                                                onValueChange={(value: 'path' | 'query' | 'body') => {
                                                    form.setValue(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.location`, value);
                                                    if (value === 'path') {
                                                        form.setValue(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.required`, true);
                                                        form.setValue(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.style`, 'parameter');
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="h-8 w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="path">URL Path</SelectItem>
                                                    <SelectItem value="query">Query String</SelectItem>
                                                    <SelectItem value="body">Request Body</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Label className="text-xs font-medium">Location</Label>
                                        </div>

                                        {form.watch(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.location`) === 'path' && (
                                            <div className="flex items-center space-x-2">
                                                <Select
                                                    value={form.watch(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.style`) || 'parameter'}
                                                    onValueChange={(value: 'parameter' | 'replacement') => {
                                                        form.setValue(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.style`, value);
                                                    }}
                                                >
                                                    <SelectTrigger className="h-8 w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="parameter">Path Parameter</SelectItem>
                                                        <SelectItem value="replacement">Path Replacement</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Label className="text-xs font-medium">Style</Label>
                                            </div>
                                        )}
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

function generateExampleUrl(path: string, parameters: McpEndpoint['parameters']) {
    let exampleUrl = path;
    const queryParams: string[] = [];

    parameters.forEach(param => {
        const exampleValue = getExampleValue(param.type);
        if (param.location === 'path') {
            exampleUrl = exampleUrl.replace(`{${param.name}}`, exampleValue);
        } else if (param.location === 'query') {
            queryParams.push(`${param.name}=${encodeURIComponent(exampleValue)}`);
        }
    });

    if (queryParams.length > 0) {
        exampleUrl += `?${queryParams.join('&')}`;
    }

    return exampleUrl;
}

function getExampleValue(type: string): string {
    switch (type) {
        case 'string':
            return 'example';
        case 'number':
            return '123';
        case 'boolean':
            return 'true';
        case 'object':
            return '{...}';
        case 'array':
            return '[...]';
        default:
            return 'value';
    }
}

export function EndpointsTab({ form, endpointFields, testingEndpoint, onTestEndpoint }: EndpointsTabProps) {
    const { fields, append, remove } = endpointFields;
    const [openPreview, setOpenPreview] = useState<number[]>([]);

    const togglePreview = (index: number) => {
        setOpenPreview(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const addEndpoint = () => {
        const newEndpoint: McpEndpoint = {
            id: `endpoint-${Date.now()}`,
            name: '',
            method: 'GET',
            path: '',
            description: '',
            parameters: [], // Initialize with empty array to ensure it's defined
        };
        append(newEndpoint);
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
                    <h3 className="text-lg font-semibold">AI Tools</h3>
                    <p className="text-sm text-muted-foreground">
                        Define API endpoints that will be exposed as AI tools for assistants to call
                    </p>
                </div>
                <Button onClick={addEndpoint} size="sm" className="h-8">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Tool
                </Button>
            </div>

            {fields.length === 0 ? (
                <Card className="border-dashed border-orange-200 bg-orange-50">
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <AlertTriangle className="h-12 w-12 text-orange-600 mb-6" />

                        <div className="text-center space-y-4 max-w-lg">
                            <div>
                                <h3 className="text-xl font-semibold text-orange-900 mb-2">
                                    No AI Tools Configured
                                </h3>
                                <p className="text-orange-700 text-base leading-relaxed">
                                    Your MCP server needs tools to provide functionality to AI assistants.
                                    Add API endpoints that will become callable tools.
                                </p>
                            </div>

                            <div className="bg-white/50 rounded-lg p-4 border border-orange-200">
                                <p className="font-medium text-orange-900 mb-3 text-sm">
                                    💡 Common Examples:
                                </p>
                                <div className="space-y-2 text-sm text-orange-700">
                                    <div className="flex items-center gap-2">
                                        <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">GET</code>
                                        <span>/users - Retrieve user list</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">POST</code>
                                        <span>/users - Create new user</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">GET</code>
                                        <span>/users/{'{id}'} - Get specific user</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col items-center gap-3">
                            <Button
                                onClick={addEndpoint}
                                size="lg"
                                className="h-12 px-8"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Add Your First Tool
                            </Button>
                            <p className="text-sm text-orange-600 text-center">
                                Or use <strong>&quot;Import from OpenAPI&quot;</strong> in the Basic Info tab to auto-configure
                            </p>
                        </div>
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
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium flex items-center gap-1">
                                            Tool Name <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 space-y-1.5">
                                                <div className="relative">
                                                    <Input
                                                        {...form.register(`apiConfig.endpoints.${index}.name`, {
                                                            validate: (value) => {
                                                                const validation = validateToolName(value);
                                                                return validation.isValid || validation.message;
                                                            }
                                                        })}
                                                        placeholder="Enter a descriptive tool name"
                                                        className={cn(
                                                            "h-8 font-mono text-sm",
                                                            form.formState.errors.apiConfig?.endpoints?.[index]?.name
                                                                ? "border-destructive focus-visible:ring-destructive"
                                                                : ""
                                                        )}
                                                        onChange={(e) => {
                                                            e.target.value = e.target.value.toLowerCase();
                                                            form.setValue(`apiConfig.endpoints.${index}.name`, e.target.value);
                                                        }}
                                                    />
                                                    {form.watch(`apiConfig.endpoints.${index}.name`) && (
                                                        <div className="absolute right-2 top-1.5">
                                                            {form.formState.errors.apiConfig?.endpoints?.[index]?.name ? (
                                                                <XCircle className="h-5 w-5 text-destructive" />
                                                            ) : (
                                                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {form.watch(`apiConfig.endpoints.${index}.method`) && form.watch(`apiConfig.endpoints.${index}.path`) && (
                                                    <HoverCard>
                                                        <HoverCardTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                type='button'
                                                                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                                                            >
                                                                <Sparkles className="h-3 w-3 mr-1" />
                                                                Suggested name
                                                            </Button>
                                                        </HoverCardTrigger>
                                                        <HoverCardContent side="bottom" align="start" className="w-fit">
                                                            <div className="flex items-center gap-1.5">
                                                                <Badge variant="outline" className="font-mono bg-muted">
                                                                    {generateToolName({
                                                                        method: form.watch(`apiConfig.endpoints.${index}.method`),
                                                                        path: form.watch(`apiConfig.endpoints.${index}.path`),
                                                                    })}
                                                                </Badge>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const generatedName = generateToolName({
                                                                            method: form.watch(`apiConfig.endpoints.${index}.method`),
                                                                            path: form.watch(`apiConfig.endpoints.${index}.path`),
                                                                        });
                                                                        form.setValue(`apiConfig.endpoints.${index}.name`, generatedName);
                                                                    }}
                                                                    className="h-6 px-2"
                                                                    disabled={!form.watch(`apiConfig.endpoints.${index}.method`) || !form.watch(`apiConfig.endpoints.${index}.path`)}
                                                                >
                                                                    Use
                                                                </Button>
                                                            </div>
                                                        </HoverCardContent>
                                                    </HoverCard>
                                                )}
                                            </div>
                                        </div>
                                        {form.formState.errors.apiConfig?.endpoints?.[index]?.name ? (
                                            <p className="text-xs text-destructive">
                                                {form.formState.errors.apiConfig.endpoints[index]?.name?.message}
                                            </p>
                                        ) : (
                                            <div className="text-xs text-muted-foreground flex items-center gap-3">
                                                <span>Must be 3-50 chars</span>
                                                <span>•</span>
                                                <span>Lowercase with underscores</span>
                                                <span>•</span>
                                                <span>No consecutive underscores</span>
                                            </div>
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
                                                <SelectItem value="GET">
                                                    <div className="flex items-center space-x-2 py-0.5">
                                                        <Badge variant="outline" className="min-w-[40px] justify-center bg-blue-100 text-blue-800 border-blue-200 text-xs px-1 py-0">GET</Badge>
                                                        <span className="text-xs">Read data</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="POST">
                                                    <div className="flex items-center space-x-2 py-0.5">
                                                        <Badge variant="outline" className="min-w-[40px] justify-center bg-green-100 text-green-800 border-green-200 text-xs px-1 py-0">POST</Badge>
                                                        <span className="text-xs">Create data</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="PUT">
                                                    <div className="flex items-center space-x-2 py-0.5">
                                                        <Badge variant="outline" className="min-w-[40px] justify-center bg-yellow-100 text-yellow-800 border-yellow-200 text-xs px-1 py-0">PUT</Badge>
                                                        <span className="text-xs">Update data</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="PATCH">
                                                    <div className="flex items-center space-x-2 py-0.5">
                                                        <Badge variant="outline" className="min-w-[40px] justify-center bg-purple-100 text-purple-800 border-purple-200 text-xs px-1 py-0">PATCH</Badge>
                                                        <span className="text-xs">Partial update</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="DELETE">
                                                    <div className="flex items-center space-x-2 py-0.5">
                                                        <Badge variant="outline" className="min-w-[40px] justify-center bg-red-100 text-red-800 border-red-200 text-xs px-1 py-0">DELETE</Badge>
                                                        <span className="text-xs">Remove data</span>
                                                    </div>
                                                </SelectItem>
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

                                {/* URL Preview */}
                                <div className="pt-2">
                                    <Collapsible open={openPreview.includes(index)}>
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                                                onClick={() => togglePreview(index)}
                                            >
                                                <Globe2 className="h-4 w-4" />
                                                URL Preview
                                            </Label>
                                            <CollapsibleTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => togglePreview(index)}
                                                >
                                                    {openPreview.includes(index) ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </CollapsibleTrigger>
                                        </div>

                                        <CollapsibleContent>
                                            {form.watch(`apiConfig.endpoints.${index}.path`) && (
                                                <div className="mt-2 rounded-md bg-muted/50 border p-3 space-y-3">
                                                    {/* Pattern */}
                                                    <div className="space-y-1">
                                                        <div className="text-xs text-muted-foreground font-medium">Pattern:</div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Badge variant="outline" className={cn(
                                                                "px-1.5 font-mono",
                                                                getMethodBadgeColor(form.watch(`apiConfig.endpoints.${index}.method`) || 'GET')
                                                            )}>
                                                                {form.watch(`apiConfig.endpoints.${index}.method`)}
                                                            </Badge>
                                                            <code className="text-xs font-mono bg-background rounded px-1.5 py-0.5 border">
                                                                {form.watch(`apiConfig.endpoints.${index}.path`)}
                                                            </code>
                                                        </div>
                                                    </div>

                                                    {/* Parameters */}
                                                    {form.watch(`apiConfig.endpoints.${index}.parameters`)?.length > 0 && (
                                                        <div className="space-y-1">
                                                            <div className="text-xs text-muted-foreground font-medium">Parameters:</div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {form.watch(`apiConfig.endpoints.${index}.parameters`).map((param, pIdx) => (
                                                                    <div key={pIdx} className="flex items-center gap-2 bg-background/50 rounded-sm px-2 py-1">
                                                                        <Badge variant="outline" className={cn(
                                                                            "px-1 py-0 h-4 text-[10px]",
                                                                            param.location === 'path'
                                                                                ? "bg-blue-50 border-blue-200 text-blue-700"
                                                                                : param.location === 'query'
                                                                                    ? "bg-purple-50 border-purple-200 text-purple-700"
                                                                                    : "bg-orange-50 border-orange-200 text-orange-700"
                                                                        )}>
                                                                            {param.location}
                                                                        </Badge>
                                                                        <span className="font-mono text-xs">{param.name}</span>
                                                                        <span className="text-[10px] text-muted-foreground">({param.type})</span>
                                                                        {param.required && (
                                                                            <span className="text-destructive text-[10px]">*</span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Example URL */}
                                                    <div className="space-y-1 border-t pt-2">
                                                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                                                            <Bot className="h-3 w-3" />
                                                            Example call:
                                                        </div>
                                                        <code className="text-xs font-mono block bg-background rounded p-2 border whitespace-pre-wrap break-all">
                                                            {generateExampleUrl(
                                                                form.watch(`apiConfig.endpoints.${index}.path`),
                                                                form.watch(`apiConfig.endpoints.${index}.parameters`) || []
                                                            )}
                                                        </code>
                                                    </div>

                                                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                        <Info className="h-3 w-3" />
                                                        The example above shows how the URL will be structured with parameters
                                                    </div>
                                                </div>
                                            )}
                                        </CollapsibleContent>
                                    </Collapsible>
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
    )
}