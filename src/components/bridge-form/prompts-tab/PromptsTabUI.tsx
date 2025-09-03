'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { BookCopyIcon, ChevronDown, ChevronUp, MessageSquare, Plus, Trash } from 'lucide-react';
import { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { McpBridgeFormData } from '../utils/types';
import { usePromptsTab } from './use-prompts-tab';

interface PromptArgument {
    name: string;
    description: string;
    required: boolean;
}

interface PromptsTabUIProps {
    form: UseFormReturn<McpBridgeFormData>;
    promptFieldArray: UseFieldArrayReturn<McpBridgeFormData, 'mcpPrompts'>;
}

export function PromptsTabUI({
    form,
    promptFieldArray,
}: PromptsTabUIProps) {
    const {
        activePromptId,
        setActivePromptId,
        addPrompt,
        removePrompt,
        duplicatePrompt,
    } = usePromptsTab(form, promptFieldArray);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <div className="p-1.5 bg-zinc-100 rounded">
                                <MessageSquare className="h-3 w-3 text-zinc-600" />
                            </div>
                            MCP Prompts
                        </CardTitle>
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={addPrompt}
                            className="text-sm"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Prompt
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Configure prompts that AI systems can use with your MCP bridge.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">

                    {promptFieldArray.fields.length === 0 ? (
                        <div className="text-center p-6 border border-dashed rounded-lg bg-muted/40">
                            <h3 className="font-medium mb-2">No Prompts Added</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Add prompts to make them available to AI systems through your MCP bridge
                            </p>
                            <Button
                                type="button"
                                onClick={addPrompt}
                                variant="outline"
                                className="mx-auto"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Prompt
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Debug info - remove this after fixing */}
                            {/* <div className="text-xs text-muted-foreground mb-2 p-2 bg-blue-50 rounded">
                                Total prompts: {promptFieldArray.fields.length}
                            </div> */}

                            <div className="border rounded-md divide-y">
                                {promptFieldArray.fields.map((field, index) => {
                                    const promptData = form.watch(`mcpPrompts.${index}`) || {};
                                    const name = promptData.name || '';
                                    const description = promptData.description || '';
                                    const isActive = activePromptId === field.id;

                                    return (
                                        <Collapsible
                                            key={field.id}
                                            open={isActive}
                                            onOpenChange={() => setActivePromptId(isActive ? null : field.id)}
                                            className="border-0"
                                        >
                                            <div className={cn("flex items-start justify-between p-3 hover:bg-muted/40 transition-colors", {
                                                "bg-muted/40": isActive
                                            })}>
                                                <CollapsibleTrigger asChild className="flex-1">
                                                    <div className="flex-1 min-w-0 cursor-pointer">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                                Prompt
                                                            </Badge>
                                                            <div className="flex-1 min-w-0">
                                                                <span className="font-medium text-sm truncate block">
                                                                    {name || <span className="text-muted-foreground italic">Unnamed prompt</span>}
                                                                </span>
                                                                {description && (
                                                                    <span className="text-xs text-muted-foreground truncate block">
                                                                        {description}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CollapsibleTrigger>
                                                <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            duplicatePrompt(index);
                                                        }}
                                                        title="Duplicate Prompt"
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
                                                            removePrompt(index);
                                                        }}
                                                        className="h-8 w-8"
                                                        title="Remove Prompt"
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
                                                            <Label htmlFor={`prompt-name-${index}`} className="text-sm font-medium">
                                                                Name <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Input
                                                                id={`prompt-name-${index}`}
                                                                {...form.register(`mcpPrompts.${index}.name`, { required: true })}
                                                                placeholder="weather_assistant"
                                                                className="h-9"
                                                            />
                                                            {form.formState.errors.mcpPrompts?.[index]?.name && (
                                                                <p className="text-xs text-red-500">Name is required</p>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`prompt-description-${index}`} className="text-sm font-medium">
                                                                Description <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Input
                                                                id={`prompt-description-${index}`}
                                                                {...form.register(`mcpPrompts.${index}.description`, { required: true })}
                                                                placeholder="Helps with weather-related questions"
                                                                className="h-9"
                                                            />
                                                            {form.formState.errors.mcpPrompts?.[index]?.description && (
                                                                <p className="text-xs text-red-500">Description is required</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor={`prompt-content-${index}`} className="text-sm font-medium">
                                                            Content <span className="text-red-500">*</span>
                                                        </Label>
                                                        <Textarea
                                                            id={`prompt-content-${index}`}
                                                            {...form.register(`mcpPrompts.${index}.content`, { required: true })}
                                                            placeholder="You are a helpful weather assistant. Provide clear and accurate weather information for the requested location."
                                                            className="min-h-[100px]"
                                                        />
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-1">
                                                                {form.formState.errors.mcpPrompts?.[index]?.content && (
                                                                    <p className="text-xs text-red-500">
                                                                        {form.formState.errors.mcpPrompts?.[index]?.content?.message || 'Content is required'}
                                                                    </p>
                                                                )}
                                                                <p className="text-xs text-muted-foreground">
                                                                    Provide the prompt template that AI systems will use. Include instructions, context, and any specific requirements.
                                                                </p>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground ml-4 flex-shrink-0">
                                                                {(() => {
                                                                    const currentContent = form.watch(`mcpPrompts.${index}.content`) || '';
                                                                    const length = currentContent.length;
                                                                    const maxLength = 50000;
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

                                                    {/* Arguments Section */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="space-y-1">
                                                                <Label className="text-sm font-medium">Arguments</Label>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Define parameters that AI systems can provide when using this prompt
                                                                </p>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const currentArgs = form.getValues(`mcpPrompts.${index}.arguments`) || [];
                                                                    form.setValue(`mcpPrompts.${index}.arguments`, [
                                                                        ...currentArgs,
                                                                        { name: '', description: '', required: false }
                                                                    ]);
                                                                }}
                                                            >
                                                                <Plus className="h-3 w-3 mr-1" />
                                                                Add Argument
                                                            </Button>
                                                        </div>

                                                        {(() => {
                                                            const args = form.watch(`mcpPrompts.${index}.arguments`) || [];
                                                            return args.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {args.map((arg: PromptArgument, argIndex: number) => (
                                                                        <div key={argIndex} className="flex gap-2 items-start p-2 border rounded-md bg-muted/30">
                                                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                                                                                <div className="space-y-1">
                                                                                    <Label className="text-xs">Name</Label>
                                                                                    <Input
                                                                                        {...form.register(`mcpPrompts.${index}.arguments.${argIndex}.name`)}
                                                                                        placeholder="city"
                                                                                        className="h-8 text-xs"
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <Label className="text-xs">Description</Label>
                                                                                    <Input
                                                                                        {...form.register(`mcpPrompts.${index}.arguments.${argIndex}.description`)}
                                                                                        placeholder="City name for weather summary"
                                                                                        className="h-8 text-xs"
                                                                                    />
                                                                                </div>
                                                                                <div className="">
                                                                                    <Label className="text-xs">Required</Label>
                                                                                    <div className="flex items-center space-x-2 mt-2">
                                                                                        <Checkbox
                                                                                            id={`prompt-arg-required-${index}-${argIndex}`}
                                                                                            checked={form.watch(`mcpPrompts.${index}.arguments.${argIndex}.required`) || false}
                                                                                            onCheckedChange={(checked) => {
                                                                                                form.setValue(`mcpPrompts.${index}.arguments.${argIndex}.required`, !!checked);
                                                                                            }}
                                                                                        />
                                                                                        <Label
                                                                                            htmlFor={`prompt-arg-required-${index}-${argIndex}`}
                                                                                            className="text-xs text-muted-foreground cursor-pointer"
                                                                                        >
                                                                                            Required argument
                                                                                        </Label>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    const currentArgs = form.getValues(`mcpPrompts.${index}.arguments`) || [];
                                                                                    const newArgs = currentArgs.filter((_: PromptArgument, i: number) => i !== argIndex);
                                                                                    form.setValue(`mcpPrompts.${index}.arguments`, newArgs);
                                                                                }}
                                                                                className="h-8 w-8 p-0"
                                                                            >
                                                                                <Trash className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-muted-foreground italic">
                                                                    No arguments defined. Arguments allow AI systems to provide parameters when using this prompt.
                                                                </p>
                                                            );
                                                        })()}
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
                                    onClick={addPrompt}
                                    className="w-full max-w-xs"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Another Prompt
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-600 flex-shrink-0" />
                    <div className="space-y-1">
                        <h4 className="font-medium text-purple-900">Prompt Configuration Tips</h4>
                        <ul className="text-sm text-purple-800 space-y-1 list-disc pl-4">
                            <li><strong>Name:</strong> Unique identifier for the prompt (e.g., weather_assistant)</li>
                            <li><strong>Description:</strong> Brief explanation of what the prompt does</li>
                            <li><strong>Content:</strong> The actual prompt template with instructions and context</li>
                            <li>Use clear, specific instructions to guide AI behavior effectively</li>
                            <li>Prompts are exposed through the MCP protocol for AI systems to access</li>
                        </ul>
                        <p className="text-xs text-purple-700 mt-2">
                            Well-designed prompts help AI systems provide better responses for your specific use case.
                        </p>
                    </div>
                </div>
            </div> */}
        </div>
    );
}
