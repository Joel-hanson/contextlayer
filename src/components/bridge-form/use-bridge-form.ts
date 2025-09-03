import { useToast } from '@/hooks/use-toast';
import { OpenAPIParser } from '@/lib/openapi-parser';
import { BridgeConfig } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { Resolver, useFieldArray, useForm } from 'react-hook-form';
import { McpBridgeFormData, mcpBridgeFormSchema } from './utils/types';

// Define parameter and endpoint types to avoid 'any'
interface EndpointParameter {
    name?: string;
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    description?: string;
    location?: 'path' | 'query' | 'body';
    style?: 'parameter' | 'replacement';
}

interface Endpoint {
    id?: string;
    name?: string;
    path?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    description?: string;
    parameters?: EndpointParameter[];
    requestBody?: {
        properties?: Record<string, {
            type?: string;
            description?: string;
            required?: boolean;
        }>;
    };
}

/**
 * Custom hook for managing the BridgeForm state and side effects
 */
export function useBridgeForm(props: {
    bridge?: BridgeConfig;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (bridge: BridgeConfig) => Promise<void>;
}) {
    const { bridge, open, onOpenChange } = props;

    // Form and UI state
    const [activeTab, setActiveTab] = useState('basic');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Confirmation dialog states
    const [showLoadDraftDialog, setShowLoadDraftDialog] = useState(false);
    const [showCloseDialog, setShowCloseDialog] = useState(false);
    const [draftData, setDraftData] = useState<McpBridgeFormData & { timestamp: number; editingId: string } | null>(null);

    const { toast } = useToast();

    // Initialize form with default values
    const form = useForm<McpBridgeFormData>({
        resolver: zodResolver(mcpBridgeFormSchema) as Resolver<McpBridgeFormData>,
        mode: 'all',
        reValidateMode: 'onChange',
        defaultValues: {
            name: '',
            description: '',
            apiConfig: {
                name: '',
                baseUrl: '',
                description: '',
                headers: {},
                authentication: { type: 'none', keyLocation: 'header' } as const,
                endpoints: [],
            },
            mcpTools: [],
            mcpResources: [],
            mcpPrompts: [],
            access: {
                allowedOrigins: [],
                requiresAuthentication: false,
            },
        },
    });

    // Set up field arrays for managing collections
    const endpointFields = useFieldArray({
        control: form.control,
        name: 'apiConfig.endpoints',
    });

    // Initialize form with bridge data when editing
    useEffect(() => {
        if (open) {
            // Clear any previous submit errors when opening the form
            setSubmitError(null);

            if (bridge) {
                // Editing existing bridge - load bridge data into form
                form.reset({
                    name: bridge.name,
                    description: bridge.description || '',
                    isPublic: bridge.isPublic ?? false,
                    apiConfig: {
                        name: bridge.apiConfig.name,
                        baseUrl: bridge.apiConfig.baseUrl,
                        description: bridge.apiConfig.description || '',
                        headers: bridge.apiConfig.headers || {},
                        authentication: bridge.apiConfig.authentication || { type: 'none', keyLocation: 'header' },
                        endpoints: (bridge.apiConfig.endpoints || []).map(endpoint => {
                            // Convert request body properties into body parameters
                            const bodyParameters = endpoint.requestBody?.properties
                                ? Object.entries(endpoint.requestBody.properties).map(([name, schema]) => ({
                                    name,
                                    type: (schema.type || 'string') as 'string' | 'number' | 'boolean' | 'object' | 'array',
                                    description: schema.description || '',
                                    required: schema.required || false,
                                    location: 'body' as const,
                                    style: 'parameter' as const
                                }))
                                : [];

                            // Ensure existing parameters have correct types
                            const typedParameters = (endpoint.parameters || []).map(param => ({
                                name: param.name || '',
                                type: param.type || 'string',
                                required: !!param.required,
                                description: param.description || '',
                                location: param.location || 'query',
                                style: param.style || 'parameter'
                            }));

                            return {
                                ...endpoint,
                                parameters: [
                                    ...typedParameters,
                                    ...bodyParameters
                                ]
                            };
                        }),
                    },
                    mcpTools: bridge.mcpTools || [],
                    mcpResources: (bridge.mcpResources || []).map(resource => ({
                        uri: resource.uri,
                        name: resource.name,
                        description: resource.description || '',
                        mimeType: resource.mimeType || 'application/json',
                        content: resource.content || ''
                    })),
                    mcpPrompts: (bridge.mcpPrompts || []).map(prompt => ({
                        name: prompt.name,
                        description: prompt.description || '',
                        content: prompt.content || '',
                        arguments: prompt.arguments?.map(arg => ({
                            name: arg.name,
                            description: arg.description || '',
                            required: arg.required
                        })) || []
                    })),
                    access: {
                        requiresAuthentication: bridge.access?.authRequired ?? false,
                        allowedOrigins: bridge.access?.allowedOrigins || [],
                        apiKey: bridge.access?.apiKey || undefined,
                    },
                });

                // Trigger validation after loading existing bridge data
                setTimeout(() => {
                    form.trigger();
                }, 0);
            } else {
                // Creating new bridge - check for template or reset to defaults
                const templateData = localStorage.getItem('contextlayer-template');
                if (templateData) {
                    try {
                        const template = JSON.parse(templateData);
                        form.reset({
                            name: template.name || '',
                            description: template.description || '',
                            isPublic: false, // Default to private for new bridges
                            apiConfig: {
                                name: template.apiConfig?.name || '',
                                baseUrl: template.apiConfig?.baseUrl || '',
                                description: template.apiConfig?.description || '',
                                headers: template.apiConfig?.headers || {},
                                authentication: template.apiConfig?.authentication || {
                                    type: 'none',
                                    keyLocation: template.apiConfig?.authentication?.keyLocation || 'header'
                                },
                                endpoints: (template.apiConfig?.endpoints || []).map((endpoint: Endpoint) => ({
                                    id: endpoint.id || `endpoint-${Date.now()}`,
                                    name: endpoint.name || '',
                                    path: endpoint.path || '',
                                    method: endpoint.method || 'GET',
                                    description: endpoint.description || '',
                                    parameters: (endpoint.parameters || []).map((param: EndpointParameter) => ({
                                        name: param.name || '',
                                        type: (param.type || 'string') as 'string' | 'number' | 'boolean' | 'object' | 'array',
                                        required: Boolean(param.required),
                                        description: param.description || '',
                                        location: param.location || 'query',
                                        style: param.style || 'parameter'
                                    })),
                                    // Safe access to requestBody
                                    requestBody: 'requestBody' in endpoint ? endpoint.requestBody : undefined
                                })),
                            },
                            mcpTools: template.mcpTools || [],
                            mcpResources: template.mcpResources || [],
                            mcpPrompts: template.mcpPrompts || [],
                            access: {
                                requiresAuthentication: false,
                                allowedOrigins: [],
                                apiKey: undefined,
                            },
                        });

                        // Clear template data after use
                        localStorage.removeItem('contextlayer-template');

                        // Fix endpoints to have IDs if they don't already
                        const currentEndpoints = form.getValues('apiConfig.endpoints');
                        const endpointsWithIds = currentEndpoints.map((endpoint, index) => ({
                            ...endpoint,
                            id: endpoint.id || `endpoint-${Date.now()}-${index}`,
                            parameters: endpoint.parameters || []
                        }));
                        form.setValue('apiConfig.endpoints', endpointsWithIds);

                        // Manually trigger validation
                        setTimeout(() => {
                            form.trigger();
                        }, 100);

                        toast({
                            title: "Template Applied",
                            description: `Template "${template.name}" has been applied to the form.`,
                        });
                    } catch (error) {
                        console.error('Error loading template:', error);
                        resetFormToDefaults();
                    }
                } else {
                    resetFormToDefaults();
                }
            }
        }

        // Helper to reset form to default values
        function resetFormToDefaults() {
            form.reset({
                name: '',
                description: '',
                isPublic: false, // Default to private
                apiConfig: {
                    name: '',
                    baseUrl: '',
                    description: '',
                    headers: {},
                    authentication: { type: 'none', keyLocation: 'header' },
                    endpoints: [],
                },
                mcpResources: [],
                mcpPrompts: [],
                access: {
                    requiresAuthentication: false,
                    allowedOrigins: [],
                    apiKey: undefined,
                },
            });

            // Trigger validation after reset
            setTimeout(() => {
                form.trigger();
            }, 0);
        }
    }, [bridge, open, form, toast]);

    // Watch for form changes to detect unsaved changes
    useEffect(() => {
        const subscription = form.watch(() => {
            if (open) {
                const isDirty = form.formState.isDirty;
                setHasUnsavedChanges(isDirty);

                // Auto-save to localStorage to prevent data loss
                if (isDirty) {
                    const formData = form.getValues();
                    localStorage.setItem('bridge-form-draft', JSON.stringify({
                        ...formData,
                        timestamp: Date.now(),
                        editingId: bridge?.id || 'new'
                    }));
                }
            }
        });
        return () => subscription.unsubscribe();
    }, [form, open, bridge?.id, form.getValues]);

    // Watch for endpoint changes to update MCP tools
    useEffect(() => {
        if (open) {
            const unsubscribe = form.watch((formData) => {
                // Only process if we have endpoints
                const endpoints = formData?.apiConfig?.endpoints;
                if (!endpoints || endpoints.length === 0) return;

                // Only regenerate if there are no existing tools
                const currentTools = formData?.mcpTools;
                if (!currentTools || currentTools.length === 0) {
                    try {
                        const processedEndpoints = endpoints
                            .filter(endpoint => endpoint !== null && endpoint !== undefined)
                            .map((endpoint) => {
                                const bodyParameters = endpoint.parameters?.filter(
                                    (p) => p && p.location === 'body'
                                ) || [];

                                const requestBody = bodyParameters.length > 0 ? {
                                    properties: bodyParameters.reduce((acc: Record<string, { type: string, description?: string, required?: boolean }>, param) => {
                                        if (!param || !param.name) return acc;
                                        return {
                                            ...acc,
                                            [param.name]: {
                                                type: param.type || 'string',
                                                description: param.description,
                                                required: param.required
                                            }
                                        };
                                    }, {})
                                } : undefined;

                                // Ensure parameters have the correct type
                                const parameters = (endpoint.parameters?.filter(
                                    (p) => p && p.location !== 'body'
                                ) || []).map((param) => {
                                    if (!param) return null;
                                    return {
                                        name: param.name || '',
                                        type: param.type || 'string',
                                        required: !!param.required,
                                        description: param.description || '',
                                        location: param.location || 'query',
                                        style: param.style || 'parameter'
                                    };
                                }).filter((p): p is NonNullable<typeof p> => p !== null);

                                return {
                                    id: endpoint.id || `endpoint-${Date.now()}`,
                                    name: endpoint.name || '',
                                    path: endpoint.path || '',
                                    method: endpoint.method || 'GET',
                                    description: endpoint.description || '',
                                    parameters,
                                    requestBody
                                };
                            });

                        // Generate MCP tools from processed endpoints
                        const tools = OpenAPIParser.generateMcpTools(processedEndpoints);

                        // Ensure tools have required properties
                        const safeTools = tools.map(tool => ({
                            ...tool,
                            inputSchema: {
                                ...tool.inputSchema,
                                required: tool.inputSchema.required || []
                            }
                        }));

                        form.setValue('mcpTools', safeTools);
                    } catch (error) {
                        console.error('Error generating MCP tools:', error);
                    }
                }
            });

            return () => unsubscribe.unsubscribe();
        }
    }, [form, open]);

    // Load draft data when opening form
    useEffect(() => {
        if (open && !bridge) {
            // Only load draft for new bridges
            const draftDataStr = localStorage.getItem('bridge-form-draft');
            if (draftDataStr) {
                try {
                    const draft = JSON.parse(draftDataStr);
                    // Only load if draft is recent (less than 1 hour old)
                    if (Date.now() - draft.timestamp < 3600000 && draft.editingId === 'new') {
                        setDraftData(draft);
                        setShowLoadDraftDialog(true);
                    }
                } catch (error) {
                    console.error('Error loading draft data:', error);
                }
            }
        }
    }, [open, bridge]);

    // Reset form to default values
    const resetFormToDefaults = useCallback(() => {
        form.reset({
            name: '',
            description: '',
            apiConfig: {
                name: '',
                baseUrl: '',
                description: '',
                headers: {},
                authentication: { type: 'none', keyLocation: 'header' },
                endpoints: [],
            },
            mcpResources: [],
            mcpPrompts: [],
            access: {
                requiresAuthentication: false,
                allowedOrigins: [],
                apiKey: undefined,
            },
        });

        // Trigger validation after reset
        setTimeout(() => {
            form.trigger();
        }, 0);
    }, [form]);

    // Clear draft from localStorage
    const clearDraft = useCallback(() => {
        localStorage.removeItem('bridge-form-draft');
    }, []);

    // Handle form close
    const handleClose = useCallback(() => {
        if (hasUnsavedChanges) {
            setShowCloseDialog(true);
            return;
        }
        onOpenChange(false);
    }, [hasUnsavedChanges, onOpenChange]);

    // Handle loading draft data
    const handleLoadDraftConfirm = useCallback(() => {
        if (draftData) {
            form.reset(draftData);
        }
        setShowLoadDraftDialog(false);
    }, [draftData, form]);

    // Handle close confirmation
    const handleCloseConfirm = useCallback(() => {
        setShowCloseDialog(false);
        onOpenChange(false);
    }, [onOpenChange]);

    // Set form as submitted and clear draft
    const handleFormSuccess = useCallback(() => {
        setHasUnsavedChanges(false);
        clearDraft();
        onOpenChange(false);
    }, [clearDraft, onOpenChange]);

    return {
        // Form state
        form,
        activeTab,
        setActiveTab,
        hasUnsavedChanges,
        showGuide,
        setShowGuide,
        submitError,
        setSubmitError,
        isSubmitting,
        setIsSubmitting,

        // Field arrays
        endpointFields,

        // Dialog states
        showLoadDraftDialog,
        setShowLoadDraftDialog,
        showCloseDialog,
        setShowCloseDialog,

        // Handlers
        handleClose,
        handleLoadDraftConfirm,
        handleCloseConfirm,
        handleFormSuccess,
        clearDraft,
        resetFormToDefaults,
    };
}
