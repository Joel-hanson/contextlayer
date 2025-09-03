import type { BridgeConfig } from '@/lib/types';
import { act, renderHook } from '@testing-library/react';
import type { UseFormReturn } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { McpBridgeFormData } from '../utils/types';
import { useRoutingAndAccessTab } from './use-routing-and-access-tab';

describe('useRoutingAndAccessTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Mock the useForm hook return
    const mockForm = {
        register: vi.fn(),
        setValue: vi.fn(),
        watch: vi.fn().mockReturnValue(false),
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

    // Mock the useToast hook
    vi.mock('@/hooks/use-toast', () => ({
        useToast: () => ({
            toast: vi.fn(),
        }),
    }));

    // Mock the useTokens hook
    vi.mock('@/hooks/useTokens', () => ({
        useTokens: () => ({
            tokens: [],
            createToken: vi.fn(),
            revokeToken: vi.fn(),
            revokeAllTokens: vi.fn(),
        }),
    }));

    // Mock window.location
    Object.defineProperty(window, 'location', {
        value: {
            protocol: 'http:',
            host: 'localhost:3000',
        },
        writable: true,
    });

    it('should initialize with default values', () => {
        const mockBridgeConfig = { id: 'test-bridge-123' } as Partial<BridgeConfig>;

        const { result } = renderHook(() => useRoutingAndAccessTab(mockForm, mockBridgeConfig as BridgeConfig));

        expect(result.current.showRevokeConfirmation).toBe(false);
        expect(result.current.isGeneratingToken).toBe(false);
        expect(result.current.isRevokingToken).toBe(false);
        expect(result.current.bridgeUrl).toBe('http://localhost:3000/mcp/test-bridge-123');
        expect(result.current.isSelfHosted).toBe(true);
    });

    it('should toggle requiresAuthentication state', () => {
        const mockBridgeConfig = { id: 'test-bridge-123' } as Partial<BridgeConfig>;

        const { result } = renderHook(() => useRoutingAndAccessTab(mockForm, mockBridgeConfig as BridgeConfig));

        act(() => {
            result.current.setRequiresAuthentication(true);
        });

        expect(mockForm.setValue).toHaveBeenCalledWith('access.requiresAuthentication', true);
    });

    it('should set URLs based on window.location', () => {
        // Change window.location to simulate HTTPS
        Object.defineProperty(window, 'location', {
            value: {
                protocol: 'https:',
                host: 'example.com',
            },
            writable: true,
        });

        const mockBridgeConfig = { id: 'test-bridge-123' } as Partial<BridgeConfig>;

        const { result } = renderHook(() => useRoutingAndAccessTab(mockForm, mockBridgeConfig as BridgeConfig));

        expect(result.current.bridgeUrl).toBe('https://example.com/mcp/test-bridge-123');
        expect(result.current.isSelfHosted).toBe(false);
    });    // Add more tests for token generation and revocation functionality
});
