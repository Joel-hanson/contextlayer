'use client';

import { useEffect, useState } from 'react';

export interface AppSettings {
    profile: {
        displayName: string;
        email: string;
        organization: string;
        timezone: string;
    };
    bridgeDefaults: {
        defaultTimeout: number;
        defaultRetryAttempts: number;
        enableCaching: boolean;
        cacheDuration: number;
        enableRateLimiting: boolean;
        requestsPerMinute: number;
        autoStart: boolean; // Whether new bridges should start automatically
    };
    notifications: {
        emailNotifications: boolean;
        bridgeFailureAlerts: boolean;
        weeklyReports: boolean;
        maintenanceUpdates: boolean;
        webhookUrl?: string;
        slackWebhook?: string;
    };
    preferences: {
        theme: 'light' | 'dark' | 'system';
        autoSaveBridges: boolean;
        showAdvancedOptions: boolean;
        defaultAuthType: 'none' | 'bearer' | 'apikey' | 'basic';
        compactView: boolean;
        language: string;
    };
}

const defaultSettings: AppSettings = {
    profile: {
        displayName: 'MCP Bridge User',
        email: '',
        organization: '',
        timezone: 'UTC',
    },
    bridgeDefaults: {
        defaultTimeout: 30000,
        defaultRetryAttempts: 3,
        enableCaching: true,
        cacheDuration: 300,
        enableRateLimiting: false,
        requestsPerMinute: 100,
        autoStart: true, // New bridges should be enabled/started by default
    },
    notifications: {
        emailNotifications: true,
        bridgeFailureAlerts: true,
        weeklyReports: false,
        maintenanceUpdates: true,
        webhookUrl: '',
        slackWebhook: '',
    },
    preferences: {
        theme: 'system',
        autoSaveBridges: true,
        showAdvancedOptions: false,
        defaultAuthType: 'none',
        compactView: false,
        language: 'en',
    },
};

export function useAppSettings() {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const savedSettings = localStorage.getItem('mcp-settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setSettings(parsed);
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        }
    }, []);

    const updateSettings = (section: keyof AppSettings, key: string, value: unknown) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
        setHasChanges(true);
    };

    const saveSettings = async () => {
        try {
            localStorage.setItem('mcp-settings', JSON.stringify(settings));
            setHasChanges(false);

            // Trigger notifications if enabled
            if (settings.notifications.emailNotifications) {
                // In a real app, this would trigger an API call
                console.log('Settings saved - email notification would be sent');
            }

            if (settings.notifications.webhookUrl) {
                try {
                    await fetch(settings.notifications.webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'settings_updated',
                            timestamp: new Date().toISOString(),
                            user: settings.profile.displayName || 'Unknown User'
                        })
                    });
                } catch (error) {
                    console.error('Failed to send webhook notification:', error);
                }
            }

            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
        setHasChanges(true);
    };

    return {
        settings,
        updateSettings,
        saveSettings,
        resetSettings,
        hasChanges
    };
}

// Hook to get bridge defaults for new bridges
export function useBridgeDefaults() {
    const [bridgeDefaults, setBridgeDefaults] = useState(defaultSettings.bridgeDefaults);

    useEffect(() => {
        const savedSettings = localStorage.getItem('mcp-settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                if (parsed.bridgeDefaults) {
                    setBridgeDefaults(parsed.bridgeDefaults);
                }
            } catch (error) {
                console.error('Failed to load bridge defaults:', error);
            }
        }
    }, []);

    return bridgeDefaults;
}
