import { McpAccessToken, TokenPermission } from '@/lib/security';
import { useCallback, useEffect, useState } from 'react';

// UUID validation helper function
function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

interface UseTokensResult {
    tokens: McpAccessToken[];
    loading: boolean;
    error: string | null;
    createToken: (name: string, description?: string, expiresInDays?: number, permissions?: TokenPermission[]) => Promise<McpAccessToken | null>;
    toggleToken: (tokenId: string) => Promise<boolean>;
    deleteToken: (tokenId: string) => Promise<boolean>;
    refreshTokens: () => Promise<void>;
}

export function useTokens(bridgeId: string): UseTokensResult {
    const [tokens, setTokens] = useState<McpAccessToken[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshTokens = useCallback(async () => {
        // Don't make API calls for invalid bridge IDs (like 'temp-bridge-id')
        if (!bridgeId || bridgeId === 'temp-bridge-id' || !isValidUUID(bridgeId)) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/bridges/${bridgeId}/tokens`);
            const result = await response.json();

            if (result.success) {
                // Transform date strings back to Date objects
                const transformedTokens = result.data.map((token: McpAccessToken & {
                    createdAt: string;
                    expiresAt?: string;
                    lastUsedAt?: string;
                }) => ({
                    ...token,
                    createdAt: new Date(token.createdAt),
                    expiresAt: token.expiresAt ? new Date(token.expiresAt) : undefined,
                    lastUsedAt: token.lastUsedAt ? new Date(token.lastUsedAt) : undefined,
                }));
                setTokens(transformedTokens);
            } else {
                setError(result.error || 'Failed to fetch tokens');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
        } finally {
            setLoading(false);
        }
    }, [bridgeId]);

    const createToken = useCallback(async (
        name: string,
        description?: string,
        expiresInDays?: number,
        permissions?: TokenPermission[]
    ): Promise<McpAccessToken | null> => {
        if (!bridgeId || bridgeId === 'temp-bridge-id' || !isValidUUID(bridgeId)) return null;

        try {
            setError(null);

            const response = await fetch(`/api/bridges/${bridgeId}/tokens`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    description,
                    expiresInDays,
                    permissions,
                }),
            });

            const result = await response.json();

            if (result.success) {
                const newToken = {
                    ...result.data,
                    createdAt: new Date(result.data.createdAt),
                    expiresAt: result.data.expiresAt ? new Date(result.data.expiresAt) : undefined,
                    lastUsedAt: result.data.lastUsedAt ? new Date(result.data.lastUsedAt) : undefined,
                };

                setTokens(prev => [...prev, newToken]);
                return newToken;
            } else {
                setError(result.error || 'Failed to create token');
                return null;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create token');
            return null;
        }
    }, [bridgeId]);

    const toggleToken = useCallback(async (tokenId: string): Promise<boolean> => {
        if (!bridgeId || bridgeId === 'temp-bridge-id' || !isValidUUID(bridgeId)) return false;

        try {
            setError(null);

            const response = await fetch(`/api/bridges/${bridgeId}/tokens`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tokenId }),
            });

            const result = await response.json();

            if (result.success) {
                const updatedToken = {
                    ...result.data,
                    createdAt: new Date(result.data.createdAt),
                    expiresAt: result.data.expiresAt ? new Date(result.data.expiresAt) : undefined,
                    lastUsedAt: result.data.lastUsedAt ? new Date(result.data.lastUsedAt) : undefined,
                };

                setTokens(prev => prev.map(token =>
                    token.id === tokenId ? updatedToken : token
                ));
                return true;
            } else {
                setError(result.error || 'Failed to toggle token');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle token');
            return false;
        }
    }, [bridgeId]);

    const deleteToken = useCallback(async (tokenId: string): Promise<boolean> => {
        if (!bridgeId || bridgeId === 'temp-bridge-id' || !isValidUUID(bridgeId)) return false;

        try {
            setError(null);

            const response = await fetch(`/api/bridges/${bridgeId}/tokens?tokenId=${tokenId}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                setTokens(prev => prev.filter(token => token.id !== tokenId));
                return true;
            } else {
                setError(result.error || 'Failed to delete token');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete token');
            return false;
        }
    }, [bridgeId]);

    // Load tokens on mount and when bridgeId changes
    useEffect(() => {
        if (bridgeId && bridgeId !== 'temp-bridge-id' && isValidUUID(bridgeId)) {
            refreshTokens();
        }
    }, [bridgeId, refreshTokens]);

    return {
        tokens,
        loading,
        error,
        createToken,
        toggleToken,
        deleteToken,
        refreshTokens,
    };
}
