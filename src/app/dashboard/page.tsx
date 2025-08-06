'use client';

import { BridgeForm } from '@/components/BridgeForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBridges } from '@/hooks/useBridges';
import { BridgeConfig } from '@/lib/types';
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Globe,
  Network,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  TrendingUp,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

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
      // Error handling is done in the hook
    }
  };

  const createNewBridge = () => {
    setEditingBridge(undefined);
    setShowBridgeForm(true);
  };

  const runningBridges = bridges.filter(b => b.enabled).length;
  const activeBridges = bridges.filter(b => b.enabled);
  const recentActivity = bridges.slice(0, 3);

  // Mock request data for demonstration
  const requestData = [
    { time: '00:00', requests: 12, responses: 11, errors: 1 },
    { time: '04:00', requests: 8, responses: 8, errors: 0 },
    { time: '08:00', requests: 45, responses: 42, errors: 3 },
    { time: '12:00', requests: 78, responses: 75, errors: 3 },
    { time: '16:00', requests: 92, responses: 89, errors: 3 },
    { time: '20:00', requests: 56, responses: 54, errors: 2 },
  ];

  const endpointUsage = [
    { name: 'GET /users', requests: 245, percentage: 45 },
    { name: 'POST /auth', requests: 123, percentage: 23 },
    { name: 'GET /posts', requests: 87, percentage: 16 },
    { name: 'PUT /profile', requests: 45, percentage: 8 },
    { name: 'DELETE /posts', requests: 43, percentage: 8 },
  ];

  const responseTimeData = [
    { time: '00:00', avgTime: 120 },
    { time: '04:00', avgTime: 95 },
    { time: '08:00', avgTime: 180 },
    { time: '12:00', avgTime: 220 },
    { time: '16:00', avgTime: 290 },
    { time: '20:00', avgTime: 156 },
  ];

  const bridgeStatusData = [
    { name: 'Active', value: runningBridges, color: '#10b981' },
    { name: 'Inactive', value: bridges.length - runningBridges, color: '#6b7280' },
  ];

  const totalRequests = requestData.reduce((sum, item) => sum + item.requests, 0);
  const totalErrors = requestData.reduce((sum, item) => sum + item.errors, 0);
  const avgResponseTime = Math.round(responseTimeData.reduce((sum, item) => sum + item.avgTime, 0) / responseTimeData.length);
  const successRate = totalRequests > 0 ? Math.round(((totalRequests - totalErrors) / totalRequests) * 100) : 100;

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
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                  Welcome back! Here&apos;s what&apos;s happening with your API bridges
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
                <Button onClick={createNewBridge} size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Bridge
                </Button>
              </div>
            </div>
          </div>

          {/* Hero Stats Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Stats Card */}
            <Card className="lg:col-span-2 from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  API Request Analytics
                </CardTitle>
                <CardDescription>
                  Real-time request metrics and performance data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{totalRequests}</div>
                    <div className="text-sm text-muted-foreground">Total Requests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{successRate}%</div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{avgResponseTime}ms</div>
                    <div className="text-sm text-muted-foreground">Avg Response</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{totalErrors}</div>
                    <div className="text-sm text-muted-foreground">Errors</div>
                  </div>
                </div>

                <div className="h-64">
                  <h4 className="text-sm font-medium mb-3">Request Volume (Last 24 Hours)</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={requestData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="requests"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Requests"
                      />
                      <Line
                        type="monotone"
                        dataKey="errors"
                        stroke="#ef4444"
                        strokeWidth={2}
                        name="Errors"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={createNewBridge} className="w-full justify-start" variant="ghost">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Bridge
                </Button>
                <Link href="/dashboard/bridges">
                  <Button className="w-full justify-start" variant="ghost">
                    <Database className="h-4 w-4 mr-2" />
                    Manage Bridges
                  </Button>
                </Link>
                <Link href="/dashboard/docs">
                  <Button className="w-full justify-start" variant="ghost">
                    <Globe className="h-4 w-4 mr-2" />
                    View Documentation
                  </Button>
                </Link>
                <Button className="w-full justify-start" variant="ghost">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {bridges.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Bridges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-green-500" />
                    Active Bridges
                  </CardTitle>
                  <CardDescription>
                    Currently running API bridges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activeBridges.length > 0 ? (
                    <div className="space-y-3">
                      {activeBridges.slice(0, 3).map((bridge) => (
                        <div key={bridge.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <div>
                              <p className="font-medium">{bridge.name}</p>
                              <p className="text-sm text-muted-foreground">/mcp/{bridge.slug || bridge.id}</p>
                            </div>
                          </div>
                          <Badge variant="success" className="bg-green-100 text-green-800">
                            <Activity className="h-3 w-3 mr-1" />
                            Live
                          </Badge>
                        </div>
                      ))}
                      {activeBridges.length > 3 && (
                        <div className="text-center">
                          <Link href="/dashboard/bridges">
                            <Button variant="ghost" size="sm">
                              View all {activeBridges.length} active bridges
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No active bridges</p>
                      <p className="text-xs text-muted-foreground">Start a bridge to see it here</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Latest changes to your bridges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.map((bridge, index) => (
                        <div key={bridge.id} className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {bridge.enabled ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30"></div>
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{bridge.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {bridge.enabled ? 'Bridge activated' : 'Bridge created'} • {index === 0 ? 'Just now' : `${index + 1}m ago`}
                            </p>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {bridge.apiConfig.endpoints?.length || 0} endpoints
                              </Badge>
                              {bridge.enabled && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                  Running
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                      <p className="text-xs text-muted-foreground">Activity will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Getting Started Section */
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
          )}

          {/* API Performance Analytics */}
          {bridges.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Response Time Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    Response Time Trends
                  </CardTitle>
                  <CardDescription>
                    Average response times over the last 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={responseTimeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}ms`, 'Response Time']} />
                        <Line
                          type="monotone"
                          dataKey="avgTime"
                          stroke="#8b5cf6"
                          strokeWidth={3}
                          dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Endpoint Usage Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Endpoint Usage
                  </CardTitle>
                  <CardDescription>
                    Most popular API endpoints by request volume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={endpointUsage} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip formatter={(value) => [`${value} requests`, 'Volume']} />
                        <Bar dataKey="requests" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Bridge Status Analytics */}
          {bridges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-orange-500" />
                  Bridge Performance Metrics
                </CardTitle>
                <CardDescription>
                  Detailed analytics and performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-lg">
                    <Network className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{bridges.length}</div>
                    <div className="text-sm text-blue-600/70">Total Bridges</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-lg">
                    <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{bridges.filter(b => b.apiConfig.authentication && b.apiConfig.authentication.type !== 'none').length}</div>
                    <div className="text-sm text-green-600/70">Secured APIs</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-lg">
                    <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{bridges.reduce((sum, b) => sum + (b.mcpTools?.length || 0), 0)}</div>
                    <div className="text-sm text-purple-600/70">MCP Tools Generated</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 rounded-lg">
                    <Activity className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-600">{runningBridges}</div>
                    <div className="text-sm text-orange-600/70">Active Bridges</div>
                  </div>
                </div>

                {/* Bridge Status Pie Chart */}
                <div className="mt-6 flex items-center justify-center">
                  <div className="w-64 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={bridgeStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {bridgeStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} bridges`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="ml-6 space-y-2">
                    {bridgeStatusData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm">{entry.name}: {entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
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
