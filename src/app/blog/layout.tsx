import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Blog & Updates - ContextLayer',
    description: 'Latest news, updates, and guides about MCP bridge development and API integration best practices.',
    keywords: [
        'MCP blog',
        'API integration news',
        'ContextLayer updates',
        'Model Context Protocol guides',
        'API bridge tutorials'
    ],
    openGraph: {
        title: 'Blog & Updates - ContextLayer',
        description: 'Latest news and guides about MCP bridge development.',
        type: 'website',
    },
};

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Blog & Updates</h1>
                <p className="text-muted-foreground mt-2">
                    Latest news, updates, and guides about MCP development
                </p>
            </div>
            {children}
        </div>
    );
}
