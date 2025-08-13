import { addSecurityHeaders, requireAuth } from '@/lib/api-security'
import { AppError, withErrorHandler } from '@/lib/error-handler'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Helper function to convert BigInt values to numbers in query results
function convertBigIntToNumber(obj: unknown): unknown {
    if (Array.isArray(obj)) {
        return obj.map(convertBigIntToNumber)
    } else if (obj && typeof obj === 'object') {
        const converted: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'bigint') {
                converted[key] = Number(value)
            } else if (value && typeof value === 'object') {
                converted[key] = convertBigIntToNumber(value)
            } else {
                converted[key] = value
            }
        }
        return converted
    }
    return obj
}

// Admin user check - you can customize this logic
async function requireAdminAuth() {
    const session = await requireAuth()

    // Check if user is admin - customize this condition based on your needs
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    const isAdmin = adminEmails.includes(session.user.email || '')

    if (!isAdmin) {
        throw new AppError('FORBIDDEN', 'Admin access required', 403)
    }

    return session
}

// GET /api/admin/metrics - Get admin dashboard metrics
export const GET = withErrorHandler(async (request: NextRequest) => {
    // Require admin authentication
    await requireAdminAuth()

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('range') || '30' // days
    const days = parseInt(timeRange, 10)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    try {
        // Get all metrics in parallel for better performance
        const [
            totalUsers,
            newUsers,
            totalBridges,
            activeBridges,
            totalEndpoints,
            userGrowth,
            bridgeStats,
            popularApiTypes,
            userActivity,
            errorStats
        ] = await Promise.all([
            // Total users
            prisma.user.count(),

            // New users in time range
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: startDate
                    }
                }
            }),

            // Total bridges
            prisma.bridge.count(),

            // Active bridges (enabled)
            prisma.bridge.count({
                where: {
                    enabled: true
                }
            }),

            // Total endpoints across all bridges
            prisma.apiEndpoint.count(),

            // User growth over time (daily for last 30 days)
            prisma.$queryRaw`
        SELECT 
          TO_CHAR(DATE("createdAt"), 'YYYY-MM-DD') as date,
          COUNT(*) as count
        FROM "users"
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY DATE("createdAt") ASC
      `,

            // Bridge creation stats
            prisma.$queryRaw`
        SELECT 
          TO_CHAR(DATE("createdAt"), 'YYYY-MM-DD') as date,
          COUNT(*) as count
        FROM "bridges"
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY DATE("createdAt") ASC
      `,

            // Most popular API base URLs (anonymized)
            prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN "baseUrl" LIKE '%api.stripe.%' THEN 'Stripe API'
            WHEN "baseUrl" LIKE '%api.github.%' THEN 'GitHub API'
            WHEN "baseUrl" LIKE '%api.openai.%' THEN 'OpenAI API'
            WHEN "baseUrl" LIKE '%googleapis.com%' THEN 'Google APIs'
            WHEN "baseUrl" LIKE '%api.slack.%' THEN 'Slack API'
            WHEN "baseUrl" LIKE '%api.twitter.%' THEN 'Twitter API'
            WHEN "baseUrl" LIKE '%graph.microsoft.%' THEN 'Microsoft Graph'
            ELSE 'Custom API'
          END as api_type,
          COUNT(*) as count
        FROM "bridges"
        GROUP BY api_type
        ORDER BY count DESC
        LIMIT 10
      `,

            // User activity (bridges per user distribution)
            prisma.$queryRaw`
        WITH user_bridge_counts AS (
          SELECT 
            u.id,
            COUNT(b.id) as bridge_count
          FROM "users" u
          LEFT JOIN "bridges" b ON u.id = b."userId"
          GROUP BY u.id
        ),
        categorized_users AS (
          SELECT 
            CASE 
              WHEN bridge_count = 0 THEN '0 bridges'
              WHEN bridge_count = 1 THEN '1 bridge'
              WHEN bridge_count <= 3 THEN '2-3 bridges'
              WHEN bridge_count <= 5 THEN '4-5 bridges'
              WHEN bridge_count <= 10 THEN '6-10 bridges'
              ELSE '10+ bridges'
            END as category,
            CASE 
              WHEN bridge_count = 0 THEN 1
              WHEN bridge_count = 1 THEN 2
              WHEN bridge_count <= 3 THEN 3
              WHEN bridge_count <= 5 THEN 4
              WHEN bridge_count <= 10 THEN 5
              ELSE 6
            END as sort_order
          FROM user_bridge_counts
        )
        SELECT 
          category,
          COUNT(*) as user_count
        FROM categorized_users
        GROUP BY category, sort_order
        ORDER BY sort_order
      `,

            // Error statistics (if you have error logging)
            prisma.feedback.count({
                where: {
                    type: 'BUG',
                    createdAt: {
                        gte: startDate
                    }
                }
            })
        ])

        // Calculate growth rates
        const previousPeriodStart = new Date()
        previousPeriodStart.setDate(previousPeriodStart.getDate() - (days * 2))
        previousPeriodStart.setDate(previousPeriodStart.getDate() + days)

        const previousUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: previousPeriodStart,
                    lt: startDate
                }
            }
        })

        const previousBridges = await prisma.bridge.count({
            where: {
                createdAt: {
                    gte: previousPeriodStart,
                    lt: startDate
                }
            }
        })

        const userGrowthRate = previousUsers > 0 ? ((newUsers - previousUsers) / previousUsers) * 100 : 0
        const bridgeGrowthRate = previousBridges > 0 ? ((totalBridges - previousBridges) / previousBridges) * 100 : 0

        // Demo user statistics
        const demoUserCount = await prisma.user.count({
            where: {
                email: 'demo@contextlayer.com'
            }
        })

        const realUserCount = totalUsers - demoUserCount

        const metrics = {
            overview: {
                totalUsers: realUserCount,
                newUsers,
                userGrowthRate: Math.round(userGrowthRate * 100) / 100,
                totalBridges,
                activeBridges,
                bridgeGrowthRate: Math.round(bridgeGrowthRate * 100) / 100,
                totalEndpoints: totalEndpoints || 0,
                avgBridgesPerUser: realUserCount > 0 ? Math.round((totalBridges / realUserCount) * 100) / 100 : 0,
                avgEndpointsPerBridge: totalBridges > 0 ? Math.round(((totalEndpoints || 0) / totalBridges) * 100) / 100 : 0
            },
            charts: {
                userGrowth: convertBigIntToNumber(userGrowth),
                bridgeCreation: convertBigIntToNumber(bridgeStats),
                popularApis: convertBigIntToNumber(popularApiTypes),
                userActivity: convertBigIntToNumber(userActivity)
            },
            system: {
                errorCount: errorStats,
                demoUsers: demoUserCount,
                realUsers: realUserCount,
                activationRate: realUserCount > 0 ? Math.round((activeBridges / totalBridges) * 100) : 0
            }
        }

        const response = NextResponse.json(metrics)
        return addSecurityHeaders(response)

    } catch (error) {
        console.error('Error fetching admin metrics:', error)
        throw new AppError('DATABASE_ERROR', 'Failed to fetch metrics', 500)
    }
})
