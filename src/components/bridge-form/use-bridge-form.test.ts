import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBridgeForm } from './use-bridge-form';

// Mock React hooks
vi.mock('react', async () => {
    const actual = await vi.importActual('react');
    return {
        ...actual as object,
        useState: vi.fn().mockImplementation((initialValue) => [initialValue, vi.fn()]),
        useEffect: vi.fn().mockImplementation((cb) => cb()),
        useCallback: vi.fn().mockImplementation((cb) => cb),
    };
});

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => {
            return store[key] || null;
        }),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock form implementation
vi.mock('react-hook-form', () => ({
    useForm: () => ({
        register: vi.fn(),
        handleSubmit: vi.fn((cb) => cb),
        formState: { errors: {}, isDirty: false },
        watch: vi.fn(() => vi.fn()),
        setValue: vi.fn(),
        getValues: vi.fn(() => ({
            name: '',
            apiConfig: {
                name: '',
                baseUrl: '',
                endpoints: []
            }
        })),
        reset: vi.fn(),
        trigger: vi.fn(),
    }),
    useFieldArray: vi.fn(() => ({
        fields: [],
        append: vi.fn(),
        remove: vi.fn(),
        move: vi.fn(),
    })),
}));

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

// Mock OpenAPIParser
vi.mock('@/lib/openapi-parser', () => ({
    OpenAPIParser: {
        generateMcpTools: vi.fn(() => []),
    },
}));

describe('useBridgeForm basic functionality', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
    });

    it('should expose the correct interface', () => {
        // Setup
        const props = {
            bridge: undefined,
            open: true,
            onOpenChange: vi.fn(),
            onSave: vi.fn().mockResolvedValue(undefined)
        };

        // Execute
        const hook = useBridgeForm(props);

        // Verify
        // Check that the hook returns the expected properties
        expect(hook).toHaveProperty('form');
        expect(hook).toHaveProperty('activeTab');
        expect(hook).toHaveProperty('setActiveTab');
        expect(hook).toHaveProperty('hasUnsavedChanges');
        expect(hook).toHaveProperty('showGuide');
        expect(hook).toHaveProperty('setShowGuide');
        expect(hook).toHaveProperty('submitError');
        expect(hook).toHaveProperty('isSubmitting');
        expect(hook).toHaveProperty('endpointFields');
        expect(hook).toHaveProperty('resourceFields');
        expect(hook).toHaveProperty('promptFields');
        expect(hook).toHaveProperty('handleClose');
        expect(hook).toHaveProperty('handleCloseConfirm');
        expect(hook).toHaveProperty('handleFormSuccess');
    });
});
