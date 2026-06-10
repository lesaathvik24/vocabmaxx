import { describe, it, expect } from 'vitest'
import { buildGrowthGeometry } from '@/lib/insights/chart'

describe('buildGrowthGeometry', () => {
    it('returns empty paths for no points', () => {
        const g = buildGrowthGeometry([], 100, 40)
        expect(g.line).toBe('')
        expect(g.area).toBe('')
        expect(g.coords).toHaveLength(0)
    })

    it('centres a single point horizontally', () => {
        const g = buildGrowthGeometry([{ date: 'd', cumulative: 5 }], 100, 40, 4)
        expect(g.coords).toHaveLength(1)
        expect(g.coords[0].x).toBeCloseTo(50) // 4 + (92)/2
    })

    it('spreads points across the inner width', () => {
        const g = buildGrowthGeometry(
            [
                { date: 'a', cumulative: 0 },
                { date: 'b', cumulative: 10 },
            ],
            100,
            40,
            4,
        )
        expect(g.coords[0].x).toBeCloseTo(4)
        expect(g.coords[1].x).toBeCloseTo(96)
    })

    it('maps the max value to the top (smallest y) and 0 to the bottom', () => {
        const g = buildGrowthGeometry(
            [
                { date: 'a', cumulative: 0 },
                { date: 'b', cumulative: 10 },
            ],
            100,
            40,
            4,
        )
        // cumulative 10 == max → top inset (y = pad)
        expect(g.coords[1].y).toBeCloseTo(4)
        // cumulative 0 → bottom inset (y = height - pad)
        expect(g.coords[0].y).toBeCloseTo(36)
        expect(g.max).toBe(10)
    })

    it('line path starts with M and area path is closed with Z', () => {
        const g = buildGrowthGeometry(
            [
                { date: 'a', cumulative: 1 },
                { date: 'b', cumulative: 2 },
            ],
            100,
            40,
        )
        expect(g.line.startsWith('M')).toBe(true)
        expect(g.area.endsWith('Z')).toBe(true)
    })

    it('uses a floor max of 1 so an all-zero series still renders along the bottom', () => {
        const g = buildGrowthGeometry(
            [
                { date: 'a', cumulative: 0 },
                { date: 'b', cumulative: 0 },
            ],
            100,
            40,
            4,
        )
        expect(g.max).toBe(1)
        expect(g.coords.every((c) => c.y === 36)).toBe(true)
    })
})
