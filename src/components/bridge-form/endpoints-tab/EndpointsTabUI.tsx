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
import { generateStandardToolName } from '@/lib/tool-name-generator';
import { cn } from '@/lib/utils';
import { AlertTriangle, Bot, ChevronDown, ChevronUp, Globe2, Info, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { type McpBridgeFormData } from '../utils/types';
import { EndpointParameterForm } from './EndpointParameterForm';
import { useEndpointsTab } from './use-endpoints-tab';

interface EndpointsTabUIProps {
    form: UseFormReturn<McpBridgeFormData>;
    endpointFields: UseFieldArrayReturn<McpBridgeFormData, "apiConfig.endpoints", "id">;
}

/**
 * Generates a standardized tool name from method and path
 */
function generateToolName({ method, path }: { method: string; path: string }): string {
    return generateStandardToolName(method, path);
}

/**
 * Validates a tool name according to MCP naming conventions
 */
function isValidToolName(name: string): boolean {
    // Tool names must be lowercase alphanumeric with underscores
    // Must start with a letter and be at least 3 characters
    return /^[a-z][a-z0-9_]{2,}$/.test(name);
}

export function EndpointsTabUI({ form, endpointFields }: EndpointsTabUIProps) {
    const {
        activeEndpointId,
        setActiveEndpointId,
        searchQuery,
        setSearchQuery,
        filterMethod,
        setFilterMethod,
        addEndpoint,
        removeEndpoint,
        filteredEndpoints
    } = useEndpointsTab(form, endpointFields);

    const methodColors: Record<string, string> = {
        GET: 'bg-green-50 text-green-700 border-green-200',
        POST: 'bg-blue-50 text-blue-700 border-blue-200',
        PUT: 'bg-orange-50 text-orange-700 border-orange-200',
        PATCH: 'bg-purple-50 text-purple-700 border-purple-200',
        DELETE: 'bg-red-50 text-red-700 border-red-200',
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <div className="p-1.5 bg-zinc-100 rounded">
                                <Bot className="h-3 w-3 text-zinc-600" />
                            </div>
                            MCP Tools
                        </CardTitle>
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={addEndpoint}
                            className="text-sm"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Endpoint
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {endpointFields.fields.length === 0 ? (
                        <div className="text-center p-6 border border-dashed rounded-lg bg-muted/40">
                            <h3 className="font-medium mb-2">No API Endpoints Added</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Add endpoints from your API to expose them as MCP tools
                            </p>
                            <Button
                                type="button"
                                onClick={addEndpoint}
                                variant="outline"
                                className="mx-auto"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Endpoint
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search endpoints..."
                                        className="pl-8 h-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Select
                                    value={filterMethod || "all"}
                                    onValueChange={(value) => setFilterMethod(value === "all" ? null : value)}
                                >
                                    <SelectTrigger className="w-[150px] h-9">
                                        <SelectValue placeholder="Filter by method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Methods</SelectItem>
                                        <SelectItem value="GET">GET</SelectItem>
                                        <SelectItem value="POST">POST</SelectItem>
                                        <SelectItem value="PUT">PUT</SelectItem>
                                        <SelectItem value="PATCH">PATCH</SelectItem>
                                        <SelectItem value="DELETE">DELETE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border rounded-md divide-y">
                                {filteredEndpoints.length > 0 ? (
                                    filteredEndpoints.map((endpoint) => {
                                        const originalIndex = endpointFields.fields.findIndex(
                                            e => e.id === endpoint.id
                                        );

                                        // Single watch call to get all endpoint data - reduces form subscriptions and re-renders
                                        const endpointData = form.watch(`apiConfig.endpoints.${originalIndex}`) || {};
                                        const parameters = endpointData.parameters || [];
                                        const name = endpointData.name || '';
                                        const method = endpointData.method || 'GET';
                                        const path = endpointData.path || '';
                                        const isActive = activeEndpointId === endpoint.id;

                                        const generateName = () => {
                                            if (!path) return;
                                            const toolName = generateToolName({ method, path });
                                            form.setValue(`apiConfig.endpoints.${originalIndex}.name`, toolName);
                                        };

                                        // Only generate suggested name when we have the required data
                                        const suggestedName = (path && method) ? generateToolName({ method, path }) : '';

                                        // Only validate when name has actual content
                                        const shouldShowValidation = name.length > 0 && !isValidToolName(name);

                                        // Simple comparison for suggested name status
                                        const isUsingSuggestedName = name === suggestedName;

                                        return (
                                            <Collapsible
                                                key={endpoint.id}
                                                open={isActive}
                                                onOpenChange={() => setActiveEndpointId(isActive ? null : endpoint.id)}
                                                className="border-0"
                                            >
                                                <div className={cn("flex items-start justify-between p-3 hover:bg-muted/40 transition-colors", {
                                                    "bg-muted/40": isActive
                                                })}>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge variant="outline" className={cn("h-6 px-2 font-medium", methodColors[method])}>
                                                                {method}
                                                            </Badge>
                                                            <div className="flex-1 font-mono text-sm truncate">
                                                                {path || <span className="text-muted-foreground italic">No path defined</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-sm font-medium truncate flex-1 min-w-0">
                                                                {name || <span className="text-muted-foreground italic">Unnamed tool</span>}
                                                            </span>
                                                            {shouldShowValidation && (
                                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex gap-1 items-center">
                                                                    <AlertTriangle className="h-3 w-3" />
                                                                    Invalid tool name
                                                                </Badge>
                                                            )}
                                                            {parameters.length > 0 && (
                                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                    {parameters.length} {parameters.length === 1 ? 'parameter' : 'parameters'}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-4">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => removeEndpoint(originalIndex)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                        </Button>
                                                        <CollapsibleTrigger asChild>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                            >
                                                                {isActive ? (
                                                                    <ChevronUp className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </CollapsibleTrigger>
                                                    </div>
                                                </div>

                                                <CollapsibleContent>
                                                    <div className="p-4 pt-0 bg-muted/40 space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center justify-between">
                                                                    <Label htmlFor={`name-${endpoint.id}`} className="text-sm font-medium">
                                                                        Tool Name *
                                                                    </Label>
                                                                    <HoverCard>
                                                                        <HoverCardTrigger asChild>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-7 w-7"
                                                                                onClick={generateName}
                                                                                disabled={!path}
                                                                            >
                                                                                <Sparkles className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </HoverCardTrigger>
                                                                        <HoverCardContent side="top" className="w-60">
                                                                            <div className="space-y-2">
                                                                                <p className="text-sm font-medium">
                                                                                    Auto-generate Tool Name
                                                                                </p>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    Creates a standardized name based on the HTTP method and endpoint path.
                                                                                </p>
                                                                                {suggestedName && (
                                                                                    <div className="bg-muted rounded p-2">
                                                                                        <p className="text-xs text-muted-foreground mb-1">Will generate:</p>
                                                                                        <code className="text-xs font-mono text-foreground">{suggestedName}</code>
                                                                                    </div>
                                                                                )}
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    Format: <code className="bg-muted rounded px-1 py-0.5">method_resource_action</code>
                                                                                </p>
                                                                            </div>
                                                                        </HoverCardContent>
                                                                    </HoverCard>
                                                                </div>

                                                                <Input
                                                                    id={`name-${endpoint.id}`}
                                                                    {...form.register(`apiConfig.endpoints.${originalIndex}.name`)}
                                                                    placeholder="Enter tool name or use suggestion below"
                                                                    className={cn(
                                                                        "h-9 font-mono text-sm",
                                                                        shouldShowValidation && "border-red-500 focus:border-red-500 focus:ring-red-500"
                                                                    )}
                                                                />
                                                                <div className="space-y-2">
                                                                    {shouldShowValidation && (
                                                                        <p className="text-xs text-red-600">
                                                                            Tool names must use lowercase letters, numbers, and underscores only, start with a letter, and be at least 3 characters
                                                                        </p>
                                                                    )}

                                                                    {suggestedName && suggestedName !== name && (!name || !isValidToolName(name)) && (
                                                                        <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                                                                            <div className="flex items-center justify-between gap-2">
                                                                                <div className="flex-1">
                                                                                    <p className="text-xs text-blue-700 mb-1">Suggested name:</p>
                                                                                    <code className="text-sm font-mono text-blue-800 bg-blue-100 px-2 py-1 rounded">{suggestedName}</code>
                                                                                </div>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    onClick={generateName}
                                                                                    className="h-8 text-xs bg-white hover:bg-blue-100 border-blue-300"
                                                                                >
                                                                                    Use This
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {isUsingSuggestedName && (
                                                                        <div className="flex items-center gap-1 text-xs text-green-600">
                                                                            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                                                            Using suggested name
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <Label htmlFor={`method-${endpoint.id}`} className="text-sm font-medium">
                                                                    HTTP Method *
                                                                </Label>
                                                                <Select
                                                                    value={method}
                                                                    onValueChange={(value) => form.setValue(`apiConfig.endpoints.${originalIndex}.method`, value as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')}
                                                                >
                                                                    <SelectTrigger id={`method-${endpoint.id}`} className="h-9">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="GET">GET</SelectItem>
                                                                        <SelectItem value="POST">POST</SelectItem>
                                                                        <SelectItem value="PUT">PUT</SelectItem>
                                                                        <SelectItem value="PATCH">PATCH</SelectItem>
                                                                        <SelectItem value="DELETE">DELETE</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <Label htmlFor={`path-${endpoint.id}`} className="text-sm font-medium">
                                                                Endpoint Path *
                                                            </Label>
                                                            <div className="flex items-center gap-1">
                                                                <div className="flex items-center gap-1 border rounded px-2 bg-muted text-muted-foreground">
                                                                    <Globe2 className="h-3 w-3" />
                                                                    <span className="text-xs font-mono truncate">
                                                                        {form.watch('apiConfig.baseUrl') || 'https://api.example.com'}
                                                                    </span>
                                                                </div>
                                                                <Input
                                                                    id={`path-${endpoint.id}`}
                                                                    {...form.register(`apiConfig.endpoints.${originalIndex}.path`)}
                                                                    placeholder="/users/{userId}"
                                                                    className="h-9 font-mono text-sm"
                                                                />
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                Use <code className="bg-muted rounded px-1 py-0.5">{'{'}</code>curly braces<code className="bg-muted rounded px-1 py-0.5">{'}'}</code> for path parameters, like <code className="bg-muted rounded px-1 py-0.5">/users/{'{'}userId{'}'}</code>
                                                            </p>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <Label htmlFor={`description-${endpoint.id}`} className="text-sm font-medium">
                                                                Description *
                                                            </Label>
                                                            <Input
                                                                id={`description-${endpoint.id}`}
                                                                {...form.register(`apiConfig.endpoints.${originalIndex}.description`)}
                                                                placeholder="Get information about a user"
                                                                className="h-9"
                                                            />
                                                            <p className="text-xs text-muted-foreground">
                                                                Clear description helps AI understand when to use this tool
                                                            </p>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-sm font-medium">Parameters</Label>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        form.setValue(`apiConfig.endpoints.${originalIndex}.parameters`, [
                                                                            ...(parameters || []),
                                                                            {
                                                                                name: '',
                                                                                type: 'string',
                                                                                required: false,
                                                                                description: '',
                                                                                location: 'query',
                                                                                style: 'parameter'
                                                                            }
                                                                        ]);
                                                                    }}
                                                                    className="h-7 text-xs"
                                                                >
                                                                    <Plus className="h-3 w-3 mr-1" />
                                                                    Add Parameter
                                                                </Button>
                                                            </div>

                                                            {parameters.length === 0 ? (
                                                                <div className="text-center p-4 border border-dashed rounded-md bg-background">
                                                                    <p className="text-sm text-muted-foreground">
                                                                        No parameters defined for this endpoint
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    {parameters.map((param: EndpointParameter, paramIndex: number) => (
                                                                        <EndpointParameterForm
                                                                            key={param.id || `${endpoint.id}-param-${paramIndex}`}
                                                                            form={form}
                                                                            endpointIndex={originalIndex}
                                                                            paramIndex={paramIndex}
                                                                            endpointPath={path}
                                                                            onRemove={() => {
                                                                                const updatedParams = [...parameters];
                                                                                updatedParams.splice(paramIndex, 1);
                                                                                form.setValue(`apiConfig.endpoints.${originalIndex}.parameters`, updatedParams);
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        );
                                    })
                                ) : (
                                    <div className="p-4 text-center">
                                        <p className="text-sm text-muted-foreground">
                                            No endpoints match your search criteria
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addEndpoint}
                                    className="w-full max-w-xs"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Another Endpoint
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="space-y-1">
                        <h4 className="font-medium text-blue-900">Tool Creation Tips</h4>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc pl-4">
                            <li>Tool names should be lowercase with underscores (e.g., <code className="bg-blue-100 px-1 rounded">get_user_info</code>)</li>
                            <li>Use clear descriptions that explain exactly what the tool does</li>
                            <li>Define all required parameters with good descriptions</li>
                            <li>Path parameters (like <code className="bg-blue-100 px-1 rounded">{'{'}userId{'}'}</code>) will be automatically detected</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Add this type definition after the imports section, before the component definition
interface EndpointParameter {
    name: string;
    type: string;
    required: boolean;
    description: string;
    location: string;
    style: string;
    id?: string;
}
