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

    // Create a test user for seeding bridges
    const hashedPassword = await bcrypt.hash('password123', 12)
    const testUser = await prisma.user.create({
        data: {
            id: randomUUID(),
            email: 'test@example.com',
            name: 'Test User',
            username: 'testuser',
            password: hashedPassword,
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

    // Create sample bridges
    const bridge1 = await prisma.bridge.create({
        data: {
            id: bridge1Id,
            slug: bridge1Id, // Use UUID as slug
            name: 'JSONPlaceholder API',
            description: 'A fake REST API for testing and prototyping',
            baseUrl: 'https://jsonplaceholder.typicode.com',
            authConfig: { type: 'none' }, // Use correct authConfig structure
            enabled: true,
            status: 'inactive',
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
            status: 'inactive',
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
        },
    })

    // Add some sample logs
    await prisma.bridgeLog.createMany({
        data: [
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
    console.log(`Created bridges:`)
    console.log(`- ${bridge1.name} (${bridge1.id})`)
    console.log(`- ${bridge2.name} (${bridge2.id})`)
}

main()
    .catch((e) => {
        console.error('❌ Error seeding data:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
