'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { OpenAPIParser } from '@/lib/openapi-parser';
import { BridgeConfig } from '@/lib/types';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, BadgeAlert, CheckCircle, Lightbulb, Link, LockIcon, Save, Settings, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Resolver, SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { ConfirmationDialog } from '../ConfirmationDialog';

// Import modular components
import { AuthenticationTab } from './AuthenticationTab';
import { BasicInfoTab } from './BasicInfoTab';
import { EndpointsTab } from './EndpointsTab';
import { PromptsTab } from './PromptsTab';
import { ResourcesTab } from './ResourcesTab';
import { RoutingAndAccessTab } from './RoutingAndAccessTab';
import {
    mcpBridgeFormSchema,
    McpPrompt,
    McpResource,
    type McpBridgeFormData,
    type McpEndpoint
} from './types';

interface BridgeFormProps {
    bridge?: BridgeConfig;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (bridge: BridgeConfig) => Promise<void>;
    onDelete?: (bridgeId: string) => void;
}

export function BridgeForm({ bridge, open, onOpenChange, onSave, onDelete }: BridgeFormProps) {
    const [activeTab, setActiveTab] = useState('basic');
    const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Confirmation dialog states
    const [showLoadDraftDialog, setShowLoadDraftDialog] = useState(false);
    const [showCloseDialog, setShowCloseDialog] = useState(false);
    const [draftData, setDraftData] = useState<McpBridgeFormData & { timestamp: number; editingId: string } | null>(null);

    const { toast } = useToast();

    const form = useForm<McpBridgeFormData>({
        resolver: zodResolver(mcpBridgeFormSchema) as Resolver<McpBridgeFormData>,
        mode: 'all', // Validate on all changes
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
                public: true,
                allowedOrigins: [],
                authRequired: false,
            },
        },
    });

    const endpointFields = useFieldArray({
        control: form.control,
        name: 'apiConfig.endpoints',
    });

    // const toolFields = useFieldArray({
    //     control: form.control,
    //     name: 'mcpTools',
    // });

    const resourceFields = useFieldArray({
        control: form.control,
        name: 'mcpResources',
    });

    const promptFields = useFieldArray({
        control: form.control,
        name: 'mcpPrompts',
    });

    // Initialize form with bridge data when editing
    useEffect(() => {
        if (open) {
            // Clear any previous submit errors when opening the form
            setSubmitError(null);

            if (bridge) {
                // Editing existing bridge
                form.reset({
                    name: bridge.name,
                    description: bridge.description || '',
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
                        mimeType: resource.mimeType || 'application/json'
                    })),
                    mcpPrompts: (bridge.mcpPrompts || []).map(prompt => ({
                        name: prompt.name,
                        description: prompt.description || '',
                        arguments: prompt.arguments?.map(arg => ({
                            name: arg.name,
                            description: arg.description || '',
                            required: arg.required
                        })) || []
                    })),
                    access: {
                        public: bridge.access?.public ?? true,
                        authRequired: bridge.access?.authRequired ?? false,
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
                            apiConfig: {
                                name: template.apiConfig?.name || '',
                                baseUrl: template.apiConfig?.baseUrl || '',
                                description: template.apiConfig?.description || '',
                                headers: template.apiConfig?.headers || {},
                                authentication: template.apiConfig?.authentication || { type: 'none', keyLocation: template.apiConfig?.authentication?.keyLocation || 'header' },
                                endpoints: (template.apiConfig?.endpoints || []).map((endpoint: {
                                    id?: string;
                                    name?: string;
                                    path?: string;
                                    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
                                    description?: string;
                                    parameters?: Array<{
                                        name?: string;
                                        type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
                                        required?: boolean;
                                        description?: string;
                                        location?: 'path' | 'query' | 'body';
                                        style?: 'parameter' | 'replacement';
                                    }>;
                                }) => ({
                                    id: endpoint.id || `endpoint-${Date.now()}`,
                                    name: endpoint.name || '',
                                    path: endpoint.path || '',
                                    method: endpoint.method || 'GET',
                                    description: endpoint.description || '',
                                    parameters: (endpoint.parameters || []).map(param => ({
                                        name: param.name || '',
                                        type: (param.type || 'string') as 'string' | 'number' | 'boolean' | 'object' | 'array',
                                        required: Boolean(param.required),
                                        description: param.description || '',
                                        location: param.location || 'query',
                                        style: param.style || 'parameter'
                                    })),
                                    // Safe access to requestBody - ensure it exists in the type
                                    requestBody: 'requestBody' in endpoint ?
                                        (endpoint as { requestBody?: { properties?: Record<string, { type: string; description?: string; required?: boolean }> } }).requestBody
                                        : undefined
                                })),
                            },
                            mcpTools: template.mcpTools || [],
                            mcpResources: template.mcpResources || [],
                            mcpPrompts: template.mcpPrompts || [],
                            access: {
                                public: true,
                                authRequired: false,
                                allowedOrigins: [],
                                apiKey: undefined,
                            },
                        });
                        // Clear template data after use
                        localStorage.removeItem('contextlayer-template');

                        // Fix endpoints to have IDs if they don't already
                        const currentEndpoints = form.getValues('apiConfig.endpoints');
                        const endpointsWithIds = currentEndpoints.map((endpoint: McpEndpoint, index: number) => ({
                            ...endpoint,
                            id: endpoint.id || `endpoint-${Date.now()}-${index}`,
                            parameters: endpoint.parameters || []
                        }));
                        form.setValue('apiConfig.endpoints', endpointsWithIds);

                        // Manually trigger validation to ensure form is marked as valid
                        setTimeout(() => {
                            form.trigger().then(() => {
                                console.log('Template validation state:', {
                                    isValid: form.formState.isValid,
                                    errors: form.formState.errors,
                                    values: form.getValues()
                                });
                            });
                        }, 100);

                        toast({
                            title: "Template Applied",
                            description: `Template "${template.name}" has been applied to the form.`,
                        });
                    } catch (error) {
                        console.error('Error loading template:', error);
                        // Fall back to defaults
                        form.reset({
                            name: '',
                            description: '',
                            apiConfig: {
                                name: '',
                                baseUrl: '',
                                description: '',
                                headers: {},
                                authentication: { type: 'none' },
                                endpoints: [],
                            },
                            mcpResources: [],
                            mcpPrompts: [],
                            access: { public: true, authRequired: false },
                        });

                        // Trigger validation after reset
                        setTimeout(() => {
                            form.trigger();
                        }, 0);
                    }
                } else {
                    // Reset to defaults
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
                            public: true,
                            authRequired: false,
                            allowedOrigins: [],
                            apiKey: undefined,
                        },
                    });

                    // Trigger validation after reset
                    setTimeout(() => {
                        form.trigger();
                    }, 0);
                }
            }
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
    }, [form, open, bridge?.id]);

    // Watch for endpoint changes to update MCP tools
    useEffect(() => {
        if (open) {
            // We need to use a custom approach to avoid TypeScript errors with the watch function
            const unsubscribe = form.watch((formData) => {
                // Only process if we have endpoints
                const endpoints = formData?.apiConfig?.endpoints;
                if (!endpoints || endpoints.length === 0) return;

                // Process endpoints to generate tools
                type EndpointParameter = {
                    name: string;
                    type: string;
                    description?: string;
                    required?: boolean;
                    location?: 'path' | 'query' | 'body';
                    style?: 'parameter' | 'replacement';
                };

                type Endpoint = {
                    id?: string;
                    name: string;
                    method: string;
                    path: string;
                    description?: string;
                    parameters?: EndpointParameter[];
                    requestBody?: {
                        properties?: Record<string, {
                            type: string;
                            description?: string;
                            required?: boolean;
                        }>;
                    };
                };

                const processedEndpoints = endpoints.map((endpoint) => {
                    if (!endpoint) return null;

                    const bodyParameters = endpoint.parameters?.filter(
                        (p) => p?.location === 'body'
                    ) || [];

                    const requestBody = bodyParameters.length > 0 ? {
                        properties: bodyParameters.reduce<Record<string, {
                            type: string;
                            description?: string;
                            required?: boolean;
                        }>>((acc, param) => {
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

                    return {
                        ...endpoint,
                        id: endpoint.id || `endpoint-${Date.now()}`, // Ensure ID exists
                        parameters: endpoint.parameters?.filter(p => p?.location !== 'body') || [],
                        requestBody
                    } as Endpoint;
                }).filter(Boolean) as Endpoint[];

                // Only regenerate if there are no existing tools
                const currentTools = formData?.mcpTools;
                if (!currentTools || currentTools.length === 0) {
                    try {
                        // Generate tools and set them safely
                        const safeEndpoints = processedEndpoints.map(endpoint => {
                            // Ensure parameters have the correct type
                            const parameters = endpoint.parameters?.map(param => ({
                                ...param,
                                name: param.name,
                                type: (param.type as 'string' | 'number' | 'boolean' | 'object' | 'array'),
                                required: !!param.required,
                                description: param.description,
                                location: param.location,
                                style: param.style
                            }));

                            return {
                                ...endpoint,
                                id: endpoint.id || `endpoint-${Date.now()}`, // Ensure ID exists
                                method: endpoint.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', // Cast method to expected type
                                parameters
                            };
                        });

                        // Define the expected interface for the generateMcpTools function
                        interface McpEndpointFormat {
                            id: string;
                            name: string;
                            path: string;
                            method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
                            description?: string;
                            parameters?: Array<{
                                name: string;
                                type: 'string' | 'number' | 'boolean' | 'object' | 'array';
                                required: boolean;
                                description?: string;
                                location?: 'path' | 'query' | 'body';
                                style?: 'parameter' | 'replacement';
                                defaultValue?: unknown;
                            }>;
                            requestBody?: {
                                properties?: Record<string, {
                                    type: string;
                                    description?: string;
                                    required?: boolean;
                                }>;
                            };
                        }

                        // Cast to expected type to avoid TypeScript errors
                        const tools = OpenAPIParser.generateMcpTools(safeEndpoints as McpEndpointFormat[]);

                        // Ensure tools have required properties to satisfy TypeScript
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

            // Return cleanup function
            return () => {
                unsubscribe.unsubscribe();
            };
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
    }, [open, bridge, form]);

    // Clear draft when successfully saving
    const clearDraft = () => {
        localStorage.removeItem('bridge-form-draft');
    };

    const handleClose = () => {
        if (hasUnsavedChanges) {
            setShowCloseDialog(true);
            return;
        }
        onOpenChange(false);
    };

    // Delete functionality moved to parent component

    const onSubmit: SubmitHandler<McpBridgeFormData> = async (data) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Generate UUID for the bridge
            const bridgeId = bridge?.id || crypto.randomUUID();

            const bridgeConfig: BridgeConfig = {
                id: bridgeId,
                slug: bridgeId, // Use UUID as slug
                name: data.name,
                description: data.description || '',
                apiConfig: {
                    id: bridge?.apiConfig.id || crypto.randomUUID(),
                    name: data.apiConfig.name,
                    baseUrl: data.apiConfig.baseUrl,
                    description: data.apiConfig.description || '',
                    headers: data.apiConfig.headers || {},
                    authentication: data.apiConfig.authentication,
                    endpoints: data.apiConfig.endpoints.map((endpoint: McpEndpoint, index: number) => {
                        // Preserve existing endpoint IDs when editing
                        const existingEndpoint = bridge?.apiConfig.endpoints?.[index];

                        // Build request body from parameters marked as 'body'
                        const bodyParameters = endpoint.parameters?.filter(param => param.location === 'body') || [];
                        const requestBody = bodyParameters.length > 0 ? {
                            properties: bodyParameters.reduce((acc, param) => ({
                                ...acc,
                                [param.name]: {
                                    type: param.type,
                                    description: param.description,
                                    required: param.required
                                }
                            }), {})
                        } : undefined;

                        return {
                            ...endpoint,
                            id: existingEndpoint?.id || crypto.randomUUID(),
                            parameters: endpoint.parameters?.filter(param => param.location !== 'body') || [],
                            requestBody: requestBody,
                            responseSchema: undefined,
                        };
                    }),
                },
                mcpTools: OpenAPIParser.generateMcpTools(
                    // Add request body information to endpoints before generating tools
                    data.apiConfig.endpoints.map(endpoint => {
                        const bodyParameters = endpoint.parameters?.filter(p => p.location === 'body') || [];
                        const requestBody = bodyParameters.length > 0 ? {
                            properties: bodyParameters.reduce((acc, param) => ({
                                ...acc,
                                [param.name]: {
                                    type: param.type,
                                    description: param.description,
                                    required: param.required
                                }
                            }), {})
                        } : undefined;

                        return {
                            ...endpoint,
                            parameters: endpoint.parameters?.filter(p => p.location !== 'body') || [],
                            requestBody
                        };
                    })
                ),
                mcpResources: data.mcpResources?.map((resource: McpResource) => ({
                    uri: resource.uri,
                    name: resource.name,
                    description: resource.description || '',
                    mimeType: resource.mimeType || 'application/json'
                })) || [],
                mcpPrompts: data.mcpPrompts?.map((prompt: McpPrompt) => ({
                    name: prompt.name,
                    description: prompt.description || '',
                    arguments: prompt.arguments?.map((arg: { name: string; description: string; required: boolean }) => ({
                        name: arg.name,
                        description: arg.description || '',
                        required: arg.required
                    })) || []
                })) || [],
                enabled: bridge?.enabled ?? true, // Default to enabled for new bridges

                // Access control - simplified
                access: {
                    public: data.access?.public ?? true,
                    authRequired: data.access?.authRequired ?? false,
                    apiKey: data.access?.apiKey,
                    allowedOrigins: data.access?.allowedOrigins,
                    tokens: [], // Tokens are now managed separately via API
                    security: {
                        tokenAuth: {
                            enabled: true,
                            requireToken: false,
                            allowMultipleTokens: true,
                        },
                        permissions: {
                            defaultPermissions: [],
                            requireExplicitGrants: false,
                            allowSelfManagement: true,
                        },
                        audit: {
                            enabled: true,
                            logRequests: true,
                            retentionDays: 30,
                        },
                    }
                },

                // Performance settings - simplified with defaults
                performance: {
                    rateLimiting: { requestsPerMinute: 60, burstLimit: 10 },
                    caching: { enabled: false, ttl: 300 },
                    timeout: 30000,
                },

                createdAt: bridge?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await onSave(bridgeConfig);
            setHasUnsavedChanges(false);
            clearDraft();
            onOpenChange(false);
        } catch (error: unknown) {
            console.error('Error saving bridge:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to save bridge. Please check your configuration and try again.';
            setSubmitError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const testEndpoint = async (endpoint: McpEndpoint) => {
        // Validate required fields
        if (!endpoint.name || !endpoint.path) {
            toast({
                title: "Test Failed",
                description: "Endpoint name and path are required for testing",
                variant: "destructive",
            });
            return;
        }

        const formValues = form.getValues();
        if (!formValues.apiConfig.baseUrl) {
            toast({
                title: "Test Failed",
                description: "API Base URL is required for testing",
                variant: "destructive",
            });
            return;
        }

        setTestingEndpoint(endpoint.name);
        try {
            const baseUrl = formValues.apiConfig.baseUrl;
            const auth = formValues.apiConfig.authentication;

            // Build the full URL
            const url = `${baseUrl.replace(/\/$/, '')}${endpoint.path.startsWith('/') ? '' : '/'}${endpoint.path}`;

            // Build headers
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...formValues.apiConfig.headers,
            };

            // Add authentication headers
            if (auth?.type === 'bearer' && auth.token) {
                headers['Authorization'] = `Bearer ${auth.token}`;
            } else if (auth?.type === 'apikey' && auth.apiKey) {
                const headerName = auth.headerName || 'X-API-Key';
                headers[headerName] = auth.apiKey;
            } else if (auth?.type === 'basic' && auth.username && auth.password) {
                headers['Authorization'] = `Basic ${btoa(`${auth.username}:${auth.password}`)}`;
            }

            // Make the request with a timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(url, {
                method: endpoint.method,
                headers,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Check if the response is ok
            if (response.ok) {
                toast({
                    title: "Test Successful",
                    description: `Endpoint "${endpoint.name}" responded with status ${response.status}`,
                    variant: "default",
                });
            } else {
                toast({
                    title: "Test Failed",
                    description: `Endpoint "${endpoint.name}" returned status ${response.status}: ${response.statusText}`,
                    variant: "destructive",
                });
            }
        } catch (error) {
            let errorMessage = `Endpoint test failed: ${error}`;

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    errorMessage = 'Request timed out after 10 seconds';
                } else if (error.message.includes('fetch')) {
                    errorMessage = 'Failed to connect to the API endpoint';
                } else {
                    errorMessage = error.message;
                }
            }

            toast({
                title: "Test Failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setTestingEndpoint(null);
        }
    }; const getTabIcon = (tabName: string) => {
        const hasErrors = form.formState.errors;

        switch (tabName) {
            case 'basic':
                return hasErrors.name || hasErrors.apiConfig ?
                    <BadgeAlert className="h-3 w-3 mx-2" /> :
                    <CheckCircle className="h-3 w-3 mx-2" />;
            case 'auth':
                return hasErrors.apiConfig?.authentication ?
                    <AlertTriangle className="h-3 w-3 mx-2" /> :
                    <LockIcon className="h-3 w-3 mx-2" />;
            case 'resources':
                return (
                    <div className="flex items-center">
                        {hasErrors?.mcpResources ?
                            <AlertTriangle className="h-3 w-3 mr-1" /> :
                            <Link className="h-3 w-3 mr-1" />}
                        <span className="text-[10px] font-medium text-orange-600 bg-orange-100 px-1 rounded">BETA</span>
                    </div>
                );
            case 'prompts':
                return (
                    <div className="flex items-center">
                        {hasErrors?.mcpPrompts ?
                            <AlertTriangle className="h-3 w-3 mr-1" /> :
                            <Link className="h-3 w-3 mr-1" />}
                        <span className="text-[10px] font-medium text-orange-600 bg-orange-100 px-1 rounded">BETA</span>
                    </div>
                );
            case 'tools':
                const hasEndpointErrors = hasErrors.apiConfig?.endpoints;
                const hasNoEndpoints = form.getValues().apiConfig?.endpoints?.length === 0;
                if (hasEndpointErrors) {
                    return <AlertTriangle className="h-3 w-3 mx-2 text-red-500" />;
                } else if (hasNoEndpoints) {
                    return <AlertTriangle className="h-3 w-3 mx-2 text-orange-500" />;
                } else {
                    return <Link className="h-3 w-3 mx-2" />;
                }
            case 'settings':
                return hasErrors.access ?
                    <AlertTriangle className="h-3 w-3 mx-2" /> :
                    <Settings className="h-3 w-3 mx-2" />;
            default:
                return null;
        }
    };

    // Confirmation handlers
    const handleLoadDraftConfirm = () => {
        if (draftData) {
            form.reset(draftData);
        }
        setShowLoadDraftDialog(false);
    };

    const handleCloseConfirm = () => {
        setShowCloseDialog(false);
        onOpenChange(false);
    };

    // Delete confirmation moved to parent component

    return (
        <>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto sm:max-h-[90vh] p-4 sm:p-6">
                    <DialogHeader className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="min-w-0">
                                <DialogTitle className="text-lg sm:text-xl font-semibold">
                                    {bridge ? 'Edit MCP Server' : 'Create New MCP Server'}
                                </DialogTitle>
                                <DialogDescription className="text-sm sm:text-base">
                                    {bridge
                                        ? 'Modify your existing MCP server configuration'
                                        : 'Configure a new MCP server to expose your API as AI tools'}
                                </DialogDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowGuide(!showGuide)}
                                className="text-blue-600 hover:text-blue-700 shrink-0 touch-manipulation"
                            >
                                <Lightbulb className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">{showGuide ? 'Hide' : 'Show'} Guide</span>
                                <span className="sm:hidden">{showGuide ? 'Hide' : 'Guide'}</span>
                            </Button>
                        </div>
                    </DialogHeader>

                    {showGuide && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <h4 className="font-medium text-blue-900 mb-2">Quick Setup Guide</h4>
                            <ol className="text-sm text-blue-800 space-y-1">
                                <li>1. <strong>Basic Info:</strong> Enter MCP server name and source API details</li>
                                <li>2. <strong>Authentication:</strong> Configure how to authenticate with the API</li>
                                <li>3. <strong>Tools:</strong> Add the API endpoints you want to expose as AI tools</li>
                                <li>4. <strong>Settings:</strong> Configure access and authentication settings</li>
                            </ol>
                        </div>
                    )}

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 h-auto p-1">
                                <TabsTrigger value="basic" className="text-xs p-2 touch-manipulation">
                                    <div className="flex items-center gap-1">
                                        {getTabIcon('basic')}
                                        <span className="hidden sm:inline">Basic Info</span>
                                        <span className="sm:hidden">Basic</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="auth" className="text-xs p-2 touch-manipulation">
                                    <div className="flex items-center gap-1">
                                        {getTabIcon('auth')}
                                        <span>Auth</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="tools" className="text-xs p-2 touch-manipulation">
                                    <div className="flex items-center gap-1">
                                        {getTabIcon('tools')}
                                        <span className="hidden sm:inline">Tools</span>
                                        <span className="sm:hidden">Tools</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="resources" className="text-xs p-2 touch-manipulation">
                                    <div className="flex items-center gap-1">
                                        {getTabIcon('resources')}
                                        <span className="hidden sm:inline">Resources</span>
                                        <span className="sm:hidden">Res</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="prompts" className="text-xs p-2 touch-manipulation">
                                    <div className="flex items-center gap-1">
                                        {getTabIcon('prompts')}
                                        <span className="hidden sm:inline">Prompts</span>
                                        <span className="sm:hidden">Pmt</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="settings" className="text-xs p-2 touch-manipulation col-span-3 sm:col-span-1">
                                    <div className="flex items-center gap-1">
                                        {getTabIcon('settings')}
                                        <span className="hidden sm:inline">Settings</span>
                                        <span className="sm:hidden">Settings</span>
                                    </div>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4">
                                <BasicInfoTab form={form} />
                            </TabsContent>

                            <TabsContent value="auth" className="space-y-4">
                                <AuthenticationTab form={form} />
                            </TabsContent>

                            <TabsContent value="tools" className="space-y-4">
                                <EndpointsTab
                                    form={form}
                                    endpointFields={endpointFields}
                                    testingEndpoint={testingEndpoint}
                                    onTestEndpoint={testEndpoint}
                                />
                            </TabsContent>

                            <TabsContent value="resources" className="space-y-4">
                                <ResourcesTab
                                    form={form}
                                    resourceFields={resourceFields}
                                />
                            </TabsContent>

                            <TabsContent value="prompts" className="space-y-4">
                                <PromptsTab
                                    form={form}
                                    promptFields={promptFields}
                                />
                            </TabsContent>

                            <TabsContent value="settings" className="space-y-4">
                                <RoutingAndAccessTab form={form} bridge={bridge} />
                            </TabsContent>
                        </Tabs>

                        <Separator />

                        {/* Error Display */}
                        {submitError && (
                            <div className="flex items-center gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                                <div>
                                    <h4 className="font-medium text-destructive">Error Creating MCP Server</h4>
                                    <p className="text-sm text-destructive/80 mt-1">{submitError}</p>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4">
                            <div className="flex items-center text-sm text-muted-foreground order-2 sm:order-1">
                                {hasUnsavedChanges && (
                                    <span className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        Unsaved changes
                                    </span>
                                )}
                                {!hasUnsavedChanges && form.getValues().apiConfig?.endpoints?.length === 0 && (
                                    <span className="flex items-center gap-1 text-orange-600 text-xs sm:text-sm">
                                        <AlertTriangle className="h-3 w-3" />
                                        No endpoints configured - no MCP tools will be available
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 order-1 sm:order-2">
                                {bridge && onDelete && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => onDelete(bridge.id)}
                                        className="text-sm w-full sm:w-auto touch-manipulation"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Bridge
                                    </Button>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleClose}
                                        className="flex-1 sm:flex-none touch-manipulation"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting ||
                                            !form.getValues('name')?.trim() ||
                                            !form.getValues('apiConfig.name')?.trim() ||
                                            !form.getValues('apiConfig.baseUrl')?.trim()}
                                        className="flex-1 sm:flex-none touch-manipulation"
                                        onClick={() => {
                                            const values = form.getValues();
                                            console.log('Button click - Form state:', {
                                                isValid: form.formState.isValid,
                                                isSubmitting: form.formState.isSubmitting,
                                                errors: form.formState.errors,
                                                accessErrors: form.formState.errors?.access,
                                                accessValues: values.access,
                                                requiredFields: {
                                                    name: values.name,
                                                    apiName: values.apiConfig.name,
                                                    baseUrl: values.apiConfig.baseUrl
                                                },
                                                isDisabled: form.formState.isSubmitting ||
                                                    !values.name?.trim() ||
                                                    !values.apiConfig.name?.trim() ||
                                                    !values.apiConfig.baseUrl?.trim()
                                            });
                                        }}
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {isSubmitting
                                            ? (bridge ? 'Updating...' : 'Creating...')
                                            : (bridge ? 'Update MCP Server' : 'Create MCP Server')
                                        }
                                    </Button>
                                </div>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialogs */}
            <ConfirmationDialog
                open={showLoadDraftDialog}
                onOpenChange={setShowLoadDraftDialog}
                onConfirm={handleLoadDraftConfirm}
                title="Load Draft Data"
                description="Found unsaved draft data. Would you like to restore it?"
                confirmText="Load Draft"
                cancelText="Discard"
            />

            <ConfirmationDialog
                open={showCloseDialog}
                onOpenChange={setShowCloseDialog}
                onConfirm={handleCloseConfirm}
                title="Unsaved Changes"
                description="You have unsaved changes. Are you sure you want to close without saving?"
                confirmText="Close Anyway"
                cancelText="Keep Editing"
            />
        </>
    );
}
