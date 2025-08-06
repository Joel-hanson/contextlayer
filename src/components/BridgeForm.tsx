'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BridgeConfig } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Plus, Save, TestTube, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

const bridgeFormSchema = z.object({
    name: z.string().min(1, 'Bridge name is required'),
    slug: z.string().optional(),
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

    const form = useForm<BridgeFormData>({
        resolver: zodResolver(bridgeFormSchema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            slug: '',
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
                    slug: bridge.slug,
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
                    slug: '',
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
                        const shouldLoadDraft = window.confirm(
                            'Found unsaved draft data. Would you like to restore it?'
                        );
                        if (shouldLoadDraft) {
                            form.reset(draft);
                        }
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
            const confirmClose = window.confirm(
                'You have unsaved changes. Are you sure you want to close without saving?'
            );
            if (!confirmClose) return;
        }
        onOpenChange(false);
    };

    const onSubmit: SubmitHandler<BridgeFormData> = (data) => {
        try {
            // Auto-generate slug if not provided
            let slug = data.slug;
            if (!slug) {
                slug = data.name.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
            }

            const bridgeConfig: BridgeConfig = {
                id: bridge?.id || crypto.randomUUID(),
                slug,
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
                enabled: bridge?.enabled || false,

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
            alert('Failed to save bridge. Please check your configuration and try again.');
        }
    };

    const onSaveAsCopy: SubmitHandler<BridgeFormData> = (data) => {
        try {
            // Auto-generate slug if not provided
            let slug = data.slug;
            if (!slug) {
                slug = data.name.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
            }

            const bridgeConfig: BridgeConfig = {
                id: crypto.randomUUID(),
                slug: `${slug}-copy`,
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
                enabled: false,

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
            alert('Failed to create bridge copy. Please check your configuration and try again.');
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
        // Simulate API test
        setTimeout(() => {
            setTestingEndpoint(null);
        }, 2000);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {bridge ? 'Edit Bridge' : 'Create New Bridge'}
                        {hasUnsavedChanges && (
                            <div className="flex items-center gap-1 text-orange-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm">Unsaved changes</span>
                            </div>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Configure your API bridge to convert REST endpoints into MCP tools.
                        {hasUnsavedChanges && (
                            <span className="block text-orange-600 mt-1">
                                Make sure to save your changes before closing.
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="bridge" className={form.formState.errors.name || form.formState.errors.slug || form.formState.errors.routing ? 'text-red-600' : ''}>
                                Bridge Configuration
                                {(form.formState.errors.name || form.formState.errors.slug || form.formState.errors.routing) && (
                                    <AlertTriangle className="h-3 w-3 ml-1" />
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="api" className={form.formState.errors.apiConfig?.name || form.formState.errors.apiConfig?.baseUrl || form.formState.errors.apiConfig?.endpoints ? 'text-red-600' : ''}>
                                API Configuration
                                {(form.formState.errors.apiConfig?.name || form.formState.errors.apiConfig?.baseUrl || form.formState.errors.apiConfig?.endpoints) && (
                                    <AlertTriangle className="h-3 w-3 ml-1" />
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="bridge" className="space-y-6">
                            {/* Basic Bridge Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Bridge Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Bridge Name</Label>
                                        <Input
                                            id="name"
                                            {...form.register('name')}
                                            placeholder="My API Bridge"
                                        />
                                        {form.formState.errors.name && (
                                            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="slug">URL Slug</Label>
                                        <Input
                                            id="slug"
                                            {...form.register('slug')}
                                            placeholder="my-api-bridge"
                                            className="font-mono text-sm"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Leave empty to auto-generate from name. Will be used in the bridge URL.
                                        </p>
                                        {form.formState.errors.slug && (
                                            <p className="text-sm text-red-500">{form.formState.errors.slug.message}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                        id="description"
                                        {...form.register('description')}
                                        placeholder="Describe what this bridge does..."
                                    />
                                </div>
                            </div>

                            {/* Routing Configuration */}
                            <div className="space-y-4 border-t pt-6">
                                <h3 className="text-lg font-semibold">Routing Configuration</h3>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-900 mb-2">Path-Based Routing</h4>
                                    <p className="text-sm text-blue-700">
                                        Your bridge will be accessible at: <code className="bg-blue-100 px-1 rounded">/mcp/{form.watch('slug') || 'your-bridge-slug'}</code>
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Routing Type</Label>
                                        <Select
                                            value={form.watch('routing.type') || 'path'}
                                            onValueChange={(value) => form.setValue('routing.type', value as 'path' | 'subdomain' | 'websocket')}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select routing type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="path">Path-based (/mcp/bridge-name)</SelectItem>
                                                <SelectItem value="subdomain">Subdomain (bridge.domain.com)</SelectItem>
                                                <SelectItem value="websocket">WebSocket (/ws/bridge-name)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {form.watch('routing.type') === 'subdomain' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="customDomain">Custom Domain</Label>
                                            <Input
                                                id="customDomain"
                                                {...form.register('routing.customDomain')}
                                                placeholder="api.yourdomain.com"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Optional custom domain for subdomain routing
                                            </p>
                                        </div>
                                    )}

                                    {(form.watch('routing.type') === 'path' || form.watch('routing.type') === 'websocket') && (
                                        <div className="space-y-2">
                                            <Label htmlFor="pathPrefix">Path Prefix</Label>
                                            <Input
                                                id="pathPrefix"
                                                {...form.register('routing.pathPrefix')}
                                                placeholder="/api/v1"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Optional prefix to add before the bridge path
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Access Control */}
                            <div className="space-y-4 border-t pt-6">
                                <h3 className="text-lg font-semibold">Access Control</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="publicAccess"
                                            {...form.register('access.public')}
                                            className="rounded"
                                        />
                                        <Label htmlFor="publicAccess">Public Access</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="authRequired"
                                            {...form.register('access.authRequired')}
                                            className="rounded"
                                        />
                                        <Label htmlFor="authRequired">Require Authentication</Label>
                                    </div>
                                </div>

                                {form.watch('access.authRequired') && (
                                    <div className="space-y-2">
                                        <Label htmlFor="apiKey">API Key</Label>
                                        <Input
                                            id="apiKey"
                                            {...form.register('access.apiKey')}
                                            placeholder="Enter API key for access control"
                                            type="password"
                                        />
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="api" className="space-y-6">
                            {/* API Configuration */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">API Configuration</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="apiName">API Name</Label>
                                        <Input
                                            id="apiName"
                                            {...form.register('apiConfig.name')}
                                            placeholder="My REST API"
                                        />
                                        {form.formState.errors.apiConfig?.name && (
                                            <p className="text-sm text-red-500">{form.formState.errors.apiConfig.name.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="baseUrl">Base URL</Label>
                                        <Input
                                            id="baseUrl"
                                            {...form.register('apiConfig.baseUrl')}
                                            placeholder="https://api.example.com"
                                        />
                                        {form.formState.errors.apiConfig?.baseUrl && (
                                            <p className="text-sm text-red-500">{form.formState.errors.apiConfig.baseUrl.message}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="apiDescription">API Description</Label>
                                    <Input
                                        id="apiDescription"
                                        {...form.register('apiConfig.description')}
                                        placeholder="Describe the API..."
                                    />
                                </div>
                            </div>

                            {/* Authentication */}
                            <div className="space-y-4 border-t pt-6">
                                <h3 className="text-lg font-semibold">Authentication</h3>
                                <div className="space-y-2">
                                    <Label>Authentication Type</Label>
                                    <Select
                                        value={form.watch('apiConfig.authentication.type')}
                                        onValueChange={(value) => form.setValue('apiConfig.authentication.type', value as 'none' | 'bearer' | 'apikey' | 'basic')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select authentication type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="bearer">Bearer Token</SelectItem>
                                            <SelectItem value="apikey">API Key</SelectItem>
                                            <SelectItem value="basic">Basic Auth</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {form.watch('apiConfig.authentication.type') === 'bearer' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="token">Bearer Token</Label>
                                        <Input
                                            id="token"
                                            type="password"
                                            {...form.register('apiConfig.authentication.token')}
                                            placeholder="Enter bearer token"
                                        />
                                    </div>
                                )}

                                {form.watch('apiConfig.authentication.type') === 'apikey' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="apiKey">API Key</Label>
                                            <Input
                                                id="apiKey"
                                                type="password"
                                                {...form.register('apiConfig.authentication.apiKey')}
                                                placeholder="Enter API key"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="headerName">Header Name</Label>
                                            <Input
                                                id="headerName"
                                                {...form.register('apiConfig.authentication.headerName')}
                                                placeholder="X-API-Key"
                                            />
                                        </div>
                                    </div>
                                )}

                                {form.watch('apiConfig.authentication.type') === 'basic' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="username">Username</Label>
                                            <Input
                                                id="username"
                                                {...form.register('apiConfig.authentication.username')}
                                                placeholder="Enter username"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                {...form.register('apiConfig.authentication.password')}
                                                placeholder="Enter password"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* API Endpoints */}
                            <div className="space-y-4 border-t pt-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">API Endpoints</h3>
                                    <Button type="button" onClick={addEndpoint} size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Endpoint
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {endpointFields.map((field, index) => (
                                        <Card key={field.id}>
                                            <CardHeader className="pb-3">
                                                <div className="flex justify-between items-center">
                                                    <CardTitle className="text-base">Endpoint {index + 1}</CardTitle>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => testEndpoint(index)}
                                                            disabled={testingEndpoint === `endpoint-${index}`}
                                                        >
                                                            <TestTube className="h-4 w-4 mr-2" />
                                                            {testingEndpoint === `endpoint-${index}` ? 'Testing...' : 'Test'}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => removeEndpoint(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Name</Label>
                                                        <Input
                                                            {...form.register(`apiConfig.endpoints.${index}.name`)}
                                                            placeholder="getUserById"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Method</Label>
                                                        <Select
                                                            value={form.watch(`apiConfig.endpoints.${index}.method`)}
                                                            onValueChange={(value) => form.setValue(`apiConfig.endpoints.${index}.method`, value as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')}
                                                        >
                                                            <SelectTrigger>
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
                                                    <div className="space-y-2">
                                                        <Label>Path</Label>
                                                        <Input
                                                            {...form.register(`apiConfig.endpoints.${index}.path`)}
                                                            placeholder="/users/{id}"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Description</Label>
                                                    <Input
                                                        {...form.register(`apiConfig.endpoints.${index}.description`)}
                                                        placeholder="Describe what this endpoint does..."
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="mt-6">
                        <div className="flex gap-2 w-full">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                            >
                                Cancel
                            </Button>
                            <div className="flex-1" />
                            {bridge && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={form.handleSubmit(onSaveAsCopy)}
                                    disabled={!form.formState.isValid || form.formState.isSubmitting}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Save as Copy
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={!form.formState.isValid || form.formState.isSubmitting}
                                className={hasUnsavedChanges ? 'bg-orange-600 hover:bg-orange-700' : ''}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {form.formState.isSubmitting
                                    ? 'Saving...'
                                    : bridge
                                        ? hasUnsavedChanges
                                            ? 'Save Changes'
                                            : 'Update Bridge'
                                        : 'Create Bridge'
                                }
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
