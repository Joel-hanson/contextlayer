import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getBaseUrl } from '@/lib/url';
import { BookOpen, Code, ExternalLink, Terminal } from 'lucide-react';

export default function DocsPage() {
    // Dynamic URL generation for examples
    const baseUrl = getBaseUrl();

    return (
        <div className="flex-1 space-y-4 font-mono">
            {/* Header */}
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Documentation</h2>
                    <p className="text-muted-foreground">
                        Learn how to set up and use MCP servers with various clients
                    </p>
                </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="getting-started" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
                    <TabsTrigger value="clients">Client Setup</TabsTrigger>
                    <TabsTrigger value="testing">Testing</TabsTrigger>
                </TabsList>

                {/* Getting Started Tab */}
                <TabsContent value="getting-started" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Quick Start
                            </CardTitle>
                            <CardDescription>Create your first MCP server in 3 steps</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold">1</div>
                                    <div>
                                        <p className="font-medium">Create a Bridge</p>
                                        <p className="text-sm text-muted-foreground">Go to Bridges page and click &ldquo;Create Bridge&rdquo;</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold">2</div>
                                    <div>
                                        <p className="font-medium">Configure Your API</p>
                                        <p className="text-sm text-muted-foreground">Add base URL, authentication, and API endpoints</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold">3</div>
                                    <div>
                                        <p className="font-medium">Connect to MCP Client</p>
                                        <p className="text-sm text-muted-foreground">Copy the endpoint URL to your MCP client configuration</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>MCP Endpoint</CardTitle>
                            <CardDescription>Your bridge endpoint URL format</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                                {getBaseUrl()}/mcp/{`{bridge-id}`}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                Replace {`{bridge-id}`} with your actual bridge ID from the dashboard.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Client Setup Tab */}
                <TabsContent value="clients" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Code className="h-5 w-5" />
                                Client Configuration
                            </CardTitle>
                            <CardDescription>Setup instructions for popular MCP clients</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Claude Desktop */}
                            <div className="space-y-3">
                                <h4 className="font-semibold">Claude Desktop</h4>
                                <div className="space-y-2">
                                    <p className="text-sm">Edit your Claude Desktop config file:</p>
                                    <div className="bg-muted p-2 rounded text-xs font-mono">
                                        macOS: ~/Library/Application Support/Claude/claude_desktop_config.json<br />
                                        Windows: %APPDATA%\Claude\claude_desktop_config.json
                                    </div>
                                    <p className="text-sm">Add this configuration:</p>
                                    <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                                        <pre className="whitespace-pre">{`{
  "mcpServers": {
    "my-api-bridge": {
      "command": "node",
      "args": [
        "-e",
        "const fetch = require('node-fetch'); const url = '${baseUrl}/mcp/YOUR_BRIDGE_ID'; process.stdin.on('data', async (data) => { try { const request = JSON.parse(data.toString()); const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) }); const result = await response.json(); process.stdout.write(JSON.stringify(result) + '\\n'); } catch (error) { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: error.message }, id: request?.id || null }) + '\\n'); } });"
      ]
    }
  }
}`}</pre>
                                    </div>
                                </div>
                            </div>

                            {/* VS Code */}
                            <div className="space-y-3">
                                <h4 className="font-semibold">VS Code with GitHub Copilot</h4>
                                <div className="space-y-2">
                                    <p className="text-sm">Create MCP configuration file:</p>
                                    <div className="bg-muted p-2 rounded text-xs font-mono">
                                        ~/.config/mcp/mcp.json
                                    </div>
                                    <p className="text-sm">Add this configuration:</p>
                                    <div className="bg-muted p-3 rounded text-xs font-mono">
                                        <pre className="whitespace-pre">{`{
  "servers": {
    "my-api-bridge": {
      "transport": {
        "type": "http",
        "url": "${baseUrl}/mcp/YOUR_BRIDGE_ID"
      }
    }
  }
}`}</pre>
                                    </div>
                                </div>
                            </div>

                            {/* Generic HTTP */}
                            <div className="space-y-3">
                                <h4 className="font-semibold">Generic HTTP Client</h4>
                                <div className="space-y-2">
                                    <p className="text-sm">Direct HTTP configuration:</p>
                                    <div className="bg-muted p-3 rounded text-xs font-mono">
                                        Protocol: JSON-RPC 2.0 over HTTP<br />
                                        Method: POST<br />
                                        Content-Type: application/json<br />
                                        URL: {baseUrl}/mcp/YOUR_BRIDGE_ID
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Testing Tab */}
                <TabsContent value="testing" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Terminal className="h-5 w-5" />
                                Testing Commands
                            </CardTitle>
                            <CardDescription>Test your MCP server with these curl commands</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">1. Initialize</h4>
                                    <div className="bg-muted p-3 rounded text-xs font-mono">
                                        <pre className="whitespace-pre">{`curl -X POST ${baseUrl}/mcp/YOUR_BRIDGE_ID \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "id": 1
  }'`}</pre>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-2">2. List Tools</h4>
                                    <div className="bg-muted p-3 rounded text-xs font-mono">
                                        <pre className="whitespace-pre">{`curl -X POST ${baseUrl}/mcp/YOUR_BRIDGE_ID \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 2
  }'`}</pre>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-2">3. Call Tool</h4>
                                    <div className="bg-muted p-3 rounded text-xs font-mono">
                                        <pre className="whitespace-pre">{`curl -X POST ${baseUrl}/mcp/YOUR_BRIDGE_ID \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "TOOL_NAME",
      "arguments": {}
    },
    "id": 3
  }'`}</pre>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-muted p-3 rounded-lg">
                                <p className="text-sm">
                                    <strong>Note:</strong> Replace YOUR_BRIDGE_ID with your actual bridge ID and TOOL_NAME with a tool from the tools/list response.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Authentication Types</CardTitle>
                            <CardDescription>Supported authentication methods</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div>
                                    <h4 className="font-medium">Bearer Token</h4>
                                    <p className="text-sm text-muted-foreground">Authorization: Bearer &lt;token&gt;</p>
                                </div>
                                <div>
                                    <h4 className="font-medium">API Key</h4>
                                    <p className="text-sm text-muted-foreground">Custom header with API key</p>
                                </div>
                                <div>
                                    <h4 className="font-medium">Basic Auth</h4>
                                    <p className="text-sm text-muted-foreground">Username and password</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* External Resources */}
            <Card>
                <CardHeader>
                    <CardTitle>Additional Resources</CardTitle>
                    <CardDescription>Learn more about MCP and API integration</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            MCP Protocol Docs
                        </Button>
                        <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            GitHub Repository
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}