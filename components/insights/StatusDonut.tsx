interface StatusDonutProps {
    mastered: number
    learning: number
    fresh: number
}

const R = 15.9155 // circumference ≈ 100 → dasharray values read as percentages

interface Seg {
    label: string
    value: number
    color: string
    dot: string
}

export function StatusDonut({ mastered, learning, fresh }: StatusDonutProps) {
    const total = mastered + learning + fresh
    const segs: Seg[] = [
        { label: 'Mastered', value: mastered, color: '#1f9e6a', dot: '#1f9e6a' },
        { label: 'Learning', value: learning, color: '#2f5bea', dot: '#2f5bea' },
        { label: 'New', value: fresh, color: '#e8863b', dot: '#e8863b' },
    ]

    let cumulative = 0

    return (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 font-display text-lg font-semibold">Library by status</h2>

            {total === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    Capture words to see your library breakdown.
                </p>
            ) : (
                <div className="flex items-center gap-6">
                    <svg width="128" height="128" viewBox="0 0 42 42" className="flex-none" role="img" aria-label="Library by status">
                        <circle cx="21" cy="21" r={R} fill="none" stroke="var(--color-line-2)" strokeWidth="7" />
                        {segs.map((s) => {
                            const pct = (s.value / total) * 100
                            const el = (
                                <circle
                                    key={s.label}
                                    cx="21"
                                    cy="21"
                                    r={R}
                                    fill="none"
                                    stroke={s.color}
                                    strokeWidth="7"
                                    strokeDasharray={`${pct} ${100 - pct}`}
                                    strokeDashoffset={-cumulative}
                                    transform="rotate(-90 21 21)"
                                />
                            )
                            cumulative += pct
                            return el
                        })}
                        <text x="21" y="20.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--color-foreground)" className="num">
                            {total}
                        </text>
                        <text x="21" y="26" textAnchor="middle" fontSize="3.2" fill="var(--color-slate-2)">
                            words
                        </text>
                    </svg>

                    <ul className="flex flex-1 flex-col gap-2.5">
                        {segs.map((s) => (
                            <li key={s.label} className="flex items-center gap-2.5 text-[13px]">
                                <span className="h-2.5 w-2.5 flex-none rounded-[3px]" style={{ background: s.dot }} aria-hidden="true" />
                                {s.label}
                                <b className="num ml-auto font-semibold">{s.value}</b>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    )
}
