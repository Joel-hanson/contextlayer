'use client';

import { UseFormReturn } from 'react-hook-form';
import { McpBridgeFormData } from '../utils/types';
import { AuthenticationTabUI } from './AuthenticationTabUI';

interface AuthenticationTabProps {
    form: UseFormReturn<McpBridgeFormData>;
}

export function AuthenticationTab({ form }: AuthenticationTabProps) {
    return <AuthenticationTabUI form={form} />;
}
