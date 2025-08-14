import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
    // Clean existing data
    await prisma.apiRequest.deleteMany()
    await prisma.bridgeLog.deleteMany()
    await prisma.apiEndpoint.deleteMany()
    await prisma.bridge.deleteMany()
    await prisma.userSettings.deleteMany()
    await prisma.account.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()

    // Create a demo user for public testing (with rate limits)
    const demoPassword = await bcrypt.hash('demo123', 12)
    const demoUser = await prisma.user.create({
        data: {
            id: randomUUID(),
            email: 'demo@contextlayer.app',
            name: 'Demo User',
            username: 'demo',
            password: demoPassword,
            role: 'USER',
            settings: {
                create: {
                    displayName: 'Demo User',
                    // Demo user restrictions
                    autoSaveBridges: true,
                    showAdvancedOptions: false,
                    defaultTimeout: 10000, // Shorter timeout for demo
                    defaultRetryAttempts: 1, // Fewer retries
                    enableRateLimiting: true,
                    requestsPerMinute: 30, // Rate limited
                }
            }
        },
    })

    // Create a test user for development/seeding
    const testPassword = await bcrypt.hash('password123', 12)
    const testUser = await prisma.user.create({
        data: {
            id: randomUUID(),
            email: 'test@example.com',
            name: 'Test User',
            username: 'testuser',
            password: testPassword,
            role: 'USER',
            settings: {
                create: {
                    displayName: 'Test User',
                }
            }
        },
    })

    // Generate UUIDs for bridges
    const bridge1Id = randomUUID()
    const bridge2Id = randomUUID()
    const demoBridge1Id = randomUUID()
    const demoBridge2Id = randomUUID()

    // Create sample bridges for demo user (limited functionality)
    const demoBridge1 = await prisma.bridge.create({
        data: {
            id: demoBridge1Id,
            slug: demoBridge1Id,
            name: 'Demo: JSONPlaceholder API',
            description: 'A demo bridge showing basic GET operations (rate limited)',
            baseUrl: 'https://jsonplaceholder.typicode.com',
            authConfig: { type: 'none' },
            enabled: true,
            userId: demoUser.id,
            endpoints: {
                create: [
                    {
                        id: randomUUID(),
                        name: 'Get Posts (Demo)',
                        method: 'GET',
                        path: '/posts',
                        description: 'Retrieve all posts (demo limited to first 10)',
                        config: {
                            parameters: [
                                {
                                    name: '_limit',
                                    type: 'number',
                                    required: false,
                                    description: 'Limit results (max 10 for demo)',
                                    defaultValue: 10
                                }
                            ]
                        },
                    },
                    {
                        id: randomUUID(),
                        name: 'Get Post by ID (Demo)',
                        method: 'GET',
                        path: '/posts/{id}',
                        description: 'Retrieve a single post by ID',
                        config: {
                            parameters: [
                                {
                                    name: 'id',
                                    type: 'number',
                                    required: true,
                                    description: 'Post ID (1-10 for demo)',
                                },
                            ]
                        },
                    },
                ],
            },
            // Add MCP tools, resources, and prompts for demo
            mcpTools: [
                {
                    name: 'get_demo_posts',
                    description: 'Get demo blog posts (limited to 10)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            limit: {
                                type: 'number',
                                description: 'Number of posts to retrieve (max 10)',
                                minimum: 1,
                                maximum: 10,
                                default: 5
                            }
                        }
                    }
                }
            ],
            mcpResources: [
                {
                    uri: 'demo://posts',
                    name: 'Demo Posts Collection',
                    description: 'Sample blog posts for testing',
                    mimeType: 'application/json'
                }
            ],
            mcpPrompts: [
                {
                    name: 'analyze_demo_post',
                    description: 'Analyze a demo blog post',
                    arguments: [
                        {
                            name: 'post_id',
                            description: 'ID of the post to analyze',
                            required: true
                        }
                    ]
                }
            ]
        },
    })

    // Create second demo bridge for demo user (to show the 2-bridge limit)
    const demoBridge2 = await prisma.bridge.create({
        data: {
            id: demoBridge2Id,
            slug: demoBridge2Id,
            name: 'Demo: HTTPBin Testing',
            description: 'A demo bridge for HTTP testing (rate limited)',
            baseUrl: 'https://httpbin.org',
            authConfig: { type: 'none' },
            enabled: true,
            userId: demoUser.id,
            endpoints: {
                create: [
                    {
                        id: randomUUID(),
                        name: 'Test GET (Demo)',
                        method: 'GET',
                        path: '/get',
                        description: 'Simple GET request test (demo limited)',
                        config: { parameters: [] },
                    },
                ],
            },
            // Simpler MCP configuration for second demo bridge
            mcpTools: [
                {
                    name: 'test_demo_request',
                    description: 'Test HTTP request (demo version with limits)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            test_data: {
                                type: 'string',
                                description: 'Simple test data for demo',
                                maxLength: 100
                            }
                        }
                    }
                }
            ],
            mcpResources: [
                {
                    uri: 'demo://http-test',
                    name: 'Demo HTTP Test',
                    description: 'Simple HTTP testing resource for demo',
                    mimeType: 'application/json'
                }
            ],
            mcpPrompts: [
                {
                    name: 'demo_http_help',
                    description: 'Get help with basic HTTP testing',
                    arguments: [
                        {
                            name: 'question',
                            description: 'Your HTTP testing question',
                            required: true
                        }
                    ]
                }
            ]
        },
    })

    // Create sample bridges for test user (full functionality)
    const bridge1 = await prisma.bridge.create({
        data: {
            id: bridge1Id,
            slug: bridge1Id, // Use UUID as slug
            name: 'JSONPlaceholder API',
            description: 'A fake REST API for testing and prototyping',
            baseUrl: 'https://jsonplaceholder.typicode.com',
            authConfig: { type: 'none' }, // Use correct authConfig structure
            enabled: true,
            userId: testUser.id,
            endpoints: {
                create: [
                    {
                        id: randomUUID(),
                        name: 'Get Posts',
                        method: 'GET',
                        path: '/posts',
                        description: 'Retrieve all posts',
                        config: { parameters: [] },
                    },
                    {
                        id: randomUUID(),
                        name: 'Get Post by ID',
                        method: 'GET',
                        path: '/posts/{id}',
                        description: 'Retrieve a single post by ID',
                        config: {
                            parameters: [
                                {
                                    name: 'id',
                                    type: 'number',
                                    required: true,
                                    description: 'Post ID',
                                },
                            ]
                        },
                    },
                    {
                        id: randomUUID(),
                        name: 'Create Post',
                        method: 'POST',
                        path: '/posts',
                        description: 'Create a new post',
                        config: {
                            parameters: [],
                            requestBody: {
                                contentType: 'application/json',
                                required: true,
                                schema: {
                                    type: 'object',
                                    properties: {
                                        title: { type: 'string' },
                                        body: { type: 'string' },
                                        userId: { type: 'number' },
                                    },
                                    required: ['title', 'body', 'userId'],
                                },
                                properties: {
                                    title: {
                                        type: 'string',
                                        description: 'Post title',
                                        required: true
                                    },
                                    body: {
                                        type: 'string',
                                        description: 'Post content',
                                        required: true
                                    },
                                    userId: {
                                        type: 'number',
                                        description: 'Author user ID',
                                        required: true
                                    }
                                }
                            }
                        },
                    },
                ],
            },
            // Add comprehensive MCP tools, resources, and prompts
            mcpTools: [
                {
                    name: 'get_posts',
                    description: 'Retrieve blog posts from JSONPlaceholder',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            limit: {
                                type: 'number',
                                description: 'Number of posts to retrieve',
                                minimum: 1,
                                maximum: 100,
                                default: 10
                            },
                            userId: {
                                type: 'number',
                                description: 'Filter posts by user ID',
                                minimum: 1,
                                maximum: 10
                            }
                        }
                    }
                },
                {
                    name: 'get_post_by_id',
                    description: 'Get a specific post by its ID',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                                description: 'Post ID to retrieve',
                                minimum: 1,
                                maximum: 100
                            }
                        },
                        required: ['id']
                    }
                },
                {
                    name: 'create_post',
                    description: 'Create a new blog post',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            title: {
                                type: 'string',
                                description: 'Post title',
                                minLength: 1,
                                maxLength: 200
                            },
                            body: {
                                type: 'string',
                                description: 'Post content',
                                minLength: 1
                            },
                            userId: {
                                type: 'number',
                                description: 'Author user ID',
                                minimum: 1,
                                maximum: 10
                            }
                        },
                        required: ['title', 'body', 'userId']
                    }
                }
            ],
            mcpResources: [
                {
                    uri: 'jsonplaceholder://posts',
                    name: 'All Posts Collection',
                    description: 'Complete collection of blog posts from JSONPlaceholder',
                    mimeType: 'application/json'
                },
                {
                    uri: 'jsonplaceholder://posts/recent',
                    name: 'Recent Posts',
                    description: 'Latest 10 blog posts',
                    mimeType: 'application/json'
                },
                {
                    uri: 'jsonplaceholder://users',
                    name: 'Users Collection',
                    description: 'All users who have authored posts',
                    mimeType: 'application/json'
                }
            ],
            mcpPrompts: [
                {
                    name: 'analyze_post',
                    description: 'Analyze a blog post for content, sentiment, and key themes',
                    arguments: [
                        {
                            name: 'post_id',
                            description: 'ID of the post to analyze',
                            required: true
                        }
                    ]
                },
                {
                    name: 'summarize_posts',
                    description: 'Create a summary of multiple blog posts',
                    arguments: [
                        {
                            name: 'user_id',
                            description: 'User ID to filter posts (optional)',
                            required: false
                        },
                        {
                            name: 'count',
                            description: 'Number of posts to summarize (default: 5)',
                            required: false
                        }
                    ]
                },
                {
                    name: 'generate_post_ideas',
                    description: 'Generate new blog post ideas based on existing content',
                    arguments: [
                        {
                            name: 'topic',
                            description: 'Topic or theme for new post ideas',
                            required: true
                        }
                    ]
                }
            ]
        },
    })

    const bridge2 = await prisma.bridge.create({
        data: {
            id: bridge2Id,
            slug: bridge2Id, // Use UUID as slug
            name: 'HTTPBin Testing API',
            description: 'HTTP Request & Response Service for testing APIs',
            baseUrl: 'https://httpbin.org',
            authConfig: { type: 'none' }, // Use new authConfig structure
            enabled: true,
            userId: testUser.id,
            endpoints: {
                create: [
                    {
                        id: randomUUID(),
                        name: 'Test GET Request',
                        method: 'GET',
                        path: '/get',
                        description: 'Returns GET request data',
                        config: { parameters: [] },
                    },
                    {
                        id: randomUUID(),
                        name: 'Test POST Request',
                        method: 'POST',
                        path: '/post',
                        description: 'Returns POST request data',
                        config: {
                            parameters: [],
                            requestBody: {
                                contentType: 'application/json',
                                required: false,
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                    },
                                },
                                properties: {
                                    message: {
                                        type: 'string',
                                        description: 'Test message to send',
                                        required: false
                                    }
                                }
                            }
                        },
                    },
                ],
            },
            // Add comprehensive MCP tools, resources, and prompts for HTTPBin
            mcpTools: [
                {
                    name: 'test_get_request',
                    description: 'Test GET request with HTTPBin and return response details',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query_params: {
                                type: 'object',
                                description: 'Query parameters to include in the request',
                                additionalProperties: { type: 'string' }
                            },
                            headers: {
                                type: 'object',
                                description: 'Custom headers to include',
                                additionalProperties: { type: 'string' }
                            }
                        }
                    }
                },
                {
                    name: 'test_post_request',
                    description: 'Test POST request with HTTPBin and analyze the response',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            data: {
                                type: 'object',
                                description: 'JSON data to send in the request body',
                                additionalProperties: true
                            },
                            headers: {
                                type: 'object',
                                description: 'Custom headers to include',
                                additionalProperties: { type: 'string' }
                            }
                        }
                    }
                },
                {
                    name: 'test_http_methods',
                    description: 'Test various HTTP methods (GET, POST, PUT, DELETE) with HTTPBin',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            method: {
                                type: 'string',
                                enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                                description: 'HTTP method to test'
                            },
                            payload: {
                                type: 'object',
                                description: 'Data payload for the request',
                                additionalProperties: true
                            }
                        },
                        required: ['method']
                    }
                },
                {
                    name: 'test_status_codes',
                    description: 'Test different HTTP status codes with HTTPBin',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            status_code: {
                                type: 'number',
                                description: 'HTTP status code to test (200, 404, 500, etc.)',
                                minimum: 100,
                                maximum: 599
                            }
                        },
                        required: ['status_code']
                    }
                }
            ],
            mcpResources: [
                {
                    uri: 'httpbin://endpoints',
                    name: 'HTTPBin Endpoints Reference',
                    description: 'Complete list of available HTTPBin testing endpoints',
                    mimeType: 'application/json'
                },
                {
                    uri: 'httpbin://status-codes',
                    name: 'HTTP Status Codes',
                    description: 'Reference guide for HTTP status codes testable with HTTPBin',
                    mimeType: 'application/json'
                },
                {
                    uri: 'httpbin://request-examples',
                    name: 'HTTP Request Examples',
                    description: 'Example HTTP requests for testing various scenarios',
                    mimeType: 'application/json'
                },
                {
                    uri: 'httpbin://headers-reference',
                    name: 'HTTP Headers Reference',
                    description: 'Common HTTP headers for testing with HTTPBin',
                    mimeType: 'application/json'
                }
            ],
            mcpPrompts: [
                {
                    name: 'debug_http_request',
                    description: 'Debug and analyze HTTP request/response issues',
                    arguments: [
                        {
                            name: 'request_method',
                            description: 'HTTP method used (GET, POST, etc.)',
                            required: true
                        },
                        {
                            name: 'expected_status',
                            description: 'Expected HTTP status code',
                            required: false
                        },
                        {
                            name: 'error_description',
                            description: 'Description of the issue encountered',
                            required: false
                        }
                    ]
                },
                {
                    name: 'generate_http_tests',
                    description: 'Generate comprehensive HTTP API test scenarios',
                    arguments: [
                        {
                            name: 'api_type',
                            description: 'Type of API to generate tests for (REST, GraphQL, etc.)',
                            required: true
                        },
                        {
                            name: 'test_coverage',
                            description: 'Level of test coverage (basic, comprehensive, edge-cases)',
                            required: false
                        }
                    ]
                },
                {
                    name: 'analyze_api_response',
                    description: 'Analyze and interpret API response data',
                    arguments: [
                        {
                            name: 'response_data',
                            description: 'JSON response data to analyze',
                            required: true
                        },
                        {
                            name: 'analysis_type',
                            description: 'Type of analysis (structure, performance, security)',
                            required: false
                        }
                    ]
                }
            ]
        },
    })

    // Add some sample logs
    await prisma.bridgeLog.createMany({
        data: [
            // Demo user bridge logs
            {
                bridgeId: demoBridge1.id,
                level: 'info',
                message: 'Demo bridge initialized (rate limited)',
                metadata: { component: 'initialization', user: 'demo' },
            },
            {
                bridgeId: demoBridge1.id,
                level: 'info',
                message: 'Rate limiting: 30 requests per minute enforced',
                metadata: { component: 'rate-limiter', user: 'demo' },
            },
            {
                bridgeId: demoBridge2.id,
                level: 'info',
                message: 'Demo HTTP testing bridge initialized',
                metadata: { component: 'initialization', user: 'demo' },
            },
            // Test user bridge logs
            {
                bridgeId: bridge1.id,
                level: 'info',
                message: 'Bridge initialized successfully',
                metadata: { component: 'initialization' },
            },
            {
                bridgeId: bridge1.id,
                level: 'debug',
                message: 'Connected to JSONPlaceholder API',
                metadata: { component: 'connection' },
            },
            {
                bridgeId: bridge2.id,
                level: 'info',
                message: 'Bridge initialized successfully',
                metadata: { component: 'initialization' },
            },
        ],
    })

    console.log('✅ Seed data created successfully!')
    console.log(``)
    console.log(`👤 Demo User (Public Testing):`)
    console.log(`   Email: demo@contextlayer.app`)
    console.log(`   Password: demo123`)
    console.log(`   Restrictions: 30 requests/min, 2 MCP server max, basic tools only`)
    console.log(``)
    console.log(`👤 Test User (Development):`)
    console.log(`   Email: test@example.com`)
    console.log(`   Password: password123`)
    console.log(`   Restrictions: None`)
    console.log(``)
    console.log(`Created bridges:`)
    console.log(`- ${demoBridge1.name} (${demoBridge1.id}) - Demo User`)
    console.log(`- ${demoBridge2.name} (${demoBridge2.id}) - Demo User`)
    console.log(`- ${bridge1.name} (${bridge1.id}) - Test User`)
    console.log(`- ${bridge2.name} (${bridge2.id}) - Test User`)
}

main()
    .catch((e) => {
        console.error('❌ Error seeding data:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
