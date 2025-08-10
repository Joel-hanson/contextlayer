'use client';

import { BridgeForm } from '@/components/bridge-form';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBridges } from '@/hooks/useBridges';
import { BridgeConfig } from '@/lib/types';
import { getBaseUrl } from '@/lib/url';
import {
    AlertCircle,
    BookOpen,
    ChevronDown,
    Copy,
    Database,
    Edit,
    Globe,
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
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingBridgeId, setDeletingBridgeId] = useState<string | null>(null);

    // Template definitions - easily expandable
    const templates = [
        {
            id: 'weather',
            name: 'Weather API',
            description: 'OpenWeatherMap real-time weather data',
            icon: Globe,
            color: 'bg-blue-500',
            tags: ['Weather', 'API Key'],
            config: {
                name: 'Weather API',
                description: 'Connect to OpenWeatherMap for real-time weather data and forecasts.',
                apiConfig: {
                    name: 'OpenWeatherMap API',
                    baseUrl: 'https://api.openweathermap.org/data/2.5',
                    description: 'Real-time weather data and forecasts',
                    authentication: { type: 'apikey', apiKey: '', headerName: 'appid' },
                    endpoints: [
                        {
                            name: 'Get Current Weather',
                            method: 'GET',
                            path: '/weather',
                            description: 'Get current weather for a city',
                            parameters: [
                                { name: 'q', type: 'string', required: true, description: 'City name' },
                                { name: 'units', type: 'string', required: false, description: 'Units (standard, metric, imperial)' }
                            ],
                        },
                        {
                            name: 'Get Weather Forecast',
                            method: 'GET',
                            path: '/forecast',
                            description: 'Get 5 day weather forecast',
                            parameters: [
                                { name: 'q', type: 'string', required: true, description: 'City name' },
                                { name: 'units', type: 'string', required: false, description: 'Units (standard, metric, imperial)' }
                            ],
                        }
                    ]
                },
                mcpResources: [
                    {
                        uri: 'weather://cities',
                        name: 'Weather Cities',
                        description: 'List of popular cities for weather queries',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'weather://units',
                        name: 'Weather Units',
                        description: 'Available unit systems for weather data',
                        mimeType: 'text/plain'
                    }
                ],
                mcpPrompts: [
                    {
                        name: 'weather_summary',
                        description: 'Generate a comprehensive weather summary for a city',
                        arguments: [
                            { name: 'city', description: 'City name for weather summary', required: true }
                        ]
                    },
                    {
                        name: 'weather_comparison',
                        description: 'Compare weather between multiple cities',
                        arguments: [
                            { name: 'cities', description: 'Comma-separated list of cities', required: true }
                        ]
                    }
                ]
            }
        },
        {
            id: 'github',
            name: 'GitHub API',
            description: 'Repository management and issues',
            icon: Zap,
            color: 'bg-gray-800',
            tags: ['Repos', 'Bearer'],
            config: {
                name: 'GitHub API',
                description: 'Access repositories, issues, and pull requests from GitHub.',
                apiConfig: {
                    name: 'GitHub REST API',
                    baseUrl: 'https://api.github.com',
                    description: 'GitHub REST API for repository management',
                    authentication: { type: 'bearer', token: '' },
                    endpoints: [
                        {
                            name: 'List User Repositories',
                            method: 'GET',
                            path: '/user/repos',
                            description: 'List repositories for the authenticated user',
                            parameters: [
                                { name: 'sort', type: 'string', required: false, description: 'Sort by created, updated, pushed, full_name' },
                                { name: 'per_page', type: 'number', required: false, description: 'Results per page (max 100)' }
                            ],
                        },
                        {
                            name: 'Get Repository Issues',
                            method: 'GET',
                            path: '/repos/{owner}/{repo}/issues',
                            description: 'Get issues for a repository',
                            parameters: [
                                { name: 'owner', type: 'string', required: true, description: 'Repository owner' },
                                { name: 'repo', type: 'string', required: true, description: 'Repository name' }
                            ],
                        }
                    ]
                },
                mcpResources: [
                    {
                        uri: 'github://profile',
                        name: 'User Profile',
                        description: 'GitHub user profile information',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'github://organizations',
                        name: 'User Organizations',
                        description: 'Organizations the user belongs to',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'github://limits',
                        name: 'Rate Limits',
                        description: 'Current API rate limit status',
                        mimeType: 'application/json'
                    }
                ],
                mcpPrompts: [
                    {
                        name: 'repo_analysis',
                        description: 'Analyze a GitHub repository structure and activity',
                        arguments: [
                            { name: 'owner', description: 'Repository owner', required: true },
                            { name: 'repo', description: 'Repository name', required: true }
                        ]
                    },
                    {
                        name: 'issue_summary',
                        description: 'Summarize issues and pull requests for a repository',
                        arguments: [
                            { name: 'owner', description: 'Repository owner', required: true },
                            { name: 'repo', description: 'Repository name', required: true },
                            { name: 'state', description: 'Issue state (open/closed/all)', required: false }
                        ]
                    }
                ]
            }
        },
        {
            id: 'demo',
            name: 'Demo API',
            description: 'JSONPlaceholder for testing',
            icon: Database,
            color: 'bg-orange-500',
            tags: ['Testing', 'No Auth'],
            config: {
                name: 'Demo API (JSONPlaceholder)',
                description: 'Free fake API for testing and prototyping. No authentication required.',
                apiConfig: {
                    name: 'JSONPlaceholder API',
                    baseUrl: 'https://jsonplaceholder.typicode.com',
                    description: 'Free fake REST API for testing and prototyping',
                    authentication: { type: 'none' },
                    endpoints: [
                        {
                            name: 'Get All Posts',
                            method: 'GET',
                            path: '/posts',
                            description: 'Retrieve all posts',
                            parameters: [],
                        },
                        {
                            name: 'Get Post by ID',
                            method: 'GET',
                            path: '/posts/{id}',
                            description: 'Retrieve a specific post by ID',
                            parameters: [
                                { name: 'id', type: 'number', required: true, description: 'Post ID' }
                            ],
                        },
                        {
                            name: 'Get All Users',
                            method: 'GET',
                            path: '/users',
                            description: 'Retrieve all users',
                            parameters: [],
                        }
                    ]
                },
                mcpResources: [
                    {
                        uri: 'demo://posts/stats',
                        name: 'Posts Statistics',
                        description: 'Statistics about posts in the demo API',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'demo://users/guide',
                        name: 'Users Guide',
                        description: 'Guide on working with demo users',
                        mimeType: 'text/markdown'
                    },
                    {
                        uri: 'demo://api/schema',
                        name: 'API Schema',
                        description: 'JSONPlaceholder API schema documentation',
                        mimeType: 'application/json'
                    }
                ],
                mcpPrompts: [
                    {
                        name: 'post_analysis',
                        description: 'Analyze posts and provide insights',
                        arguments: [
                            { name: 'limit', description: 'Number of posts to analyze', required: false }
                        ]
                    },
                    {
                        name: 'user_profile',
                        description: 'Generate a detailed user profile summary',
                        arguments: [
                            { name: 'user_id', description: 'User ID to analyze', required: true }
                        ]
                    }
                ]
            }
        },
        {
            id: 'slack',
            name: 'Slack API',
            description: 'Team communication and messaging',
            icon: Zap,
            color: 'bg-purple-600',
            tags: ['Chat', 'OAuth'],
            config: {
                name: 'Slack API',
                description: 'Send messages and manage Slack workspaces.',
                apiConfig: {
                    name: 'Slack Web API',
                    baseUrl: 'https://slack.com/api',
                    description: 'Slack Web API for team communication',
                    authentication: { type: 'bearer', token: '' },
                    endpoints: [
                        {
                            name: 'Send Message',
                            method: 'POST',
                            path: '/chat.postMessage',
                            description: 'Send a message to a channel',
                            parameters: [
                                { name: 'channel', type: 'string', required: true, description: 'Channel ID or name' },
                                { name: 'text', type: 'string', required: true, description: 'Message text' }
                            ],
                        },
                        {
                            name: 'List Channels',
                            method: 'GET',
                            path: '/conversations.list',
                            description: 'Get list of channels',
                            parameters: [
                                { name: 'types', type: 'string', required: false, description: 'Channel types (public_channel,private_channel)' }
                            ],
                        }
                    ]
                },
                mcpResources: [
                    {
                        uri: 'slack://workspace/info',
                        name: 'Workspace Info',
                        description: 'Current Slack workspace information',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'slack://channels/guidelines',
                        name: 'Channel Guidelines',
                        description: 'Best practices for channel management',
                        mimeType: 'text/markdown'
                    },
                    {
                        uri: 'slack://messaging/templates',
                        name: 'Message Templates',
                        description: 'Common message templates for team communication',
                        mimeType: 'application/json'
                    }
                ],
                mcpPrompts: [
                    {
                        name: 'channel_summary',
                        description: 'Summarize channel activity and key discussions',
                        arguments: [
                            { name: 'channel', description: 'Channel ID or name', required: true },
                            { name: 'days', description: 'Number of days to analyze', required: false }
                        ]
                    },
                    {
                        name: 'message_composer',
                        description: 'Compose professional messages for team communication',
                        arguments: [
                            { name: 'purpose', description: 'Purpose of the message', required: true },
                            { name: 'tone', description: 'Tone (formal/casual/urgent)', required: false }
                        ]
                    }
                ]
            }
        },
        {
            id: 'openai',
            name: 'OpenAI API',
            description: 'AI models and completions',
            icon: Zap,
            color: 'bg-green-600',
            tags: ['AI', 'Bearer'],
            config: {
                name: 'OpenAI API',
                description: 'Access OpenAI models for AI-powered features.',
                apiConfig: {
                    name: 'OpenAI API',
                    baseUrl: 'https://api.openai.com/v1',
                    description: 'OpenAI API for AI models',
                    authentication: { type: 'bearer', token: '' },
                    endpoints: [
                        {
                            name: 'Create Completion',
                            method: 'POST',
                            path: '/chat/completions',
                            description: 'Generate AI completions',
                            parameters: [
                                { name: 'model', type: 'string', required: true, description: 'Model ID (e.g., gpt-4)' },
                                { name: 'messages', type: 'array', required: true, description: 'Array of message objects' }
                            ],
                        },
                        {
                            name: 'List Models',
                            method: 'GET',
                            path: '/models',
                            description: 'List available models',
                            parameters: [],
                        }
                    ]
                },
                mcpResources: [
                    {
                        uri: 'openai://models/capabilities',
                        name: 'Model Capabilities',
                        description: 'Detailed capabilities of different OpenAI models',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'openai://usage/guidelines',
                        name: 'Usage Guidelines',
                        description: 'Best practices for using OpenAI API',
                        mimeType: 'text/markdown'
                    },
                    {
                        uri: 'openai://pricing/calculator',
                        name: 'Pricing Calculator',
                        description: 'Token usage and pricing information',
                        mimeType: 'application/json'
                    }
                ],
                mcpPrompts: [
                    {
                        name: 'model_selector',
                        description: 'Help choose the right OpenAI model for a specific task',
                        arguments: [
                            { name: 'task', description: 'Description of the task', required: true },
                            { name: 'budget', description: 'Budget considerations (low/medium/high)', required: false }
                        ]
                    },
                    {
                        name: 'prompt_optimizer',
                        description: 'Optimize prompts for better AI responses',
                        arguments: [
                            { name: 'prompt', description: 'Original prompt to optimize', required: true },
                            { name: 'goal', description: 'Desired outcome', required: true }
                        ]
                    },
                    {
                        name: 'response_analyzer',
                        description: 'Analyze and improve AI-generated responses',
                        arguments: [
                            { name: 'response', description: 'AI response to analyze', required: true },
                            { name: 'criteria', description: 'Evaluation criteria', required: false }
                        ]
                    }
                ]
            }
        },
    ];

    const applyTemplate = (template: typeof templates[0]) => {
        if (typeof window !== 'undefined') {
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
        setDeletingBridgeId(bridgeId);
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingBridgeId) return;

        try {
            await deleteBridge(deletingBridgeId);
        } catch (error) {
            console.error('Failed to delete bridge:', error);
        } finally {
            setShowDeleteDialog(false);
            setDeletingBridgeId(null);
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
                    <div className="flex items-center justify-between space-y-2">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">MCP Servers</h2>
                            <p className="text-muted-foreground">
                                Manage your MCP servers and their tool configurations
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
                            {/* Template Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Use Template
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
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
                                            </DropdownMenuItem>
                                        );
                                    })}
                                    <DropdownMenuItem className="border-t">
                                        <div className="text-xs text-muted-foreground">More templates coming soon...</div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button onClick={createNewBridge}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Custom
                            </Button>
                        </div>
                    </div>

                    {/* MCP Usage Info */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <Database className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="space-y-2">
                                    <h3 className="font-semibold">Using MCP Tools</h3>
                                    <p className="text-muted-foreground text-sm">
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
                                                <div className="py-2 px-3 bg-muted/50 rounded-lg space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Database className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm font-medium">{bridge.apiConfig.name}</span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            {bridge.apiConfig.endpoints?.length || 0} endpoint{(bridge.apiConfig.endpoints?.length || 0) !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>

                                                    {/* MCP Content Stats - Equal Grid Layout */}
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <Badge variant="outline" className="text-xs py-0.5 px-2 flex items-center justify-center">
                                                            <Zap className="h-3 w-3 mr-1 flex-shrink-0" />
                                                            <span className="truncate">{bridge.mcpTools?.length || 0} tool{(bridge.mcpTools?.length || 0) !== 1 ? 's' : ''}</span>
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs py-0.5 px-2 flex items-center justify-center">
                                                            <BookOpen className="h-3 w-3 mr-1 flex-shrink-0" />
                                                            <span className="truncate">{bridge.mcpResources?.length || 0} resource{(bridge.mcpResources?.length || 0) !== 1 ? 's' : ''}</span>
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs py-0.5 px-2 flex items-center justify-center">
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
                                                        title="Delete MCP Server"
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
