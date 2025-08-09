'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { BridgeConfig } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, FileText, Info, Lightbulb, LinkIcon, Plus, Save, TestTube, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ConfirmationDialog } from './ConfirmationDialog';
import { Checkbox } from './ui/checkbox';

const bridgeFormSchema = z.object({
    name: z.string().min(1, 'Bridge name is required'),
    description: z.string().optional(),
    apiConfig: z.object({
        name: z.string().min(1, 'API name is required'),
        baseUrl: z.string().url('Must be a valid URL'),
        description: z.string().optional(),
        headers: z.record(z.string()).optional(),
        authentication: z.object({
            type: z.enum(['none', 'bearer', 'apikey', 'basic']),
            token: z.string().optional(),
            apiKey: z.string().optional(),
            username: z.string().optional(),
            password: z.string().optional(),
            headerName: z.string().optional(),
        }).optional(),
        endpoints: z.array(z.object({
            name: z.string().min(1, 'Endpoint name is required'),
            method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
            path: z.string().min(1, 'Path is required'),
            description: z.string().optional(),
            parameters: z.array(z.object({
                name: z.string(),
                type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
                required: z.boolean(),
                description: z.string().optional(),
            })).optional(),
        })),
    }),
    routing: z.object({
        type: z.enum(['path', 'subdomain', 'websocket']),
        customDomain: z.string().optional(),
        pathPrefix: z.string().optional(),
    }).optional(),
    access: z.object({
        public: z.boolean(),
        allowedOrigins: z.array(z.string()).optional(),
        authRequired: z.boolean(),
        apiKey: z.string().optional(),
    }).optional(),
});

type BridgeFormData = z.infer<typeof bridgeFormSchema>;

interface BridgeFormProps {
    bridge?: BridgeConfig;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (bridge: BridgeConfig) => void;
}

export function BridgeForm({ bridge, open, onOpenChange, onSave }: BridgeFormProps) {
    const [activeTab, setActiveTab] = useState('bridge');
    const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [, setShowImportDialog] = useState(false);
    const [showLoadDraftDialog, setShowLoadDraftDialog] = useState(false);
    const [showCloseDialog, setShowCloseDialog] = useState(false);
    const [draftData, setDraftData] = useState<(BridgeFormData & { timestamp: number; editingId: string }) | null>(null);
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
            routing: {
                type: 'path',
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

    const { fields: endpointFields, append: appendEndpoint, remove: removeEndpoint } = useFieldArray({
        control: form.control,
        name: 'apiConfig.endpoints',
    });

    // Reset form when bridge changes or dialog opens/closes
    useEffect(() => {
        if (open) {
            // Reset to first tab when opening
            setActiveTab('bridge');
            setHasUnsavedChanges(false);

            if (bridge) {
                // Editing existing bridge - populate form with current values
                form.reset({
                    name: bridge.name,
                    description: bridge.description,
                    apiConfig: {
                        name: bridge.apiConfig.name,
                        baseUrl: bridge.apiConfig.baseUrl,
                        description: bridge.apiConfig.description,
                        headers: bridge.apiConfig.headers || {},
                        authentication: bridge.apiConfig.authentication || { type: 'none' },
                        endpoints: bridge.apiConfig.endpoints || [],
                    },
                    routing: bridge.routing || { type: 'path' },
                    access: bridge.access || { public: true, authRequired: false },
                });
            } else {
                // Creating new bridge - reset to defaults
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
                    routing: { type: 'path' },
                    access: { public: true, authRequired: false },
                });
            }
        }
    }, [bridge, open, form]);

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
            const draftData = localStorage.getItem('bridge-form-draft');
            if (draftData) {
                try {
                    const draft = JSON.parse(draftData);
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
                enabled: bridge?.enabled ?? true, // Default to enabled for new bridges

                // Path-based routing configuration
                routing: data.routing || { type: 'path' as const },

                // Access control
                access: data.access || { public: true, authRequired: false },

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

    const onSaveAsCopy: SubmitHandler<BridgeFormData> = (data) => {
        try {
            // Generate UUIDs for the copy
            const bridgeId = crypto.randomUUID();

            const bridgeConfig: BridgeConfig = {
                id: bridgeId,
                slug: bridgeId, // Use UUID as slug
                name: `${data.name} (Copy)`,
                description: data.description || '',
                apiConfig: {
                    id: crypto.randomUUID(),
                    name: data.apiConfig.name,
                    baseUrl: data.apiConfig.baseUrl,
                    description: data.apiConfig.description || '',
                    headers: data.apiConfig.headers || {},
                    authentication: data.apiConfig.authentication || { type: 'none' },
                    endpoints: data.apiConfig.endpoints.map((endpoint) => ({
                        ...endpoint,
                        id: crypto.randomUUID(),
                        parameters: endpoint.parameters || [],
                        requestBody: undefined,
                        responseSchema: undefined,
                    })),
                },
                mcpTools: [],
                enabled: true, // Default to enabled for new bridges

                // Path-based routing configuration  
                routing: data.routing || { type: 'path' as const },

                // Access control
                access: data.access || { public: true, authRequired: false },

                // Performance settings (using the default structure from BridgeConfig)
                performance: {
                    rateLimiting: { requestsPerMinute: 60, burstLimit: 10 },
                    caching: { enabled: false, ttl: 300 },
                    timeout: 30000,
                },

                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            onSave(bridgeConfig);
            setHasUnsavedChanges(false);
            clearDraft();
            onOpenChange(false);
        } catch (error) {
            console.error('Error creating bridge copy:', error);
            toast({
                title: "Copy Failed",
                description: "Failed to create bridge copy. Please check your configuration and try again.",
                variant: "destructive",
            });
        }
    };

    const addEndpoint = () => {
        appendEndpoint({
            name: '',
            method: 'GET',
            path: '',
            description: '',
            parameters: [],
        });
    };

    const testEndpoint = async (index: number) => {
        setTestingEndpoint(`endpoint-${index}`);
        try {
            // Get form values to build the request
            const formValues = form.getValues();
            const endpoint = formValues.apiConfig.endpoints[index];
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
            let errorMessage = 'Endpoint test failed';

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

    return (
        <>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="space-y-2">
                        <DialogTitle className="flex items-center justify-between text-lg">
                            <span className="flex items-center gap-2">
                                {bridge ? 'Edit Bridge' : 'Create New Bridge'}
                                {hasUnsavedChanges && (
                                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Unsaved
                                    </Badge>
                                )}
                            </span>
                        </DialogTitle>
                        <DialogDescription className="text-sm text-zinc-600">
                            Transform your REST API into an MCP server that AI assistants can use.
                        </DialogDescription>

                        {/* Collapsible Quick Setup Guide */}
                        <div className="border border-zinc-200 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setShowGuide(!showGuide)}
                                className="w-full flex items-center justify-between p-3 text-left hover:bg-zinc-50 transition-colors rounded-lg"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="p-1 bg-zinc-100 rounded">
                                        <Lightbulb className="h-3 w-3 text-zinc-600" />
                                    </div>
                                    <h4 className="font-medium text-sm text-zinc-900">Quick Setup Guide</h4>
                                </div>
                                {showGuide ? (
                                    <ChevronUp className="h-4 w-4 text-zinc-500" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                                )}
                            </button>

                            {showGuide && (
                                <div className="px-3 pb-3">
                                    <div className="space-y-3 text-xs">
                                        <div className="space-y-1 text-zinc-700">
                                            <div className="font-medium text-zinc-900 mb-2">🚀 Quick Setup Steps:</div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-medium">1</div>
                                                <strong>Bridge Configuration:</strong> Name your bridge and set basic info
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-medium">2</div>
                                                <strong>API Configuration:</strong> Add API details, authentication, and endpoints
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-medium">3</div>
                                                <strong>Save & Start:</strong> Create your MCP server for AI assistants
                                            </div>
                                        </div>

                                        <div className="border-t pt-2 space-y-1">
                                            <div className="font-medium text-green-700">💡 Pro Tips:</div>
                                            <div className="text-zinc-600">
                                                • Have an OpenAPI spec? Use <strong>&quot;Import OpenAPI&quot;</strong> in API Config
                                            </div>
                                            <div className="text-zinc-600">
                                                • Test endpoints as you add them with the <strong>&quot;Test Endpoint&quot;</strong> button
                                            </div>
                                            <div className="text-zinc-600">
                                                • Add parameter descriptions to help AI understand your API
                                            </div>
                                        </div>

                                        <div className="border-t pt-2 space-y-1">
                                            <div className="font-medium text-blue-700">🔗 Your MCP Endpoint:</div>
                                            <div className="bg-blue-50 p-2 rounded text-xs font-mono text-blue-800 break-all">
                                                http://localhost:3000/mcp/&#123;bridge-id&#125;
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto">
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 h-auto p-1">
                                    <TabsTrigger
                                        value="bridge"
                                        className={`flex flex-col items-center gap-1 p-2 data-[state=active]:bg-background ${form.formState.errors.name || form.formState.errors.routing ? 'text-red-600' : ''
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${form.getValues('name')
                                                ? 'bg-zinc-900 text-white'
                                                : 'bg-zinc-200 text-zinc-600'
                                                }`}>
                                                1
                                            </div>
                                            <span className="font-medium text-sm">Bridge Setup</span>
                                            {(form.formState.errors.name || form.formState.errors.routing) && (
                                                <AlertTriangle className="h-3 w-3" />
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">Name & Basic Info</span>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="api"
                                        className={`flex flex-col items-center gap-1 p-2 data-[state=active]:bg-background ${form.formState.errors.apiConfig?.name || form.formState.errors.apiConfig?.baseUrl || form.formState.errors.apiConfig?.endpoints ? 'text-red-600' : ''
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${form.getValues('apiConfig.name') && form.getValues('apiConfig.baseUrl') && endpointFields.length > 0
                                                ? 'bg-zinc-900 text-white'
                                                : 'bg-zinc-200 text-zinc-600'
                                                }`}>
                                                2
                                            </div>
                                            <span className="font-medium text-sm">API Configuration</span>
                                            {(form.formState.errors.apiConfig?.name || form.formState.errors.apiConfig?.baseUrl || form.formState.errors.apiConfig?.endpoints) && (
                                                <AlertTriangle className="h-3 w-3" />
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">Endpoints & Auth</span>
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="bridge" className="mt-4 space-y-4">
                                    {/* Basic Bridge Information */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="flex items-center gap-2 text-base">
                                                    <div className="p-1.5 bg-zinc-100 rounded">
                                                        <Info className="h-3 w-3 text-zinc-600" />
                                                    </div>
                                                    Bridge Information
                                                </CardTitle>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowImportDialog(true)}
                                                    className="text-sm"
                                                >
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    Import OpenAPI
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="name" className="text-sm font-medium">
                                                        Bridge Name <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="name"
                                                        {...form.register('name')}
                                                        placeholder="My API Bridge"
                                                        className={form.formState.errors.name ? 'border-red-300 focus:border-red-500 h-9' : 'h-9'}
                                                    />
                                                    {form.formState.errors.name && (
                                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            {form.formState.errors.name.message}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground">
                                                        A unique identifier will be automatically generated for your bridge URL.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                                                <Textarea
                                                    id="description"
                                                    {...form.register('description')}
                                                    placeholder="Describe what this bridge does..."
                                                    rows={2}
                                                    className="resize-none"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Routing Configuration */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <div className="p-1.5 bg-zinc-100 rounded">
                                                    <ArrowRight className="h-3 w-3 text-zinc-600" />
                                                </div>
                                                Routing Configuration
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                                                <h4 className="font-medium text-zinc-900 mb-1 flex items-center gap-2 text-sm">
                                                    <CheckCircle2 className="h-3 w-3 text-zinc-600" />
                                                    Path-Based Routing
                                                </h4>
                                                <p className="text-xs text-zinc-700">
                                                    Your bridge will be accessible at:
                                                    <code className="bg-zinc-200 px-1.5 py-0.5 rounded ml-1 font-mono text-zinc-800 text-xs">
                                                        /mcp/{bridge?.slug || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'}
                                                    </code>
                                                    {!bridge && (
                                                        <span className="ml-2 text-zinc-500 text-xs">(Generated automatically)</span>
                                                    )}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-sm font-medium">Routing Type</Label>
                                                    <Select
                                                        value={form.watch('routing.type') || 'path'}
                                                        onValueChange={(value) => form.setValue('routing.type', value as 'path' | 'subdomain' | 'websocket')}
                                                    >
                                                        <SelectTrigger className="h-9">
                                                            <SelectValue placeholder="Select routing type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="path">Path-based (/mcp/bridge-name)</SelectItem>
                                                            <SelectItem value="subdomain">Subdomain (bridge.domain.com)</SelectItem>
                                                            <SelectItem value="websocket">WebSocket (/ws/bridge-name)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {form.watch('routing.type') === 'path' && (
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="pathPrefix" className="text-sm font-medium">Path Prefix</Label>
                                                        <Input
                                                            id="pathPrefix"
                                                            {...form.register('routing.pathPrefix')}
                                                            placeholder="/api/v1"
                                                            className="font-mono text-sm h-9"
                                                        />
                                                        <p className="text-xs text-muted-foreground">
                                                            Optional prefix to add before the bridge path
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Access Control */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <div className="p-1.5 bg-zinc-100 rounded">
                                                    <CheckCircle2 className="h-3 w-3 text-zinc-600" />
                                                </div>
                                                Access Control
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="publicAccess"
                                                        checked={form.watch('access.public')}
                                                        onCheckedChange={(checked) => form.setValue('access.public', !!checked)}
                                                    />
                                                    <Label htmlFor="publicAccess" className="text-sm font-medium cursor-pointer">
                                                        Public Access
                                                    </Label>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="authRequired"
                                                        checked={form.watch('access.authRequired')}
                                                        onCheckedChange={(checked) => form.setValue('access.authRequired', !!checked)}
                                                    />
                                                    <Label htmlFor="authRequired" className="text-sm font-medium cursor-pointer">
                                                        Require Authentication
                                                    </Label>
                                                </div>
                                            </div>

                                            {form.watch('access.authRequired') && (
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="apiKey" className="text-sm font-medium">API Key</Label>
                                                    <Input
                                                        id="apiKey"
                                                        {...form.register('access.apiKey')}
                                                        placeholder="Enter API key for access control"
                                                        type="password"
                                                        className="h-9"
                                                    />
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Next Step Button */}
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            type="button"
                                            onClick={() => setActiveTab('api')}
                                            className="flex items-center gap-2"
                                        >
                                            Next: Configure API
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="api" className="mt-4 space-y-4">
                                    {/* API Configuration */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <div className="p-1.5 bg-zinc-100 rounded">
                                                    <Info className="h-3 w-3 text-zinc-600" />
                                                </div>
                                                API Configuration
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="apiName" className="text-sm font-medium">
                                                        API Name <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="apiName"
                                                        {...form.register('apiConfig.name')}
                                                        placeholder="My REST API"
                                                        className={form.formState.errors.apiConfig?.name ? 'border-red-300 focus:border-red-500 h-9' : 'h-9'}
                                                    />
                                                    {form.formState.errors.apiConfig?.name && (
                                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            {form.formState.errors.apiConfig.name.message}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="baseUrl" className="text-sm font-medium">
                                                        Base URL <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="baseUrl"
                                                        {...form.register('apiConfig.baseUrl')}
                                                        placeholder="https://api.example.com"
                                                        className={form.formState.errors.apiConfig?.baseUrl ? 'border-red-300 focus:border-red-500 h-9' : 'h-9'}
                                                    />
                                                    {form.formState.errors.apiConfig?.baseUrl && (
                                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            {form.formState.errors.apiConfig.baseUrl.message}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="apiDescription" className="text-sm font-medium">API Description</Label>
                                                <Textarea
                                                    id="apiDescription"
                                                    {...form.register('apiConfig.description')}
                                                    placeholder="Describe the API..."
                                                    rows={2}
                                                    className="resize-none"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Authentication */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <div className="p-1.5 bg-zinc-100 rounded">
                                                    <CheckCircle2 className="h-3 w-3 text-zinc-600" />
                                                </div>
                                                Authentication
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-sm font-medium">Authentication Type</Label>
                                                <Select
                                                    value={form.watch('apiConfig.authentication.type')}
                                                    onValueChange={(value) => form.setValue('apiConfig.authentication.type', value as 'none' | 'bearer' | 'apikey' | 'basic')}
                                                >
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Select authentication type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-zinc-400" />
                                                                None
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="bearer">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-zinc-500" />
                                                                Bearer Token
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="apikey">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-zinc-600" />
                                                                API Key
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="basic">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-zinc-700" />
                                                                Basic Auth
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {form.watch('apiConfig.authentication.type') === 'bearer' && (
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="token" className="text-sm font-medium">Bearer Token</Label>
                                                    <Input
                                                        id="token"
                                                        type="password"
                                                        {...form.register('apiConfig.authentication.token')}
                                                        placeholder="Enter bearer token"
                                                        className="h-9"
                                                    />
                                                </div>
                                            )}

                                            {form.watch('apiConfig.authentication.type') === 'apikey' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="apiKey" className="text-sm font-medium">API Key</Label>
                                                        <Input
                                                            id="apiKey"
                                                            type="password"
                                                            {...form.register('apiConfig.authentication.apiKey')}
                                                            placeholder="Enter API key"
                                                            className="h-9"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="headerName" className="text-sm font-medium">Header Name</Label>
                                                        <Input
                                                            id="headerName"
                                                            {...form.register('apiConfig.authentication.headerName')}
                                                            placeholder="X-API-Key"
                                                            className="h-9"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {form.watch('apiConfig.authentication.type') === 'basic' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                                                        <Input
                                                            id="username"
                                                            {...form.register('apiConfig.authentication.username')}
                                                            placeholder="Enter username"
                                                            className="h-9"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                                                        <Input
                                                            id="password"
                                                            type="password"
                                                            {...form.register('apiConfig.authentication.password')}
                                                            placeholder="Enter password"
                                                            className="h-9"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* API Endpoints */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="flex items-center gap-2 text-base">
                                                        <div className="p-1.5 bg-zinc-100 rounded">
                                                            <ArrowRight className="h-3 w-3 text-zinc-600" />
                                                        </div>
                                                        API Endpoints → MCP Tools
                                                    </CardTitle>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Each endpoint becomes an MCP tool that AI assistants can use.
                                                    </p>
                                                </div>
                                                <Button type="button" onClick={addEndpoint} size="sm" className="shrink-0">
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Add
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {endpointFields.length === 0 && (
                                                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                                                    <div className="text-muted-foreground">
                                                        <div className="text-2xl mb-2 flex justify-center items-center">
                                                            <LinkIcon className="h-8 w-8" />
                                                        </div>
                                                        <div className="text-sm font-medium mb-1">No endpoints added yet</div>
                                                        <div className="text-xs mb-3">Click &quot;Add&quot; to create your first MCP tool</div>
                                                        <Button type="button" onClick={addEndpoint} variant="outline" size="sm">
                                                            <Plus className="h-3 w-3 mr-1" />
                                                            Add Your First Endpoint
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-3">
                                                {endpointFields.map((field, index) => (
                                                    <Card key={field.id} className="border-l-2 border-l-zinc-300">
                                                        <CardHeader className="pb-2">
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className="px-1.5 py-0.5 text-xs">
                                                                        #{index + 1}
                                                                    </Badge>
                                                                    <CardTitle className="text-sm">
                                                                        {form.watch(`apiConfig.endpoints.${index}.name`) || `Endpoint ${index + 1}`}
                                                                    </CardTitle>
                                                                    <Badge
                                                                        variant={form.watch(`apiConfig.endpoints.${index}.method`) === 'GET' ? 'secondary' : 'default'}
                                                                        className="text-xs px-1.5 py-0.5"
                                                                    >
                                                                        {form.watch(`apiConfig.endpoints.${index}.method`) || 'GET'}
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => testEndpoint(index)}
                                                                        disabled={testingEndpoint === `endpoint-${index}`}
                                                                        className="h-7 px-2"
                                                                    >
                                                                        <TestTube className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        onClick={() => removeEndpoint(index)}
                                                                        className="h-7 px-2"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="space-y-3">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs font-medium">
                                                                        Tool Name <span className="text-red-500">*</span>
                                                                    </Label>
                                                                    <Input
                                                                        {...form.register(`apiConfig.endpoints.${index}.name`)}
                                                                        placeholder="Get User Profile"
                                                                        className="h-8 text-sm"
                                                                    />
                                                                    <p className="text-xs text-muted-foreground">
                                                                        What AI assistants will see
                                                                    </p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs font-medium">Method</Label>
                                                                    <Select
                                                                        value={form.watch(`apiConfig.endpoints.${index}.method`)}
                                                                        onValueChange={(value) => form.setValue(`apiConfig.endpoints.${index}.method`, value as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')}
                                                                    >
                                                                        <SelectTrigger className="h-8">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="GET">GET</SelectItem>
                                                                            <SelectItem value="POST">POST</SelectItem>
                                                                            <SelectItem value="PUT">PUT</SelectItem>
                                                                            <SelectItem value="DELETE">DELETE</SelectItem>
                                                                            <SelectItem value="PATCH">PATCH</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs font-medium">
                                                                        API Path <span className="text-red-500">*</span>
                                                                    </Label>
                                                                    <Input
                                                                        {...form.register(`apiConfig.endpoints.${index}.path`)}
                                                                        placeholder="/users/{id}"
                                                                        className="font-mono text-sm h-8"
                                                                    />
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Use {'{}'} for parameters
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs font-medium">Tool Description</Label>
                                                                <Textarea
                                                                    {...form.register(`apiConfig.endpoints.${index}.description`)}
                                                                    placeholder="Retrieve user profile information by ID"
                                                                    rows={2}
                                                                    className="resize-none text-sm"
                                                                />
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>

                            {/* Enhanced Progress Indicator */}
                            <Card className="mt-4 bg-gradient-to-r from-zinc-50 to-slate-50 border-zinc-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm font-semibold text-zinc-800">Setup Progress</div>
                                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${[
                                                form.getValues('name'),
                                                form.getValues('apiConfig.name') && form.getValues('apiConfig.baseUrl'),
                                                endpointFields.length > 0
                                            ].filter(Boolean).length === 3
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {[
                                                    form.getValues('name'),
                                                    form.getValues('apiConfig.name') && form.getValues('apiConfig.baseUrl'),
                                                    endpointFields.length > 0
                                                ].filter(Boolean).length === 3 ? 'Complete' : 'In Progress'}
                                            </div>
                                        </div>
                                        <div className="text-xs text-zinc-500 font-medium">
                                            {[
                                                form.getValues('name'),
                                                form.getValues('apiConfig.name') && form.getValues('apiConfig.baseUrl'),
                                                endpointFields.length > 0
                                            ].filter(Boolean).length} of 3 steps completed
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-zinc-200 rounded-full h-2 mb-4">
                                        <div
                                            className="bg-gradient-to-r from-zinc-800 to-zinc-700 h-2 rounded-full transition-all duration-300 ease-in-out"
                                            style={{
                                                width: `${([
                                                    form.getValues('name'),
                                                    form.getValues('apiConfig.name') && form.getValues('apiConfig.baseUrl'),
                                                    endpointFields.length > 0
                                                ].filter(Boolean).length / 3) * 100}%`
                                            }}
                                        />
                                    </div>

                                    {/* Step Details */}
                                    <div className="space-y-3">
                                        <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${form.getValues('name')
                                            ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                            : activeTab === 'bridge'
                                                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                                                : 'bg-white border-zinc-200 hover:bg-zinc-50'
                                            }`} onClick={() => setActiveTab('bridge')}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${form.getValues('name')
                                                ? 'bg-green-600 text-white'
                                                : activeTab === 'bridge'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-zinc-300 text-zinc-600'
                                                }`}>
                                                {form.getValues('name') ? '✓' : '1'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-zinc-900">Bridge Information</div>
                                                <div className="text-xs text-zinc-500">
                                                    {form.getValues('name')
                                                        ? `${form.getValues('name')} • Ready`
                                                        : 'Name and basic configuration required'
                                                    }
                                                </div>
                                            </div>
                                            {form.getValues('name') && (
                                                <div className="text-green-600">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>

                                        <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${form.getValues('apiConfig.name') && form.getValues('apiConfig.baseUrl')
                                            ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                            : activeTab === 'api'
                                                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                                                : 'bg-white border-zinc-200 hover:bg-zinc-50'
                                            }`} onClick={() => setActiveTab('api')}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${form.getValues('apiConfig.name') && form.getValues('apiConfig.baseUrl')
                                                ? 'bg-green-600 text-white'
                                                : activeTab === 'api'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-zinc-300 text-zinc-600'
                                                }`}>
                                                {form.getValues('apiConfig.name') && form.getValues('apiConfig.baseUrl') ? '✓' : '2'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-zinc-900">API Configuration</div>
                                                <div className="text-xs text-zinc-500">
                                                    {form.getValues('apiConfig.name') && form.getValues('apiConfig.baseUrl')
                                                        ? `${form.getValues('apiConfig.name')} • ${(() => {
                                                            try {
                                                                return new URL(form.getValues('apiConfig.baseUrl') || '').hostname;
                                                            } catch {
                                                                return 'Invalid URL';
                                                            }
                                                        })()}`
                                                        : 'API details and authentication required'
                                                    }
                                                </div>
                                            </div>
                                            {form.getValues('apiConfig.name') && form.getValues('apiConfig.baseUrl') && (
                                                <div className="text-green-600">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>

                                        <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${endpointFields.length > 0
                                            ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                            : activeTab === 'api'
                                                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                                                : 'bg-white border-zinc-200 hover:bg-zinc-50'
                                            }`} onClick={() => setActiveTab('api')}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${endpointFields.length > 0
                                                ? 'bg-green-600 text-white'
                                                : activeTab === 'api'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-zinc-300 text-zinc-600'
                                                }`}>
                                                {endpointFields.length > 0 ? '✓' : '3'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-zinc-900">API Endpoints</div>
                                                <div className="text-xs text-zinc-500">
                                                    {endpointFields.length > 0
                                                        ? `${endpointFields.length} endpoint${endpointFields.length === 1 ? '' : 's'} configured`
                                                        : 'Add at least one endpoint to create MCP tools'
                                                    }
                                                </div>
                                            </div>
                                            {endpointFields.length > 0 && (
                                                <div className="text-green-600">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Next Action Hint */}
                                    {[
                                        form.getValues('name'),
                                        form.getValues('apiConfig.name') && form.getValues('apiConfig.baseUrl'),
                                        endpointFields.length > 0
                                    ].filter(Boolean).length < 3 && (
                                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-amber-600">
                                                        <ArrowRight className="w-4 h-4" />
                                                    </div>
                                                    <div className="text-sm text-amber-800">
                                                        <strong>Next: </strong>
                                                        {!form.getValues('name') ? 'Add bridge name and description' :
                                                            !form.getValues('apiConfig.name') || !form.getValues('apiConfig.baseUrl') ? 'Configure your API details' :
                                                                endpointFields.length === 0 ? 'Add at least one API endpoint' : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                </CardContent>
                            </Card>
                        </form>
                    </div>

                    <Separator />

                    <DialogFooter className="p-1">
                        <div className="flex items-center justify-between w-full">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                size="sm"
                            >
                                Cancel
                            </Button>

                            <div className="flex items-center gap-2">
                                {bridge && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={form.handleSubmit(onSaveAsCopy)}
                                        disabled={!form.formState.isValid || form.formState.isSubmitting}
                                        size="sm"
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Save as Copy
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    onClick={form.handleSubmit(onSubmit)}
                                    disabled={!form.formState.isValid || form.formState.isSubmitting || endpointFields.length === 0}
                                    className={`min-w-[120px] ${hasUnsavedChanges ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                                    size="sm"
                                >
                                    <Save className="h-3 w-3 mr-1" />
                                    {form.formState.isSubmitting
                                        ? 'Saving...'
                                        : bridge
                                            ? hasUnsavedChanges
                                                ? 'Save Changes'
                                                : 'Update Bridge'
                                            : endpointFields.length === 0
                                                ? 'Add Endpoints First'
                                                : 'Create Bridge'
                                    }
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
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
