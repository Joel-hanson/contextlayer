'use client';

import { useState } from 'react';
import { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { McpBridgeFormData } from '../utils/types';

interface UseResourcesTabResult {
    activeResourceId: string | null;
    setActiveResourceId: (id: string | null) => void;
    addResource: () => void;
    removeResource: (index: number) => void;
    duplicateResource: (index: number) => void;
    resourceFieldArray: UseFieldArrayReturn<McpBridgeFormData, 'mcpResources'>;
}

export function useResourcesTab(
    form: UseFormReturn<McpBridgeFormData>,
    resourceFieldArray: UseFieldArrayReturn<McpBridgeFormData, 'mcpResources'>
): UseResourcesTabResult {
    const [activeResourceId, setActiveResourceId] = useState<string | null>(null);
    const addResource = () => {
        const timestamp = Date.now();
        resourceFieldArray.append({
            name: '',
            description: '',
            uri: `resource://untitled_${timestamp}`,
            mimeType: 'text/markdown',
            content: '',
        });
        // Auto-expand the newly added resource
        const newIndex = resourceFieldArray.fields.length;
        if (newIndex >= 0) {
            const newResourceId = resourceFieldArray.fields[newIndex]?.id;
            if (newResourceId) {
                setActiveResourceId(newResourceId);
            }
        }
    };

    const removeResource = (index: number) => {
        const resourceId = resourceFieldArray.fields[index]?.id;
        if (activeResourceId === resourceId) {
            setActiveResourceId(null);
        }
        resourceFieldArray.remove(index);
    };

    const duplicateResource = (index: number) => {
        const currentResource = form.getValues(`mcpResources.${index}`);
        if (currentResource) {
            const duplicatedResource = {
                ...currentResource,
                name: `${currentResource.name} (Copy)`,
            };
            resourceFieldArray.insert(index + 1, duplicatedResource);
            // Auto-expand the duplicated resource
            const newResourceId = resourceFieldArray.fields[index + 1]?.id;
            if (newResourceId) {
                setActiveResourceId(newResourceId);
            }
        }
    };

    return {
        activeResourceId,
        setActiveResourceId,
        addResource,
        removeResource,
        duplicateResource,
        resourceFieldArray,
    };
}
