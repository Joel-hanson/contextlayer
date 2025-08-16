'use client';

import { BridgeForm } from '@/components/bridge-form';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useBridges } from '@/hooks/useBridges';
import type { ApiTemplate } from '@/lib/templates/api-templates';
import { apiTemplates } from '@/lib/templates/api-templates';
import { BridgeConfig } from '@/lib/types';
import { getBaseUrl } from '@/lib/url';
import {
    AlertCircle,
    BookOpen,
    ChevronDown,
    Copy,
    Database,
    Edit,
    Play,
    Plus,
    RefreshCw,
    Settings,
    Square,
    Trash2,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function BridgesPage() {
    const baseUrl = getBaseUrl();
    const { toast } = useToast();
    const {
        bridges,
        setBridges,
        loading,
        error,
        createBridge,
        updateBridge,
        deleteBridge,
        startBridge,
        stopBridge,
        refreshBridges,
        clearError,
        serverStatuses,
    } = useBridges();

    const [showBridgeForm, setShowBridgeForm] = useState(false);
    const [editingBridge, setEditingBridge] = useState<BridgeConfig | undefined>();
    const [operatingBridges, setOperatingBridges] = useState<Set<string>>(new Set());
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingBridgeId, setDeletingBridgeId] = useState<string | null>(null);

    // Import templates from the central location
    const templates = apiTemplates;

    const applyTemplate = (template: ApiTemplate) => {
        if (typeof window !== 'undefined') {
            clearError(); // Clear any previous errors
            // Process the template to add required IDs to endpoints
            const processedConfig = {
                ...template.config,
                apiConfig: {
                    ...template.config.apiConfig,
                    endpoints: template.config.apiConfig?.endpoints?.map((endpoint, index) => ({
                        ...endpoint,
                        id: `endpoint-${Date.now()}-${index}`,
                        parameters: endpoint.parameters || []
                    })) || []
                }
            };

            localStorage.setItem('contextlayer-template', JSON.stringify(processedConfig));
            setEditingBridge(undefined);
            setShowBridgeForm(true);
        }
    };

    const handleSaveBridge = async (bridge: BridgeConfig) => {
        if (editingBridge) {
            await updateBridge(bridge.id, bridge);
            setEditingBridge(undefined);
        } else {
            // Generate unique ID if not provided
            if (!bridge.id) {
                bridge.id = `bridge-${Date.now()}`;
            }
            await createBridge(bridge);
            setEditingBridge(undefined);
        }
    };

    const handleToggleBridge = async (bridgeId: string) => {
        const bridge = bridges.find(b => b.id === bridgeId);
        if (!bridge || operatingBridges.has(bridgeId)) return;

        setOperatingBridges(prev => new Set(prev).add(bridgeId));

        try {
            if (bridge.enabled) {
                await stopBridge(bridgeId);
            } else {
                await startBridge(bridgeId, bridge);
            }
        } catch (error) {
            console.error('Failed to toggle bridge:', error);
        } finally {
            setOperatingBridges(prev => {
                const newSet = new Set(prev);
                newSet.delete(bridgeId);
                return newSet;
            });
        }
    };

    const handleDeleteBridge = async (bridgeId: string) => {
        setDeletingBridgeId(bridgeId);
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingBridgeId) return;

        // Close dialog immediately
        setShowDeleteDialog(false);
        setShowBridgeForm(false);
        setEditingBridge(undefined);

        // Find bridge to remove
        const bridgeToDelete = bridges.find(b => b.id === deletingBridgeId);
        if (!bridgeToDelete) return;

        // Update state optimistically
        const prevBridges = bridges;
        setBridges(bridges.filter(b => b.id !== deletingBridgeId));

        try {
            await deleteBridge(deletingBridgeId);
        } catch (error) {
            console.error('Failed to delete bridge:', error);
            // Revert on failure
            setBridges(prevBridges);
            toast({
                title: "Delete Failed",
                description: error instanceof Error ? error.message : "Failed to delete MCP server",
                variant: "destructive"
            });
        } finally {
            setDeletingBridgeId(null);
        }
    };

    const editBridge = (bridge: BridgeConfig) => {
        clearError(); // Clear any previous errors
        setEditingBridge(bridge);
        setShowBridgeForm(true);
    };

    const createNewBridge = () => {
        clearError(); // Clear any previous errors
        setEditingBridge(undefined);
        setShowBridgeForm(true);
    };

    return (
        <div className="flex-1 space-y-4 font-mono">
            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading MCP servers...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <div>
                                <h3 className="font-semibold text-destructive">Error Loading MCP Servers</h3>
                                <p className="text-destructive/80">{error}</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={refreshBridges}
                                className="ml-auto"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Content */}
            {!loading && !error && (
                <>
                    {/* Header */}
                    <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">MCP Servers</h2>
                            <p className="text-muted-foreground text-sm sm:text-base">
                                Manage your MCP servers and their tool configurations
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                            <Button
                                variant="outline"
                                onClick={refreshBridges}
                                disabled={loading}
                                className="w-full sm:w-auto touch-manipulation"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Refresh
                            </Button>
                            <Button
                                variant="outline"
                                asChild
                                className="w-full sm:w-auto touch-manipulation"
                            >
                                <Link href="/guide">
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Quick Guide
                                </Link>
                            </Button>
                            {/* Template Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full sm:w-auto touch-manipulation">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Use Template
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 sm:w-80">
                                    {templates.map((template) => {
                                        const IconComponent = template.icon;
                                        return (
                                            <DropdownMenuItem
                                                key={template.id}
                                                onClick={() => applyTemplate(template)}
                                                className="flex items-center gap-3 py-3"
                                            >
                                                <div className={`w-8 h-8 rounded-md ${template.color} flex items-center justify-center shrink-0`}>
                                                    <IconComponent className="h-4 w-4 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium">{template.name}</div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {template.description}
                                                    </div>
                                                </div>
                                                {["openai", "stripe", "sendgrid", "github", "slack"].includes(template.id) && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Under Testing
                                                    </Badge>
                                                )}
                                            </DropdownMenuItem>
                                        );
                                    })}
                                    <DropdownMenuItem className="border-t">
                                        <div className="text-xs text-muted-foreground">More templates coming soon...</div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button onClick={createNewBridge} className="w-full sm:w-auto touch-manipulation">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Custom
                            </Button>
                        </div>
                    </div>

                    {/* MCP Usage Info */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row items-start gap-3">
                                <Database className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                                <div className="space-y-2 min-w-0">
                                    <h3 className="font-semibold text-sm sm:text-base">Using MCP Tools</h3>
                                    <p className="text-muted-foreground text-xs sm:text-sm">
                                        Copy the MCP server URL and configure it in your MCP client (Claude Desktop, VS Code Copilot, etc.).
                                        The server provides AI tools that your assistant can call to interact with your APIs.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>



                    {/* Bridges Grid */}
                    <div className="space-y-4">
                        {bridges.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Database className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No MCP servers yet</h3>
                                    <p className="text-muted-foreground text-center mb-4">
                                        Get started by creating your first MCP server to convert API endpoints into AI tools.
                                    </p>
                                    <Button onClick={createNewBridge}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Your First MCP Server
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {bridges.map((bridge) => {
                                    const status = serverStatuses[bridge.id];
                                    const isRunning = bridge.enabled && status?.running;

                                    return (
                                        <Card key={bridge.id} className="hover:shadow-lg transition-shadow">
                                            <CardHeader className="pb-3">
                                                <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                                                    <div className="space-y-1 min-w-0 flex-1">
                                                        <CardTitle className="text-base sm:text-lg truncate">{bridge.name}</CardTitle>
                                                        <CardDescription className="line-clamp-2 text-xs sm:text-sm">
                                                            {bridge.description || 'No description provided'}
                                                        </CardDescription>
                                                    </div>
                                                    <Badge variant={isRunning ? 'default' : 'secondary'} className="shrink-0">
                                                        {isRunning ? 'Running' : 'Stopped'}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4 pt-0">
                                                {/* API Info - Simplified */}
                                                <div className="py-2 px-3 bg-muted/50 rounded-lg space-y-3">
                                                    <div className="flex items-center justify-between min-w-0">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <Database className="h-4 w-4 text-muted-foreground shrink-0" />
                                                            <span className="text-sm font-medium truncate">{bridge.apiConfig.name}</span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground shrink-0">
                                                            {bridge.apiConfig.endpoints?.length || 0} endpoint{(bridge.apiConfig.endpoints?.length || 0) !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>

                                                    {/* MCP Content Stats - Responsive Grid Layout */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                        <Badge variant="outline" className="text-xs py-1 px-2 flex items-center justify-center">
                                                            <Zap className="h-3 w-3 mr-1 flex-shrink-0" />
                                                            <span className="truncate">{bridge.mcpTools?.length || 0} tool{(bridge.mcpTools?.length || 0) !== 1 ? 's' : ''}</span>
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs py-1 px-2 flex items-center justify-center">
                                                            <BookOpen className="h-3 w-3 mr-1 flex-shrink-0" />
                                                            <span className="truncate">{bridge.mcpResources?.length || 0} resource{(bridge.mcpResources?.length || 0) !== 1 ? 's' : ''}</span>
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs py-1 px-2 flex items-center justify-center sm:col-span-1 col-span-1">
                                                            <Settings className="h-3 w-3 mr-1 flex-shrink-0" />
                                                            <span className="truncate">{bridge.mcpPrompts?.length || 0} prompt{(bridge.mcpPrompts?.length || 0) !== 1 ? 's' : ''}</span>
                                                        </Badge>
                                                    </div>

                                                </div>

                                                {/* MCP Endpoint - More prominent */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">MCP Endpoint</span>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(`${baseUrl}/mcp/${bridge.slug || bridge.id}`);
                                                                    toast({
                                                                        title: "URL Copied",
                                                                        description: `MCP endpoint URL copied to clipboard, url ${baseUrl}/mcp/${bridge.slug || bridge.id}`,
                                                                        duration: 2000
                                                                    });
                                                                }}
                                                                className="h-7 w-7 p-0"
                                                                title="Copy URL"
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </Button>
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 w-7 p-0"
                                                                        title="Setup Instructions"
                                                                    >
                                                                        <Settings className="h-3 w-3" />
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                                                    <DialogHeader>
                                                                        <DialogTitle>MCP Client Setup for &ldquo;{bridge.name}&rdquo;</DialogTitle>
                                                                        <DialogDescription>
                                                                            Configure your MCP client to use this bridge
                                                                        </DialogDescription>
                                                                    </DialogHeader>

                                                                    <Tabs defaultValue="claude" className="w-full">
                                                                        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto">
                                                                            <TabsTrigger value="claude" className="text-xs sm:text-sm">Claude Desktop</TabsTrigger>
                                                                            <TabsTrigger value="vscode" className="text-xs sm:text-sm">VS Code</TabsTrigger>
                                                                            <TabsTrigger value="http" className="text-xs sm:text-sm">HTTP Client</TabsTrigger>
                                                                        </TabsList>

                                                                        <TabsContent value="claude" className="space-y-4">
                                                                            <div className="space-y-3">
                                                                                <h4 className="font-semibold">Claude Desktop Configuration</h4>
                                                                                <p className="text-sm text-muted-foreground">
                                                                                    Edit your Claude Desktop config file:
                                                                                </p>
                                                                                <div className="bg-muted p-2 rounded text-xs font-mono">
                                                                                    macOS: ~/Library/Application Support/Claude/claude_desktop_config.json<br />
                                                                                    Windows: %APPDATA%\Claude\claude_desktop_config.json
                                                                                </div>
                                                                                <p className="text-sm text-muted-foreground">
                                                                                    Add this configuration:
                                                                                </p>
                                                                                <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                                                                                    <pre className="whitespace-pre-wrap break-words">{`{
  "mcpServers": {
    "${bridge.name.toLowerCase().replace(/\s+/g, '-')}": {
      "command": "node",
      "args": [
        "-e",
        "const fetch = require('node-fetch'); const url = '${baseUrl}/mcp/${bridge.slug || bridge.id}'; process.stdin.on('data', async (data) => { try { const request = JSON.parse(data.toString()); const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) }); const result = await response.json(); process.stdout.write(JSON.stringify(result) + '\\\\n'); } catch (error) { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: error.message }, id: request?.id || null }) + '\\\\n'); } });"
      ]
    }
  }
}`}</pre>
                                                                                </div>
                                                                                <p className="text-sm text-muted-foreground">
                                                                                    Restart Claude Desktop after saving the configuration.
                                                                                </p>
                                                                            </div>
                                                                        </TabsContent>

                                                                        <TabsContent value="vscode" className="space-y-4">
                                                                            <div className="space-y-3">
                                                                                <h4 className="font-semibold">VS Code Configuration</h4>
                                                                                <p className="text-sm text-muted-foreground">
                                                                                    Create or edit your MCP configuration file:
                                                                                </p>
                                                                                <div className="bg-muted p-2 rounded text-xs font-mono">
                                                                                    ~/.config/mcp/mcp.json
                                                                                </div>
                                                                                <p className="text-sm text-muted-foreground">
                                                                                    Add this server configuration:
                                                                                </p>
                                                                                <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                                                                                    <pre className="whitespace-pre-wrap break-words">{`{
  "servers": {
    "${bridge.name.toLowerCase().replace(/\s+/g, '-')}": {
      "transport": {
        "type": "http",
        "url": "${baseUrl}/mcp/${bridge.slug || bridge.id}"
      }
    }
  }
}`}</pre>
                                                                                </div>
                                                                                <p className="text-sm text-muted-foreground">
                                                                                    Restart VS Code to load the new configuration.
                                                                                </p>
                                                                            </div>
                                                                        </TabsContent>

                                                                        <TabsContent value="http" className="space-y-4">
                                                                            <div className="space-y-3">
                                                                                <h4 className="font-semibold">HTTP Client Configuration</h4>
                                                                                <p className="text-sm text-muted-foreground">
                                                                                    Direct HTTP endpoint configuration:
                                                                                </p>
                                                                                <div className="bg-muted p-3 rounded text-xs font-mono">
                                                                                    Protocol: JSON-RPC 2.0 over HTTP<br />
                                                                                    Method: POST<br />
                                                                                    Content-Type: application/json<br />
                                                                                    URL: ${baseUrl}/mcp/{bridge.slug || bridge.id}
                                                                                </div>
                                                                                <h5 className="font-medium mt-4">Test Commands:</h5>
                                                                                <div className="space-y-2">
                                                                                    <div>
                                                                                        <p className="text-sm font-medium">Initialize:</p>
                                                                                        <div className="bg-muted p-2 rounded text-xs font-mono">
                                                                                            <pre className="whitespace-pre-wrap break-words">{`curl -X POST ${baseUrl}/mcp/${bridge.slug || bridge.id} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc": "2.0", "method": "initialize", "id": 1}'`}</pre>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-sm font-medium">List Tools:</p>
                                                                                        <div className="bg-muted p-2 rounded text-xs font-mono">
                                                                                            <pre className="whitespace-pre-wrap break-words">{`curl -X POST ${baseUrl}/mcp/${bridge.slug || bridge.id} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 2}'`}</pre>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </TabsContent>
                                                                    </Tabs>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 p-2 bg-muted rounded border">
                                                        <span className="font-mono text-xs text-muted-foreground truncate">
                                                            {typeof window !== 'undefined' ? `${window.location.host}/mcp/${bridge.slug || bridge.id}` : `${getBaseUrl()}/mcp/${bridge.slug || bridge.id}`}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Status Indicator */}
                                                {isRunning && status?.url && (
                                                    <div className="flex items-center gap-2 text-sm py-1">
                                                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                                                        <span className="font-medium text-muted-foreground">Live</span>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 pt-2">
                                                    <Button
                                                        variant={isRunning ? "outline" : "default"}
                                                        size="sm"
                                                        onClick={() => handleToggleBridge(bridge.id)}
                                                        disabled={operatingBridges.has(bridge.id)}
                                                        className="flex-1 touch-manipulation"
                                                    >
                                                        {operatingBridges.has(bridge.id) ? (
                                                            <>
                                                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                                                                <span className="text-xs sm:text-sm">{isRunning ? 'Stopping...' : 'Starting...'}</span>
                                                            </>
                                                        ) : isRunning ? (
                                                            <>
                                                                <Square className="h-4 w-4 mr-2" />
                                                                <span className="text-xs sm:text-sm">Stop</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Play className="h-4 w-4 mr-2" />
                                                                <span className="text-xs sm:text-sm">Start</span>
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => editBridge(bridge)}
                                                        title="Edit Bridge"
                                                        className="touch-manipulation"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => handleDeleteBridge(bridge.id)}
                                                        className="hover:bg-muted touch-manipulation"
                                                        title="Delete MCP Server"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <BridgeForm
                        bridge={editingBridge}
                        open={showBridgeForm}
                        onOpenChange={setShowBridgeForm}
                        onSave={handleSaveBridge}
                        onDelete={editingBridge ? handleDeleteBridge : undefined}
                    />

                    <ConfirmationDialog
                        open={showDeleteDialog}
                        onOpenChange={setShowDeleteDialog}
                        onConfirm={handleDeleteConfirm}
                        title="Delete MCP Server"
                        description={`Are you sure you want to delete the MCP server "${bridges.find(b => b.id === deletingBridgeId)?.name}"? This action cannot be undone.`}
                        confirmText="Delete"
                        cancelText="Cancel"
                    />
                </>
            )}
        </div>
    );
}
