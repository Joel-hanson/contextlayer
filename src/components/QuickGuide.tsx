'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertCircle,
    BookOpen,
    CheckCircle,
    Code,
    Copy,
    Globe,
    Settings,
    Shield,
    TestTube,
    Zap
} from 'lucide-react';
import { useState } from 'react';

export function QuickGuide() {
    const [copiedEndpoint, setCopiedEndpoint] = useState(false);

    const copyEndpoint = () => {
        navigator.clipboard.writeText('http://localhost:3000/mcp/{server-id}');
        setCopiedEndpoint(true);
        setTimeout(() => setCopiedEndpoint(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">ContextLayer Quick Guide</h2>
                <p className="text-muted-foreground">
                    Transform any REST API into an AI-accessible tool in minutes
                </p>
            </div>

            <Tabs defaultValue="quickstart" className="w-full">
                {/* <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="quickstart" className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Quick Start
                    </TabsTrigger>
                    <TabsTrigger value="examples" className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Examples
                    </TabsTrigger>
                    <TabsTrigger value="auth" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Authentication
                    </TabsTrigger>
                    <TabsTrigger value="troubleshooting" className="flex items-center gap-2">
                        <TestTube className="h-4 w-4" />
                        Troubleshooting
                    </TabsTrigger>
                </TabsList> */}

                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                    <TabsTrigger value="quickstart" className="flex items-center  sm:gap-2 text-xs sm:text-sm sm:px-3 h-auto">
                        <Zap className="h-2 w-2 sm:h-4 sm:w-4 shrink-0" />
                        <span className="hidden sm:inline">Quick Start</span>
                        <span className="sm:hidden">Start</span>
                    </TabsTrigger>
                    <TabsTrigger value="examples" className="flex items-center  sm:gap-2 text-xs sm:text-sm sm:px-2 h-auto">
                        <Code className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="hidden sm:inline">Examples</span>
                        <span className="sm:hidden">Examples</span>
                    </TabsTrigger>
                    <TabsTrigger value="auth" className="flex items-center  sm:gap-2 text-xs sm:text-sm sm:px-3 h-auto">
                        <Shield className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="hidden sm:inline">Authentication</span>
                        <span className="sm:hidden">Auth</span>
                    </TabsTrigger>
                    <TabsTrigger value="troubleshooting" className="flex items-center  sm:gap-2 text-xs sm:text-sm sm:px-3 h-auto">
                        <TestTube className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="hidden sm:inline">Troubleshooting</span>
                        <span className="sm:hidden">Help</span>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="quickstart" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                                        <span className="text-zinc-700 font-bold text-sm">1</span>
                                    </div>
                                    Create MCP Server
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Start by creating a new MCP server with basic information
                                </p>
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                        <span>MCP Server Name: <code className="bg-zinc-100 px-1 rounded">GitHub API</code></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                        <span>Description: What your API does</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                                        <span className="text-zinc-700 font-bold text-sm">2</span>
                                    </div>
                                    Configure Source API
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Add your API details and authentication
                                </p>
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <Settings className="h-3 w-3 text-zinc-600" />
                                        <span>Base URL: <code className="bg-zinc-100 px-1 rounded">https://api.github.com</code></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-3 w-3 text-zinc-600" />
                                        <span>Authentication: Bearer Token</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                                        <span className="text-zinc-700 font-bold text-sm">3</span>
                                    </div>
                                    Add AI Tools
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Define API endpoints that will be exposed as AI tools
                                </p>
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-3 w-3 text-zinc-600" />
                                        <span>Path: <code className="bg-zinc-100 px-1 rounded">/repos/{'{'}owner{'}'}/{'{'}repo{'}'}</code></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Code className="h-3 w-3 text-zinc-600" />
                                        <span>Parameters: owner, repo</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Your MCP Endpoint
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Once your MCP server is created, AI assistants can connect using this endpoint:
                            </p>
                            <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-lg">
                                <code className="flex-1 text-zinc-800 font-mono text-sm">
                                    http://localhost:3000/mcp/{'{'}server-id{'}'}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={copyEndpoint}
                                    className="h-8 w-8 p-0"
                                >
                                    {copiedEndpoint ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="examples" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>GitHub API Example</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Badge variant="outline">GET</Badge>
                                    <code className="ml-2 text-sm">/repos/{'{'}owner{'}'}/{'{'}repo{'}'}</code>
                                </div>
                                <div className="text-sm space-y-1">
                                    <p><strong>Parameters:</strong></p>
                                    <ul className="list-disc list-inside ml-4 text-xs space-y-1">
                                        <li><code>owner</code> (string, required) - Repository owner</li>
                                        <li><code>repo</code> (string, required) - Repository name</li>
                                    </ul>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    AI can ask: &quot;Get information about microsoft/vscode repository&quot;
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>E-commerce API Example</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Badge variant="outline" className="bg-zinc-50">POST</Badge>
                                    <code className="ml-2 text-sm">/orders</code>
                                </div>
                                <div className="text-sm space-y-1">
                                    <p><strong>Parameters:</strong></p>
                                    <ul className="list-disc list-inside ml-4 text-xs space-y-1">
                                        <li><code>customer_id</code> (number, required) - Customer ID</li>
                                        <li><code>items</code> (array, required) - Order items</li>
                                        <li><code>total</code> (number, required) - Order total</li>
                                    </ul>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    AI can ask: &quot;Create an order for customer 123 with items A and B&quot;
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="auth" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Bearer Token</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">Most common for modern APIs</p>
                                <div className="space-y-2 text-xs font-mono bg-zinc-50 p-3 rounded">
                                    <div>Type: <span className="text-zinc-600">Bearer</span></div>
                                    <div>Token: <span className="text-zinc-800">ghp_xxxxxxxxxxxx</span></div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Used by: GitHub, GitLab, many REST APIs
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>API Key</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">Common for service APIs</p>
                                <div className="space-y-2 text-xs font-mono bg-zinc-50 p-3 rounded">
                                    <div>Type: <span className="text-zinc-600">API Key</span></div>
                                    <div>Header: <span className="text-zinc-700">X-API-Key</span></div>
                                    <div>Key: <span className="text-zinc-800">secret123</span></div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Used by: OpenWeather, many SaaS APIs
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Auth</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">Username and password</p>
                                <div className="space-y-2 text-xs font-mono bg-zinc-50 p-3 rounded">
                                    <div>Type: <span className="text-zinc-600">Basic</span></div>
                                    <div>Username: <span className="text-zinc-700">admin</span></div>
                                    <div>Password: <span className="text-zinc-800">password123</span></div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Used by: Legacy APIs, internal services
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>No Authentication</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">Public APIs</p>
                                <div className="space-y-2 text-xs font-mono bg-zinc-50 p-3 rounded">
                                    <div>Type: <span className="text-zinc-600">None</span></div>
                                    <div className="text-muted-foreground">No credentials needed</div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Used by: JSONPlaceholder, public data APIs
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="troubleshooting" className="space-y-6">
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-600">
                                    <AlertCircle className="h-5 w-5" />
                                    MCP Server Won&apos;t Start
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Check Base URL</p>
                                            <p className="text-xs text-muted-foreground">Ensure the API base URL is accessible and correct</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Verify Authentication</p>
                                            <p className="text-xs text-muted-foreground">Double-check tokens, API keys, and credentials</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">At Least One Endpoint</p>
                                            <p className="text-xs text-muted-foreground">Configure at least one tool to start the MCP server</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-amber-600">
                                    <AlertCircle className="h-5 w-5" />
                                    AI Can&apos;t Use Tools
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">MCP Server Status Active</p>
                                            <p className="text-xs text-muted-foreground">Green toggle means MCP server is running</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Parameter Configuration</p>
                                            <p className="text-xs text-muted-foreground">Ensure parameters are properly defined with types</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Required Parameters</p>
                                            <p className="text-xs text-muted-foreground">Mark required parameters correctly</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-zinc-700">
                                    <TestTube className="h-5 w-5" />
                                    Testing Your MCP Server
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <Code className="h-4 w-4 text-zinc-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Test Individual Tools</p>
                                            <p className="text-xs text-muted-foreground">Use the &quot;Test Tool&quot; button in the tool configuration</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Globe className="h-4 w-4 text-zinc-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Check MCP Tools</p>
                                            <p className="text-xs text-muted-foreground">
                                                <code className="bg-zinc-100 px-1 rounded text-xs">
                                                    {`curl -X POST http://localhost:3000/mcp/{id} -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'`}
                                                </code>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
