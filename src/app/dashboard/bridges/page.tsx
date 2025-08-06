'use client';

import { BridgeForm } from '@/components/BridgeForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBridges } from '@/hooks/useBridges';
import { BridgeConfig } from '@/lib/types';
import {
    AlertCircle,
    Copy,
    Database,
    Edit,
    Play,
    Plus,
    RefreshCw,
    Square,
    Trash2
} from 'lucide-react';
import { useState } from 'react';

export default function BridgesPage() {
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
        <div className="p-6 space-y-8">
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
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <div>
                                <h3 className="font-semibold text-red-900">Error Loading Bridges</h3>
                                <p className="text-red-700">{error}</p>
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
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Bridges</h1>
                            <p className="text-muted-foreground">
                                Manage your API bridges and their configurations
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={refreshBridges}
                                disabled={loading}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                            <Button onClick={createNewBridge} size="lg">
                                <Plus className="h-5 w-5 mr-2" />
                                Create Bridge
                            </Button>
                        </div>
                    </div>

                    {/* MCP Usage Info */}
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <Database className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-blue-900">Using MCP Endpoints</h3>
                                    <p className="text-blue-800 text-sm">
                                        Copy the MCP endpoint URL and configure it in your MCP client (Claude Desktop, VS Code Copilot, etc.). 
                                        The endpoint supports JSON-RPC 2.0 protocol for tools/list and tools/call methods.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bridges Grid */}
                    <div className="space-y-6">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                                    <Badge variant={isRunning ? 'success' : 'secondary'}>
                                                        {isRunning ? 'Running' : 'Stopped'}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">API:</span>
                                                        <span className="font-medium">{bridge.apiConfig.name}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Endpoints:</span>
                                                        <span className="font-medium">{bridge.apiConfig.endpoints?.length || 0}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">MCP Endpoint:</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                                                http://localhost:3001/mcp/{bridge.slug || bridge.id}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(`http://localhost:3001/mcp/${bridge.slug || bridge.id}`);
                                                                }}
                                                                className="h-6 w-6 p-0"
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    {isRunning && status?.url && (
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Status:</span>
                                                            <span className="flex items-center gap-1">
                                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                                <span className="text-green-600 font-medium">Live at {status.url}</span>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    <Button
                                                        variant={isRunning ? "destructive" : "default"}
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
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                    />
                </>
            )}
        </div>
    );
}
