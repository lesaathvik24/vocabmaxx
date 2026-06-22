# ADR 0007 — DeepSeek `deepseek-chat` as the LLM provider (supersedes 0005 § Decision model)

**Status:** Accepted
**Date:** 2026-06-09
**Supersedes:** the model choice in [ADR 0005](0005-hybrid-definition-pipeline.md). The hybrid pipeline shape is unchanged.

---

## Context

ADR 0005 specified Anthropic `claude-haiku-4-5-20251001` as the LLM for the definition fallback. Before Phase 3 shipped, we switched the provider to DeepSeek `deepseek-chat`.

## Decision

Use **DeepSeek `deepseek-chat`** with `response_format: { type: "json_object" }`, `temperature: 0`, `max_tokens: 200`. Configured via `DEEPSEEK_API_KEY` + `DEEPSEEK_BASE_URL` (default `https://api.deepseek.com`).

## Why we swapped

1. **Cost.** `deepseek-chat` is ~5x cheaper per output token than Haiku 4.5 for this workload. The expected per-word cost on the rare-word path is well under $0.0001.
2. **Native JSON mode.** DeepSeek supports `response_format: json_object` which, combined with `temperature: 0`, gives deterministic strict-JSON output that round-trips through our Zod schema (`{ definition, examples: [string, string] }`) without retries.
3. **OpenAI-compatible API.** Same `/chat/completions` shape as the OpenAI SDK — trivial to swap providers later (Together, Groq, OpenRouter) without rewriting `llm.client.ts`.
4. **No platform tie-in.** Anthropic Workbench, Bedrock, and Vertex integrations were unused.

## What stayed the same

- The hybrid order: cache → dict → LLM.
- The shared `definition_cache` (no `user_id`) — first user pays, every future user is free.
- Typed error envelope: `not_found | network_failure | rate_limited | malformed_llm_response | no_fallback_available`.
- Zod validation of the LLM payload — strict, no retries on schema mismatch (surface as `malformed_llm_response`).

## Trade-offs accepted

- **Quality risk.** Haiku is generally regarded as stronger on nuanced English. For vocab definitions (≤25 words) and 2 short examples, DeepSeek output has been spot-checked and is acceptable. If quality regresses in Phase 4 UX dogfooding, reintroduce Haiku as a primary, DeepSeek as backup — `llm.client.ts` is the only file that changes.
- **Geopolitical / TOS risk.** DeepSeek is a Chinese-hosted API. Definitions contain no PII (only the public term + generated text), so data exposure is low. Documented in `SECURITY.md`.
- **Rate limits.** DeepSeek's free-tier ceilings are tighter than Anthropic's paid tiers. Capture flow surfaces `rate_limited` as a typed error and does not retry — the user re-submits.

## Verification

- `tests/integration/api/llm.test.ts` covers success, 429, schema mismatch, non-JSON body, and missing-API-key paths.
- `tests/unit/definition.service.test.ts` covers the dict → LLM fallback path with the LLM mocked.

## Migration cost

`llm.client.ts` rewritten end-to-end. No callers needed updating — the public surface (`fetchLLMDefinition: (term) => Promise<Result<DefinitionResult, DefinitionError>>`) is unchanged.

## Scope (call sites)

This provider choice now covers **three** DeepSeek call sites, all in `lib/services/llm.client.ts`, all sharing the same `callDeepSeek` transport (JSON mode, `temperature: 0`, Zod-validated, typed-error envelope):

1. `fetchLLMDefinition` — definition fallback (original).
2. `generateScenario` — Sidequests mission generation.
3. `judgeUsage` — Sidequests submission grading.

The cost/quality/rate-limit trade-offs below apply to all three. Scenario/judge calls are bounded (~120 max tokens each) and the judge route is token-bucket throttled. Prompts + schemas: `TECH_SPEC.md §7`.

## References

- Implementation: `lib/services/llm.client.ts`.
- DeepSeek API docs: https://api-docs.deepseek.com/api/create-chat-completion
- Prompt + Zod schema: `TECH_SPEC.md §7`.
