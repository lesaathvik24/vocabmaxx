import { buildGrowthGeometry, type SeriesPoint } from '@/lib/insights/chart'

interface GrowthChartProps {
    data: SeriesPoint[]
}

const VIEW_W = 600
const VIEW_H = 180
const PAD = 8

function fmtDay(iso: string): string {
    return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
    })
}

export function GrowthChart({ data }: GrowthChartProps) {
    const geo = buildGrowthGeometry(data, VIEW_W, VIEW_H, PAD)
    const total = data.length ? data[data.length - 1].cumulative : 0
    const start = data.length ? data[0].cumulative : 0
    const gained = total - start

    return (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-baseline justify-between">
                <div>
                    <h2 className="font-display text-lg font-semibold">Vocabulary growth</h2>
                    <p className="text-xs text-muted-foreground">
                        {data.length ? `Last ${data.length} days` : 'No data yet'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-semibold tabular-nums">{total}</p>
                    <p className="text-xs text-muted-foreground">
                        {gained > 0 ? `+${gained} this window` : 'total words'}
                    </p>
                </div>
            </div>

            {data.length === 0 ? (
                <div className="flex h-[140px] items-center justify-center text-sm text-muted-foreground">
                    Capture words to see your growth curve.
                </div>
            ) : (
                <>
                    <svg
                        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                        className="h-[160px] w-full"
                        preserveAspectRatio="none"
                        role="img"
                        aria-label={`Vocabulary growth: ${total} words total`}
                    >
                        <path d={geo.area} className="fill-accent/15" />
                        <path
                            d={geo.line}
                            className="fill-none stroke-accent"
                            strokeWidth={2}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>
                    <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                        <span>{fmtDay(data[0].date)}</span>
                        <span>{fmtDay(data[data.length - 1].date)}</span>
                    </div>
                </>
            )}
        </section>
    )
}
