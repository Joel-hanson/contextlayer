import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOpenAPIImportDialog } from './use-openapi-import-dialog';

describe('useOpenAPIImportDialog', () => {
    const mockOnImport = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useOpenAPIImportDialog({ onImport: mockOnImport }));

        expect(result.current.activeTab).toBe('url');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.result).toBe(null);
        expect(result.current.url).toBe('');
        expect(result.current.jsonContent).toBe('');
        expect(result.current.file).toBe(null);
    });

    it('should update url when setUrl is called', () => {
        const { result } = renderHook(() => useOpenAPIImportDialog({ onImport: mockOnImport }));

        act(() => {
            result.current.setUrl('https://example.com/openapi.json');
        });

        expect(result.current.url).toBe('https://example.com/openapi.json');
    });

    it('should update jsonContent when setJsonContent is called', () => {
        const { result } = renderHook(() => useOpenAPIImportDialog({ onImport: mockOnImport }));

        act(() => {
            result.current.setJsonContent('{"openapi": "3.0.0"}');
        });

        expect(result.current.jsonContent).toBe('{"openapi": "3.0.0"}');
    });

    it('should update file when setFile is called', () => {
        const { result } = renderHook(() => useOpenAPIImportDialog({ onImport: mockOnImport }));
        const mockFile = new File(['{}'], 'openapi.json', { type: 'application/json' });

        act(() => {
            result.current.setFile(mockFile);
        });

        expect(result.current.file).toBe(mockFile);
    });

    it('should update activeTab when setActiveTab is called', () => {
        const { result } = renderHook(() => useOpenAPIImportDialog({ onImport: mockOnImport }));

        act(() => {
            result.current.setActiveTab('file');
        });

        expect(result.current.activeTab).toBe('file');
    });

    it('should reset state when handleClose is called', () => {
        const { result } = renderHook(() => useOpenAPIImportDialog({ onImport: mockOnImport }));

        // Set some values
        act(() => {
            result.current.setUrl('https://example.com/openapi.json');
            result.current.setJsonContent('{"openapi": "3.0.0"}');
            result.current.setActiveTab('text');
            // Set some mock result
            // @ts-ignore - We're forcibly setting an internal state for testing
            result.current.result = { success: true, data: {} };
        });

        // Call handleClose
        act(() => {
            result.current.handleClose();
        });

        // Verify everything is reset
        expect(result.current.activeTab).toBe('url');
        expect(result.current.url).toBe('');
        expect(result.current.jsonContent).toBe('');
        expect(result.current.file).toBe(null);
        expect(result.current.result).toBe(null);
    });

    // Additional tests for the API call functions would typically mock fetch
    // and test the handleImportFromUrl, handleImportFromJson, etc. functions
});
