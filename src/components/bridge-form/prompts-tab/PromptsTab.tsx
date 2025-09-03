'use client';

import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { McpBridgeFormData } from '../utils/types';
import { PromptsTabUI } from './PromptsTabUI';

interface PromptsTabProps {
    form: UseFormReturn<McpBridgeFormData>;
}

export function PromptsTab({ form }: PromptsTabProps) {
    const promptFieldArray = useFieldArray({
        control: form.control,
        name: 'mcpPrompts',
    });

    return (
        <PromptsTabUI
            form={form}
            promptFieldArray={promptFieldArray}
        />
    );
}
