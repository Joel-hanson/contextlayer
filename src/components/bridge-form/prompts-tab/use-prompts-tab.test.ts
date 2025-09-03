import { act, renderHook } from '@testing-library/react';
import type { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { McpBridgeFormData } from '../utils/types';
import { usePromptsTab } from './use-prompts-tab';

describe('usePromptsTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Mock the useForm hook return
    const mockForm = {
        register: vi.fn(),
        setValue: vi.fn(),
        watch: vi.fn().mockReturnValue(''),
        formState: {
            errors: {},
        },
        getValues: vi.fn(),
        control: {
            register: vi.fn(),
            unregister: vi.fn(),
            getFieldState: vi.fn(),
            _names: {
                array: new Set(),
                mount: new Set(),
                unMount: new Set(),
                watch: new Set(),
                focus: '',
                watchAll: false,
            },
            _subjects: {
                watch: {
                    next: vi.fn(),
                },
                array: {
                    next: vi.fn(),
                },
                state: {
                    next: vi.fn(),
                },
            },
            _getWatch: vi.fn(),
            _formValues: [],
            _defaultValues: {},
        },
    } as unknown as UseFormReturn<McpBridgeFormData>;

    // Mock the useFieldArray hook return
    const mockPromptFields = {
        fields: [],
        append: vi.fn(),
        prepend: vi.fn(),
        remove: vi.fn(),
        swap: vi.fn(),
        move: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        replace: vi.fn(),
    } as unknown as UseFieldArrayReturn<McpBridgeFormData, 'mcpPrompts'>;

    it('should provide addPrompt function that appends a new prompt', () => {
        // Mock useFieldArray implementation
        vi.mock('react-hook-form', () => ({
            useFieldArray: () => mockPromptFields
        }));

        const { result } = renderHook(() => usePromptsTab(mockForm));

        act(() => {
            result.current.addPrompt();
        });

        expect(mockPromptFields.append).toHaveBeenCalledWith({
            id: expect.any(String),
            name: '',
            description: '',
            content: '',
        });
    });

    it('should provide removePrompt function that removes a prompt', () => {
        // Mock useFieldArray implementation
        vi.mock('react-hook-form', () => ({
            useFieldArray: () => mockPromptFields
        }));

        const { result } = renderHook(() => usePromptsTab(mockForm));

        act(() => {
            result.current.removePrompt(2);
        });

        expect(mockPromptFields.remove).toHaveBeenCalledWith(2);
    });

    it('should provide duplicatePrompt function that copies a prompt', () => {
        // Mock getValues to return a sample prompt
        const mockPrompt = {
            name: 'Test Prompt',
            description: 'A test prompt',
            content: 'This is a test prompt content',
            arguments: [],
        };
        const mockGetValues = vi.fn().mockReturnValue(mockPrompt);
        const formWithMockGetValues = { ...mockForm, getValues: mockGetValues };

        // Mock useFieldArray implementation
        vi.mock('react-hook-form', () => ({
            useFieldArray: () => mockPromptFields
        }));

        const { result } = renderHook(() => usePromptsTab(formWithMockGetValues));

        act(() => {
            result.current.duplicatePrompt(1);
        });

        expect(mockGetValues).toHaveBeenCalledWith('mcpPrompts.1');
        expect(mockPromptFields.insert).toHaveBeenCalledWith(2, {
            ...mockPrompt,
            name: 'Test Prompt (Copy)',
        });
    }); it('should provide isLastPrompt function that checks if a prompt is the last one', () => {
        // Mock fields array with some items
        const mockFields = [
            { id: '1', name: '', description: '', content: '', arguments: [] },
            { id: '2', name: '', description: '', content: '', arguments: [] },
            { id: '3', name: '', description: '', content: '', arguments: [] }
        ];
        mockPromptFields.fields = mockFields as unknown as UseFieldArrayReturn<McpBridgeFormData, 'mcpPrompts'>['fields'];

        // Mock useFieldArray implementation
        vi.mock('react-hook-form', () => ({
            useFieldArray: () => mockPromptFields
        }));

        const { result } = renderHook(() => usePromptsTab(mockForm));

        expect(result.current.isLastPrompt(0)).toBe(false);
        expect(result.current.isLastPrompt(1)).toBe(false);
        expect(result.current.isLastPrompt(2)).toBe(true);
    });
});
