'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, AlertTriangle, Eye, RefreshCw, Server, TrendingUp, Users } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface AdminMetrics {
    overview: {
        totalUsers: number
        newUsers: number
        userGrowthRate: number
        totalBridges: number
        activeBridges: number
        bridgeGrowthRate: number
        totalEndpoints: number
        avgBridgesPerUser: number
        avgEndpointsPerBridge: number
    }
    charts: {
        userGrowth: Array<{ date: string; count: number }>
        bridgeCreation: Array<{ date: string; count: number }>
        popularApis: Array<{ api_type: string; count: number }>
        userActivity: Array<{ category: string; user_count: number }>
    }
    system: {
        errorCount: number
        demoUsers: number
        realUsers: number
        activationRate: number
    }
}

export default function AdminDashboard() {
    const { status } = useSession()
    const router = useRouter()
    const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin')
            return
        }
    }, [status, router])

    const fetchMetrics = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch(`/api/admin/metrics?range=${timeRange}`)

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Access denied. Admin privileges required.')
                }
                throw new Error('Failed to fetch metrics')
            }

            const data = await response.json()
            setMetrics(data)
        } catch (error) {
            console.error('Error fetching admin metrics:', error)
            setError(error instanceof Error ? error.message : 'Failed to load metrics')
        } finally {
            setLoading(false)
        }
    }, [timeRange])

    useEffect(() => {
        if (status === 'authenticated') {
            fetchMetrics()
        }
    }, [status, fetchMetrics])

    if (status === 'loading') {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600">Loading admin dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    if (status === 'unauthenticated') {
        return null
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-600">System metrics and analytics overview</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Badge variant="outline" className="mr-2">Range</Badge>
                        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as '7d' | '30d' | '90d')}>
                            <SelectTrigger className="w-36">
                                <SelectValue
                                    placeholder="Select range"
                                    defaultValue={timeRange}
                                >
                                    {timeRange === '7d' && 'Last 7 days'}
                                    {timeRange === '30d' && 'Last 30 days'}
                                    {timeRange === '90d' && 'Last 90 days'}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">Last 7 days</SelectItem>
                                <SelectItem value="30d">Last 30 days</SelectItem>
                                <SelectItem value="90d">Last 90 days</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={fetchMetrics} variant="outline" size="sm" disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-2 text-red-800">
                                <AlertTriangle className="h-5 w-5" />
                                <span className="font-medium">Error loading metrics:</span>
                                <span>{error}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Card key={i}>
                                <CardHeader className="pb-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-8 w-16" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-4 w-24" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : metrics ? (
                    <>
                        {/* Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{metrics.overview.totalUsers}</div>
                                    <p className="text-xs text-muted-foreground">
                                        <span className="text-green-600 font-medium">
                                            +{metrics.overview.newUsers} ({metrics.overview.userGrowthRate.toFixed(1)}%)
                                        </span> this period
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Bridges</CardTitle>
                                    <Server className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{metrics.overview.totalBridges}</div>
                                    <p className="text-xs text-muted-foreground">
                                        <span className="text-green-600 font-medium">
                                            {metrics.overview.bridgeGrowthRate.toFixed(1)}% growth
                                        </span> this period
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Bridges</CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{metrics.overview.activeBridges}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {metrics.system.activationRate}% activation rate
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Endpoints</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{metrics.overview.totalEndpoints}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Avg {metrics.overview.avgEndpointsPerBridge} per bridge
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <Tabs defaultValue="users" className="space-y-4">
                            <TabsList>
                                <TabsTrigger value="users">Users</TabsTrigger>
                                <TabsTrigger value="bridges">Bridges</TabsTrigger>
                                <TabsTrigger value="apis">Popular APIs</TabsTrigger>
                                <TabsTrigger value="activity">User Activity</TabsTrigger>
                            </TabsList>

                            <TabsContent value="users" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>User Growth Chart</CardTitle>
                                            <CardDescription>Daily user registrations over time</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {metrics.charts.userGrowth.length > 0 ? (
                                                <div className="space-y-2">
                                                    <div className="text-sm text-gray-600 mb-4">Recent growth activity:</div>
                                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                                        {metrics.charts.userGrowth.slice(-10).map((item, index) => {
                                                            const date = new Date(item.date);
                                                            const isValidDate = !isNaN(date.getTime());

                                                            // Fallback: try to parse as ISO string if direct parsing fails
                                                            let displayDate = 'Invalid Date';
                                                            if (isValidDate) {
                                                                displayDate = date.toLocaleDateString();
                                                            } else if (typeof item.date === 'string') {
                                                                // Try parsing as string directly
                                                                const fallbackDate = new Date(item.date);
                                                                if (!isNaN(fallbackDate.getTime())) {
                                                                    displayDate = fallbackDate.toLocaleDateString();
                                                                } else {
                                                                    // If still invalid, just show the raw value
                                                                    displayDate = `${item.date}`;
                                                                }
                                                            }

                                                            return (
                                                                <div key={index} className="flex justify-between text-sm">
                                                                    <span className="text-gray-600">
                                                                        {displayDate}
                                                                    </span>
                                                                    <span className="font-medium">+{item.count} users</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center text-gray-500 py-8">
                                                    No growth data available
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>User Metrics</CardTitle>
                                            <CardDescription>Key user statistics and insights</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Total Users</span>
                                                    <span className="font-medium">{metrics.overview.totalUsers}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">New Users</span>
                                                    <span className="font-medium">+{metrics.overview.newUsers}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Growth Rate</span>
                                                    <Badge variant={metrics.overview.userGrowthRate >= 0 ? "secondary" : "destructive"}>
                                                        {metrics.overview.userGrowthRate >= 0 ? '+' : ''}{metrics.overview.userGrowthRate.toFixed(1)}%
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Avg Bridges per User</span>
                                                    <Badge variant="outline">{metrics.overview.avgBridgesPerUser}</Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>User Types Distribution</CardTitle>
                                        <CardDescription>Breakdown of user account types</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <Eye className="h-8 w-8 text-gray-400" />
                                                    <div>
                                                        <div className="font-medium">Demo Users</div>
                                                        <div className="text-sm text-gray-500">Test accounts</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold">{metrics.system.demoUsers}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {(metrics.system.demoUsers > 0 ? ((metrics.system.demoUsers / (metrics.overview.totalUsers + metrics.system.demoUsers)) * 100).toFixed(1) : 0)}%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <Users className="h-8 w-8 text-blue-500" />
                                                    <div>
                                                        <div className="font-medium">Real Users</div>
                                                        <div className="text-sm text-gray-500">Active accounts</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-blue-600">{metrics.system.realUsers}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {(metrics.system.realUsers > 0 ? ((metrics.system.realUsers / (metrics.overview.totalUsers + metrics.system.demoUsers)) * 100).toFixed(1) : 0)}%
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="bridges" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Bridge Statistics</CardTitle>
                                            <CardDescription>Overview of bridge creation and usage</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                    <div className="text-2xl font-bold text-blue-600">{metrics.overview.totalBridges}</div>
                                                    <div className="text-sm text-gray-600">Total Bridges</div>
                                                </div>
                                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                                    <div className="text-2xl font-bold text-green-600">{metrics.overview.activeBridges}</div>
                                                    <div className="text-sm text-gray-600">Active</div>
                                                </div>
                                                <div className="text-center p-3 bg-purple-50 rounded-lg">
                                                    <div className="text-2xl font-bold text-purple-600">{metrics.overview.totalEndpoints}</div>
                                                    <div className="text-sm text-gray-600">Total Endpoints</div>
                                                </div>
                                                <div className="text-center p-3 bg-orange-50 rounded-lg">
                                                    <div className="text-2xl font-bold text-orange-600">{metrics.overview.avgEndpointsPerBridge}</div>
                                                    <div className="text-sm text-gray-600">Avg per Bridge</div>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Bridge Growth Rate</span>
                                                    <Badge variant={metrics.overview.bridgeGrowthRate >= 0 ? "secondary" : "destructive"}>
                                                        {metrics.overview.bridgeGrowthRate >= 0 ? '+' : ''}{metrics.overview.bridgeGrowthRate.toFixed(1)}%
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Activation Rate</span>
                                                    <Badge variant="outline">{metrics.system.activationRate}%</Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Bridge Creation Activity</CardTitle>
                                            <CardDescription>Daily bridge creation over time</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {metrics.charts.bridgeCreation.length > 0 ? (
                                                <div className="space-y-2">
                                                    <div className="text-sm text-gray-600 mb-4">Recent creation activity:</div>
                                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                                        {metrics.charts.bridgeCreation.slice(-10).map((item, index) => {
                                                            const date = new Date(item.date);
                                                            const isValidDate = !isNaN(date.getTime());

                                                            // Fallback: try to parse as ISO string if direct parsing fails
                                                            let displayDate = 'Invalid Date';
                                                            if (isValidDate) {
                                                                displayDate = date.toLocaleDateString();
                                                            } else if (typeof item.date === 'string') {
                                                                // Try parsing as string directly
                                                                const fallbackDate = new Date(item.date);
                                                                if (!isNaN(fallbackDate.getTime())) {
                                                                    displayDate = fallbackDate.toLocaleDateString();
                                                                } else {
                                                                    // If still invalid, just show the raw value
                                                                    displayDate = `${item.date}`;
                                                                }
                                                            }

                                                            return (
                                                                <div key={index} className="flex justify-between text-sm">
                                                                    <span className="text-gray-600">
                                                                        {displayDate}
                                                                    </span>
                                                                    <span className="font-medium">+{item.count} bridges</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center text-gray-500 py-8">
                                                    No bridge creation data available
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="apis" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Popular API Types</CardTitle>
                                        <CardDescription>Most commonly integrated API services</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {metrics.charts.popularApis.map((api, index) => (
                                                <div key={api.api_type} className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                                                            {index + 1}
                                                        </div>
                                                        <span className="font-medium">{api.api_type}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-medium">{api.count}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {metrics.overview.totalBridges > 0
                                                                ? `${((api.count / metrics.overview.totalBridges) * 100).toFixed(1)}%`
                                                                : '0%'
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {metrics.charts.popularApis.length === 0 && (
                                                <div className="text-center text-gray-500 py-8">
                                                    No API integrations yet
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="activity" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>User Activity Distribution</CardTitle>
                                        <CardDescription>How many bridges users typically create</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {metrics.charts.userActivity.map((activity) => (
                                                <div key={activity.category} className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">{activity.category}</span>
                                                    <div className="text-right">
                                                        <span className="font-medium">{activity.user_count} users</span>
                                                        <div className="text-xs text-gray-500">
                                                            {metrics.overview.totalUsers > 0
                                                                ? `${((activity.user_count / metrics.overview.totalUsers) * 100).toFixed(1)}%`
                                                                : '0%'
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {metrics.charts.userActivity.length === 0 && (
                                                <div className="text-center text-gray-500 py-8">
                                                    No user activity data available
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-6 pt-4 border-t">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Average per user</span>
                                                    <Badge variant="outline">{metrics.overview.avgBridgesPerUser}</Badge>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">System errors</span>
                                                    <Badge variant={metrics.system.errorCount > 0 ? "destructive" : "secondary"}>
                                                        {metrics.system.errorCount} errors
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </>
                ) : null}
            </div>
        </DashboardLayout>
    )
}
