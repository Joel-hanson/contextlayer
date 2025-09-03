'use client';

import { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { McpBridgeFormData } from '../utils/types';
import { EndpointsTabUI } from './EndpointsTabUI';

interface EndpointsTabProps {
    form: UseFormReturn<McpBridgeFormData>;
    endpointFields: UseFieldArrayReturn<McpBridgeFormData, "apiConfig.endpoints", "id">;
}

export function EndpointsTab({ form, endpointFields }: EndpointsTabProps) {
    return <EndpointsTabUI form={form} endpointFields={endpointFields} />;
}
