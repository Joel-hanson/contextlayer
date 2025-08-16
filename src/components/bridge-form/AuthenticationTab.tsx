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
import { ChevronDown, ChevronUp, Code2, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { type McpBridgeFormData } from './types';

interface AuthenticationTabProps {
    form: UseFormReturn<McpBridgeFormData>;
}

function generateAuthPreview(form: UseFormReturn<McpBridgeFormData>) {
    const authType = form.watch('apiConfig.authentication.type');

    switch (authType) {
        case 'bearer':
            return {
                header: 'Authorization',
                value: `Bearer ${form.watch('apiConfig.authentication.token') || '[YOUR_TOKEN]'}`
            };
        case 'apikey': {
            const keyLocation = form.watch('apiConfig.authentication.keyLocation') || 'header';
            const apiKey = form.watch('apiConfig.authentication.apiKey') || '[YOUR_API_KEY]';

            if (keyLocation === 'header') {
                const headerName = form.watch('apiConfig.authentication.headerName') || 'X-API-Key';
                return {
                    header: headerName,
                    value: apiKey
                };
            } else {
                const paramName = form.watch('apiConfig.authentication.paramName') || 'api_key';
                return {
                    query: `?${paramName}=${apiKey}`
                };
            }
        }
        case 'basic': {
            const username = form.watch('apiConfig.authentication.username') || '[USERNAME]';
            const password = form.watch('apiConfig.authentication.password') || '[PASSWORD]';
            const encoded = btoa(`${username}:${password}`);
            return {
                header: 'Authorization',
                value: `Basic ${encoded}`
            };
        }
        default:
            return null;
    }
}

export function AuthenticationTab({ form }: AuthenticationTabProps) {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const authType = form.watch('apiConfig.authentication.type') || 'none';

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <div className="p-1.5 bg-zinc-100 rounded">
                        <KeyRound className="h-3 w-3 text-zinc-600" />
                    </div>
                    API Authentication
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Authentication Type</Label>
                    <Select
                        value={authType}
                        onValueChange={(value) => form.setValue('apiConfig.authentication.type', value as 'none' | 'bearer' | 'apikey' | 'basic')}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select authentication type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No Authentication</SelectItem>
                            <SelectItem value="bearer">Bearer Token</SelectItem>
                            <SelectItem value="apikey">API Key</SelectItem>
                            <SelectItem value="basic">Basic Authentication</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {authType === 'bearer' && (
                    <div className="space-y-1.5">
                        <Label htmlFor="token" className="text-sm font-medium">
                            Bearer Token *
                        </Label>
                        <Input
                            id="token"
                            {...form.register('apiConfig.authentication.token')}
                            type="password"
                            placeholder="Enter your bearer token"
                            className="font-mono text-sm h-9"
                        />
                        <p className="text-xs text-muted-foreground">
                            Token will be sent in the Authorization header as &quot;Bearer [token]&quot;
                        </p>
                    </div>
                )}

                {authType === 'apikey' && (
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="apiKey" className="text-sm font-medium">
                                API Key *
                            </Label>
                            <Input
                                id="apiKey"
                                {...form.register('apiConfig.authentication.apiKey')}
                                type="password"
                                placeholder="Enter your API key"
                                className="font-mono text-sm h-9"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">API Key Location</Label>
                            <Select
                                value={form.watch('apiConfig.authentication.keyLocation') || 'header'}
                                onValueChange={(value) => form.setValue('apiConfig.authentication.keyLocation', value as 'header' | 'query')}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="header">Request Header</SelectItem>
                                    <SelectItem value="query">Query Parameter</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {form.watch('apiConfig.authentication.keyLocation') === 'header' ? (
                            <div className="space-y-1.5">
                                <Label htmlFor="headerName" className="text-sm font-medium">
                                    Header Name *
                                </Label>
                                <Input
                                    id="headerName"
                                    {...form.register('apiConfig.authentication.headerName')}
                                    placeholder="X-API-Key"
                                    className="font-mono text-sm h-9"
                                />
                                <p className="text-xs text-muted-foreground">
                                    API key will be sent in the specified header
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <Label htmlFor="paramName" className="text-sm font-medium">
                                    Parameter Name *
                                </Label>
                                <Input
                                    id="paramName"
                                    {...form.register('apiConfig.authentication.paramName')}
                                    placeholder="api_key"
                                    className="font-mono text-sm h-9"
                                />
                                <p className="text-xs text-muted-foreground">
                                    API key will be sent as a query parameter (e.g., ?api_key=YOUR_KEY)
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {authType === 'basic' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="username" className="text-sm font-medium">
                                Username *
                            </Label>
                            <Input
                                id="username"
                                {...form.register('apiConfig.authentication.username')}
                                placeholder="Enter username"
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-sm font-medium">
                                Password *
                            </Label>
                            <Input
                                id="password"
                                {...form.register('apiConfig.authentication.password')}
                                type="password"
                                placeholder="Enter password"
                                className="h-9"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-xs text-muted-foreground">
                                Credentials will be base64 encoded and sent in the Authorization header
                            </p>
                        </div>
                    </div>
                )}

                {authType === 'none' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                            No authentication will be used for API requests. Make sure your API endpoints are publicly accessible.
                        </p>
                    </div>
                )}

                {/* Authentication Preview */}
                <div className="pt-4 border-t">
                    <Collapsible open={isPreviewOpen}>
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                                onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                            >
                                <Code2 className="h-4 w-4" />
                                Authentication Preview
                            </Label>
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                                >
                                    {isPreviewOpen ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                        </div>

                        <CollapsibleContent>
                            {authType !== 'none' ? (
                                <div className="mt-2 rounded-md bg-muted/50 border p-3 space-y-3">
                                    <div className="space-y-2">
                                        <div className="text-xs text-muted-foreground font-medium">
                                            Your requests will include:
                                        </div>
                                        {(() => {
                                            const preview = generateAuthPreview(form);
                                            if (!preview) return null;

                                            return (
                                                <div className="space-y-2">
                                                    {preview.header && (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                                                                    header
                                                                </Badge>
                                                                <span className="font-mono text-xs">{preview.header}</span>
                                                            </div>
                                                            <code className="text-xs font-mono block bg-background rounded px-2 py-1 border">
                                                                {preview.value ? (
                                                                    typeof preview.value === 'string' && preview.value.includes('[YOUR_TOKEN]') ?
                                                                        preview.value :
                                                                        typeof preview.value === 'string' && preview.value.includes('[YOUR_API_KEY]') ?
                                                                            preview.value :
                                                                            typeof preview.value === 'string' && preview.value.includes('[USERNAME]') || preview.value.includes('[PASSWORD]') ?
                                                                                preview.value :
                                                                                typeof preview.value === 'string' && preview.value.startsWith('Bearer ') ?
                                                                                    `Bearer ${preview.value.substring(7, 10)}...${preview.value.substring(preview.value.length - 4)}` :
                                                                                    typeof preview.value === 'string' && preview.value.startsWith('Basic ') ?
                                                                                        `Basic ${preview.value.substring(6, 9)}...${preview.value.substring(preview.value.length - 4)}` :
                                                                                        typeof preview.value === 'string' && preview.value.length > 10 ?
                                                                                            `${preview.value.substring(0, 3)}...${preview.value.substring(preview.value.length - 4)}` :
                                                                                            preview.value
                                                                ) : preview.value}
                                                            </code>
                                                        </div>
                                                    )}
                                                    {preview.query && (
                                                        <div className="space-y-1">
                                                            <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
                                                                query parameter
                                                            </Badge>
                                                            <code className="text-xs font-mono block bg-background rounded px-2 py-1 border">
                                                                {preview.query}
                                                            </code>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        These values will be automatically included in each request
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-2 rounded-md bg-muted/50 border p-3">
                                    <p className="text-sm text-muted-foreground">
                                        No authentication will be added to the requests
                                    </p>
                                </div>
                            )}
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </CardContent>
        </Card>
    );
}
