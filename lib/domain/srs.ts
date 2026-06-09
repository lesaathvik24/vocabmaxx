import { Grade } from './grade'

export interface SRSState {
    easeFactor: number
    intervalDays: number
    repetitions: number
}

export interface SRSResult {
    state: SRSState
    dueDate: Date
}

const MS_PER_DAY = 86_400_000

export function nextState(
    current: SRSState,
    grade: Grade,
    now: Date = new Date(),
): SRSResult {
    let reps: number
    let interval: number

    if (grade === Grade.Again) {
        reps = 0
        interval = 1
    } else {
        reps = current.repetitions + 1
        if (reps === 1) interval = 1
        else if (reps === 2) interval = 6
        else interval = Math.round(current.intervalDays * current.easeFactor)
    }

    const g = grade
    let ease = current.easeFactor + (0.1 - (5 - g) * (0.08 + (5 - g) * 0.02))
    ease = Math.max(1.3, ease)

    return {
        state: { easeFactor: ease, intervalDays: interval, repetitions: reps },
        dueDate: new Date(now.getTime() + interval * MS_PER_DAY),
    }
}

export const initialSRSState: SRSState = { easeFactor: 2.5, intervalDays: 0, repetitions: 0 }
