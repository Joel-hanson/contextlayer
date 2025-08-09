'use client';

import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
    Bell,
    Download,
    RefreshCw,
    Save,
    Settings2,
    Trash2,
    Upload,
    User,
    Zap
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface AppSettings {
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
    };
    notifications: {
        emailNotifications: boolean;
        bridgeFailureAlerts: boolean;
        weeklyReports: boolean;
        maintenanceUpdates: boolean;
        webhookUrl: string;
        slackWebhookUrl: string;
    };
    apiKeys: {
        enableApiAccess: boolean;
        allowPublicAccess: boolean;
    };
    preferences: {
        theme: 'light' | 'dark' | 'system';
        autoSaveBridges: boolean;
        showAdvancedOptions: boolean;
        defaultAuthType: 'none' | 'bearer' | 'apikey' | 'basic';
    };
}

const defaultSettings: AppSettings = {
    profile: {
        displayName: 'ContextLayer User',
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
    },
    notifications: {
        emailNotifications: true,
        bridgeFailureAlerts: true,
        weeklyReports: false,
        maintenanceUpdates: true,
        webhookUrl: '',
        slackWebhookUrl: '',
    },
    apiKeys: {
        enableApiAccess: false,
        allowPublicAccess: false,
    },
    preferences: {
        theme: 'light' as const, // Default to light theme
        autoSaveBridges: true,
        showAdvancedOptions: false,
        defaultAuthType: 'none' as const,
    },
};

const timezones = [
    'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London',
    'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney'
];

export default function SettingsPage() {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [showResetDialog, setShowResetDialog] = useState(false);
    const { data: session } = useSession();
    const { toast } = useToast();

    // Load settings from database on mount
    useEffect(() => {
        const loadSettings = async () => {
            if (!session?.user) {
                return;
            }

            try {
                const response = await fetch('/api/user/settings');
                if (response.ok) {
                    const settingsData = await response.json();

                    // API returns the settings directly, not nested under userData
                    const loadedSettings: AppSettings = {
                        profile: {
                            displayName: settingsData.profile?.displayName || 'ContextLayer User',
                            email: settingsData.profile?.email || '',
                            organization: settingsData.profile?.organization || '',
                            timezone: settingsData.profile?.timezone || 'UTC',
                        },
                        bridgeDefaults: settingsData.bridgeDefaults || defaultSettings.bridgeDefaults,
                        notifications: settingsData.notifications || defaultSettings.notifications,
                        apiKeys: settingsData.apiKeys || defaultSettings.apiKeys,
                        preferences: {
                            ...defaultSettings.preferences,
                            ...settingsData.preferences,
                            theme: 'light' as const, // Always use light theme
                        },
                    };

                    setSettings(loadedSettings);
                } else {
                    console.error('Failed to load settings from database');
                    // Fallback to localStorage
                    const savedSettings = localStorage.getItem('contextlayer-settings');
                    if (savedSettings) {
                        try {
                            const parsed = JSON.parse(savedSettings);
                            setSettings({ ...defaultSettings, ...parsed });
                        } catch {
                            console.error('Failed to parse localStorage settings');
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        };

        loadSettings();
    }, [session]);

    const updateSettings = (section: keyof AppSettings, key: string, value: unknown) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
        setHasChanges(true);

        // Special handling for theme changes to apply immediately
        // DISABLED: Theme changing functionality temporarily disabled
        /*
        if (section === 'preferences' && key === 'theme') {
            console.log('Theme changing from', settings.preferences.theme, 'to:', value);
            setTheme(value as 'light' | 'dark' | 'system');
            // Also persist directly to theme provider's storage
            localStorage.setItem('contextlayer-theme', value as string);
            console.log('Theme set and persisted to localStorage:', value);
        }
        */
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            if (session?.user) {
                // Save to database
                const response = await fetch('/api/user/settings', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        profile: {
                            name: settings.profile.displayName,
                            organization: settings.profile.organization,
                            timezone: settings.profile.timezone,
                        },
                        bridgeDefaults: settings.bridgeDefaults,
                        notifications: settings.notifications,
                        apiKeys: settings.apiKeys,
                        preferences: {
                            ...settings.preferences,
                            theme: 'light', // Always save as light theme
                        },
                    }),
                });

                if (response.ok) {
                    toast({
                        title: "Success",
                        description: "Settings saved successfully!",
                    });
                } else {
                    throw new Error('Failed to save settings to database');
                }
            } else {
                // Fallback to localStorage if not authenticated
                localStorage.setItem('contextlayer-settings', JSON.stringify(settings));
                toast({
                    title: "Success",
                    description: "Settings saved locally!",
                });
            }

            // Ensure theme is synced with theme provider
            // DISABLED: Theme changing functionality temporarily disabled
            /*
            setTheme(settings.preferences.theme);
            localStorage.setItem('contextlayer-theme', settings.preferences.theme);
            */

            setHasChanges(false);

            // Simulate webhook notification if configured
            if (settings.notifications.webhookUrl) {
                try {
                    await fetch(settings.notifications.webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'settings_updated',
                            timestamp: new Date().toISOString(),
                            user: settings.profile.displayName || 'Unknown User',
                            changes: 'Settings have been updated'
                        })
                    });
                } catch (error) {
                    console.log('Webhook notification failed:', error);
                }
            }

            // Simulate auto-save behavior if enabled
            if (settings.preferences.autoSaveBridges) {
                console.log('Auto-save is enabled - bridges will be saved automatically');
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast({
                title: "Error",
                description: "Failed to save settings. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    }; const resetSettings = () => {
        setShowResetDialog(true);
    };

    const handleResetConfirm = () => {
        setSettings(defaultSettings);
        setHasChanges(true);
        setShowResetDialog(false);
    };

    const exportSettings = () => {
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'contextlayer-settings.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target?.result as string);
                    setSettings({ ...defaultSettings, ...imported });
                    setHasChanges(true);
                } catch {
                    toast({
                        title: "Import Failed",
                        description: "Failed to import settings file. Please check the file format.",
                        variant: "destructive",
                    });
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <div className="flex-1 space-y-4 font-mono">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your profile and bridge preferences
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={exportSettings}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import
                    </Button>
                    <input
                        id="import-file"
                        type="file"
                        accept=".json"
                        onChange={importSettings}
                        className="hidden"
                    />
                    <Button
                        onClick={saveSettings}
                        disabled={!hasChanges || saving}
                        className="relative"
                    >
                        {saving ? (
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        {saving ? 'Saving...' : 'Save'}
                        {hasChanges && !saving && (
                            <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                        )}
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="bridges">Bridges</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>

                {/* Profile Settings */}
                <TabsContent value="profile" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Profile Information
                            </CardTitle>
                            <CardDescription>
                                Your account details and contact information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Display Name</Label>
                                    <Input
                                        id="displayName"
                                        value={settings.profile.displayName}
                                        onChange={(e) => updateSettings('profile', 'displayName', e.target.value)}
                                        placeholder="Your name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={settings.profile.email}
                                        onChange={(e) => updateSettings('profile', 'email', e.target.value)}
                                        placeholder="your@email.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="organization">Organization</Label>
                                    <Input
                                        id="organization"
                                        value={settings.profile.organization}
                                        onChange={(e) => updateSettings('profile', 'organization', e.target.value)}
                                        placeholder="Your company"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Timezone</Label>
                                    <Select
                                        value={settings.profile.timezone}
                                        onValueChange={(value) => updateSettings('profile', 'timezone', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {timezones.map(tz => (
                                                <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Bridge Defaults */}
                <TabsContent value="bridges" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5" />
                                Bridge Defaults
                            </CardTitle>
                            <CardDescription>
                                Default settings applied to new bridges you create
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="defaultTimeout">Timeout (ms)</Label>
                                    <Input
                                        id="defaultTimeout"
                                        type="number"
                                        value={settings.bridgeDefaults.defaultTimeout}
                                        onChange={(e) => updateSettings('bridgeDefaults', 'defaultTimeout', parseInt(e.target.value))}
                                        min="1000"
                                        max="300000"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Request timeout (1-300 seconds)
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="retryAttempts">Retry Attempts</Label>
                                    <Input
                                        id="retryAttempts"
                                        type="number"
                                        value={settings.bridgeDefaults.defaultRetryAttempts}
                                        onChange={(e) => updateSettings('bridgeDefaults', 'defaultRetryAttempts', parseInt(e.target.value))}
                                        min="0"
                                        max="5"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Retries on failed requests (0-5)
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cacheDuration">Cache Duration (sec)</Label>
                                    <Input
                                        id="cacheDuration"
                                        type="number"
                                        value={settings.bridgeDefaults.cacheDuration}
                                        onChange={(e) => updateSettings('bridgeDefaults', 'cacheDuration', parseInt(e.target.value))}
                                        min="0"
                                        max="3600"
                                        disabled={true}
                                        className="opacity-50"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Coming soon - Response cache duration (0-3600 sec)
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="requestsPerMinute">Rate Limit (req/min)</Label>
                                    <Input
                                        id="requestsPerMinute"
                                        type="number"
                                        value={settings.bridgeDefaults.requestsPerMinute}
                                        onChange={(e) => updateSettings('bridgeDefaults', 'requestsPerMinute', parseInt(e.target.value))}
                                        min="1"
                                        max="1000"
                                        disabled={true}
                                        className="opacity-50"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Coming soon - Max requests per minute (1-1000)
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {/* DISABLED: Caching functionality not implemented yet */}
                                {/*
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="enableCaching"
                                        checked={settings.bridgeDefaults.enableCaching}
                                        onCheckedChange={(checked: boolean) => updateSettings('bridgeDefaults', 'enableCaching', checked)}
                                    />
                                    <Label htmlFor="enableCaching">Enable caching by default</Label>
                                </div>
                                */}
                                <div className="flex items-center space-x-2 opacity-50">
                                    <Switch
                                        id="enableCaching"
                                        checked={false}
                                        disabled={true}
                                    />
                                    <div>
                                        <Label htmlFor="enableCaching" className="text-muted-foreground">Enable caching by default</Label>
                                        <p className="text-xs text-muted-foreground">Coming soon - Response caching functionality</p>
                                    </div>
                                </div>

                                {/* DISABLED: Rate limiting functionality not implemented yet */}
                                {/*
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="enableRateLimiting"
                                        checked={settings.bridgeDefaults.enableRateLimiting}
                                        onCheckedChange={(checked: boolean) => updateSettings('bridgeDefaults', 'enableRateLimiting', checked)}
                                    />
                                    <Label htmlFor="enableRateLimiting">Enable rate limiting by default</Label>
                                </div>
                                */}
                                <div className="flex items-center space-x-2 opacity-50">
                                    <Switch
                                        id="enableRateLimiting"
                                        checked={false}
                                        disabled={true}
                                    />
                                    <div>
                                        <Label htmlFor="enableRateLimiting" className="text-muted-foreground">Enable rate limiting by default</Label>
                                        <p className="text-xs text-muted-foreground">Coming soon - Rate limiting functionality</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications */}
                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Notifications
                            </CardTitle>
                            <CardDescription>
                                Email notifications for bridge activity and updates
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                {/* DISABLED: Email notification system not implemented yet */}
                                {/*
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="emailNotifications"
                                        checked={settings.notifications.emailNotifications}
                                        onCheckedChange={(checked: boolean) => updateSettings('notifications', 'emailNotifications', checked)}
                                    />
                                    <div>
                                        <Label htmlFor="emailNotifications">Email notifications</Label>
                                        <p className="text-xs text-muted-foreground">
                                            General email updates about your bridges
                                        </p>
                                    </div>
                                </div>
                                */}
                                <div className="flex items-center space-x-2 opacity-50">
                                    <Switch
                                        id="emailNotifications"
                                        checked={false}
                                        disabled={true}
                                    />
                                    <div>
                                        <Label htmlFor="emailNotifications" className="text-muted-foreground">Email notifications</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Coming soon - General email updates about your bridges
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 opacity-50">
                                    <Switch
                                        id="bridgeFailureAlerts"
                                        checked={false}
                                        disabled={true}
                                    />
                                    <div>
                                        <Label htmlFor="bridgeFailureAlerts" className="text-muted-foreground">Failure alerts</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Coming soon - Immediate notifications when bridges fail
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 opacity-50">
                                    <Switch
                                        id="weeklyReports"
                                        checked={false}
                                        disabled={true}
                                    />
                                    <div>
                                        <Label htmlFor="weeklyReports" className="text-muted-foreground">Weekly reports</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Coming soon - Weekly summaries of bridge activity
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 opacity-50">
                                    <Switch
                                        id="maintenanceUpdates"
                                        checked={false}
                                        disabled={true}
                                    />
                                    <div>
                                        <Label htmlFor="maintenanceUpdates" className="text-muted-foreground">Maintenance updates</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Coming soon - Platform maintenance and new features
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <h4 className="text-sm font-medium mb-3 text-muted-foreground">Webhook Integrations (Coming Soon)</h4>
                                    <div className="space-y-4">
                                        <div className="space-y-2 opacity-50">
                                            <Label htmlFor="webhookUrl" className="text-muted-foreground">Generic Webhook URL</Label>
                                            <Input
                                                id="webhookUrl"
                                                type="url"
                                                placeholder="https://your-webhook-endpoint.com/notify"
                                                value={settings.notifications.webhookUrl}
                                                onChange={(e) => updateSettings('notifications', 'webhookUrl', e.target.value)}
                                                disabled={true}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Coming soon - JSON payload will be sent to this endpoint for bridge events
                                            </p>
                                        </div>
                                        <div className="space-y-2 opacity-50">
                                            <Label htmlFor="slackWebhookUrl" className="text-muted-foreground">Slack Webhook URL</Label>
                                            <Input
                                                id="slackWebhookUrl"
                                                type="url"
                                                placeholder="https://hooks.slack.com/services/..."
                                                value={settings.notifications.slackWebhookUrl}
                                                onChange={(e) => updateSettings('notifications', 'slackWebhookUrl', e.target.value)}
                                                disabled={true}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Coming soon - Formatted Slack messages for bridge notifications
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Preferences */}
                <TabsContent value="preferences" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings2 className="h-5 w-5" />
                                Application Preferences
                            </CardTitle>
                            <CardDescription>
                                Customize your ContextLayer experience
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                {/* DISABLED: Theme selection temporarily disabled */}
                                {/*
                                <div className="space-y-2">
                                    <Label>Theme</Label>
                                    <Select
                                        value={settings.preferences.theme}
                                        onValueChange={(value) => updateSettings('preferences', 'theme', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select theme" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="light">Light</SelectItem>
                                            <SelectItem value="dark">Dark</SelectItem>
                                            <SelectItem value="system">System</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                */}
                                <div className="space-y-2">
                                    <Label>Default Auth Type</Label>
                                    <Select
                                        value={settings.preferences.defaultAuthType}
                                        onValueChange={(value) => updateSettings('preferences', 'defaultAuthType', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No Authentication</SelectItem>
                                            <SelectItem value="bearer">Bearer Token</SelectItem>
                                            <SelectItem value="apikey">API Key</SelectItem>
                                            <SelectItem value="basic">Basic Auth</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="autoSaveBridges"
                                        checked={settings.preferences.autoSaveBridges}
                                        onCheckedChange={(checked: boolean) => updateSettings('preferences', 'autoSaveBridges', checked)}
                                    />
                                    <div>
                                        <Label htmlFor="autoSaveBridges">Auto-save bridges</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Coming soon - Automatically save as you work
                                        </p>
                                    </div>
                                </div>
                                {/* DISABLED: Show advanced options functionality not implemented yet */}
                                {/*
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="showAdvancedOptions"
                                        checked={settings.preferences.showAdvancedOptions}
                                        onCheckedChange={(checked: boolean) => updateSettings('preferences', 'showAdvancedOptions', checked)}
                                    />
                                    <div>
                                        <Label htmlFor="showAdvancedOptions">Show advanced options</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Display advanced settings in forms
                                        </p>
                                    </div>
                                </div>
                                */}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reset Section */}
                    <Card className="border-muted">
                        <CardHeader>
                            <CardTitle className="text-muted-foreground">Reset Settings</CardTitle>
                            <CardDescription>
                                Reset all settings to default values
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={resetSettings}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Reset to Defaults
                                </Button>
                                <Button variant="outline" onClick={() => window.location.reload()}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Reload App
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {hasChanges && (
                <div className="fixed bottom-4 right-4 p-4 bg-card border rounded-lg shadow-lg">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span>Unsaved changes</span>
                        <Button size="sm" onClick={saveSettings} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
            )}

            <ConfirmationDialog
                open={showResetDialog}
                onOpenChange={setShowResetDialog}
                onConfirm={handleResetConfirm}
                title="Reset Settings"
                description="Are you sure you want to reset all settings to defaults? This action cannot be undone."
                confirmText="Reset to Defaults"
                cancelText="Cancel"
            />
        </div>
    );
}