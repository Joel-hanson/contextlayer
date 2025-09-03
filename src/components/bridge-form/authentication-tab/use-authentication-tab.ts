'use client';

import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { McpBridgeFormData } from '../utils/types';

interface AuthPreview {
    header?: string;
    value?: string;
    query?: string;
}

export function useAuthenticationTab(form: UseFormReturn<McpBridgeFormData>) {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const authType = form.watch('apiConfig.authentication.type') || 'none';

    function generateAuthPreview(): AuthPreview | null {
        const authType = form.watch('apiConfig.authentication.type');

        switch (authType) {
            case 'bearer':
                return {
                    header: 'Authorization',
                    value: `Bearer ${form.watch('apiConfig.authentication.token') || '[YOUR_TOKEN]'}`
                };
            case 'apikey': {
                const keyLocation = form.watch('apiConfig.authentication.keyLocation') || 'header';
                const apiKey = form.watch('apiConfig.authentication.apiKey') || '[YOUR_API_KEY]';

                if (keyLocation === 'header') {
                    const headerName = form.watch('apiConfig.authentication.headerName') || 'X-API-Key';
                    return {
                        header: headerName,
                        value: apiKey
                    };
                } else {
                    const paramName = form.watch('apiConfig.authentication.paramName') || 'api_key';
                    return {
                        query: `?${paramName}=${apiKey}`
                    };
                }
            }
            case 'basic': {
                const username = form.watch('apiConfig.authentication.username') || '[USERNAME]';
                const password = form.watch('apiConfig.authentication.password') || '[PASSWORD]';
                const encoded = btoa(`${username}:${password}`);
                return {
                    header: 'Authorization',
                    value: `Basic ${encoded}`
                };
            }
            default:
                return null;
        }
    }

    return {
        isPreviewOpen,
        setIsPreviewOpen,
        authType,
        generateAuthPreview
    };
}
