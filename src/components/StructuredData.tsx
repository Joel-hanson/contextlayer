'use client';

import Head from 'next/head';

interface StructuredDataProps {
    data: object;
}

export function StructuredData({ data }: StructuredDataProps) {
    return (
        <Head>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
            />
        </Head>
    );
}

// Predefined structured data schemas
export const schemas = {
    organization: {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "ContextLayer",
        "url": process.env.NEXT_PUBLIC_URL || "https://contextlayer.tech",
        "logo": `${process.env.NEXT_PUBLIC_URL || "https://contextlayer.tech"}/logo.png`,
        "description": "Transform any REST API into Model Context Protocol (MCP) servers that AI assistants can use.",
        "foundingDate": "2024",
        "sameAs": [
            "https://github.com/Joel-hanson/contextlayer"
        ]
    },

    softwareApplication: {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "ContextLayer",
        "applicationCategory": "DeveloperApplication",
        "description": "Transform any REST API into Model Context Protocol (MCP) servers that AI assistants like Claude Desktop can use. Web-based configuration, secure authentication, and automatic tool generation.",
        "url": process.env.NEXT_PUBLIC_URL || "https://contextlayer.tech",
        "operatingSystem": "Web Browser",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "creator": {
            "@type": "Organization",
            "name": "ContextLayer"
        },
        "featureList": [
            "Web-based API configuration",
            "Secure authentication support",
            "Automatic MCP tool generation",
            "Universal REST API compatibility",
            "Bridge management dashboard",
            "Configuration templates"
        ]
    },

    howTo: (title: string, steps: string[]) => ({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": title,
        "description": "Step-by-step guide to transform REST APIs into MCP servers",
        "step": steps.map((step, index) => ({
            "@type": "HowToStep",
            "position": index + 1,
            "name": `Step ${index + 1}`,
            "text": step
        }))
    }),

    article: (title: string, description: string, datePublished?: string, dateModified?: string) => ({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "author": {
            "@type": "Organization",
            "name": "ContextLayer"
        },
        "publisher": {
            "@type": "Organization",
            "name": "ContextLayer",
            "logo": {
                "@type": "ImageObject",
                "url": `${process.env.NEXT_PUBLIC_URL || "https://contextlayer.tech"}/logo.png`
            }
        },
        "datePublished": datePublished || new Date().toISOString(),
        "dateModified": dateModified || new Date().toISOString()
    })
};
