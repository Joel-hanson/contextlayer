import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://contextlayer.tech'

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/dashboard/',
                    '/admin/',
                    '/auth/',
                    '/mcp/',
                    '/_next/',
                    '/static/',
                ],
            },
            {
                userAgent: '*',
                allow: [
                    '/guide',
                    '/public-bridges',
                    '/feedback',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
