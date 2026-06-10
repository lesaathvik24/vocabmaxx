/**
 * Pure, client-safe helpers for the dashboard summary tiles: review streak and
 * the weekly sparkline. No DB, no `server-only` — unit-tested in isolation.
 */

export function dayKey(d: Date): string {
    return d.toISOString().slice(0, 10)
}

/**
 * Consecutive-day review streak ending today. A one-day grace applies: if the
 * user has not reviewed yet *today*, the streak is counted from yesterday so it
 * stays visible until the day actually lapses.
 */
export function computeStreak(reviewDays: Iterable<string>, today: string): number {
    const set = reviewDays instanceof Set ? reviewDays : new Set(reviewDays)
    const cursor = new Date(`${today}T00:00:00.000Z`)
    if (!set.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1)

    let streak = 0
    while (set.has(dayKey(cursor))) {
        streak++
        cursor.setUTCDate(cursor.getUTCDate() - 1)
    }
    return streak
}

/**
 * Dense `days`-length array of review counts ending today (oldest → today),
 * expanded from sparse per-day counts. Missing days are 0.
 */
export function buildDailyHistory(
    daily: { day: string; count: number }[],
    now: Date,
    days = 7,
): number[] {
    const byDay = new Map(daily.map((d) => [d.day, d.count]))
    const start = new Date(now)
    start.setUTCDate(start.getUTCDate() - (days - 1))

    const out: number[] = []
    for (let i = 0; i < days; i++) {
        const d = new Date(start)
        d.setUTCDate(start.getUTCDate() + i)
        out.push(byDay.get(dayKey(d)) ?? 0)
    }
    return out
}
