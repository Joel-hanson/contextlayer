import { Metadata } from 'next';

export interface SEOConfig {
    title: string;
    description: string;
    keywords?: string[];
    image?: string;
    url?: string;
    type?: 'website' | 'article';
    publishedTime?: string;
    modifiedTime?: string;
}

export function generateSEOMetadata(config: SEOConfig): Metadata {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://contextlayer.tech';

    return {
        title: config.title,
        description: config.description,
        keywords: config.keywords,
        openGraph: {
            title: config.title,
            description: config.description,
            url: config.url || baseUrl,
            siteName: 'ContextLayer',
            locale: 'en_US',
            type: config.type || 'website',
            images: [
                {
                    url: config.image || '/og-image.png',
                    width: 1200,
                    height: 630,
                    alt: config.title,
                }
            ],
            publishedTime: config.publishedTime,
            modifiedTime: config.modifiedTime,
        },
        twitter: {
            card: 'summary_large_image',
            title: config.title,
            description: config.description,
            images: [config.image || '/og-image.png'],
            creator: '@contextlayer',
        },
        alternates: {
            canonical: config.url || baseUrl,
        },
    };
}

// Common SEO keywords for the application
export const commonKeywords = [
    'MCP',
    'Model Context Protocol',
    'MCP server',
    'MCP tools',
    'REST API',
    'AI tools',
    'Claude Desktop',
    'AI assistant',
    'API integration',
    'developer tools',
    'API to MCP',
    'AI automation',
    'REST to MCP converter',
    'MCP bridge',
    'MCP configuration',
];

// Page-specific SEO configurations
export const pageConfigs = {
    home: {
        title: 'ContextLayer - Transform REST APIs into MCP Servers',
        description: 'Transform any REST API into Model Context Protocol (MCP) servers that AI assistants like Claude Desktop can use. Web-based configuration, secure authentication, and automatic tool generation.',
        keywords: [...commonKeywords, 'MCP platform', 'MCP server generator', 'Model Context Protocol platform'],
    },
    guide: {
        title: 'Quick Start Guide - Learn How to Create MCP Servers',
        description: 'Step-by-step guide to transform your REST APIs into Model Context Protocol (MCP) servers. Learn to configure authentication, endpoints, and connect AI assistants.',
        keywords: [...commonKeywords, 'MCP guide', 'MCP tutorial', 'MCP setup guide', 'Model Context Protocol tutorial'],
    },
    publicBridges: {
        title: 'Public MCP Gallery - Explore Community MCP Servers',
        description: 'Browse and discover public MCP server configurations created by the community. Find ready-to-use MCP servers for popular services.',
        keywords: [...commonKeywords, 'public MCP servers', 'community MCP examples', 'MCP gallery', 'MCP marketplace'],
    },
    docs: {
        title: 'Documentation - MCP Setup & Configuration Guide',
        description: 'Complete documentation for setting up Model Context Protocol (MCP) servers with Claude Desktop, VS Code, and other AI assistants.',
        keywords: [...commonKeywords, 'MCP documentation', 'MCP setup guide', 'Model Context Protocol docs'],
    },
    dashboard: {
        title: 'Dashboard - Manage Your MCP Servers',
        description: 'Manage your MCP servers, monitor usage, and configure Model Context Protocol endpoints from your personalized dashboard.',
        keywords: [...commonKeywords, 'MCP dashboard', 'MCP management', 'MCP monitoring'],
    },
} as const;
