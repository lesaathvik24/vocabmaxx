'use client'

export type PushStatus = 'unsupported' | 'unconfigured' | 'blocked' | 'subscribed' | 'unsubscribed'

export function isPushSupported(): boolean {
    return (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    )
}

function vapidPublicKey(): string | undefined {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4)
    const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = window.atob(normalized)
    return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export async function getPushStatus(): Promise<PushStatus> {
    if (!isPushSupported()) return 'unsupported'
    if (!vapidPublicKey()) return 'unconfigured'
    if (Notification.permission === 'denied') return 'blocked'

    const registration = await navigator.serviceWorker.getRegistration('/sw.js')
    const subscription = await registration?.pushManager.getSubscription()
    return subscription ? 'subscribed' : 'unsubscribed'
}

/**
 * Full enable flow: register the service worker, ask permission, subscribe
 * with the VAPID key, and persist the subscription server-side.
 * Throws with a user-presentable message on any hard failure.
 */
export async function enablePush(): Promise<void> {
    if (!isPushSupported()) throw new Error('This browser does not support notifications.')
    const key = vapidPublicKey()
    if (!key) throw new Error('Push notifications are not configured for this deployment.')

    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
        throw new Error('Notifications were not allowed. You can enable them in your browser settings.')
    }

    const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
        }))

    const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
    })
    if (!res.ok) {
        await subscription.unsubscribe().catch(() => undefined)
        throw new Error('Could not save the subscription. Try again.')
    }
}

export async function disablePush(): Promise<void> {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js')
    const subscription = await registration?.pushManager.getSubscription()
    if (!subscription) return

    const endpoint = subscription.endpoint
    await subscription.unsubscribe().catch(() => undefined)
    await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint }),
    }).catch(() => undefined)
}
