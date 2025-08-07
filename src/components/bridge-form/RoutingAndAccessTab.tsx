'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BridgeConfig } from '@/lib/types';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
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

interface RoutingAndAccessTabProps {
    form: UseFormReturn<BridgeFormData>;
    bridge?: BridgeConfig;
}

export function RoutingAndAccessTab({ form, bridge }: RoutingAndAccessTabProps) {
    return (
        <div className="space-y-6">
            {/* Routing Configuration */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className="p-1.5 bg-zinc-100 rounded">
                            <ArrowRight className="h-3 w-3 text-zinc-600" />
                        </div>
                        Routing Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                        <h4 className="font-medium text-zinc-900 mb-1 flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-3 w-3 text-zinc-600" />
                            Path-Based Routing
                        </h4>
                        <p className="text-xs text-zinc-700">
                            Your bridge will be accessible at:{' '}
                            <code className="bg-zinc-200 px-1.5 py-0.5 rounded ml-1 font-mono text-zinc-800 text-xs">
                                /mcp/{bridge?.slug || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'}
                            </code>
                            {!bridge && (
                                <span className="ml-2 text-zinc-500 text-xs">(Generated automatically)</span>
                            )}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Routing Type</Label>
                            <Select
                                value={form.watch('routing.type') || 'path'}
                                onValueChange={(value) => form.setValue('routing.type', value as 'path' | 'subdomain' | 'websocket')}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select routing type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="path">Path-based (/mcp/bridge-name)</SelectItem>
                                    <SelectItem value="subdomain">Subdomain (bridge.domain.com)</SelectItem>
                                    <SelectItem value="websocket">WebSocket (/ws/bridge-name)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {form.watch('routing.type') === 'path' && (
                            <div className="space-y-1.5">
                                <Label htmlFor="pathPrefix" className="text-sm font-medium">Path Prefix</Label>
                                <Input
                                    id="pathPrefix"
                                    {...form.register('routing.pathPrefix')}
                                    placeholder="/api/v1"
                                    className="font-mono text-sm h-9"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Optional prefix to add before the bridge path
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Access Control */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className="p-1.5 bg-zinc-100 rounded">
                            <CheckCircle2 className="h-3 w-3 text-zinc-600" />
                        </div>
                        Access Control
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="publicAccess"
                                checked={form.watch('access.public')}
                                onCheckedChange={(checked) => form.setValue('access.public', !!checked)}
                            />
                            <Label htmlFor="publicAccess" className="text-sm font-medium cursor-pointer">
                                Public Access
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="authRequired"
                                checked={form.watch('access.authRequired')}
                                onCheckedChange={(checked) => form.setValue('access.authRequired', !!checked)}
                            />
                            <Label htmlFor="authRequired" className="text-sm font-medium cursor-pointer">
                                Require Authentication
                            </Label>
                        </div>
                    </div>

                    {form.watch('access.authRequired') && (
                        <div className="space-y-1.5">
                            <Label htmlFor="accessApiKey" className="text-sm font-medium">API Key</Label>
                            <Input
                                id="accessApiKey"
                                {...form.register('access.apiKey')}
                                placeholder="Enter API key for access control"
                                type="password"
                                className="font-mono text-sm h-9"
                            />
                            <p className="text-xs text-muted-foreground">
                                This key will be required to access the bridge endpoints
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
