# ADR 0006 — SM-2 as the spaced repetition algorithm

**Status:** Accepted
**Date:** 2026-06-07

---

## Context

VocabMaxx's core retention mechanism is spaced repetition. The algorithm determines how often each word is reviewed. Getting this wrong — too frequent, too rare, poorly adapted — is the difference between a tool that works and one that gets abandoned.

Two algorithms are in serious contention in 2026: SM-2 (the classic) and FSRS (the modern ML-based replacement).

## Decision

Use **SM-2** for v1.

The implementation lives in `lib/domain/srs.ts` as a pure, deterministic function. The algorithm is explicitly isolated behind this interface so it can be replaced in v2 without touching the persistence layer.

```typescript
export function nextState(current: SRSState, grade: Grade, now: Date): SRSResult
```

## The SM-2 algorithm (summary)

```
on grade = Again:
    reps = 0, interval = 1

on grade ∈ {Hard, Good, Easy}:
    reps += 1
    interval =
        if reps == 1: 1
        if reps == 2: 6
        else: round(interval × easeFactor)

easeFactor += 0.1 - (5 - grade) × (0.08 + (5 - grade) × 0.02)
easeFactor = max(1.3, easeFactor)

dueDate = now + interval days
```

Full worked example in [`TECH_SPEC.md §3`](../TECH_SPEC.md).

## Alternatives considered

### 1. FSRS (Free Spaced Repetition Scheduler)
- Anki's new default as of 2023. Significantly better at scheduling than SM-2 for most users.
- Driven by a forgetting-curve model with two parameters (Difficulty, Stability) fit to user review history.
- Outperforms SM-2 measurably at scale — ~10-15% better retention per unit time studied.
- Requires > 1,000 reviews to tune well; before that, uses global priors.
- Implementation: ~300 lines of non-trivial math vs SM-2's ~40 lines.
- **Rejected for v1 because:**
  - Solo dev, single user, < 1,000 reviews initially — FSRS's advantage is invisible until there's data.
  - Implementation complexity adds risk of subtle bugs that corrupt schedules.
  - The interface isolation means we can swap in v2 once we have enough review history to tune FSRS parameters.

### 2. Leitner boxes (5-box system)
- Dead simple: right answer → next box; wrong answer → box 1.
- Fixed review intervals (1, 3, 7, 14, 30 days per box).
- Recruiter-legible but technically inferior — no adaptive ease factor.
- Rejected: SM-2 is only marginally more complex and substantially better.

### 3. "Streaks" / daily minimums (not SRS at all)
- No algorithm — just "do 10 cards a day."
- Gamified; no scientific basis for retention.
- Rejected: the whole point is scientifically-grounded retention.

## Consequences

### Positive
- **Well-understood** — SM-2 has decades of research validation; Anki uses it and has ~10M users.
- **Simple implementation** — 40 lines, easy to unit test exhaustively.
- **Interface isolation** — `nextState` is a pure function; the scheduler can change without touching DB or UI.

### Negative
- **Not optimal** — FSRS beats SM-2 for high-volume users. This matters at > 1,000 reviews.
- **Ease factor can drift** — consecutive Hard grades push ease toward the floor (1.3) which compresses all intervals. Known SM-2 pathology; addressed in Anki via "easy bonus." We'll monitor and patch if needed.

## Migration path to FSRS (v2)

1. Collect > 1,000 review events in `review_log`.
2. Implement FSRS in `lib/domain/srs-fsrs.ts` behind the same `nextState` interface.
3. Run a parallel simulation against historical `review_log` data — compare schedules.
4. If FSRS schedules are clearly better (> 5% predicted retention improvement), swap.
5. Migration: for each word, reset `srs_state` to FSRS priors (don't try to convert SM-2 state to FSRS state — different models).

## Verification

- 15+ unit tests in `tests/unit/srs.test.ts` cover the worked-example table and edge cases.
- All test values are independently verified against the SM-2 spec.
- Grade distribution in `review_log` over time should show declining Again% (users are retaining words).

## References

- SM-2 algorithm paper: Wozniak, P.A. (1999). "SuperMemo 2".
- FSRS: Ye, S. (2022). "A Stochastic Shortest Path Algorithm for Optimizing Spaced Repetition Scheduling."
- Implementation: `lib/domain/srs.ts`.
