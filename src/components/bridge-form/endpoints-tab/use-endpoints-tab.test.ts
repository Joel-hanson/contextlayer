import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEndpointsTab } from './use-endpoints-tab';

// Mock dependencies
const mockEndpointFields = {
    fields: [
        { id: 'endpoint-1', name: 'get_users', method: 'GET', path: '/users', description: 'Get users' },
        { id: 'endpoint-2', name: 'create_user', method: 'POST', path: '/users', description: 'Create user' },
    ],
    append: vi.fn(),
    remove: vi.fn(),
};

const mockForm = {
    control: {},
    setValue: vi.fn(),
    watch: vi.fn((path) => {
        if (path === 'apiConfig.endpoints.0.parameters') return [];
        if (path === 'apiConfig.endpoints.1.parameters') return [{ name: 'userId', type: 'string' }];
        return null;
    }),
};

describe('useEndpointsTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useEndpointsTab(mockForm as any, mockEndpointFields as any));

        expect(result.current.activeEndpointId).toBeNull();
        expect(result.current.searchQuery).toBe('');
        expect(result.current.filterMethod).toBeNull();
        expect(result.current.filteredEndpoints).toEqual(mockEndpointFields.fields);
    });

    it('should add a new endpoint', () => {
        const { result } = renderHook(() => useEndpointsTab(mockForm as any, mockEndpointFields as any));

        // Mock Date.now for consistent ID generation in tests
        const dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => 123456789);

        act(() => {
            result.current.addEndpoint();
        });

        expect(mockEndpointFields.append).toHaveBeenCalledWith({
            id: 'endpoint-123456789',
            name: '',
            path: '',
            method: 'GET',
            description: '',
            parameters: []
        });

        expect(result.current.activeEndpointId).toBe('endpoint-123456789');

        dateSpy.mockRestore();
    });

    it('should remove an endpoint', () => {
        const { result } = renderHook(() => useEndpointsTab(mockForm as any, mockEndpointFields as any));

        act(() => {
            result.current.removeEndpoint(1);
        });

        expect(mockEndpointFields.remove).toHaveBeenCalledWith(1);
    });

    it('should filter endpoints by search query', () => {
        const { result } = renderHook(() => useEndpointsTab(mockForm as any, mockEndpointFields as any));

        act(() => {
            result.current.setSearchQuery('create');
        });

        expect(result.current.filteredEndpoints).toEqual([mockEndpointFields.fields[1]]);
    });

    it('should filter endpoints by method', () => {
        const { result } = renderHook(() => useEndpointsTab(mockForm as any, mockEndpointFields as any));

        act(() => {
            result.current.setFilterMethod('GET');
        });

        expect(result.current.filteredEndpoints).toEqual([mockEndpointFields.fields[0]]);
    });

    it('should handle both search query and method filter', () => {
        const { result } = renderHook(() => useEndpointsTab(mockForm as any, mockEndpointFields as any));

        act(() => {
            result.current.setSearchQuery('user');
            result.current.setFilterMethod('POST');
        });

        expect(result.current.filteredEndpoints).toEqual([mockEndpointFields.fields[1]]);
    });
});
