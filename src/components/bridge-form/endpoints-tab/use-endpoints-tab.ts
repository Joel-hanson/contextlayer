'use client';

import { useState } from 'react';
import { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { McpBridgeFormData } from '../utils/types';

export function useEndpointsTab(
    form: UseFormReturn<McpBridgeFormData>,
    endpointFields: UseFieldArrayReturn<McpBridgeFormData, "apiConfig.endpoints", "id">
) {
    const [activeEndpointId, setActiveEndpointId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filterMethod, setFilterMethod] = useState<string | null>(null);

    const addEndpoint = () => {
        const newEndpointId = `endpoint-${Date.now()}`;
        endpointFields.append({
            id: newEndpointId,
            name: '',
            path: '',
            method: 'GET',
            description: '',
            parameters: []
        });
        setActiveEndpointId(newEndpointId);
    };

    const removeEndpoint = (index: number) => {
        endpointFields.remove(index);
    };

    const filteredEndpoints = endpointFields.fields.filter(endpoint => {
        const matchesSearch = !searchQuery ||
            endpoint.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            endpoint.path?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            endpoint.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesMethod = !filterMethod || endpoint.method === filterMethod;

        return matchesSearch && matchesMethod;
    });

    return {
        activeEndpointId,
        setActiveEndpointId,
        searchQuery,
        setSearchQuery,
        filterMethod,
        setFilterMethod,
        addEndpoint,
        removeEndpoint,
        filteredEndpoints
    };
}
