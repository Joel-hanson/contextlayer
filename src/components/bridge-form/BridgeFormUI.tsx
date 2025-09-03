import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BridgeConfig } from '@/lib/types';
import { AlertTriangle, BadgeAlert, CheckCircle, Lightbulb, Link, LockIcon, Save, Settings, Trash2 } from 'lucide-react';

// Import modular components
import { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { AuthenticationTab } from './authentication-tab';
import { BasicInfoTab } from './basic-info-tab';
import { EndpointsTab } from './endpoints-tab';
import { FormValidationErrors } from './FormValidationErrors';
import { PromptsTab } from './prompts-tab';
import { ResourcesTab } from './resources-tab';
import { RoutingAndAccessTab } from './routing-and-access-tab';
import { McpBridgeFormData } from './utils/types';

interface BridgeFormUIProps {
    form: UseFormReturn<McpBridgeFormData>;
    bridge?: BridgeConfig;
    open: boolean;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    showGuide: boolean;
    setShowGuide: (show: boolean) => void;
    submitError: string | null;
    isSubmitting: boolean;
    endpointFields: UseFieldArrayReturn<McpBridgeFormData, "apiConfig.endpoints", "id">;
    hasUnsavedChanges: boolean;
    onClose: () => void;
    onSubmit: (data: McpBridgeFormData) => void;
    onDelete?: () => void;
}

/**
 * The presentational component for the BridgeForm
 */
export function BridgeFormUI({
    form,
    bridge,
    open,
    activeTab,
    setActiveTab,
    showGuide,
    setShowGuide,
    submitError,
    isSubmitting,
    endpointFields,
    hasUnsavedChanges,
    onClose,
    onSubmit,
    onDelete
}: BridgeFormUIProps) {

    // Tab icon helper
    const getTabIcon = (tabName: string) => {
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

    return (
        <Dialog open={open} onOpenChange={onClose}>
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

                <form onSubmit={form.handleSubmit(data => onSubmit(data))} className="space-y-6">
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
                            />
                        </TabsContent>

                        <TabsContent value="resources" className="space-y-4">
                            <ResourcesTab form={form} />
                        </TabsContent>

                        <TabsContent value="prompts" className="space-y-4">
                            <PromptsTab form={form} />
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-4">
                            <RoutingAndAccessTab form={form} bridgeConfig={bridge} />
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

                    {/* Form Validation Errors Display */}
                    <FormValidationErrors errors={form.formState.errors} getValues={form.getValues} />

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
                                    onClick={onDelete}
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
                                    onClick={onClose}
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
    );
}
