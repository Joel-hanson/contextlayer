'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Info } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

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

interface BasicInfoTabProps {
    form: UseFormReturn<BridgeFormData>;
}

export function BasicInfoTab({ form }: BasicInfoTabProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <div className="p-1.5 bg-zinc-100 rounded">
                        <Info className="h-3 w-3 text-zinc-600" />
                    </div>
                    Bridge Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-sm font-medium">
                            Bridge Name *
                        </Label>
                        <Input
                            id="name"
                            {...form.register('name')}
                            placeholder="GitHub API Bridge"
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
                            API Name *
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
            </CardContent>
        </Card>
    );
}
