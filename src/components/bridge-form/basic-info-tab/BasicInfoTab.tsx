'use client';

import { UseFormReturn } from 'react-hook-form';
import { McpBridgeFormData } from '../utils/types';
import { BasicInfoTabUI } from './BasicInfoTabUI';

interface BasicInfoTabProps {
    form: UseFormReturn<McpBridgeFormData>;
}

export function BasicInfoTab({ form }: BasicInfoTabProps) {
    return <BasicInfoTabUI form={form} />;
}
