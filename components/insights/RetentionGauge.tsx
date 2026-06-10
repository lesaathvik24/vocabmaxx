interface RetentionGaugeProps {
    /** 0..1 */
    rate: number
    windowDays: number
    /** Total reviews in the window (drives the empty state). */
    sampleSize: number
}

const SIZE = 160
const STROKE = 14
const RADIUS = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * RADIUS

function tone(rate: number): string {
    if (rate >= 0.85) return 'stroke-success'
    if (rate >= 0.6) return 'stroke-warning'
    return 'stroke-destructive'
}

export function RetentionGauge({ rate, windowDays, sampleSize }: RetentionGaugeProps) {
    const pct = Math.round(rate * 100)
    const dash = CIRC * rate

    return (
        <section className="flex flex-col items-center rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 w-full text-left">
                <h2 className="font-display text-lg font-semibold">Retention</h2>
                <p className="text-xs text-muted-foreground">Pass rate · last {windowDays} days</p>
            </div>

            {sampleSize === 0 ? (
                <div className="flex h-[160px] items-center justify-center text-center text-sm text-muted-foreground">
                    Review some cards to measure retention.
                </div>
            ) : (
                <>
                    <div className="relative" style={{ width: SIZE, height: SIZE }}>
                        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full -rotate-90">
                            <circle
                                cx={SIZE / 2}
                                cy={SIZE / 2}
                                r={RADIUS}
                                className="fill-none stroke-muted"
                                strokeWidth={STROKE}
                            />
                            <circle
                                cx={SIZE / 2}
                                cy={SIZE / 2}
                                r={RADIUS}
                                className={`fill-none ${tone(rate)}`}
                                strokeWidth={STROKE}
                                strokeLinecap="round"
                                strokeDasharray={`${dash} ${CIRC - dash}`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-semibold tabular-nums">{pct}%</span>
                            <span className="text-[11px] text-muted-foreground">
                                {sampleSize} review{sampleSize === 1 ? '' : 's'}
                            </span>
                        </div>
                    </div>
                </>
            )}
        </section>
    )
}
