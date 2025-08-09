'use client';

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTokens } from "@/hooks/useTokens";
import { McpAccessToken, TokenPermission } from "@/lib/security";
import { AlertCircle, Check, Copy, Eye, EyeOff, Play, Plus, Square, Trash2 } from "lucide-react";
import { useState } from "react";

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
    const { tokens, loading, error, createToken, toggleToken, deleteToken } = useTokens(bridgeId);
    const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newToken, setNewToken] = useState<NewTokenForm>(initialNewToken); const handleCreateToken = async () => {
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
            }
        } catch (error) {
            console.error('Failed to create token:', error);
        }
    };

    const handleToggleToken = async (tokenId: string) => {
        try {
            await toggleToken(tokenId);
        } catch (error) {
            console.error('Failed to toggle token:', error);
        }
    };

    const handleDeleteToken = async (tokenId: string) => {
        if (window.confirm('Are you sure you want to delete this token? This action cannot be undone.')) {
            try {
                await deleteToken(tokenId);
            } catch (error) {
                console.error('Failed to delete token:', error);
            }
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
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
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
                                        variant="outline"
                                        onClick={() => {
                                            setIsCreating(false);
                                            setNewToken(initialNewToken);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
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
                        {tokens.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No access tokens created yet.
                            </div>
                        ) : (
                            tokens.map((token) => {
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
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => toggleTokenVisibility(token.id)}
                                                    >
                                                        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>

                                                    {isVisible && (
                                                        <Button
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

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleToggleToken(token.id)}
                                                        disabled={isTokenExpired(token.expiresAt)}
                                                    >
                                                        {token.isActive ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                                    </Button>                                                    <Button
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
        </div>
    );
}
