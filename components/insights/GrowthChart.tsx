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
        <section className="rounded-[18px] border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-baseline justify-between">
                <div>
                    <h2 className="font-display text-lg font-semibold">Vocabulary growth</h2>
                    <p className="text-xs text-muted-foreground">
                        {data.length ? `Last ${data.length} days` : 'No data yet'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="num text-[28px] font-bold tracking-tight leading-none text-accent">{total}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
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
                        <defs>
                            <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor="#2f5bea" stopOpacity="0.22" />
                                <stop offset="1" stopColor="#2f5bea" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {[0.25, 0.5, 0.75].map((f) => (
                            <line
                                key={f}
                                x1={0}
                                x2={VIEW_W}
                                y1={VIEW_H * f}
                                y2={VIEW_H * f}
                                stroke="var(--color-line-2)"
                                strokeWidth={1}
                                vectorEffect="non-scaling-stroke"
                            />
                        ))}
                        <path d={geo.area} fill="url(#growthFill)" />
                        <path
                            d={geo.line}
                            className="fill-none stroke-accent"
                            strokeWidth={3}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>
                    <div className="num mt-2 flex justify-between text-[11px] text-faint">
                        <span>{fmtDay(data[0].date)}</span>
                        <span>{fmtDay(data[data.length - 1].date)}</span>
                    </div>
                </>
            )}
        </section>
    )
}
