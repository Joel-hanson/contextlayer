import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user with their settings
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                settings: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // If no settings exist, create default ones
        let userSettings = user.settings;
        if (!userSettings) {
            userSettings = await prisma.userSettings.create({
                data: {
                    userId: user.id,
                },
            });
        }

        // Transform database data to match the frontend interface
        const settings = {
            profile: {
                displayName: userSettings.displayName || user.name || '',
                email: user.email || '',
                organization: userSettings.organization || '',
                timezone: userSettings.timezone,
            },
            bridgeDefaults: {
                defaultTimeout: userSettings.defaultTimeout,
                defaultRetryAttempts: userSettings.defaultRetryAttempts,
                enableCaching: userSettings.enableCaching,
                cacheDuration: userSettings.cacheDuration,
                enableRateLimiting: userSettings.enableRateLimiting,
                requestsPerMinute: userSettings.requestsPerMinute,
            },
            notifications: {
                emailNotifications: userSettings.emailNotifications,
                bridgeFailureAlerts: userSettings.bridgeFailureAlerts,
                weeklyReports: userSettings.weeklyReports,
                maintenanceUpdates: userSettings.maintenanceUpdates,
                webhookUrl: userSettings.webhookUrl || '',
                slackWebhookUrl: userSettings.slackWebhookUrl || '',
            },
            apiKeys: {
                enableApiAccess: userSettings.enableApiAccess,
                allowPublicAccess: userSettings.allowPublicAccess,
            },
            preferences: {
                theme: userSettings.theme as 'light' | 'dark' | 'system',
                autoSaveBridges: userSettings.autoSaveBridges,
                showAdvancedOptions: userSettings.showAdvancedOptions,
                defaultAuthType: userSettings.defaultAuthType as 'none' | 'bearer' | 'apikey' | 'basic',
            },
        };

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching user settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Update user settings
        await prisma.userSettings.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                displayName: body.profile?.displayName,
                organization: body.profile?.organization,
                timezone: body.profile?.timezone || 'UTC',
                theme: body.preferences?.theme || 'light',
                autoSaveBridges: body.preferences?.autoSaveBridges ?? true,
                showAdvancedOptions: body.preferences?.showAdvancedOptions ?? false,
                defaultAuthType: body.preferences?.defaultAuthType || 'none',
                defaultTimeout: body.bridgeDefaults?.defaultTimeout || 30000,
                defaultRetryAttempts: body.bridgeDefaults?.defaultRetryAttempts || 3,
                enableCaching: body.bridgeDefaults?.enableCaching ?? true,
                cacheDuration: body.bridgeDefaults?.cacheDuration || 300,
                enableRateLimiting: body.bridgeDefaults?.enableRateLimiting ?? false,
                requestsPerMinute: body.bridgeDefaults?.requestsPerMinute || 100,
                emailNotifications: body.notifications?.emailNotifications ?? true,
                bridgeFailureAlerts: body.notifications?.bridgeFailureAlerts ?? true,
                weeklyReports: body.notifications?.weeklyReports ?? false,
                maintenanceUpdates: body.notifications?.maintenanceUpdates ?? true,
                webhookUrl: body.notifications?.webhookUrl || null,
                slackWebhookUrl: body.notifications?.slackWebhookUrl || null,
                enableApiAccess: body.apiKeys?.enableApiAccess ?? false,
                allowPublicAccess: body.apiKeys?.allowPublicAccess ?? false,
            },
            update: {
                displayName: body.profile?.displayName,
                organization: body.profile?.organization,
                timezone: body.profile?.timezone,
                theme: body.preferences?.theme,
                autoSaveBridges: body.preferences?.autoSaveBridges,
                showAdvancedOptions: body.preferences?.showAdvancedOptions,
                defaultAuthType: body.preferences?.defaultAuthType,
                defaultTimeout: body.bridgeDefaults?.defaultTimeout,
                defaultRetryAttempts: body.bridgeDefaults?.defaultRetryAttempts,
                enableCaching: body.bridgeDefaults?.enableCaching,
                cacheDuration: body.bridgeDefaults?.cacheDuration,
                enableRateLimiting: body.bridgeDefaults?.enableRateLimiting,
                requestsPerMinute: body.bridgeDefaults?.requestsPerMinute,
                emailNotifications: body.notifications?.emailNotifications,
                bridgeFailureAlerts: body.notifications?.bridgeFailureAlerts,
                weeklyReports: body.notifications?.weeklyReports,
                maintenanceUpdates: body.notifications?.maintenanceUpdates,
                webhookUrl: body.notifications?.webhookUrl,
                slackWebhookUrl: body.notifications?.slackWebhookUrl,
                enableApiAccess: body.apiKeys?.enableApiAccess,
                allowPublicAccess: body.apiKeys?.allowPublicAccess,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating user settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
