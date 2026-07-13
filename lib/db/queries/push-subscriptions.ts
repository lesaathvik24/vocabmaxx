import 'server-only'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '../client'
import { pushSubscriptions } from '../schema'

export interface PushSubscriptionRow {
    id: string
    userId: string
    endpoint: string
    p256dh: string
    auth: string
}

export interface SubscriptionInput {
    endpoint: string
    p256dh: string
    auth: string
}

/**
 * Insert-or-update by endpoint: a browser re-subscribing (or a device changing
 * hands between accounts) replaces the existing row rather than duplicating it.
 */
export async function upsert(userId: string, sub: SubscriptionInput): Promise<void> {
    await db
        .insert(pushSubscriptions)
        .values({ userId, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth })
        .onConflictDoUpdate({
            target: pushSubscriptions.endpoint,
            set: { userId, p256dh: sub.p256dh, auth: sub.auth },
        })
}

export async function removeByEndpoint(userId: string, endpoint: string): Promise<boolean> {
    const deleted = await db
        .delete(pushSubscriptions)
        .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)))
        .returning({ id: pushSubscriptions.id })
    return deleted.length > 0
}

/** Server-side prune for endpoints the push service reports as gone (404/410). */
export async function removeStale(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))
}

export async function listByUser(userId: string): Promise<PushSubscriptionRow[]> {
    return db
        .select({
            id: pushSubscriptions.id,
            userId: pushSubscriptions.userId,
            endpoint: pushSubscriptions.endpoint,
            p256dh: pushSubscriptions.p256dh,
            auth: pushSubscriptions.auth,
        })
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId))
}

/** Every user with at least one push subscription (digest fan-out). */
export async function listSubscribedUserIds(): Promise<{ userId: string }[]> {
    return db
        .selectDistinct({ userId: pushSubscriptions.userId })
        .from(pushSubscriptions)
        .orderBy(sql`1`)
}
