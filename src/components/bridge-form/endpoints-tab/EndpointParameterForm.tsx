'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { McpBridgeFormData } from '../utils/types';

interface EndpointParameterFormProps {
    form: UseFormReturn<McpBridgeFormData>;
    endpointIndex: number;
    paramIndex: number;
    endpointPath: string;
    onRemove: () => void;
}

export function EndpointParameterForm({
    form,
    endpointIndex,
    paramIndex,
    endpointPath,
    onRemove
}: EndpointParameterFormProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const paramName = form.watch(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.name`) || '';
    const paramType = form.watch(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.type`) || 'string';
    const paramRequired = form.watch(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.required`) || false;
    const paramLocation = form.watch(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.location`) || 'query';

    // Check if this parameter is found in the path
    const isPathParameter = endpointPath.includes(`{${paramName}}`);

    // If param name is found in path, automatically set location to 'path' and required to true
    if (isPathParameter && paramName && paramLocation !== 'path') {
        form.setValue(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.location`, 'path');
        form.setValue(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.required`, true);
    }

    return (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <Card className="border p-3">
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                                {paramName ? paramName : <span className="text-muted-foreground italic">Unnamed parameter</span>}
                            </span>
                            {paramLocation === 'path' && (
                                <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded">path</span>
                            )}
                            {paramRequired && (
                                <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-800 rounded">required</span>
                            )}
                            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">{paramType}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={onRemove}
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
                                {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </div>

                <CollapsibleContent className="pt-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor={`param-name-${endpointIndex}-${paramIndex}`} className="text-xs font-medium">
                                Parameter Name *
                            </Label>
                            <Input
                                id={`param-name-${endpointIndex}-${paramIndex}`}
                                {...form.register(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.name`)}
                                placeholder="userId"
                                className="h-8 text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor={`param-type-${endpointIndex}-${paramIndex}`} className="text-xs font-medium">
                                Data Type *
                            </Label>
                            <Select
                                value={paramType}
                                onValueChange={(value) => form.setValue(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.type`,
                                    value as "string" | "number" | "boolean" | "object" | "array")}
                            >
                                <SelectTrigger id={`param-type-${endpointIndex}-${paramIndex}`} className="h-8 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="string">String</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="boolean">Boolean</SelectItem>
                                    <SelectItem value="array">Array</SelectItem>
                                    <SelectItem value="object">Object</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor={`param-location-${endpointIndex}-${paramIndex}`} className="text-xs font-medium">
                                Parameter Location *
                            </Label>
                            <Select
                                value={paramLocation}
                                onValueChange={(value) => form.setValue(
                                    `apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.location`,
                                    value as "path" | "query" | "body" | "header"
                                )}
                                disabled={isPathParameter}
                            >
                                <SelectTrigger id={`param-location-${endpointIndex}-${paramIndex}`} className="h-8 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="query">Query</SelectItem>
                                    <SelectItem value="path">Path</SelectItem>
                                    <SelectItem value="header">Header</SelectItem>
                                    <SelectItem value="body">Body</SelectItem>
                                </SelectContent>
                            </Select>
                            {isPathParameter && (
                                <p className="text-xs text-muted-foreground">
                                    This parameter is found in the path and must have location set to &quot;path&quot;
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor={`param-required-${endpointIndex}-${paramIndex}`} className="text-xs font-medium">
                                    Required
                                </Label>
                                <Switch
                                    id={`param-required-${endpointIndex}-${paramIndex}`}
                                    checked={paramRequired}
                                    onCheckedChange={(checked) =>
                                        form.setValue(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.required`, checked)
                                    }
                                    disabled={isPathParameter}
                                />
                            </div>
                            {isPathParameter && (
                                <p className="text-xs text-muted-foreground">
                                    Path parameters are always required
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`param-description-${endpointIndex}-${paramIndex}`} className="text-xs font-medium">
                            Description
                        </Label>
                        <Input
                            id={`param-description-${endpointIndex}-${paramIndex}`}
                            {...form.register(`apiConfig.endpoints.${endpointIndex}.parameters.${paramIndex}.description`)}
                            placeholder="Unique identifier for the user"
                            className="h-8 text-sm"
                        />
                    </div>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
