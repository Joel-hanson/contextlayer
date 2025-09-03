'use client';

import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { TokenManager } from '@/components/TokenManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { McpAccessToken } from '@/lib/security';
import { Copy, Key, RefreshCw, Shield } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { McpBridgeFormData } from '../utils/types';

interface RoutingAndAccessTabUIProps {
    form: UseFormReturn<McpBridgeFormData>;
    generateAuthToken: () => void;
    showRevokeConfirmation: boolean;
    setShowRevokeConfirmation: (show: boolean) => void;
    revokeAuthTokens: () => void;
    revokeAllAuthTokens: () => void;
    tokens: McpAccessToken[];
    bridgeId?: string;
    bridgeName?: string;
    bridgeHostname: string;
    bridgeUrl: string;
    wsUrl: string;
    isSelfHosted: boolean;
    requiresAuthentication: boolean;
    setRequiresAuthentication: (requires: boolean) => void;
    isGeneratingToken: boolean;
    isRevokingToken: boolean;
}

export function RoutingAndAccessTabUI({
    form,
    generateAuthToken,
    showRevokeConfirmation,
    setShowRevokeConfirmation,
    revokeAuthTokens,
    tokens,
    bridgeId,
    bridgeName,
    bridgeUrl,
    wsUrl,
    isSelfHosted,
    requiresAuthentication,
    setRequiresAuthentication,
    isGeneratingToken,
}: RoutingAndAccessTabUIProps) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Routing & Access Control</h3>
                <p className="text-sm text-gray-500">
                    Configure how AI systems can access your MCP bridge.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        MCP Endpoints
                    </CardTitle>
                    <CardDescription>
                        These are the endpoints that AI systems will use to access your bridge.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">HTTP Endpoint</Label>
                        <div className="flex">
                            <Input
                                readOnly
                                value={bridgeUrl}
                                className="bg-gray-50 font-mono text-sm"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="ml-2"
                                onClick={() => {
                                    navigator.clipboard.writeText(bridgeUrl);
                                }}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* <div className="space-y-2">
                        <Label className="text-xs font-medium">WebSocket Endpoint</Label>
                        <div className="flex">
                            <Input
                                readOnly
                                value={wsUrl}
                                className="bg-gray-50 font-mono text-sm"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="ml-2"
                                onClick={() => {
                                    navigator.clipboard.writeText(wsUrl);
                                }}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div> */}

                    {isSelfHosted && (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800">
                            <p>
                                <strong>Note:</strong> You&apos;re running in self-hosted mode.
                                For production use, consider setting up a proper domain.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Access Control
                    </CardTitle>
                    <CardDescription>
                        Control who can access your MCP bridge.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="requires-auth"
                            checked={requiresAuthentication}
                            onCheckedChange={(checked) => {
                                setRequiresAuthentication(checked === true);
                            }}
                        />
                        <div className="space-y-1">
                            <Label
                                htmlFor="requires-auth"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Require Authentication
                            </Label>
                            <p className="text-xs text-gray-500">
                                When enabled, API calls to your MCP bridge will require an authentication token.
                            </p>
                        </div>
                    </div>

                    {requiresAuthentication && (
                        <>
                            <Separator />

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-medium">Authentication Tokens</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={generateAuthToken}
                                        disabled={isGeneratingToken}
                                        className="gap-1"
                                    >
                                        <Key className="h-3 w-3" />
                                        Generate Token
                                    </Button>
                                </div>

                                {tokens && tokens.length > 0 && bridgeId && bridgeName ? (
                                    <TokenManager
                                        bridgeId={bridgeId}
                                        bridgeName={bridgeName}
                                    />
                                ) : (
                                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-md p-4 text-center">
                                        <p className="text-sm text-gray-500">No authentication tokens generated yet.</p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-xs font-medium">CORS Settings</Label>
                                    <div className="space-y-2">
                                        <div className="flex items-start space-x-2">
                                            <Checkbox
                                                id="allow-all-origins"
                                                {...form.register('access.allowAllOrigins')}
                                            />
                                            <div className="space-y-1">
                                                <Label
                                                    htmlFor="allow-all-origins"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Allow All Origins
                                                </Label>
                                                <p className="text-xs text-gray-500">
                                                    When enabled, your MCP bridge will accept requests from any domain.
                                                    Not recommended for production use.
                                                </p>
                                            </div>
                                        </div>

                                        {!form.watch('access.allowAllOrigins') && (
                                            <div className="space-y-2">
                                                <Label htmlFor="allowed-origins" className="text-xs font-medium">
                                                    Allowed Origins
                                                </Label>
                                                <Input
                                                    id="allowed-origins"
                                                    placeholder="https://example.com, https://app.example.com"
                                                    {...form.register('access.allowedOrigins')}
                                                />
                                                <p className="text-xs text-gray-500">
                                                    Comma-separated list of domains that are allowed to access your MCP bridge.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                open={showRevokeConfirmation}
                onOpenChange={setShowRevokeConfirmation}
                title="Revoke Authentication Tokens"
                description="Are you sure you want to revoke these authentication tokens? This action cannot be undone, and any applications using these tokens will lose access."
                confirmText="Revoke Tokens"
                cancelText="Cancel"
                onConfirm={revokeAuthTokens}
            />
        </div>
    );
}
