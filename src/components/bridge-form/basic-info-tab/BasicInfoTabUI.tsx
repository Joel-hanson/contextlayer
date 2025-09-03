'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Globe, Info } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { OpenAPIImportDialog } from '../openapi-import-dialog';
import { type McpBridgeFormData } from '../utils/types';
import { useBasicInfoTab } from './use-basic-info-tab';

interface BasicInfoTabUIProps {
    form: UseFormReturn<McpBridgeFormData>;
}

export function BasicInfoTabUI({ form }: BasicInfoTabUIProps) {
    const { showImportDialog, setShowImportDialog, handleOpenAPIImport } = useBasicInfoTab(form);

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <div className="p-1.5 bg-zinc-100 rounded">
                                <Info className="h-3 w-3 text-zinc-600" />
                            </div>
                            MCP Server Information
                        </CardTitle>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowImportDialog(true)}
                            className="text-sm"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Import OpenAPI
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-sm font-medium">
                                MCP Server Name *
                            </Label>
                            <Input
                                id="name"
                                {...form.register('name')}
                                placeholder="GitHub Tools Server"
                                className="h-9"
                            />
                            {form.formState.errors.name && (
                                <p className="text-xs text-red-600">
                                    {form.formState.errors.name.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="apiName" className="text-sm font-medium">
                                Source API Name *
                            </Label>
                            <Input
                                id="apiName"
                                {...form.register('apiConfig.name')}
                                placeholder="GitHub API"
                                className="h-9"
                            />
                            {form.formState.errors.apiConfig?.name && (
                                <p className="text-xs text-red-600">
                                    {form.formState.errors.apiConfig.name.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="baseUrl" className="text-sm font-medium">
                            Base URL *
                        </Label>
                        <Input
                            id="baseUrl"
                            {...form.register('apiConfig.baseUrl')}
                            placeholder="https://api.github.com"
                            className="font-mono text-sm h-9"
                        />
                        {form.formState.errors.apiConfig?.baseUrl && (
                            <p className="text-xs text-red-600">
                                {form.formState.errors.apiConfig.baseUrl.message}
                            </p>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-sm font-medium">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            {...form.register('description')}
                            placeholder="Describe what this bridge does..."
                            className="h-20 resize-none text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="apiDescription" className="text-sm font-medium">
                            API Description
                        </Label>
                        <Textarea
                            id="apiDescription"
                            {...form.register('apiConfig.description')}
                            placeholder="Describe the API functionality..."
                            className="h-20 resize-none text-sm"
                        />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    Public MCP Server
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Make this MCP server publicly discoverable for others to use
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isPublic"
                                    checked={form.watch('isPublic') || false}
                                    onCheckedChange={(checked) => {
                                        form.setValue('isPublic', !!checked, {
                                            shouldDirty: true,
                                            shouldTouch: true,
                                            shouldValidate: true
                                        });
                                    }}
                                />
                                <Label
                                    htmlFor="isPublic"
                                    className="text-sm cursor-pointer"
                                >
                                    Make public
                                </Label>
                            </div>
                        </div>
                        {form.watch('isPublic') && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex gap-2">
                                    <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-blue-900">
                                            Public Bridge Notice
                                        </p>
                                        <p className="text-xs text-blue-800">
                                            When public, your bridge will be discoverable on the marketplace.
                                            Only the bridge name, description, and available tools/prompts/resources will be visible.
                                            Your API credentials and configuration remain private.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <OpenAPIImportDialog
                open={showImportDialog}
                onOpenChange={setShowImportDialog}
                onImport={handleOpenAPIImport}
            />
        </>
    );
}
