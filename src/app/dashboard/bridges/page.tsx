'use client';

import { BridgeForm } from '@/components/bridge-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBridges } from '@/hooks/useBridges';
import { BridgeConfig } from '@/lib/types';
import { getBaseUrl } from '@/lib/url';
import {
    AlertCircle,
    BookOpen,
    Copy,
    Database,
    Edit,
    Play,
    Plus,
    RefreshCw,
    Settings,
    Square,
    Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function BridgesPage() {
    const baseUrl = getBaseUrl();
    const {
        bridges,
        loading,
        error,
        createBridge,
        updateBridge,
        deleteBridge,
        startBridge,
        stopBridge,
        refreshBridges,
        serverStatuses,
    } = useBridges();

    const [showBridgeForm, setShowBridgeForm] = useState(false);
    const [editingBridge, setEditingBridge] = useState<BridgeConfig | undefined>();
    const [operatingBridges, setOperatingBridges] = useState<Set<string>>(new Set());

    const handleSaveBridge = async (bridge: BridgeConfig) => {
        try {
            if (editingBridge) {
                await updateBridge(bridge.id, bridge);
            } else {
                // Generate unique ID if not provided
                if (!bridge.id) {
                    bridge.id = `bridge-${Date.now()}`;
                }
                await createBridge(bridge);
            }
            setEditingBridge(undefined);
            setShowBridgeForm(false);
        } catch (error) {
            console.error('Failed to save bridge:', error);
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
        if (!confirm('Are you sure you want to delete this bridge? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteBridge(bridgeId);
        } catch (error) {
            console.error('Failed to delete bridge:', error);
        }
    };

    const editBridge = (bridge: BridgeConfig) => {
        setEditingBridge(bridge);
        setShowBridgeForm(true);
    };

    const createNewBridge = () => {
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
                        <p className="text-muted-foreground">Loading bridges...</p>
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
                                <h3 className="font-semibold text-destructive">Error Loading Bridges</h3>
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
                    <div className="flex items-center justify-between space-y-2">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Bridges</h2>
                            <p className="text-muted-foreground">
                                Manage your API bridges and their configurations
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                onClick={refreshBridges}
                                disabled={loading}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Refresh
                            </Button>
                            <Button
                                variant="outline"
                                asChild
                            >
                                <Link href="/guide">
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Quick Guide
                                </Link>
                            </Button>
                            <Button onClick={createNewBridge}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Bridge
                            </Button>
                        </div>
                    </div>

                    {/* MCP Usage Info */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <Database className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="space-y-2">
                                    <h3 className="font-semibold">Using MCP Endpoints</h3>
                                    <p className="text-muted-foreground text-sm">
                                        Copy the MCP endpoint URL and configure it in your MCP client (Claude Desktop, VS Code Copilot, etc.).
                                        The endpoint supports JSON-RPC 2.0 protocol for tools/list and tools/call methods.
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
                                    <h3 className="text-lg font-semibold mb-2">No bridges yet</h3>
                                    <p className="text-muted-foreground text-center mb-4">
                                        Get started by creating your first API bridge to convert REST endpoints into MCP tools.
                                    </p>
                                    <Button onClick={createNewBridge}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Your First Bridge
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
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <CardTitle className="text-lg">{bridge.name}</CardTitle>
                                                        <CardDescription className="line-clamp-2">
                                                            {bridge.description || 'No description provided'}
                                                        </CardDescription>
                                                    </div>
                                                    <Badge variant={isRunning ? 'default' : 'secondary'}>
                                                        {isRunning ? 'Running' : 'Stopped'}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {/* API Info - Simplified */}
                                                <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <Database className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium">{bridge.apiConfig.name}</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {bridge.apiConfig.endpoints?.length || 0} endpoint{(bridge.apiConfig.endpoints?.length || 0) !== 1 ? 's' : ''}
                                                    </span>
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
                                                        className="flex-1"
                                                    >
                                                        {operatingBridges.has(bridge.id) ? (
                                                            <>
                                                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                                                                {isRunning ? 'Stopping...' : 'Starting...'}
                                                            </>
                                                        ) : isRunning ? (
                                                            <>
                                                                <Square className="h-4 w-4 mr-2" />
                                                                Stop
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Play className="h-4 w-4 mr-2" />
                                                                Start
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => editBridge(bridge)}
                                                        title="Edit Bridge"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeleteBridge(bridge.id)}
                                                        className="hover:bg-muted"
                                                        title="Delete Bridge"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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
                </>
            )}
        </div>
    );
}
