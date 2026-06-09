# ADR 0005 — Hybrid definition pipeline (Dictionary API → LLM fallback)

**Status:** Accepted (LLM provider superseded by [ADR 0007](0007-deepseek-over-anthropic.md) — pipeline shape unchanged)
**Date:** 2026-06-07

---

## Context

When a user captures a word, VocabMaxx needs to produce:
1. A concise, accurate definition (≤ 25 words).
2. Two or three natural usage examples from real-world contexts (podcasts, journalism, conversation).
3. Attribution of where the definition came from.

The choice of data source directly affects quality, latency, cost, and reliability.

## Decision

Use a **hybrid pipeline**: free dictionary API first, LLM fallback second, shared definition cache across all users.

```
                  ┌─────────────────────────┐
                  │ Check definition_cache   │
                  └───────────┬─────────────┘
                    hit │         │ miss
                        ▼         ▼
                   return     GET dictionaryapi.dev
                              /api/v2/entries/en/{term}
                              │
                  has examples?
                    yes │       │ no
                        ▼       ▼
                   return    call LLM (Anthropic Haiku)
                             parse strict JSON
                             │
                   ok  │           │ error
                       ▼           ▼
                  return       return typed error
                               (no_fallback_available
                               | malformed_llm_response)
               ↓
          write to definition_cache (shared, no user_id)
```

LLM model: `claude-haiku-4-5-20251001` — fastest and cheapest in the Anthropic family. At ~$0.001/word for rare words, the cost for personal use is negligible.

## Alternatives considered

### 1. LLM-only
- Uniform quality for all words; no gap between common and rare.
- ~$0.001/word × 1000 words = $1 total for a typical user. Acceptable.
- Latency: 1-3s per word vs < 200ms for a dict cache hit.
- Rejected: the majority of words (common English) are well-served by a free dictionary at 10x lower latency. Burning LLM tokens on "happy" is wasteful.

### 2. Dictionary-only (no LLM)
- Zero variable cost, fastest latency.
- dictionaryapi.dev has no examples for many technical, literary, or rare words.
- For a vocab-maxxing use case, the rare words are the most important.
- Rejected: gaps in the most important part of the target vocabulary.

### 3. Merriam-Webster / Oxford API
- Higher quality dictionary; real corpus examples.
- Free tier: 1,000 calls/day (MW). Paid tiers are expensive.
- Rejected: the free tier is fine per-user but fails the shared-cache model if many users capture the same word concurrently.

### 4. Wordnik API
- Generous free tier; rich example sentences from real texts.
- Less maintained; JSON shape less consistent than dictionaryapi.dev.
- Considered: could replace dictionaryapi.dev in v2 if example quality needs improvement.

### 5. Perplexity / GPT-4o as LLM
- OpenAI support included as an env-var toggle (`OPENAI_API_KEY`).
- Rejected as the default: Anthropic Haiku is cheaper and the structured JSON output is more reliable with Anthropic's tool-use-trained models.

## Why `definition_cache` is shared (no user_id)

A word's definition is the same for all users. Caching per-user would:
- Multiply the number of LLM calls by the number of users who capture the same word.
- Increase cost proportionally.
- Not change the output (definitions aren't personalized).

Shared cache is public-read in Supabase (no RLS on that table). Writes are server-side via service role key. This is safe — definitions contain no PII.

## Consequences

### Positive
- **95th percentile latency** for common words: < 200ms (cache hit).
- **Rare word coverage** via LLM fallback — the vocabulary type that matters most gets the most complete treatment.
- **Cost predictable** — bulk of traffic is cache hits; LLM calls are first-capture-only per term, amortized across users.
- **No vendor key required to onboard** — the dict API is keyless. Users can try without Anthropic access.

### Negative
- **Dict API quality varies** — some definitions are terse; some examples are weak. The LLM fallback threshold (any non-empty example) may be too lenient. Tune in Phase 3 if definition quality is poor.
- **LLM latency** for rare words is 1-3s. Users may perceive this as slow. Mitigation: optimistic UI with a loading skeleton + "generating..." label.
- **dictionaryapi.dev has no SLA** — it's a community API. If it goes down, all captures fall through to LLM (cost spike but functional). Monitor in RUNBOOK.

## Verification

- Unit tests: dict happy path, dict miss → LLM, cache hit short-circuits, no-key → no_fallback_available.
- Manual: add "ubiquitous" → source badge "Dictionary". Add "defenestrate" → source badge "LLM". Add "defenestrate" again → instant (cache hit).

## References

- Implementation: `lib/services/definition.service.ts`, `lib/services/dict.client.ts`, `lib/services/llm.client.ts`.
- API contracts: [`TECH_SPEC.md`](../TECH_SPEC.md) §7.
