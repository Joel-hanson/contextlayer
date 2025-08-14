import type { LucideIcon } from 'lucide-react';
import { Database, Globe, Zap } from 'lucide-react';
import type {
    ApiConfig as BaseApiConfig,
    McpPrompt,
    McpResource
} from '../types';

interface TemplateApiConfig extends Omit<BaseApiConfig, 'id'> {
    id?: string;
}

interface TemplateConfig {
    name: string;
    description?: string;
    apiConfig: TemplateApiConfig;
    mcpResources?: McpResource[];
    mcpPrompts?: McpPrompt[];
}

export interface ApiTemplate {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    color: string;
    tags: string[];
    config: TemplateConfig;
}

export const apiTemplates: ApiTemplate[] = [
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
                        id: 'weather-current',
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
                        id: 'weather-forecast',
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
                        id: 'github-list-repos',
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
                        id: 'github-get-issues',
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
                        id: 'demo-get-posts',
                        name: 'Get All Posts',
                        method: 'GET',
                        path: '/posts',
                        description: 'Retrieve all posts',
                        parameters: [],
                    },
                    {
                        id: 'demo-get-post',
                        name: 'Get Post by ID',
                        method: 'GET',
                        path: '/posts/{id}',
                        description: 'Retrieve a specific post by ID',
                        parameters: [
                            { name: 'id', type: 'number', required: true, description: 'Post ID' }
                        ],
                    },
                    {
                        id: 'demo-get-users',
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
                        id: 'slack-send-message',
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
                        id: 'slack-list-channels',
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
                        id: 'openai-completion',
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
                        id: 'openai-models',
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
    }
];
