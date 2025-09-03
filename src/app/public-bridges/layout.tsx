import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Public Bridge Gallery - Explore Community MCP Servers',
    description: 'Browse and discover public MCP bridge configurations created by the community. Find ready-to-use API bridges for popular services and learn from real-world examples.',
    keywords: [
        'public MCP bridges',
        'community bridges',
        'MCP examples',
        'API bridge gallery',
        'shared configurations',
        'MCP server examples'
    ],
    openGraph: {
        title: 'Public Bridge Gallery - ContextLayer',
        description: 'Browse and discover public MCP bridge configurations created by the community.',
        type: 'website',
    },
};

export default function PublicBridgesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
