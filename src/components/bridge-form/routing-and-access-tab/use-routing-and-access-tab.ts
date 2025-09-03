'use client';

import { useToast } from '@/hooks/use-toast';
import { useTokens } from '@/hooks/useTokens';
import type { McpAccessToken } from '@/lib/security';
import { BridgeConfig } from '@/lib/types';
import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { McpBridgeFormData } from '../utils/types';

interface UseRoutingAndAccessTabResult {
    generateAuthToken: () => void;
    showRevokeConfirmation: boolean;
    setShowRevokeConfirmation: (show: boolean) => void;
    revokeAuthTokens: () => void;
    revokeAllAuthTokens: () => void;
    tokens: McpAccessToken[];
    bridgeHostname: string;
    bridgeUrl: string;
    wsUrl: string;
    isSelfHosted: boolean;
    requiresAuthentication: boolean;
    setRequiresAuthentication: (requires: boolean) => void;
    isGeneratingToken: boolean;
    isRevokingToken: boolean;
}

export function useRoutingAndAccessTab(
    form: UseFormReturn<McpBridgeFormData>,
    bridgeConfig?: BridgeConfig
): UseRoutingAndAccessTabResult {
    const { toast } = useToast();
    const [showRevokeConfirmation, setShowRevokeConfirmation] = useState(false);
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);
    const [isRevokingToken, setIsRevokingToken] = useState(false);
    const [isSelfHosted, setIsSelfHosted] = useState(false);
    const [requiresAuthentication, setRequiresAuthentication] = useState(
        Boolean(form.watch('access')?.requiresAuthentication) || false
    );
    const [bridgeHostname, setBridgeHostname] = useState('');
    const [bridgeUrl, setBridgeUrl] = useState('');
    const [wsUrl, setWsUrl] = useState('');

    const { tokens, createToken, deleteToken, toggleToken } = useTokens(
        bridgeConfig?.id || ''
    );

    // Update form when requiresAuthentication changes
    useEffect(() => {
        const currentAccess = form.getValues('access') || {};
        form.setValue('access', {
            ...currentAccess,
            requiresAuthentication,
        });
    }, [requiresAuthentication, form]);

    // Update URL displays when bridge ID changes
    useEffect(() => {
        if (!bridgeConfig?.id) return;

        const hostname = typeof window !== 'undefined' ? window.location.host : '';
        setBridgeHostname(hostname);

        const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https' : 'http';
        const wsProtocol = protocol === 'https' ? 'wss' : 'ws';

        setBridgeUrl(`${protocol}://${hostname}/mcp/${bridgeConfig.id}`);
        setWsUrl(`${wsProtocol}://${hostname}/mcp/${bridgeConfig.id}/ws`);

        // Detect if we're running in self-hosted mode
        setIsSelfHosted(hostname.includes('localhost') || hostname.includes('127.0.0.1'));
    }, [bridgeConfig?.id]);

    const generateAuthToken = async () => {
        if (!bridgeConfig?.id) {
            toast({
                title: 'Error',
                description: 'Bridge ID is required to generate a token',
                variant: 'destructive',
            });
            return;
        }

        setIsGeneratingToken(true);
        try {
            await createToken('Bridge Access Token', 'Token for accessing the MCP bridge');
            toast({
                title: 'Success',
                description: 'Authentication token generated successfully',
            });
        } catch (_error) {
            toast({
                title: 'Error',
                description: 'Failed to generate authentication token',
                variant: 'destructive',
            });
        } finally {
            setIsGeneratingToken(false);
        }
    };

    const revokeAuthTokens = async () => {
        if (!bridgeConfig?.id || tokens.length === 0) return;

        setIsRevokingToken(true);
        try {
            // Delete the first token (or implement a way to select which token to delete)
            await deleteToken(tokens[0].id);
            toast({
                title: 'Success',
                description: 'Authentication token revoked successfully',
            });
        } catch (_error) {
            toast({
                title: 'Error',
                description: 'Failed to revoke authentication token',
                variant: 'destructive',
            });
        } finally {
            setIsRevokingToken(false);
            setShowRevokeConfirmation(false);
        }
    };

    const revokeAllAuthTokens = async () => {
        if (!bridgeConfig?.id || tokens.length === 0) return;

        setIsRevokingToken(true);
        try {
            // Delete all tokens
            await Promise.all(tokens.map(token => deleteToken(token.id)));
            toast({
                title: 'Success',
                description: 'All authentication tokens revoked successfully',
            });
        } catch (_error) {
            toast({
                title: 'Error',
                description: 'Failed to revoke authentication tokens',
                variant: 'destructive',
            });
        } finally {
            setIsRevokingToken(false);
            setShowRevokeConfirmation(false);
        }
    };

    return {
        generateAuthToken,
        showRevokeConfirmation,
        setShowRevokeConfirmation,
        revokeAuthTokens,
        revokeAllAuthTokens,
        tokens,
        bridgeHostname,
        bridgeUrl,
        wsUrl,
        isSelfHosted,
        requiresAuthentication,
        setRequiresAuthentication,
        isGeneratingToken,
        isRevokingToken,
    };
}
