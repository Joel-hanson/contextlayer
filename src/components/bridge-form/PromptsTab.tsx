'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { UseFieldArrayReturn, UseFormReturn, useFieldArray } from 'react-hook-form';
import { type McpBridgeFormData } from './types';

interface PromptsTabProps {
    form: UseFormReturn<McpBridgeFormData>;
    promptFields: UseFieldArrayReturn<McpBridgeFormData, "mcpPrompts", "id">;
}

// Component for managing arguments within each prompt
interface ArgumentsSectionProps {
    form: UseFormReturn<McpBridgeFormData>;
    promptIndex: number;
}

function ArgumentsSection({ form, promptIndex }: ArgumentsSectionProps) {
    const argumentFields = useFieldArray({
        control: form.control,
        name: `mcpPrompts.${promptIndex}.arguments` as const,
    });

    const addArgument = () => {
        argumentFields.append({
            name: '',
            description: '',
            required: false,
        });
    };

    const removeArgument = (argIndex: number) => {
        argumentFields.remove(argIndex);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Arguments</Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addArgument}
                >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Argument
                </Button>
            </div>

            {argumentFields.fields.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                    No arguments defined. Arguments allow AI models to provide dynamic parameters when using this prompt with your API.
                </p>
            ) : (
                <div className="space-y-3">
                    {argumentFields.fields.map((field, argIndex) => (
                        <div key={field.id} className="p-3 border rounded-md bg-gray-50">
                            <div className="flex justify-between items-start mb-3">
                                <Badge variant="secondary" className="text-xs">
                                    Arg {argIndex + 1}
                                </Badge>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeArgument(argIndex)}
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor={`argument-name-${promptIndex}-${argIndex}`}>
                                        Name *
                                    </Label>
                                    <Input
                                        id={`argument-name-${promptIndex}-${argIndex}`}
                                        {...form.register(`mcpPrompts.${promptIndex}.arguments.${argIndex}.name` as const)}
                                        placeholder="e.g., userId, searchTerm"
                                        className="text-sm"
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id={`argument-required-${promptIndex}-${argIndex}`}
                                        checked={form.watch(`mcpPrompts.${promptIndex}.arguments.${argIndex}.required`)}
                                        onCheckedChange={(checked) => {
                                            form.setValue(`mcpPrompts.${promptIndex}.arguments.${argIndex}.required` as const, checked);
                                        }}
                                    />
                                    <Label htmlFor={`argument-required-${promptIndex}-${argIndex}`} className="text-sm">
                                        Required
                                    </Label>
                                </div>
                            </div>

                            <div className="mt-3">
                                <Label htmlFor={`argument-description-${promptIndex}-${argIndex}`}>
                                    Description
                                </Label>
                                <Input
                                    id={`argument-description-${promptIndex}-${argIndex}`}
                                    {...form.register(`mcpPrompts.${promptIndex}.arguments.${argIndex}.description` as const)}
                                    placeholder="Describe this parameter for API calls..."
                                    className="text-sm"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function PromptsTab({ form, promptFields }: PromptsTabProps) {
    const addPrompt = () => {
        promptFields.append({
            name: '',
            description: '',
            arguments: [],
        });
    };

    const removePrompt = (index: number) => {
        promptFields.remove(index);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        <div>
                            <CardTitle>MCP Prompts</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Create prompt templates that help AI models interact effectively with your API
                            </p>
                        </div>
                    </div>
                    <Button type="button" onClick={addPrompt} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Prompt
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {promptFields.fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-4 opacity-50" />
                        <p>No API interaction prompts configured</p>
                        <p className="text-sm">Prompts guide AI models on how to use your API effectively</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {promptFields.fields.map((field, index) => (
                            <Card key={field.id} className="p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">Prompt {index + 1}</Badge>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removePrompt(index)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor={`prompt-name-${index}`}>
                                                Prompt Name *
                                            </Label>
                                            <Input
                                                id={`prompt-name-${index}`}
                                                {...form.register(`mcpPrompts.${index}.name` as const)}
                                                placeholder="e.g., find-user, analyze-sales-data"
                                            />
                                            {form.formState.errors.mcpPrompts?.[index]?.name && (
                                                <p className="text-sm text-red-600 mt-1">
                                                    {form.formState.errors.mcpPrompts[index]?.name?.message}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor={`prompt-description-${index}`}>
                                                Description
                                            </Label>
                                            <Textarea
                                                id={`prompt-description-${index}`}
                                                {...form.register(`mcpPrompts.${index}.description` as const)}
                                                placeholder="Describe how this prompt helps AI models interact with your API..."
                                                className="min-h-[80px]"
                                            />
                                        </div>
                                    </div>

                                    <ArgumentsSection
                                        form={form}
                                        promptIndex={index}
                                    />
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-blue-900">About API Interaction Prompts</p>
                            <p className="text-blue-700 mt-1">
                                Prompts guide AI models on how to effectively use your API tools and resources. Examples:
                            </p>
                            <ul className="list-disc list-inside mt-2 text-blue-700 space-y-1">
                                <li><strong>Find User:</strong> &ldquo;Search for a user by email or ID using the user lookup tool&rdquo;</li>
                                <li><strong>Generate Report:</strong> &ldquo;Create a sales report for {'{'}timeRange{'}'} using analytics data&rdquo;</li>
                                <li><strong>Analyze Data:</strong> &ldquo;Analyze customer behavior patterns from API data&rdquo;</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
