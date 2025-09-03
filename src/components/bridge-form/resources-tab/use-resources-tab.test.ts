import { act, renderHook } from '@testing-library/react';
import type { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { McpBridgeFormData } from '../utils/types';
import { useResourcesTab } from './use-resources-tab';

describe('useResourcesTab', () => {
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
    const mockResourceFields = {
        fields: [],
        append: vi.fn(),
        prepend: vi.fn(),
        remove: vi.fn(),
        swap: vi.fn(),
        move: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        replace: vi.fn(),
    } as unknown as UseFieldArrayReturn<McpBridgeFormData, 'mcpResources'>;

    it('should provide addResource function that appends a new resource', () => {
        const { result } = renderHook(() => useResourcesTab(mockForm, mockResourceFields));

        act(() => {
            result.current.addResource();
        });

        expect(mockResourceFields.append).toHaveBeenCalledWith({
            id: expect.any(String),
            name: '',
            description: '',
            mimeType: 'text/markdown',
            content: '',
        });
    });

    it('should provide removeResource function that removes a resource', () => {
        const { result } = renderHook(() => useResourcesTab(mockForm, mockResourceFields));

        act(() => {
            result.current.removeResource(2);
        });

        expect(mockResourceFields.remove).toHaveBeenCalledWith(2);
    });

    it('should provide duplicateResource function that copies a resource', () => {
        // Mock getValues to return a sample resource
        const mockResource = {
            name: 'Test Resource',
            description: 'A test resource',
            uri: 'https://example.com/resource',
            mimeType: 'text/markdown',
            content: 'This is a test resource content',
        };
        const mockGetValues = vi.fn().mockReturnValue(mockResource);
        const formWithMockGetValues = { ...mockForm, getValues: mockGetValues };

        const { result } = renderHook(() => useResourcesTab(formWithMockGetValues, mockResourceFields));

        act(() => {
            result.current.duplicateResource(1);
        });

        expect(mockGetValues).toHaveBeenCalledWith('mcpResources.1');
        expect(mockResourceFields.insert).toHaveBeenCalledWith(2, {
            ...mockResource,
            name: 'Test Resource (Copy)',
        });
    }); it('should provide isLastResource function that checks if a resource is the last one', () => {
        // Mock fields array with some items
        const mockFields = [
            { id: '1', name: '', description: '', uri: '', mimeType: 'text/markdown', content: '' },
            { id: '2', name: '', description: '', uri: '', mimeType: 'text/markdown', content: '' },
            { id: '3', name: '', description: '', uri: '', mimeType: 'text/markdown', content: '' }
        ];
        mockResourceFields.fields = mockFields as unknown as UseFieldArrayReturn<McpBridgeFormData, 'mcpResources'>['fields'];

        const { result } = renderHook(() => useResourcesTab(mockForm, mockResourceFields));

        expect(result.current.isLastResource(0)).toBe(false);
        expect(result.current.isLastResource(1)).toBe(false);
        expect(result.current.isLastResource(2)).toBe(true);
    });
});
