import * as Sentry from '@sentry/nextjs'

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    debug: false,
    beforeSend(event) {
        if (event.request?.cookies) delete event.request.cookies
        if (event.request?.headers) {
            if ('cookie' in event.request.headers) event.request.headers.cookie = undefined as unknown as string
            if ('authorization' in event.request.headers) event.request.headers.authorization = undefined as unknown as string
        }
        if (event.user) {
            delete event.user.email
            delete event.user.ip_address
            delete event.user.username
        }
        if (event.breadcrumbs) {
            for (const b of event.breadcrumbs) {
                if ((b.category === 'fetch' || b.category === 'xhr') && b.data?.request_headers) {
                    const h = b.data.request_headers as Record<string, unknown>
                    if (h.cookie !== undefined) h.cookie = undefined
                    if (h.authorization !== undefined) h.authorization = undefined
                }
            }
        }
        return event
    },
})
