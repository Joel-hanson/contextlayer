'use client';

import { TokenManager } from '@/components/TokenManager';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTokens } from '@/hooks/useTokens';
import { BridgeConfig } from '@/lib/types';
import { ArrowRight, CheckCircle2, Lock, Unlock } from 'lucide-react';
import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { type BridgeFormData } from './types';

interface RoutingAndAccessTabProps {
    form: UseFormReturn<BridgeFormData>;
    bridge?: BridgeConfig;
}

export function RoutingAndAccessTab({ form, bridge }: RoutingAndAccessTabProps) {
    const bridgeName = form.getValues('name') || 'Untitled Bridge';
    const bridgeId = bridge?.id || 'temp-bridge-id';

    // Get tokens to automatically determine authentication status
    // Only load tokens for existing bridges (not temp ones)
    const shouldLoadTokens = bridge?.id && bridge.id !== 'temp-bridge-id';
    const { tokens } = useTokens(shouldLoadTokens ? bridge.id : '');

    // Automatically sync authRequired with token existence
    const hasTokens = tokens.length > 0;

    // Automatically update form when token state changes
    useEffect(() => {
        if (shouldLoadTokens) {
            form.setValue('access.authRequired', hasTokens);
        }
    }, [shouldLoadTokens, hasTokens, tokens, form]);

    return (
        <div className="space-y-6">
            {/* MCP Transport Configuration */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className="p-1.5 bg-zinc-100 rounded">
                            <ArrowRight className="h-3 w-3 text-zinc-600" />
                        </div>
                        MCP Transport Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                        <h4 className="font-medium text-zinc-900 mb-1 flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-3 w-3 text-zinc-600" />
                            HTTP Transport
                        </h4>
                        <p className="text-xs text-zinc-700">
                            Your Context layer will be accessible via HTTP transport at:{' '}
                            <code className="bg-zinc-200 px-1.5 py-0.5 rounded ml-1 font-mono text-zinc-800 text-xs">
                                /mcp/{bridge?.slug || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'}
                            </code>
                            {!bridge && (
                                <span className="ml-2 text-zinc-500 text-xs">(Generated automatically)</span>
                            )}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                            Uses HTTP POST for JSON-RPC 2.0 messages with optional Server-Sent Events for streaming
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Transport Type</Label>
                            <Select
                                value="http"
                                disabled
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="http">HTTP Transport (Streamable HTTP)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Uses HTTP POST for JSON-RPC 2.0 messages. Stdio transport is not applicable for web-based bridges.
                            </p>
                        </div>
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

                        {/* Authentication Status - Auto-determined by token presence */}
                        <div className="flex items-center space-x-2" key={`auth-status-${tokens.length}`}>
                            <div className="flex items-center space-x-2">
                                {tokens.length > 0 ? (
                                    <>
                                        <Lock className="h-4 w-4 text-green-600" />
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            Authentication Required ({tokens.length} token{tokens.length !== 1 ? 's' : ''})
                                        </Badge>
                                    </>
                                ) : (
                                    <>
                                        <Unlock className="h-4 w-4 text-gray-500" />
                                        <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                                            No Authentication (0 tokens)
                                        </Badge>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {shouldLoadTokens && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="text-sm">
                                <p className="font-medium text-blue-900 mb-1">Automatic Authentication Control</p>
                                <p className="text-blue-800 text-xs">
                                    Authentication is automatically {tokens.length > 0 ? 'enabled' : 'disabled'} based on token presence.
                                    {tokens.length > 0
                                        ? ' Remove all tokens to disable authentication.'
                                        : ' Create a token below to enable authentication.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Always show TokenManager for existing bridges, or when creating new ones */}
                    <div className="space-y-4">
                        <TokenManager
                            bridgeId={bridgeId}
                            bridgeName={bridgeName}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
