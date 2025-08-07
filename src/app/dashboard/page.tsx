'use client';

import { BridgeForm } from '@/components/bridge-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBridges } from '@/hooks/useBridges';
import { BridgeConfig } from '@/lib/types';
import { getMcpPath, getMcpUrl } from '@/lib/url';
import {
  Activity,
  AlertCircle,
  BookOpen,
  Copy,
  Database,
  Globe,
  Lightbulb,
  Plus,
  RefreshCw,
  Settings,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function Dashboard() {
  const {
    bridges,
    loading,
    error,
    createBridge,
    updateBridge,
    refreshBridges,
  } = useBridges();

  const [showBridgeForm, setShowBridgeForm] = useState(false);
  const [editingBridge, setEditingBridge] = useState<BridgeConfig | undefined>();

  const handleSaveBridge = async (bridge: BridgeConfig) => {
    try {
      if (editingBridge) {
        await updateBridge(bridge.id, bridge);
      } else {
        // Generate unique ID if not provided (should be UUID)
        if (!bridge.id) {
          bridge.id = crypto.randomUUID();
        }
        await createBridge(bridge);
      }
      setEditingBridge(undefined);
      setShowBridgeForm(false);
    } catch (error) {
      console.error('Failed to save bridge:', error);
      // Error handling is done in the hook
    }
  };

  const createNewBridge = () => {
    setEditingBridge(undefined);
    setShowBridgeForm(true);
  }; const runningBridges = bridges.filter(b => b.enabled).length;
  const activeBridges = bridges.filter(b => b.enabled);

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
          <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground">
                Here&apos;s what&apos;s happening with your MCP bridges today.
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
              <Button onClick={createNewBridge}>
                <Plus className="mr-2 h-4 w-4" />
                Create Bridge
              </Button>
            </div>
          </div>

          {bridges.length === 0 ? (
            /* Getting Started Section - Empty State */
            <div className="grid gap-6">
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center mb-6">
                    <Database className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">Welcome to MCP Bridge!</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-md">
                    Transform any REST API into a Model Context Protocol server that AI assistants can use. Get started by creating your first bridge.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={createNewBridge} size="lg">
                      <Plus className="h-5 w-5 mr-2" />
                      Create Your First Bridge
                    </Button>
                    <Link href="/dashboard/docs">
                      <Button variant="outline" size="lg">
                        <Globe className="h-5 w-5 mr-2" />
                        View Documentation
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Tips for New Users */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Database className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h4 className="font-semibold mb-2">Create a Bridge</h4>
                    <p className="text-sm text-muted-foreground">Connect any REST API by providing the base URL and endpoints you want to expose.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h4 className="font-semibold mb-2">Start the Bridge</h4>
                    <p className="text-sm text-muted-foreground">Activate your bridge to make it available as an MCP server endpoint.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Settings className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h4 className="font-semibold mb-2">Configure Client</h4>
                    <p className="text-sm text-muted-foreground">Add the MCP endpoint to your AI assistant configuration (Claude, VS Code, etc.).</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            /* Main Dashboard with Bridges */
            <div className="grid gap-6">
              {/* Status Overview */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Bridges
                    </CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{bridges.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {bridges.length === 1 ? '+1 from last month' : 'bridges configured'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Bridges
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{runningBridges}</div>
                    <p className="text-xs text-muted-foreground">
                      {runningBridges === 1 ? 'bridge running' : 'bridges running'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Endpoints
                    </CardTitle>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {bridges.reduce((acc, bridge) => acc + (bridge.apiConfig.endpoints?.length || 0), 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      API endpoints configured
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Inactive Bridges
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{bridges.length - runningBridges}</div>
                    <p className="text-xs text-muted-foreground">
                      {bridges.length - runningBridges === 1 ? 'bridge not running' : 'bridges not running'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Active Bridges */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5" />
                          Active Bridges
                        </CardTitle>
                        <CardDescription>Currently running MCP servers</CardDescription>
                      </div>
                      <Link href="/dashboard/bridges">
                        <Button variant="outline" size="sm">View All</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {activeBridges.length > 0 ? (
                      <div className="space-y-3">
                        {activeBridges.slice(0, 4).map((bridge) => (
                          <div key={bridge.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <div>
                                <p className="font-medium">{bridge.name}</p>
                                <p className="text-sm text-muted-foreground">{getMcpPath(bridge.slug || bridge.id)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {bridge.apiConfig.endpoints?.length || 0} endpoints
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(getMcpUrl(bridge.slug || bridge.id));
                                }}
                                className="h-7 w-7 p-0"
                                title="Copy MCP URL"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {activeBridges.length > 4 && (
                          <div className="text-center pt-2">
                            <Link href="/dashboard/bridges">
                              <Button variant="ghost" size="sm">
                                +{activeBridges.length - 4} more active bridges
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                          <Activity className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">No active bridges</p>
                        <p className="text-xs text-muted-foreground">Start a bridge to see it here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>Common tasks and helpful resources</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button onClick={createNewBridge} className="w-full justify-start h-auto p-4" variant="ghost">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Plus className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Create New Bridge</div>
                          <div className="text-sm text-muted-foreground">Add a new REST API connection</div>
                        </div>
                      </div>
                    </Button>

                    <Link href="/dashboard/bridges">
                      <Button className="w-full justify-start h-auto p-4" variant="ghost">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                            <Database className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">Manage Bridges</div>
                            <div className="text-sm text-muted-foreground">View, edit, and control your bridges</div>
                          </div>
                        </div>
                      </Button>
                    </Link>

                    <Link href="/dashboard/docs">
                      <Button className="w-full justify-start h-auto p-4" variant="ghost">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">Documentation</div>
                            <div className="text-sm text-muted-foreground">Learn how to setup MCP clients</div>
                          </div>
                        </div>
                      </Button>
                    </Link>

                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Lightbulb className="h-4 w-4" />
                        <span className="font-medium">Pro Tip</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Copy the MCP endpoint URL from active bridges and add it to your AI assistant&apos;s configuration to start using your APIs with AI.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Bridges */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>All Bridges</CardTitle>
                      <CardDescription>Quick overview of your API bridges</CardDescription>
                    </div>
                    <Link href="/dashboard/bridges">
                      <Button variant="outline" size="sm">Manage All</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {bridges.slice(0, 6).map((bridge) => (
                      <div key={bridge.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${bridge.enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                          <div>
                            <p className="font-medium">{bridge.name}</p>
                            <p className="text-sm text-muted-foreground">{bridge.apiConfig.name} • {bridge.apiConfig.endpoints?.length || 0} endpoints</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={bridge.enabled ? "default" : "secondary"} className="text-xs">
                            {bridge.enabled ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(getMcpUrl(bridge.slug || bridge.id));
                            }}
                            className="h-7 w-7 p-0"
                            title="Copy MCP URL"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {bridges.length > 6 && (
                      <div className="text-center pt-2">
                        <Link href="/dashboard/bridges">
                          <Button variant="ghost" size="sm">
                            View all {bridges.length} bridges
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
