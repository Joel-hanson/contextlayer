'use client';

import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { TokenManager } from '@/components/TokenManager';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTokens } from '@/hooks/useTokens';
import { BridgeConfig } from '@/lib/types';
import { ArrowRight, CheckCircle2, Lock, Unlock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { type McpBridgeFormData } from './types';

interface RoutingAndAccessTabProps {
    form: UseFormReturn<McpBridgeFormData>;
    bridge?: BridgeConfig;
}

export function RoutingAndAccessTab({ form, bridge }: RoutingAndAccessTabProps) {
    const bridgeName = form.getValues('name') || 'Untitled Bridge';
    const bridgeId = bridge?.id || 'temp-bridge-id';
    const { toast } = useToast();

    // Get tokens for existing bridges
    const isExistingBridge = bridge?.id && bridge.id !== 'temp-bridge-id';
    const { tokens, createToken, deleteToken } = useTokens(isExistingBridge ? bridge.id : '');

    // State for managing authentication
    const [isCreatingToken, setIsCreatingToken] = useState(false);
    const [authEnabled, setAuthEnabled] = useState(false);
    const [showDisableConfirm, setShowDisableConfirm] = useState(false);

    // Initialize auth state based on existing tokens or form values
    useEffect(() => {
        if (isExistingBridge) {
            // For existing bridges, base it on token presence
            const hasTokens = tokens.length > 0;
            setAuthEnabled(hasTokens);
            form.setValue('access.authRequired', hasTokens, {
                shouldValidate: true,
                shouldDirty: true
            });
        } else {
            // For new bridges, use form value
            const formAuthRequired = form.getValues('access.authRequired');
            setAuthEnabled(formAuthRequired || false);
        }
    }, [tokens, isExistingBridge, form]);

    // Handle authentication toggle
    const handleAuthToggle = async (checked: boolean) => {
        if (isExistingBridge) {
            // For existing bridges, manage tokens directly
            if (checked && tokens.length === 0) {
                // Create a default token when enabling auth
                setIsCreatingToken(true);
                try {
                    const newToken = await createToken(
                        `${bridgeName} Access Token`,
                        'Auto-generated access token for authentication',
                        undefined, // Never expires
                        []
                    );

                    if (newToken) {
                        setAuthEnabled(true);
                        form.setValue('access.authRequired', true, {
                            shouldValidate: true,
                            shouldDirty: true
                        });
                        toast({
                            title: "Authentication Enabled",
                            description: "A new access token has been created. You can find it in the token manager below.",
                        });
                    }
                } catch (error) {
                    console.error('Failed to create token:', error);
                    toast({
                        title: "Failed to enable authentication",
                        description: "Could not create access token. Please try again.",
                        variant: "destructive",
                    });
                } finally {
                    setIsCreatingToken(false);
                }
            } else if (!checked && tokens.length > 0) {
                // When disabling auth, show confirmation dialog
                setShowDisableConfirm(true);
            } else {
                // Just toggle the state if no tokens need to be managed
                setAuthEnabled(checked);
                form.setValue('access.authRequired', checked, {
                    shouldValidate: true,
                    shouldDirty: true
                });
            }
        } else {
            // For new bridges, just set the form value
            setAuthEnabled(checked);
            form.setValue('access.authRequired', checked, {
                shouldValidate: true,
                shouldDirty: true
            });
        }
    };

    const handleDisableAuthConfirm = async () => {
        // Delete all tokens
        const deletePromises = tokens.map(token => deleteToken(token.id));
        await Promise.all(deletePromises);

        setAuthEnabled(false);
        form.setValue('access.authRequired', false, {
            shouldValidate: true,
            shouldDirty: true
        });
        toast({
            title: "Authentication Disabled",
            description: "All access tokens have been deleted and authentication is now disabled.",
        });
        setShowDisableConfirm(false);
    };

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
                            <Select value="http" disabled>
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
                    <div className="grid grid-cols-1 gap-4">
                        {/* Simple Authentication Toggle */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="authRequired"
                                checked={authEnabled}
                                onCheckedChange={handleAuthToggle}
                                disabled={isCreatingToken}
                            />
                            <Label htmlFor="authRequired" className="text-sm font-medium cursor-pointer">
                                {isCreatingToken ? 'Creating token...' : 'Require Authentication'}
                            </Label>
                        </div>
                    </div>

                    {/* Authentication Status Display */}
                    <div className="flex items-center space-x-2">
                        {authEnabled ? (
                            <>
                                <Lock className="h-4 w-4 text-green-600" />
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Authentication Required
                                    {isExistingBridge && tokens.length > 0 && ` (${tokens.length} token${tokens.length !== 1 ? 's' : ''})`}
                                </Badge>
                            </>
                        ) : (
                            <>
                                <Unlock className="h-4 w-4 text-gray-500" />
                                <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                                    No Authentication Required
                                </Badge>
                            </>
                        )}
                    </div>

                    {/* Information Box */}
                    {isExistingBridge ? (
                        authEnabled && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="text-sm">
                                    <p className="font-medium text-blue-900 mb-1">Authentication Active</p>
                                    <p className="text-blue-800 text-xs">
                                        {tokens.length > 0
                                            ? `Your bridge has ${tokens.length} active token${tokens.length !== 1 ? 's' : ''}. You can manage them below.`
                                            : 'A token will be automatically created to enable authentication.'
                                        }
                                    </p>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="text-sm">
                                <p className="font-medium text-yellow-900 mb-1">New Bridge</p>
                                <p className="text-yellow-800 text-xs">
                                    {authEnabled
                                        ? 'Authentication will be required. A token will be created automatically when you save the bridge.'
                                        : 'No authentication required. You can enable it later by editing the bridge.'
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Token Management for Existing Bridges */}
                    {isExistingBridge && authEnabled && (
                        <div className="space-y-4">
                            <TokenManager
                                bridgeId={bridgeId}
                                bridgeName={bridgeName}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Confirmation Dialog for Disabling Authentication */}
            <ConfirmationDialog
                open={showDisableConfirm}
                onOpenChange={setShowDisableConfirm}
                onConfirm={handleDisableAuthConfirm}
                title="Disable Authentication"
                description={`This will delete all ${tokens.length} access token(s) and disable authentication. Are you sure?`}
                confirmText="Delete Tokens & Disable"
                cancelText="Cancel"
            />
        </div>
    );
}
