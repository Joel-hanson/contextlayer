import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'ContextLayer - MCP Bridge Platform',
        short_name: 'ContextLayer',
        description: 'Transform REST APIs into Model Context Protocol servers',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#18181b', // Changed to zinc-900 from shadcn zinc theme
        icons: [
            {
                src: '/android-chrome-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/android-chrome-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
