import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',
                '/dashboard',
                '/capture',
                '/words',
                '/review',
                '/insights',
                '/settings',
                '/algorithm',
            ],
        },
        sitemap: `${siteUrl}/sitemap.xml`,
        host: siteUrl,
    }
}
