'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { BridgeConfig } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, BadgeAlert, CheckCircle, Lightbulb, Link, LockIcon, Save, Settings, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { ConfirmationDialog } from '../ConfirmationDialog';

// Import modular components
import { AuthenticationTab } from './AuthenticationTab';
import { BasicInfoTab } from './BasicInfoTab';
import { EndpointsTab } from './EndpointsTab';
import { PromptsTab } from './PromptsTab';
import { ResourcesTab } from './ResourcesTab';
import { RoutingAndAccessTab } from './RoutingAndAccessTab';
import { bridgeFormSchema, type BridgeFormData } from './types';

interface BridgeFormProps {
    bridge?: BridgeConfig;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (bridge: BridgeConfig) => void;
    onDelete?: (bridgeId: string) => void;
}

export function BridgeForm({ bridge, open, onOpenChange, onSave, onDelete }: BridgeFormProps) {
    const [activeTab, setActiveTab] = useState('basic');
    const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    // Confirmation dialog states
    const [showLoadDraftDialog, setShowLoadDraftDialog] = useState(false);
    const [showCloseDialog, setShowCloseDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [draftData, setDraftData] = useState<BridgeFormData & { timestamp: number; editingId: string } | null>(null);

    const { toast } = useToast();

    const form = useForm<BridgeFormData>({
        resolver: zodResolver(bridgeFormSchema),
        mode: 'onChange',
        defaultValues: {
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
            routing: {
                type: 'http',
                customDomain: '',
                pathPrefix: '',
            },
            access: {
                public: true,
                allowedOrigins: [],
                authRequired: false,
                apiKey: '',
            },
        },
    });

    const endpointFields = useFieldArray({
        control: form.control,
        name: 'apiConfig.endpoints',
    });

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
                        authentication: bridge.apiConfig.authentication || { type: 'none' },
                        endpoints: (bridge.apiConfig.endpoints || []).map(endpoint => ({
                            ...endpoint,
                            parameters: endpoint.parameters || []
                        })),
                    },
                    mcpResources: bridge.mcpResources || [],
                    mcpPrompts: bridge.mcpPrompts || [],
                    routing: bridge.routing || { type: 'http' },
                    access: bridge.access || { public: true, authRequired: false },
                });
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
                                authentication: template.apiConfig?.authentication || { type: 'none' },
                                endpoints: template.apiConfig?.endpoints || [],
                            },
                            mcpResources: template.mcpResources || [],
                            mcpPrompts: template.mcpPrompts || [],
                            routing: { type: 'http' },
                            access: { public: true, authRequired: false },
                        });
                        // Clear template data after use
                        localStorage.removeItem('contextlayer-template');
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
                            routing: { type: 'http' },
                            access: { public: true, authRequired: false },
                        });
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
                            authentication: { type: 'none' },
                            endpoints: [],
                        },
                        mcpResources: [],
                        mcpPrompts: [],
                        routing: { type: 'http' },
                        access: { public: true, authRequired: false },
                    });
                }
            }
        }
    }, [bridge, open, form, toast]);

    // Watch for form changes to detect unsaved changes
    useEffect(() => {
        const subscription = form.watch(() => {
            if (open) {
                setHasUnsavedChanges(form.formState.isDirty);

                // Auto-save to localStorage to prevent data loss
                if (form.formState.isDirty) {
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

    const handleDelete = () => {
        if (!bridge || !onDelete) return;
        setShowDeleteDialog(true);
    };

    const onSubmit: SubmitHandler<BridgeFormData> = (data) => {
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
                    authentication: data.apiConfig.authentication || { type: 'none' },
                    endpoints: data.apiConfig.endpoints.map((endpoint, index) => {
                        // Preserve existing endpoint IDs when editing
                        const existingEndpoint = bridge?.apiConfig.endpoints?.[index];
                        return {
                            ...endpoint,
                            id: existingEndpoint?.id || crypto.randomUUID(),
                            parameters: endpoint.parameters || [],
                            requestBody: undefined,
                            responseSchema: undefined,
                        };
                    }),
                },
                mcpTools: bridge?.mcpTools || [],
                mcpResources: data.mcpResources || [],
                mcpPrompts: data.mcpPrompts || [],
                enabled: bridge?.enabled ?? true, // Default to enabled for new bridges

                // HTTP transport configuration
                routing: data.routing || { type: 'http' as const },

                // Access control
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

                // Performance settings (using the default structure from BridgeConfig)
                performance: {
                    rateLimiting: { requestsPerMinute: 60, burstLimit: 10 },
                    caching: { enabled: false, ttl: 300 },
                    timeout: 30000,
                },

                createdAt: bridge?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            onSave(bridgeConfig);
            setHasUnsavedChanges(false);
            clearDraft();
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving bridge:', error);
            toast({
                title: "Save Failed",
                description: "Failed to save bridge. Please check your configuration and try again.",
                variant: "destructive",
            });
        }
    };

    const testEndpoint = async (endpoint: BridgeFormData['apiConfig']['endpoints'][0]) => {
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
            case 'endpoints':
                const hasEndpointErrors = hasErrors.apiConfig?.endpoints;
                const hasNoEndpoints = form.getValues().apiConfig?.endpoints?.length === 0;
                if (hasEndpointErrors) {
                    return <AlertTriangle className="h-3 w-3 mx-2 text-red-500" />;
                } else if (hasNoEndpoints) {
                    return <AlertTriangle className="h-3 w-3 mx-2 text-orange-500" />;
                } else {
                    return <Link className="h-3 w-3 mx-2" />;
                }
            case 'routing':
                return hasErrors.routing || hasErrors.access ?
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

    const handleDeleteConfirm = () => {
        if (bridge && onDelete) {
            onDelete(bridge.id);
            clearDraft();
            onOpenChange(false);
        }
        setShowDeleteDialog(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-xl font-semibold">
                                    {bridge ? 'Edit MCP Server' : 'Create New MCP Server'}
                                </DialogTitle>
                                <DialogDescription>
                                    {bridge
                                        ? 'Modify your existing MCP server configuration'
                                        : 'Configure a new MCP server to expose your API as AI tools'}
                                </DialogDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowGuide(!showGuide)}
                                className="text-blue-600 hover:text-blue-700"
                            >
                                <Lightbulb className="h-4 w-4 mr-1" />
                                {showGuide ? 'Hide' : 'Show'} Guide
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
                                <li>4. <strong>Routing:</strong> Configure access and routing settings</li>
                            </ol>
                        </div>
                    )}

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-6">
                                <TabsTrigger value="basic" className="text-xs">
                                    {getTabIcon('basic')} Basic Info
                                </TabsTrigger>
                                <TabsTrigger value="auth" className="text-xs">
                                    {getTabIcon('auth')} Auth
                                </TabsTrigger>
                                <TabsTrigger value="endpoints" className="text-xs">
                                    {getTabIcon('endpoints')} Tools
                                </TabsTrigger>
                                <TabsTrigger value="resources" className="text-xs">
                                    {getTabIcon('resources')} Resources
                                </TabsTrigger>
                                <TabsTrigger value="prompts" className="text-xs">
                                    {getTabIcon('prompts')} Prompts
                                </TabsTrigger>
                                <TabsTrigger value="routing" className="text-xs">
                                    {getTabIcon('routing')} Routing
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4">
                                <BasicInfoTab form={form} />
                            </TabsContent>

                            <TabsContent value="auth" className="space-y-4">
                                <AuthenticationTab form={form} />
                            </TabsContent>

                            <TabsContent value="endpoints" className="space-y-4">
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

                            <TabsContent value="routing" className="space-y-4">
                                <RoutingAndAccessTab form={form} bridge={bridge} />
                            </TabsContent>
                        </Tabs>

                        <Separator />

                        <DialogFooter className="flex justify-between items-center">
                            <div className="flex items-center text-sm text-muted-foreground">
                                {hasUnsavedChanges && (
                                    <span className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        Unsaved changes
                                    </span>
                                )}
                                {!hasUnsavedChanges && form.getValues().apiConfig?.endpoints?.length === 0 && (
                                    <span className="flex items-center gap-1 text-orange-600">
                                        <AlertTriangle className="h-3 w-3" />
                                        No endpoints configured - no MCP tools will be available
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                {bridge && onDelete && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={handleDelete}
                                        className="text-sm"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Bridge
                                    </Button>
                                )}

                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={handleClose}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={!form.formState.isValid || form.formState.isSubmitting}
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {bridge ? 'Update MCP Server' : 'Create MCP Server'}
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

            <ConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDeleteConfirm}
                title="Delete Bridge"
                description={`Are you sure you want to delete the bridge "${bridge?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </>
    );
}
