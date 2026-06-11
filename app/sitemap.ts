import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date()
    return [
        { url: siteUrl, lastModified, changeFrequency: 'weekly', priority: 1 },
        { url: `${siteUrl}/auth/sign-up`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${siteUrl}/auth/sign-in`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    ]
}
