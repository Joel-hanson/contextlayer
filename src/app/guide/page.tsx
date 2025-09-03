import { DashboardLayout } from '@/components/DashboardLayout';
import { QuickGuide } from '@/components/QuickGuide';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Quick Start Guide - Learn How to Bridge APIs',
    description: 'Step-by-step guide to transform your REST APIs into Model Context Protocol (MCP) servers. Learn to configure authentication, endpoints, and connect AI assistants.',
    keywords: [
        'MCP guide',
        'API bridge tutorial',
        'Model Context Protocol setup',
        'REST API integration',
        'Claude Desktop setup',
        'AI assistant configuration'
    ],
    openGraph: {
        title: 'Quick Start Guide - ContextLayer',
        description: 'Step-by-step guide to transform your REST APIs into Model Context Protocol (MCP) servers.',
        type: 'article',
    },
};

export default function GuidePage() {
    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 font-mono">
                <QuickGuide />
            </div>
        </DashboardLayout>
    );
}
