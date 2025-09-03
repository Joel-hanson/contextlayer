'use client';

import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { McpBridgeFormData } from '../utils/types';
import { ResourcesTabUI } from './ResourcesTabUI';

interface ResourcesTabProps {
    form: UseFormReturn<McpBridgeFormData>;
}

export function ResourcesTab({ form }: ResourcesTabProps) {
    const resourceFieldArray = useFieldArray({
        control: form.control,
        name: 'mcpResources',
    });

    return (
        <ResourcesTabUI
            form={form}
            resourceFieldArray={resourceFieldArray}
        />
    );
}
