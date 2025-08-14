import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Creating admin users...')

    // Get admin emails from environment variable
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || []

    if (adminEmails.length === 0) {
        console.log('⚠️  No admin emails found in ADMIN_EMAILS environment variable')
        console.log('   Please set ADMIN_EMAILS=admin@example.com,admin2@example.com in your .env file')
        return
    }

    console.log(`📧 Found ${adminEmails.length} admin email(s): ${adminEmails.join(', ')}`)

    const adminUsers = []

    for (const email of adminEmails) {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            // Update existing user to admin role
            const updatedUser = await prisma.user.update({
                where: { email },
                data: {
                    role: 'ADMIN',
                    updatedAt: new Date()
                },
                include: {
                    settings: true
                }
            })

            console.log(`✅ Updated existing user to admin: ${email}`)
            adminUsers.push(updatedUser)
        } else {
            // Create new admin user
            const adminName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            const adminUsername = email.split('@')[0].replace(/[._]/g, '')

            // Generate a secure random password
            const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase() + '123!'
            const hashedPassword = await bcrypt.hash(randomPassword, 12)

            const newAdmin = await prisma.user.create({
                data: {
                    id: randomUUID(),
                    email: email,
                    name: adminName,
                    username: adminUsername,
                    password: hashedPassword,
                    role: 'ADMIN',
                    emailVerified: new Date(), // Auto-verify admin emails
                    settings: {
                        create: {
                            displayName: adminName,
                            autoSaveBridges: true,
                            showAdvancedOptions: true,
                            defaultTimeout: 30000,
                            defaultRetryAttempts: 3,
                            enableRateLimiting: false, // No rate limiting for admins
                            requestsPerMinute: 1000, // High limit for admins
                        }
                    }
                },
                include: {
                    settings: true
                }
            })

            console.log(`✅ Created new admin user: ${email}`)
            console.log(`   Password: ${randomPassword}`)
            console.log(`   ⚠️  Please save this password securely and change it after first login!`)

            adminUsers.push(newAdmin)
        }
    }

    // Create some sample admin data for testing
    if (adminUsers.length > 0) {
        const firstAdmin = adminUsers[0]

        // Create an admin-specific bridge for monitoring/testing
        const adminBridge = await prisma.bridge.create({
            data: {
                id: randomUUID(),
                slug: `admin-monitoring-${Date.now()}`,
                name: 'Admin Monitoring Bridge',
                description: 'Internal bridge for admin monitoring and testing purposes',
                baseUrl: 'https://httpbin.org',
                authConfig: { type: 'none' },
                enabled: true,
                userId: firstAdmin.id,
                endpoints: {
                    create: [
                        {
                            id: randomUUID(),
                            name: 'Health Check',
                            method: 'GET',
                            path: '/status/200',
                            description: 'System health check endpoint',
                            config: { parameters: [] },
                        },
                        {
                            id: randomUUID(),
                            name: 'System Status',
                            method: 'GET',
                            path: '/get',
                            description: 'Get system status information',
                            config: {
                                parameters: [
                                    {
                                        name: 'include_headers',
                                        type: 'boolean',
                                        required: false,
                                        description: 'Include request headers in response',
                                        defaultValue: true
                                    }
                                ]
                            },
                        },
                    ],
                },
                mcpTools: [
                    {
                        name: 'system_health_check',
                        description: 'Check system health and status',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                detailed: {
                                    type: 'boolean',
                                    description: 'Return detailed health information',
                                    default: true
                                }
                            }
                        }
                    }
                ],
                mcpResources: [
                    {
                        uri: 'admin://system-status',
                        name: 'System Status',
                        description: 'Real-time system status and metrics',
                        mimeType: 'application/json'
                    }
                ],
                mcpPrompts: [
                    {
                        name: 'analyze_system_metrics',
                        description: 'Analyze system performance metrics and suggest optimizations',
                        arguments: [
                            {
                                name: 'time_range',
                                description: 'Time range for metrics analysis (1h, 24h, 7d)',
                                required: false
                            }
                        ]
                    }
                ]
            },
        })

        // Add some admin logs
        await prisma.bridgeLog.createMany({
            data: [
                {
                    bridgeId: adminBridge.id,
                    level: 'info',
                    message: 'Admin monitoring bridge initialized',
                    metadata: {
                        component: 'admin-initialization',
                        admin_user: firstAdmin.email,
                        bridge_type: 'monitoring'
                    },
                },
                {
                    bridgeId: adminBridge.id,
                    level: 'info',
                    message: 'Admin bridge configured with unlimited rate limiting',
                    metadata: {
                        component: 'rate-limiter',
                        admin_user: firstAdmin.email,
                        rate_limit: 'unlimited'
                    },
                },
            ],
        })

        console.log(`✅ Created admin monitoring bridge: ${adminBridge.name}`)
    }

    console.log('')
    console.log('🎉 Admin user creation completed!')
    console.log('')
    console.log('📋 Summary:')
    console.log(`   • Created/Updated ${adminUsers.length} admin user(s)`)
    console.log(`   • Admin users have access to /admin dashboard`)
    console.log(`   • Admin users have unlimited rate limits`)
    console.log(`   • Admin users have advanced options enabled`)
    console.log('')

    if (adminUsers.some(user => !user.settings?.id)) {
        console.log('⚠️  Remember to:')
        console.log('   1. Save the generated passwords securely')
        console.log('   2. Ask admins to change passwords after first login')
        console.log('   3. Set up additional security measures if needed')
    }

    console.log('')
    console.log('🔗 Admin Dashboard URL: http://localhost:3000/admin')
    console.log('')
}

main()
    .catch((e) => {
        console.error('❌ Error creating admin users:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
