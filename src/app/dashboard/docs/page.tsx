import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Code, ExternalLink } from 'lucide-react';

export default function DocsPage() {
    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
                <p className="text-muted-foreground">
                    Learn how to use MCP Bridge to connect REST APIs to the Model Context Protocol
                </p>
            </div>

            {/* Documentation Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Getting Started
                        </CardTitle>
                        <CardDescription>
                            Learn how to create your first MCP bridge
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold">1</div>
                                <div>
                                    <p className="font-medium">Create a Bridge</p>
                                    <p className="text-sm text-muted-foreground">Click &quot;Create Bridge&quot; to start configuring your API</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold">2</div>
                                <div>
                                    <p className="font-medium">Configure API</p>
                                    <p className="text-sm text-muted-foreground">Set your base URL, authentication, and endpoints</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold">3</div>
                                <div>
                                    <p className="font-medium">Start Bridge</p>
                                    <p className="text-sm text-muted-foreground">Launch your MCP server and connect with Claude or VS Code</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Code className="h-5 w-5" />
                            MCP Integration
                        </CardTitle>
                        <CardDescription>
                            How to connect your bridges to MCP clients
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm font-mono">
                                # Add to your MCP client config<br />
                                {`{`}<br />
                                {`  "mcpServers": {`}<br />
                                {`    "my-api": {`}<br />
                                {`      "command": "node",`}<br />
                                {`      "args": ["path/to/bridge"],`}<br />
                                {`      "env": {}`}<br />
                                {`    }`}<br />
                                {`  }`}<br />
                                {`}`}
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Your API endpoints will automatically become available as MCP tools that can be called by AI assistants.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Authentication Types</CardTitle>
                        <CardDescription>
                            Supported authentication methods for REST APIs
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div>
                                <h4 className="font-medium">Bearer Token</h4>
                                <p className="text-sm text-muted-foreground">Authorization: Bearer &lt;token&gt;</p>
                            </div>
                            <div>
                                <h4 className="font-medium">API Key</h4>
                                <p className="text-sm text-muted-foreground">Custom header or query parameter</p>
                            </div>
                            <div>
                                <h4 className="font-medium">Basic Auth</h4>
                                <p className="text-sm text-muted-foreground">Username and password credentials</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Best Practices</CardTitle>
                        <CardDescription>
                            Tips for creating effective API bridges
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div>
                                <h4 className="font-medium">Use Descriptive Names</h4>
                                <p className="text-sm text-muted-foreground">Choose clear names for your bridges and endpoints</p>
                            </div>
                            <div>
                                <h4 className="font-medium">Group Related Endpoints</h4>
                                <p className="text-sm text-muted-foreground">Organize endpoints by functionality or resource type</p>
                            </div>
                            <div>
                                <h4 className="font-medium">Test Your Configuration</h4>
                                <p className="text-sm text-muted-foreground">Verify endpoints work before connecting to MCP clients</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* External Resources */}
            <Card>
                <CardHeader>
                    <CardTitle>External Resources</CardTitle>
                    <CardDescription>
                        Additional documentation and resources
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <Button variant="outline" className="flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            MCP Protocol Docs
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            GitHub Repository
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            API Examples
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
