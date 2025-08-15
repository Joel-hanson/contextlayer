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
        id: 'stripe',
        name: 'Stripe API',
        description: 'Payment processing and subscriptions',
        icon: Zap,
        color: 'bg-emerald-500',
        tags: ['Payments', 'Bearer'],
        config: {
            name: 'Stripe API',
            description: 'Process payments and manage subscriptions with Stripe.',
            apiConfig: {
                name: 'Stripe API v1',
                baseUrl: 'https://api.stripe.com/v1',
                description: 'Stripe payment processing API',
                authentication: { type: 'bearer', token: '' },
                endpoints: [
                    {
                        id: 'stripe-create-payment',
                        name: 'Create Payment Intent',
                        method: 'POST',
                        path: '/payment_intents',
                        description: 'Create a PaymentIntent for processing payments',
                        parameters: [
                            { name: 'amount', type: 'number', required: true, description: 'Amount in smallest currency unit' },
                            { name: 'currency', type: 'string', required: true, description: 'Three-letter ISO currency code' }
                        ],
                    },
                    {
                        id: 'stripe-list-customers',
                        name: 'List Customers',
                        method: 'GET',
                        path: '/customers',
                        description: 'List all customers',
                        parameters: [
                            { name: 'limit', type: 'number', required: false, description: 'Number of customers to return' },
                            { name: 'email', type: 'string', required: false, description: 'Filter by customer email' }
                        ],
                    }
                ]
            },
            mcpResources: [
                {
                    uri: 'stripe://payment/methods',
                    name: 'Payment Methods',
                    description: 'Available payment methods by region',
                    mimeType: 'application/json'
                }
            ],
            mcpPrompts: [
                {
                    name: 'payment_flow',
                    description: 'Generate payment flow recommendations',
                    arguments: [
                        { name: 'amount', description: 'Payment amount', required: true },
                        { name: 'currency', description: 'Currency code', required: true }
                    ]
                }
            ]
        }
    },
    {
        id: 'sendgrid',
        name: 'SendGrid API',
        description: 'Email service integration',
        icon: Zap,
        color: 'bg-blue-600',
        tags: ['Email', 'Bearer'],
        config: {
            name: 'SendGrid API',
            description: 'Send transactional and marketing emails.',
            apiConfig: {
                name: 'SendGrid API v3',
                baseUrl: 'https://api.sendgrid.com/v3',
                description: 'SendGrid email service API',
                authentication: { type: 'bearer', token: '' },
                endpoints: [
                    {
                        id: 'sendgrid-send-email',
                        name: 'Send Email',
                        method: 'POST',
                        path: '/mail/send',
                        description: 'Send a transactional email',
                        parameters: [
                            { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
                            { name: 'subject', type: 'string', required: true, description: 'Email subject' },
                            { name: 'content', type: 'string', required: true, description: 'Email content' }
                        ],
                    },
                    {
                        id: 'sendgrid-get-stats',
                        name: 'Get Email Stats',
                        method: 'GET',
                        path: '/stats',
                        description: 'Get email statistics',
                        parameters: [
                            { name: 'start_date', type: 'string', required: true, description: 'Start date in YYYY-MM-DD format' },
                            { name: 'end_date', type: 'string', required: false, description: 'End date in YYYY-MM-DD format' }
                        ],
                    }
                ]
            },
            mcpResources: [
                {
                    uri: 'sendgrid://templates',
                    name: 'Email Templates',
                    description: 'Available email templates',
                    mimeType: 'application/json'
                }
            ],
            mcpPrompts: [
                {
                    name: 'email_composer',
                    description: 'Generate professional email content',
                    arguments: [
                        { name: 'purpose', description: 'Email purpose', required: true },
                        { name: 'tone', description: 'Email tone (formal/casual)', required: false }
                    ]
                }
            ]
        }
    },
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
        id: 'jsonbin',
        name: 'JSONBin.io API',
        description: 'JSON storage and API mocking',
        icon: Database,
        color: 'bg-yellow-500',
        tags: ['Storage', 'API Key'],
        config: {
            name: 'JSONBin.io API',
            description: 'Store and access JSON data with a simple REST API.',
            apiConfig: {
                name: 'JSONBin.io API',
                baseUrl: 'https://api.jsonbin.io/v3',
                description: 'JSON storage service with API features',
                authentication: { type: 'apikey', apiKey: '', headerName: 'X-Master-Key' },
                endpoints: [
                    {
                        id: 'jsonbin-create',
                        name: 'Create Bin',
                        method: 'POST',
                        path: '/b',
                        description: 'Create a new JSON bin',
                        parameters: [
                            { name: 'name', type: 'string', required: false, description: 'Name of the bin' },
                            { name: 'private', type: 'boolean', required: false, description: 'Make bin private' }
                        ],
                    },
                    {
                        id: 'jsonbin-read',
                        name: 'Read Bin',
                        method: 'GET',
                        path: '/b/{id}',
                        description: 'Read a JSON bin by ID',
                        parameters: [
                            { name: 'id', type: 'string', required: true, description: 'Bin ID' }
                        ],
                    },
                    {
                        id: 'jsonbin-update',
                        name: 'Update Bin',
                        method: 'PUT',
                        path: '/b/{id}',
                        description: 'Update a JSON bin',
                        parameters: [
                            { name: 'id', type: 'string', required: true, description: 'Bin ID' }
                        ],
                    }
                ]
            },
            mcpResources: [
                {
                    uri: 'jsonbin://bins/list',
                    name: 'Bins List',
                    description: 'List of all JSON bins',
                    mimeType: 'application/json'
                }
            ],
            mcpPrompts: [
                {
                    name: 'json_validator',
                    description: 'Validate JSON structure before storing',
                    arguments: [
                        { name: 'json', description: 'JSON data to validate', required: true }
                    ]
                }
            ]
        }
    },
    {
        id: 'reqres',
        name: 'ReqRes API',
        description: 'REST API for testing',
        icon: Database,
        color: 'bg-indigo-500',
        tags: ['Testing', 'No Auth'],
        config: {
            name: 'ReqRes API',
            description: 'Free REST API for testing with realistic response data.',
            apiConfig: {
                name: 'ReqRes API',
                baseUrl: 'https://reqres.in/api',
                description: 'Mock REST API with realistic responses',
                authentication: { type: 'none' },
                endpoints: [
                    {
                        id: 'reqres-list-users',
                        name: 'List Users',
                        method: 'GET',
                        path: '/users',
                        description: 'Get list of users with pagination',
                        parameters: [
                            { name: 'page', type: 'number', required: false, description: 'Page number' },
                            { name: 'per_page', type: 'number', required: false, description: 'Items per page' }
                        ],
                    },
                    {
                        id: 'reqres-single-user',
                        name: 'Get Single User',
                        method: 'GET',
                        path: '/users/{id}',
                        description: 'Get a single user by ID',
                        parameters: [
                            { name: 'id', type: 'number', required: true, description: 'User ID' }
                        ],
                    },
                    {
                        id: 'reqres-create-user',
                        name: 'Create User',
                        method: 'POST',
                        path: '/users',
                        description: 'Create a new user',
                        parameters: [
                            { name: 'name', type: 'string', required: true, description: 'User name' },
                            { name: 'job', type: 'string', required: true, description: 'User job' }
                        ],
                    },
                    {
                        id: 'reqres-login',
                        name: 'Login',
                        method: 'POST',
                        path: '/login',
                        description: 'Login with email and password',
                        parameters: [
                            { name: 'email', type: 'string', required: true, description: 'User email' },
                            { name: 'password', type: 'string', required: true, description: 'User password' }
                        ],
                    }
                ]
            },
            mcpResources: [
                {
                    uri: 'reqres://users/schema',
                    name: 'User Schema',
                    description: 'User data structure documentation',
                    mimeType: 'application/json'
                },
                {
                    uri: 'reqres://examples',
                    name: 'Example Responses',
                    description: 'Sample API responses for each endpoint',
                    mimeType: 'application/json'
                }
            ],
            mcpPrompts: [
                {
                    name: 'test_scenario',
                    description: 'Generate test scenarios for endpoints',
                    arguments: [
                        { name: 'endpoint', description: 'Target endpoint', required: true },
                        { name: 'scenario_type', description: 'Type of test (success/error)', required: true }
                    ]
                }
            ]
        }
    },
    {
        id: 'dog-api',
        name: 'Dog API',
        description: 'Dog images and facts',
        icon: Globe,
        color: 'bg-orange-400',
        tags: ['Fun', 'No Auth'],
        config: {
            name: 'Dog API',
            description: 'Get random dog images and breed information.',
            apiConfig: {
                name: 'Dog API',
                baseUrl: 'https://dog.ceo/api',
                description: 'Free API for dog images and breeds',
                authentication: { type: 'none' },
                endpoints: [
                    {
                        id: 'random-dog',
                        name: 'Random Dog',
                        method: 'GET',
                        path: '/breeds/image/random',
                        description: 'Get a random dog image',
                        parameters: [],
                    },
                    {
                        id: 'breed-list',
                        name: 'List Breeds',
                        method: 'GET',
                        path: '/breeds/list/all',
                        description: 'Get list of all dog breeds',
                        parameters: [],
                    },
                    {
                        id: 'breed-images',
                        name: 'Breed Images',
                        method: 'GET',
                        path: '/breed/{breed}/images',
                        description: 'Get images for a specific breed',
                        parameters: [
                            { name: 'breed', type: 'string', required: true, description: 'Dog breed name' }
                        ],
                    }
                ]
            },
            mcpResources: [
                {
                    uri: 'dog://breeds/info',
                    name: 'Breed Information',
                    description: 'Detailed information about dog breeds',
                    mimeType: 'application/json'
                }
            ],
            mcpPrompts: [
                {
                    name: 'breed_finder',
                    description: 'Find dog breeds based on characteristics',
                    arguments: [
                        { name: 'characteristics', description: 'Desired breed characteristics', required: true }
                    ]
                }
            ]
        }
    },
    {
        id: 'jokes-api',
        name: 'JokeAPI',
        description: 'Programming and general jokes',
        icon: Globe,
        color: 'bg-pink-500',
        tags: ['Fun', 'No Auth'],
        config: {
            name: 'JokeAPI',
            description: 'Get random jokes of various categories.',
            apiConfig: {
                name: 'JokeAPI v2',
                baseUrl: 'https://v2.jokeapi.dev',
                description: 'Free API for jokes and humor',
                authentication: { type: 'none' },
                endpoints: [
                    {
                        id: 'random-joke',
                        name: 'Random Joke',
                        method: 'GET',
                        path: '/joke/Any',
                        description: 'Get a random joke',
                        parameters: [
                            { name: 'type', type: 'string', required: false, description: 'Type of joke (single/twopart)' },
                            { name: 'contains', type: 'string', required: false, description: 'Search term in joke' }
                        ],
                    },
                    {
                        id: 'category-joke',
                        name: 'Category Joke',
                        method: 'GET',
                        path: '/joke/{category}',
                        description: 'Get a joke from specific category',
                        parameters: [
                            { name: 'category', type: 'string', required: true, description: 'Joke category (Programming/Misc/Dark/Pun/Spooky/Christmas)' }
                        ],
                    }
                ]
            },
            mcpResources: [
                {
                    uri: 'jokes://categories',
                    name: 'Joke Categories',
                    description: 'Available joke categories',
                    mimeType: 'application/json'
                }
            ],
            mcpPrompts: [
                {
                    name: 'joke_finder',
                    description: 'Find jokes based on mood and preferences',
                    arguments: [
                        { name: 'mood', description: 'Desired mood of joke', required: true },
                        { name: 'category', description: 'Preferred category', required: false }
                    ]
                }
            ]
        }
    },
    {
        id: 'pokemon',
        name: 'PokéAPI',
        description: 'Pokémon data and information',
        icon: Globe,
        color: 'bg-red-500',
        tags: ['Fun', 'No Auth'],
        config: {
            name: 'PokéAPI',
            description: 'Complete Pokémon information database.',
            apiConfig: {
                name: 'PokéAPI v2',
                baseUrl: 'https://pokeapi.co/api/v2',
                description: 'Free API for Pokémon data',
                authentication: { type: 'none' },
                endpoints: [
                    {
                        id: 'get-pokemon',
                        name: 'Get Pokémon',
                        method: 'GET',
                        path: '/pokemon/{id}',
                        description: 'Get information about a specific Pokémon',
                        parameters: [
                            { name: 'id', type: 'string', required: true, description: 'Pokémon ID or name' }
                        ],
                    },
                    {
                        id: 'list-types',
                        name: 'List Types',
                        method: 'GET',
                        path: '/type',
                        description: 'Get all Pokémon types',
                        parameters: [],
                    },
                    {
                        id: 'get-ability',
                        name: 'Get Ability',
                        method: 'GET',
                        path: '/ability/{id}',
                        description: 'Get information about a specific ability',
                        parameters: [
                            { name: 'id', type: 'string', required: true, description: 'Ability ID or name' }
                        ],
                    }
                ]
            },
            mcpResources: [
                {
                    uri: 'pokemon://types/chart',
                    name: 'Type Chart',
                    description: 'Pokémon type effectiveness chart',
                    mimeType: 'application/json'
                },
                {
                    uri: 'pokemon://generations',
                    name: 'Generations',
                    description: 'List of Pokémon generations',
                    mimeType: 'application/json'
                }
            ],
            mcpPrompts: [
                {
                    name: 'team_builder',
                    description: 'Build a balanced Pokémon team',
                    arguments: [
                        { name: 'generation', description: 'Pokémon generation', required: true },
                        { name: 'style', description: 'Battle style preference', required: false }
                    ]
                }
            ]
        }
    },
    {
        id: 'nasa',
        name: 'NASA API',
        description: 'Space and astronomy data',
        icon: Globe,
        color: 'bg-blue-800',
        tags: ['Educational', 'API Key'],
        config: {
            name: 'NASA API',
            description: 'Access NASA space data and imagery.',
            apiConfig: {
                name: 'NASA Open API',
                baseUrl: 'https://api.nasa.gov',
                description: 'NASA space and astronomy data',
                authentication: { type: 'apikey', apiKey: 'DEMO_KEY', headerName: 'api_key' },
                endpoints: [
                    {
                        id: 'apod',
                        name: 'Astronomy Picture of the Day',
                        method: 'GET',
                        path: '/planetary/apod',
                        description: 'Get astronomy picture of the day',
                        parameters: [
                            { name: 'date', type: 'string', required: false, description: 'Date (YYYY-MM-DD)' },
                            { name: 'hd', type: 'boolean', required: false, description: 'HD image URL' }
                        ],
                    },
                    {
                        id: 'mars-photos',
                        name: 'Mars Rover Photos',
                        method: 'GET',
                        path: '/mars-photos/api/v1/rovers/curiosity/photos',
                        description: 'Get Mars rover photos',
                        parameters: [
                            { name: 'sol', type: 'number', required: true, description: 'Martian sol (day)' },
                            { name: 'camera', type: 'string', required: false, description: 'Rover camera name' }
                        ],
                    }
                ]
            },
            mcpResources: [
                {
                    uri: 'nasa://rovers/info',
                    name: 'Mars Rovers',
                    description: 'Information about Mars rovers',
                    mimeType: 'application/json'
                },
                {
                    uri: 'nasa://cameras',
                    name: 'Rover Cameras',
                    description: 'Available Mars rover cameras',
                    mimeType: 'application/json'
                }
            ],
            mcpPrompts: [
                {
                    name: 'space_facts',
                    description: 'Generate space facts from NASA data',
                    arguments: [
                        { name: 'topic', description: 'Space topic of interest', required: true },
                        { name: 'level', description: 'Complexity level', required: false }
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
