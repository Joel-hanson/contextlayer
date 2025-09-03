'use client';

import { useCallback, useState } from 'react';
import { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { McpBridgeFormData } from '../utils/types';

export interface UsePromptsTabResult {
    activePromptId: string | null;
    setActivePromptId: (id: string | null) => void;
    addPrompt: () => void;
    removePrompt: (index: number) => void;
    duplicatePrompt: (index: number) => void;
    isLastPrompt: (index: number) => boolean;
}

export function usePromptsTab(
    form: UseFormReturn<McpBridgeFormData>,
    promptFieldArray: UseFieldArrayReturn<McpBridgeFormData, 'mcpPrompts'>
): UsePromptsTabResult {
    const [activePromptId, setActivePromptId] = useState<string | null>(null);

    const addPrompt = useCallback(() => {
        console.log('Adding prompt. Current fields:', promptFieldArray.fields.length);
        promptFieldArray.append({
            name: '',
            description: '',
            content: '',
            arguments: [],
        });

        // Auto-expand the newly added prompt (now at the last index)
        // Use setTimeout to ensure the field array has been updated
        setTimeout(() => {
            console.log('After adding prompt. New fields:', promptFieldArray.fields.length);
            const lastIndex = promptFieldArray.fields.length - 1;
            const newPromptId = promptFieldArray.fields[lastIndex]?.id + 1;
            if (newPromptId) {
                console.log('Setting active prompt ID:', newPromptId);
                setActivePromptId(newPromptId);
            }
        }, 10);
    }, [promptFieldArray, setActivePromptId]);

    const removePrompt = useCallback((index: number) => {
        const promptToRemove = promptFieldArray.fields[index];
        if (activePromptId === promptToRemove.id) {
            setActivePromptId(null);
        }
        promptFieldArray.remove(index);
    }, [promptFieldArray, activePromptId, setActivePromptId]);

    const duplicatePrompt = useCallback((index: number) => {
        const currentPrompt = form.getValues(`mcpPrompts.${index}`);
        if (currentPrompt) {
            const duplicatedPrompt = {
                ...currentPrompt,
                name: `${currentPrompt.name} (Copy)`,
            };
            promptFieldArray.insert(index + 1, duplicatedPrompt);

            // Auto-expand the duplicated prompt
            const newPromptId = promptFieldArray.fields[index + 1]?.id;
            if (newPromptId) {
                setTimeout(() => {
                    setActivePromptId(newPromptId);
                }, 0);
            }
        }
    }, [form, promptFieldArray, setActivePromptId]);

    const isLastPrompt = useCallback((index: number) => {
        return index === promptFieldArray.fields.length - 1;
    }, [promptFieldArray.fields.length]);

    return {
        activePromptId,
        setActivePromptId,
        addPrompt,
        removePrompt,
        duplicatePrompt,
        isLastPrompt,
    };
}
