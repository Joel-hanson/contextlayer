'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { BookCopyIcon, ChevronDown, ChevronUp, FileText, Plus, Trash } from 'lucide-react';
import { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { McpBridgeFormData } from '../utils/types';
import { useResourcesTab } from './use-resources-tab';

interface ResourcesTabUIProps {
    form: UseFormReturn<McpBridgeFormData>;
    resourceFieldArray: UseFieldArrayReturn<McpBridgeFormData, 'mcpResources'>;
}

export function ResourcesTabUI({
    form,
    resourceFieldArray,
}: ResourcesTabUIProps) {
    const {
        activeResourceId,
        setActiveResourceId,
        addResource,
        removeResource,
        duplicateResource,
    } = useResourcesTab(form, resourceFieldArray);
    const mimeTypes = [
        { value: 'text/markdown', label: 'Markdown' },
        { value: 'text/plain', label: 'Plain Text' },
        { value: 'application/json', label: 'JSON' },
        // Note: Other MIME types like HTML, XML, images, and PDF are not yet implemented in the MCP handler
        // { value: 'text/html', label: 'HTML' },
        // { value: 'application/xml', label: 'XML' },
        // { value: 'image/png', label: 'PNG Image' },
        // { value: 'image/jpeg', label: 'JPEG Image' },
        // { value: 'image/svg+xml', label: 'SVG Image' },
        // { value: 'application/pdf', label: 'PDF' },
    ];

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <div className="p-1.5 bg-zinc-100 rounded">
                                <FileText className="h-3 w-3 text-zinc-600" />
                            </div>
                            MCP Resources
                        </CardTitle>
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={addResource}
                            className="text-sm"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Resource
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Configure resources that AI systems can access through your MCP bridge.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">

                    {resourceFieldArray.fields.length === 0 ? (
                        <div className="text-center p-6 border border-dashed rounded-lg bg-muted/40">
                            <h3 className="font-medium mb-2">No Resources Added</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Add resources to make them available to AI systems through your MCP bridge
                            </p>
                            <Button
                                type="button"
                                onClick={addResource}
                                variant="outline"
                                className="mx-auto"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Resource
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="border rounded-md divide-y">
                                {resourceFieldArray.fields.map((field, index) => {
                                    const resourceData = form.watch(`mcpResources.${index}`) || {};
                                    const name = resourceData.name || '';
                                    const uri = resourceData.uri || '';
                                    const mimeType = resourceData.mimeType || 'text/markdown';
                                    const isActive = activeResourceId === field.id;

                                    return (
                                        <Collapsible
                                            key={field.id}
                                            open={isActive}
                                            onOpenChange={() => setActiveResourceId(isActive ? null : field.id)}
                                            className="border-0"
                                        >
                                            <div className={cn("flex items-start justify-between p-3 hover:bg-muted/40 transition-colors", {
                                                "bg-muted/40": isActive
                                            })}>
                                                <CollapsibleTrigger asChild className="flex-1">
                                                    <div className="flex-1 min-w-0 cursor-pointer">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                {mimeType}
                                                            </Badge>
                                                            <div className="flex-1 min-w-0">
                                                                <span className="font-medium text-sm truncate block">
                                                                    {name || <span className="text-muted-foreground italic">Unnamed resource</span>}
                                                                </span>
                                                                {uri && (
                                                                    <span className="text-xs text-muted-foreground font-mono truncate block">
                                                                        {uri}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CollapsibleTrigger>

                                                <div className="flex items-center gap-2 ml-4">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            duplicateResource(index);
                                                        }}
                                                        title="Duplicate Resource"
                                                        className="h-8 w-8"
                                                    >
                                                        <BookCopyIcon className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeResource(index);
                                                        }}
                                                        className="h-8 w-8"
                                                        title="Remove Resource"
                                                    >
                                                        <Trash className="h-4 w-4 text-muted-foreground hover:text-destructive" />
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
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`resource-name-${index}`} className="text-sm font-medium">
                                                                Name <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Input
                                                                id={`resource-name-${index}`}
                                                                {...form.register(`mcpResources.${index}.name`, { required: true })}
                                                                placeholder="company_faq"
                                                                className="h-9"
                                                            />
                                                            {form.formState.errors.mcpResources?.[index]?.name && (
                                                                <p className="text-xs text-red-500">Name is required</p>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`resource-uri-${index}`} className="text-sm font-medium">
                                                                Resource URI <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Input
                                                                id={`resource-uri-${index}`}
                                                                {...form.register(`mcpResources.${index}.uri`, { required: true })}
                                                                placeholder="resource://company/faq"
                                                                className="h-9"
                                                            />
                                                            {form.formState.errors.mcpResources?.[index]?.uri && (
                                                                <p className="text-xs text-red-500">URI is required</p>
                                                            )}
                                                            <p className="text-xs text-muted-foreground">
                                                                Unique identifier for this resource (e.g., <code className="bg-muted rounded px-1 py-0.5">resource://company/faq</code>)
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`resource-description-${index}`} className="text-sm font-medium">
                                                                Description <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Input
                                                                id={`resource-description-${index}`}
                                                                {...form.register(`mcpResources.${index}.description`, { required: true })}
                                                                placeholder="Frequently asked questions about our company"
                                                                className="h-9"
                                                            />
                                                            {form.formState.errors.mcpResources?.[index]?.description && (
                                                                <p className="text-xs text-red-500">Description is required</p>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`resource-mime-${index}`} className="text-sm font-medium">
                                                                MIME Type <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Select
                                                                onValueChange={(value) => form.setValue(`mcpResources.${index}.mimeType`, value)}
                                                                defaultValue={form.watch(`mcpResources.${index}.mimeType`) || 'text/markdown'}
                                                            >
                                                                <SelectTrigger id={`resource-mime-${index}`} className="h-9">
                                                                    <SelectValue placeholder="Select MIME type" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {mimeTypes.map((type) => (
                                                                        <SelectItem key={type.value} value={type.value}>
                                                                            {type.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor={`resource-content-${index}`} className="text-sm font-medium">
                                                            Content <span className="text-red-500">*</span>
                                                        </Label>
                                                        <Textarea
                                                            id={`resource-content-${index}`}
                                                            {...form.register(`mcpResources.${index}.content`, { required: true })}
                                                            placeholder="Enter the actual content of this resource (markdown, text, JSON, etc.)"
                                                            className="min-h-[100px]"
                                                        />
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-1">
                                                                {form.formState.errors.mcpResources?.[index]?.content && (
                                                                    <p className="text-xs text-red-500">
                                                                        {form.formState.errors.mcpResources?.[index]?.content?.message || 'Content is required'}
                                                                    </p>
                                                                )}
                                                                <p className="text-xs text-muted-foreground">
                                                                    Provide the actual content that will be returned when this resource is accessed.
                                                                    This can be markdown documentation, JSON data, plain text, etc.
                                                                </p>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground ml-4 flex-shrink-0">
                                                                {(() => {
                                                                    const currentContent = form.watch(`mcpResources.${index}.content`) || '';
                                                                    const length = currentContent.length;
                                                                    const maxLength = 100000;
                                                                    const percentage = (length / maxLength) * 100;

                                                                    return (
                                                                        <span className={cn(
                                                                            "font-mono",
                                                                            percentage > 90 ? "text-red-500" :
                                                                                percentage > 75 ? "text-orange-500" :
                                                                                    "text-muted-foreground"
                                                                        )}>
                                                                            {length.toLocaleString()}/{maxLength.toLocaleString()}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    );
                                })}
                            </div>

                            <div className="flex justify-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addResource}
                                    className="w-full max-w-xs"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Another Resource
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="space-y-1">
                        <h4 className="font-medium text-blue-900">Resource Configuration Tips</h4>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc pl-4">
                            <li>Currently supported MIME types: Markdown, Plain Text, and JSON</li>
                            <li><strong>URI:</strong> Unique identifier that AI systems use to request this resource</li>
                            <li><strong>Name:</strong> Human-readable name for easy identification</li>
                            <li><strong>Description:</strong> Brief explanation of what this resource contains</li>
                            <li><strong>Content:</strong> The actual data that will be returned (max 100KB per resource)</li>
                            <li>Resources are exposed through the MCP protocol for AI systems to access</li>
                        </ul>
                        <p className="text-xs text-blue-700 mt-2">
                            Additional MIME types (HTML, XML, Images, PDF) will be supported in future updates.
                        </p>
                    </div>
                </div>
            </div> */}
        </div>
    );
}
