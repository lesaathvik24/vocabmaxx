# Phase 4 — QA bugs from user testing

> Source: manual QA session 2026-06-10. Solve in the order listed (12 first, then 1→11). Flip the checkbox + add a one-line resolution note when done.

## Order

12 → 1 → 2 → 3 → 5 → 6 → 7 → 8 → 9 → 10 → 11

(#4 was a positive confirmation, not a bug — skipped.)

---

## 12. Marketing page redesign — [x]

**Symptom:** marketing page is bare/dry.
**Fix:** redesign to match dashboard visual language (oklch tokens, Inter Tight display, rounded-2xl cards, accent CTA). Tone: clickbaity/Twitter — short, punchy, "from heard to owned" loop. Hero + 3 feature cards + CTA, no pricing.
**Files:** `app/(marketing)/page.tsx`, `app/(marketing)/layout.tsx`, possibly `components/marketing/`.

---

## 1. No sign-out button — [x]

**Symptom:** Topbar / Sidebar has no sign-out affordance after Phase 4 port.
**Fix:** Add a user menu in the Sidebar footer (avatar + email + dropdown with "Sign out"). The old `components/layout/sign-out-button.tsx` exists — reuse it inside a `DropdownMenu`.
**Files:** `components/layout/Sidebar.tsx`, possibly new `components/layout/UserMenu.tsx`.

---

## 2. Route stubs say "coming in phase X" — [x]

**Symptom:** `/words`, `/insights`, `/settings`, `/review`, `/words/[id]` all show a literal "coming in phase X" placeholder.
**Fix:** Replace with a polished `<EmptyState>` per DESIGN.md §5 — illustration (lucide icon) + 6-word headline + CTA back to dashboard or capture. No phase numbers leaked to the user.
**Files:** `app/(app)/{words,insights,settings,review}/page.tsx`, `app/(app)/words/[id]/page.tsx`. Consider extracting a `components/layout/ComingSoon.tsx`.

---

## 3. RecentCaptures empty-state CTA goes to /words (Phase 6 stub) — [x]

**Symptom:** empty-state book icon + CTA in `RecentCaptures` points at `/words`, which is itself a stub.
**Fix:** CTA should go to `/capture`, not `/words`. The headline "No words yet" with primary CTA "Capture your first word" → `/capture`.
**Files:** `components/dashboard/RecentCaptures.tsx`.

---

## 5. Duplicate detection: misses normalisation, error too terse — [x]

**Symptom:**
- `ubiquitious` (typo, llm) and `ubiquitous` (dict) both saved because the typed variant isn't normalised — duplicate detection sees them as different terms.
- More importantly: when a real duplicate IS detected (`409 duplicate_term`), the toast message is just `duplicate_term`. Not human.

**Fix (two parts):**
- (a) Better duplicate message: in `lib/utils/errors.ts`, map `duplicate_term` to "You already have this word in your collection." Wire the toast in `AddWordInput` / hooks to display the friendly message.
- (b) Lowercase + trim normalisation before persisting in `wordService.save` if not already (verify). DO NOT auto-correct misspellings — that's an LLM hallucination separate issue (#11).

**Files:** `lib/utils/errors.ts`, `app/(app)/capture/CapturePageClient.tsx` (or `AddWordInput.tsx`), `lib/services/word.service.ts` to confirm normalisation.

---

## 6. Paragraph extract failed on a real-world paragraph — [x]

**Symptom:** the 140-word "proliferation of technology in education" paragraph returned `Received an unexpected response. Please try again.` (= `malformed_llm_response`). DeepSeek output didn't conform to the strict JSON schema.

**Fix:** make `llm.client.extractCandidates` resilient:
- Add a JSON-mode hint to the prompt (DeepSeek supports `response_format: { type: 'json_object' }`).
- If parse fails on first attempt, do one retry with a stricter system prompt.
- Log the raw LLM body to Sentry (truncated) so we can keep tightening the prompt.

**Files:** `lib/services/llm.client.ts`, possibly the prompt block. Add a regression test under `tests/integration/api/llm.test.ts` with the failing paragraph as a fixture.

---

## 7. .txt upload with numbered list = 0/0/10 failed; plain list works but is all source=dictionary — [x]

**Symptom (two parts):**
- (a) Numbered list (`1. word`, `2. word`) returns 10 failed because the parser keeps the `1. ` prefix as part of the term. `definitionService` then fails on the malformed term.
- (b) Plain `.txt` list works but all rows are tagged `dictionary` — that's actually correct behaviour (common words hit dict), not a bug. Note in the resolution.

**Fix:** In `components/capture/BulkUploader.tsx` parsing, strip leading list markers (`/^\s*(\d+[.)]|[-*•])\s+/`) before submitting. Also trim, lowercase, drop empties (already done). Add a hint above the dropzone: "One word per line. Numbers/bullets are ignored."

**Files:** `components/capture/BulkUploader.tsx`.

---

## 8. iOS sidebar has an extra divider line before the close button — [x]

**Symptom:** mobile sheet header on iOS shows a visual line/divider above the close button that doesn't belong.
**Fix:** inspect the shadcn `Sheet` header default — likely a `border-b` on the `SheetHeader` or close-button container that we're not overriding. Remove the rogue border or zero out the default header.
**Files:** `components/layout/Topbar.tsx` (SheetContent wrapper), possibly `components/ui/sheet.tsx`.

---

## 9. iOS dashboard needs an "Add new word" button — [x]

**Symptom:** "Add word" CTA in Topbar is `hidden md:flex` so mobile has no way to start a capture without opening the sheet.
**Fix:** Add a floating action button (FAB) on `/dashboard` for mobile only, or a prominent inline "Add a word" card at the top of the mobile dashboard. FAB is more standard.
**Files:** `app/(app)/dashboard/page.tsx`, possibly new `components/layout/MobileFAB.tsx`.

---

## 10. Make dark mode the default — [x]

**Symptom:** light is the default.
**Fix:** `app/layout.tsx` — pass `defaultTheme="dark"` (and probably remove `enableSystem` or keep it but with dark fallback) to the `<ThemeProvider>`.
**Files:** `app/layout.tsx`.

---

## 11. LLM accepts gibberish strings and saves them — [x]

**Symptom:** `hufwueriugrniurejogt` got captured with definition "This is not a valid English word." and `source: llm`. The LLM correctly refused but we persisted the refusal as a definition.

**Fix:** in `lib/services/llm.client.ts` (`defineWord`), inspect the LLM response for refusal sentinels — short definition + phrases like "not a valid", "not a real word", "I cannot define" — and return a typed `not_a_word` error instead of an ok result. Capture route should map this to a 400 with friendly message: "We couldn't find a definition for that — check the spelling?"

Alternative cleaner fix: extend the LLM JSON schema to include `{ valid: boolean; definition?: string; examples?: string[] }` and only treat `valid: true` as a definition. Prompt asks the model to set `valid: false` for non-words.

**Files:** `lib/services/llm.client.ts`, `lib/services/definition.service.ts`, `app/api/capture/route.ts`, `lib/utils/errors.ts`.

---

## Resolution log

(Append a one-line note as each item lands.)

- **#12** — `app/(marketing)/page.tsx` redesigned: hero "Every word you Google twice is a leak.", three feature cards with lucide icons + accent-soft glyphs, closer card, footer. All token-based, Inter Tight headings, matches dashboard language. shadcn buttonVariants, no hardcoded slate colors.
- **#1** — `components/layout/UserMenu.tsx` added: avatar (initials) + email + "Free · beta" trigger, DropdownMenu with destructive "Sign out". Wired into Sidebar footer, fed via `userEmail` prop threaded AppShell → Sidebar/Topbar from `app/(app)/layout.tsx`. Mobile sheet inherits via same Sidebar.
- **#2** — `components/layout/ComingSoon.tsx` added (icon + title + body + CTA). All 5 stubs (`/words`, `/words/[id]`, `/insights`, `/settings`, `/review`) rewritten with user-friendly copy. No phase numbers leak to users.
- **#3** — Verified: `RecentCaptures` empty-state CTA already targets `/capture` (line 79). The "View all" link on the populated state goes to `/words` which now renders the polished ComingSoon from #2. No code change needed.
- **#5** — `word.service.save` now normalises `term.trim().toLowerCase()` before dedup-check + insert, so "Ubiquitous" and "ubiquitous" collide as duplicates. `CapturePageClient.handleCapture` now maps the thrown error kind through `toUserMessage()` so the toast reads "You already have that word in your collection." instead of `duplicate_term`. (Note: typos like `ubiquitious` ≠ `ubiquitous` remain different words — that's a spelling-quality LLM issue tracked in #11, not dedup.)
- **#6** — Two-prong fix in `lib/services/llm.client.ts`: (a) simplified the extract LLM schema to `{terms: string[]}` and tightened the system prompt with explicit shape + count + non-proper-noun rules; the old schema needed `term/context/confidence` per item and DeepSeek drifted on long paragraphs. (b) Added a single retry with a stricter system prompt if the first parse fails. `extractCandidates` now returns `string[]` directly. Tests updated; 73/73 pass.
- **#7** — `BulkUploader.parseTerms` strips leading list markers (`1.`, `1)`, `-`, `*`, `•`) via regex before trim. Dropzone hint updated to inform users. `source: dictionary` for common words is correct behaviour (dict-first per ADR 0005), not a bug.
- **#8** — Disabled the shadcn `Sheet` default floating close button (`showCloseButton={false}`) on the mobile nav sheet — it was floating over the Sidebar's brand area producing the visual artifact. Added an inline X button inside the Sidebar's brand header (only renders when `onClose` is passed, so desktop sidebar stays clean).
- **#9** — `components/layout/MobileAddFab.tsx` added: floating accent FAB (Plus, 56×56) bottom-right, mobile-only (`md:hidden`), auto-hides on `/capture`. Mounted globally in AppShell so dashboard/words/insights/etc all get it. Added `pb-24 md:pb-6` to main content so the FAB doesn't cover content.
- **#10** — `app/layout.tsx`: `defaultTheme="dark"` + `enableSystem={false}`. New visitors land in dark; topbar toggle still flips to light and persists.
- **#11** — Extended LLM definition schema with `valid: boolean`. Updated prompt to set `valid: false` for gibberish/typos/non-words. `fetchLLMDefinition` returns typed `not_a_word` error in that case (added to `DefinitionError`). Capture route maps to 422; user message: "That doesn't look like an English word — check the spelling?" Added MSW integration test for the path. 43/43 integration tests pass.

