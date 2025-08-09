'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeyRound } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { type BridgeFormData } from './types';

interface AuthenticationTabProps {
    form: UseFormReturn<BridgeFormData>;
}

export function AuthenticationTab({ form }: AuthenticationTabProps) {
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-xs text-muted-foreground">
                                API key will be sent in the specified header
                            </p>
                        </div>
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
            </CardContent>
        </Card>
    );
}
