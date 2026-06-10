/**
 * Pure SVG geometry helpers for the insights charts. No React, no DOM — just math,
 * so the path generation can be unit-tested.
 */

export interface SeriesPoint {
    date: string
    cumulative: number
}

export interface GrowthGeometry {
    /** SVG `d` for the line stroke. */
    line: string
    /** SVG `d` for the filled area (closed to the baseline). */
    area: string
    /** Plotted coordinates, in order. */
    coords: { x: number; y: number }[]
    /** Max value used for the y-scale. */
    max: number
}

/**
 * Map a cumulative series into SVG coordinates within a `width`×`height` box,
 * leaving `pad` px of inset on every side. The y-axis runs 0..max (max ≥ 1 so a
 * flat-zero series still renders along the bottom).
 */
export function buildGrowthGeometry(
    points: SeriesPoint[],
    width: number,
    height: number,
    pad = 4,
): GrowthGeometry {
    const max = Math.max(1, ...points.map((p) => p.cumulative))
    const innerW = width - pad * 2
    const innerH = height - pad * 2
    const n = points.length

    const coords = points.map((p, i) => {
        const x = n <= 1 ? pad + innerW / 2 : pad + (innerW * i) / (n - 1)
        const y = pad + innerH * (1 - p.cumulative / max)
        return { x: round(x), y: round(y) }
    })

    if (coords.length === 0) {
        return { line: '', area: '', coords, max }
    }

    const line = coords
        .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x} ${c.y}`)
        .join(' ')

    const baseY = round(height - pad)
    const first = coords[0]
    const last = coords[coords.length - 1]
    const area = `M${first.x} ${baseY} ${coords
        .map((c) => `L${c.x} ${c.y}`)
        .join(' ')} L${last.x} ${baseY} Z`

    return { line, area, coords, max }
}

function round(n: number): number {
    return Math.round(n * 100) / 100
}
