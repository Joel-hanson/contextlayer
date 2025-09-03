'use client';

import { BridgeConfig } from '@/lib/types';
import { UseFormReturn } from 'react-hook-form';
import { McpBridgeFormData } from '../utils/types';
import { RoutingAndAccessTabUI } from './RoutingAndAccessTabUI';
import { useRoutingAndAccessTab } from './use-routing-and-access-tab';

interface RoutingAndAccessTabProps {
    form: UseFormReturn<McpBridgeFormData>;
    bridgeConfig?: BridgeConfig;
}

export function RoutingAndAccessTab({ form, bridgeConfig }: RoutingAndAccessTabProps) {
    const {
        generateAuthToken,
        showRevokeConfirmation,
        setShowRevokeConfirmation,
        revokeAuthTokens,
        revokeAllAuthTokens,
        tokens,
        bridgeHostname,
        bridgeUrl,
        isSelfHosted,
        requiresAuthentication,
        setRequiresAuthentication,
        isGeneratingToken,
        isRevokingToken,
    } = useRoutingAndAccessTab(form, bridgeConfig);

    return (
        <RoutingAndAccessTabUI
            form={form}
            generateAuthToken={generateAuthToken}
            showRevokeConfirmation={showRevokeConfirmation}
            setShowRevokeConfirmation={setShowRevokeConfirmation}
            revokeAuthTokens={revokeAuthTokens}
            revokeAllAuthTokens={revokeAllAuthTokens}
            tokens={tokens}
            bridgeId={bridgeConfig?.id}
            bridgeName={bridgeConfig?.name}
            bridgeHostname={bridgeHostname}
            bridgeUrl={bridgeUrl}
            isSelfHosted={isSelfHosted}
            requiresAuthentication={requiresAuthentication}
            setRequiresAuthentication={setRequiresAuthentication}
            isGeneratingToken={isGeneratingToken}
            isRevokingToken={isRevokingToken}
        />
    );
}
