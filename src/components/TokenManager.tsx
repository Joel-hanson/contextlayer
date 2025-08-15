'use client';

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTokens } from "@/hooks/useTokens";
import { McpAccessToken, TokenPermission } from "@/lib/security";
import { AlertCircle, Check, Copy, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

interface TokenManagerProps {
    bridgeId: string;
    bridgeName: string;
}

interface NewTokenForm {
    name: string;
    description: string;
    expiresInDays?: number;
    permissions: TokenPermission[];
}

const initialNewToken: NewTokenForm = {
    name: '',
    description: '',
    expiresInDays: undefined,
    permissions: []
};

export function TokenManager({
    bridgeId,
    bridgeName,
}: TokenManagerProps) {
    const { tokens, loading, error, createToken, deleteToken } = useTokens(bridgeId);
    const { toast } = useToast();

    // Memoize expensive computations
    const sortedTokens = useMemo(() => [...tokens].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ), [tokens]);
    const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newToken, setNewToken] = useState<NewTokenForm>(initialNewToken);

    // Confirmation dialog state
    const [confirmationDialog, setConfirmationDialog] = useState<{
        open: boolean;
        tokenId: string | null;
        tokenName: string;
    }>({
        open: false,
        tokenId: null,
        tokenName: '',
    });

    const handleCreateToken = async () => {
        if (!newToken.name.trim()) {
            return;
        }

        try {
            const token = await createToken(
                newToken.name,
                newToken.description || undefined,
                newToken.expiresInDays,
                newToken.permissions
            );

            if (token) {
                // Show the new token temporarily
                setShowTokens(prev => ({ ...prev, [token.id]: true }));

                // Reset form
                setNewToken(initialNewToken);
                setIsCreating(false);

                // Show success toast
                toast({
                    title: "Token created successfully",
                    description: `Access token "${token.name}" has been created and is now active.`,
                });
            }
        } catch (error) {
            console.error('Failed to create token:', error);
            toast({
                title: "Failed to create token",
                description: "An error occurred while creating the access token. Please try again.",
                variant: "destructive",
            });
        }
    };

    // const handleToggleToken = async (tokenId: string) => {
    //     try {
    //         const success = await toggleToken(tokenId);
    //         if (success) {
    //             const token = tokens.find(t => t.id === tokenId);
    //             const newStatus = token ? !token.isActive : false;
    //             toast({
    //                 title: `Token ${newStatus ? 'enabled' : 'disabled'}`,
    //                 description: `Access token has been ${newStatus ? 'enabled' : 'disabled'}.`,
    //             });
    //         }
    //     } catch (error) {
    //         console.error('Failed to toggle token:', error);
    //         toast({
    //             title: "Failed to update token",
    //             description: "An error occurred while updating the token status.",
    //             variant: "destructive",
    //         });
    //     }
    // };

    const handleDeleteToken = (tokenId: string) => {
        const token = tokens.find(t => t.id === tokenId);
        if (!token) return;

        setConfirmationDialog({
            open: true,
            tokenId: tokenId,
            tokenName: token.name,
        });
    };

    const confirmDeleteToken = async () => {
        const { tokenId } = confirmationDialog;
        if (!tokenId) return;

        try {
            const success = await deleteToken(tokenId);
            if (success) {
                toast({
                    title: "Token deleted",
                    description: "Access token has been permanently deleted.",
                });
            }
        } catch (error) {
            console.error('Failed to delete token:', error);
            toast({
                title: "Failed to delete token",
                description: "An error occurred while deleting the access token.",
                variant: "destructive",
            });
        } finally {
            setConfirmationDialog({
                open: false,
                tokenId: null,
                tokenName: '',
            });
        }
    };

    const toggleTokenVisibility = (tokenId: string) => {
        setShowTokens(prev => ({
            ...prev,
            [tokenId]: !prev[tokenId]
        }));
    };

    const copyToClipboard = async (text: string, tokenId: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedToken(tokenId);
            setTimeout(() => setCopiedToken(null), 2000);
            toast({
                title: "Token copied",
                description: "Access token has been copied to clipboard.",
            });
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            toast({
                title: "Failed to copy token",
                description: "Could not copy token to clipboard. Please copy it manually.",
                variant: "destructive",
            });
        }
    };

    const formatExpiration = (expiresAt: Date | undefined) => {
        if (!expiresAt) return 'Never';
        return new Date(expiresAt).toLocaleDateString();
    };

    const isTokenExpired = (expiresAt: Date | undefined) => {
        if (!expiresAt) return false;
        return new Date() > new Date(expiresAt);
    };

    const getTokenStatus = (token: McpAccessToken) => {
        if (isTokenExpired(token.expiresAt)) return 'expired';
        return token.isActive ? 'active' : 'disabled';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'disabled': return 'bg-gray-100 text-gray-800';
            case 'expired': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Token Management</CardTitle>
                    <CardDescription>Loading tokens...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Access Tokens</CardTitle>
                            <CardDescription>
                                Manage API access tokens for {bridgeName}
                            </CardDescription>
                        </div>
                        <Button
                            type="button"
                            onClick={() => setIsCreating(!isCreating)}
                            variant="outline"
                            size="sm"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Token
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {isCreating && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Create New Token</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Token Name</label>
                                        <Input
                                            placeholder="Enter token name"
                                            value={newToken.name}
                                            onChange={(e) => setNewToken(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Expires In (days)</label>
                                        <Select
                                            value={newToken.expiresInDays?.toString() || 'never'}
                                            onValueChange={(value) =>
                                                setNewToken(prev => ({
                                                    ...prev,
                                                    expiresInDays: value === 'never' ? undefined : parseInt(value)
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="never">Never expires</SelectItem>
                                                <SelectItem value="7">7 days</SelectItem>
                                                <SelectItem value="30">30 days</SelectItem>
                                                <SelectItem value="90">90 days</SelectItem>
                                                <SelectItem value="365">1 year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Description</label>
                                    <Textarea
                                        placeholder="Optional description"
                                        value={newToken.description}
                                        onChange={(e) => setNewToken(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>

                                <div className="flex justify-end space-x-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setIsCreating(false);
                                            setNewToken(initialNewToken);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleCreateToken}
                                        disabled={!newToken.name.trim()}
                                    >
                                        Create Token
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="space-y-4">
                        {sortedTokens.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No access tokens created yet.
                            </div>
                        ) : (
                            sortedTokens.map((token) => {
                                const status = getTokenStatus(token);
                                const isVisible = showTokens[token.id];

                                return (
                                    <Card key={token.id}>
                                        <CardContent className="pt-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center space-x-2">
                                                        <h4 className="font-medium">{token.name}</h4>
                                                        <Badge className={getStatusColor(status)}>
                                                            {status}
                                                        </Badge>
                                                    </div>
                                                    {token.description && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {token.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                        <span>Created: {token.createdAt.toLocaleDateString()}</span>
                                                        <span>Expires: {formatExpiration(token.expiresAt)}</span>
                                                        {token.lastUsedAt && (
                                                            <span>Last used: {token.lastUsedAt.toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => toggleTokenVisibility(token.id)}
                                                    >
                                                        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>

                                                    {isVisible && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(token.token, token.id)}
                                                        >
                                                            {copiedToken === token.id ? (
                                                                <Check className="h-4 w-4" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    )}

                                                    {/* <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleToggleToken(token.id)}
                                                        disabled={isTokenExpired(token.expiresAt)}
                                                    >
                                                        {token.isActive ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                                    </Button> */}
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeleteToken(token.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {isVisible && (
                                                <div className="mt-3 p-3 bg-muted rounded-md">
                                                    <div className="font-mono text-sm break-all">
                                                        {token.token}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Dialog for Token Deletion */}
            <ConfirmationDialog
                open={confirmationDialog.open}
                onOpenChange={(open) => setConfirmationDialog(prev => ({ ...prev, open }))}
                onConfirm={confirmDeleteToken}
                title="Delete Access Token"
                description={`Are you sure you want to delete the token "${confirmationDialog.tokenName}"? This action cannot be undone and will immediately revoke access for this token.`}
                confirmText="Delete Token"
                cancelText="Cancel"
            />
        </div>
    );
}
