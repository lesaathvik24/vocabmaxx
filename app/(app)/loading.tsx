import { Skeleton } from '@/components/ui/skeleton'

/**
 * Shown instantly by Next.js while a route segment's server component fetches
 * its data. Without this, navigating between tabs (Dashboard, Review, Words…)
 * appears to "hang" on the previous page until the server responds. This
 * skeleton makes every tab switch feel immediate.
 */
export default function AppLoading() {
    return (
        <div className="space-y-6" aria-busy="true" aria-label="Loading">
            <div className="space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-24 w-full rounded-2xl" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.55fr_1fr]">
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
            </div>
        </div>
    )
}
