# Product Requirements Document — VocabMaxx

**Version:** 0.1 (draft, pre-launch)
**Owner:** Lekhan Saathvik
**Last updated:** 2026-06-07
**Status:** Approved for Phase 0 execution

---

## 1. Problem

People who consume English at a professional level — writers, journalists, podcast listeners, ESL professionals, GRE/IELTS candidates, students prepping for civils — encounter unfamiliar words constantly. The current options to capture and retain them are all broken in some way:

- **Anki** is powerful but forces the user to author every card. At the moment of capture (mid-podcast, mid-article), that friction kills the loop. Most words never make it into the deck.
- **Vocabulary.com / Reji / LingQ** paywall the useful features, treat advanced learners like beginners, or surround the experience with social/gamification noise.
- **The system dictionary** gives a definition. It does not remember the word, does not test recall, and does not surface it again.
- **Notes apps** capture the word but never close the retention loop.

The user knows hundreds of words *passively* (they would recognize the definition in multiple choice). They want to know those same words *actively* — to use them in their own speech and writing without hesitation.

## 2. Vision

VocabMaxx collapses **capture-to-retention** into three steps:

1. **Type the word** (or extract it from text you paste, or right-click it on a webpage).
2. **Confirm the definition** in under five seconds.
3. **Review on schedule** — SM-2 surfaces it at the moment your memory weakens.

No card authoring. No paywall on the useful features. No beginner framing. A tool for people who take their language seriously.

## 3. Target users

### Primary persona — "The Reader"
- 25-40 years old, professional or graduate student.
- Reads 1-3 long-form articles per day, listens to 2-5 hours of podcasts per week.
- Already passively understands advanced English. Wants to upgrade from recognition to production.
- Pays for high-signal tools (Readwise, Notion AI, Substack subscriptions) but rejects gamified consumer apps.

### Secondary persona — "The Test-Taker"
- 18-30 years old, prepping for GRE / IELTS / TOEFL / UPSC / CAT.
- Time-boxed (3-6 month prep window).
- Wants efficient vocab building with credible definitions and contextual examples.

### Anti-persona — who this is **not** for
- Absolute English beginners (vocab apps for them are saturated and well-served).
- Users who want social feeds, streaks-as-pressure, or daily quotas as the primary motivator.

## 4. User stories (priority-ordered)

1. **As a reader**, when I encounter an unfamiliar word in a podcast or article, I can capture it in under 5 seconds with a clean definition and natural usage examples, so it never gets lost to "I'll look it up later."
2. **As a reviewer**, I see only the words that are actually due for review today, and rating them updates their schedule predictably, so I trust the system to handle timing.
3. **As a paste-warrior**, I can paste a transcript chunk or article paragraph, get a list of the advanced vocabulary in it, and pick which ones to learn — so I don't have to type each word individually.
4. **As a multi-device user**, I sign in on my phone, laptop, and tablet, and my vocabulary is identical and instantly synced across all three.
5. **As a power user**, I can install a browser extension and right-click any word on any webpage to add it to my deck without leaving the page.
6. **As a learner who values progress**, I can see how my vocabulary has grown over time and which words I'm consistently failing on, so I can adjust focus.
7. **As a privacy-conscious user**, my vocabulary data is mine — exportable as JSON, CSV, or Anki `.apkg` at any time.
8. **As an iPhone user**, I can install VocabMaxx to my home screen as a native-feeling app, with offline review capability.

## 5. Features (v1.0 scope)

### Core (must ship)
- **Sign in / sign up** with Google OAuth or email magic-link (Supabase Auth).
- **Single-word capture** — type a word → hybrid dictionary/LLM definition with 2-3 examples → save.
- **Paragraph capture** — paste text → LLM extracts advanced vocab → user confirms which to add.
- **Bulk import** — drag a `.txt` file with one word per line → batch processing with progress.
- **SM-2 review session** — flip cards, rate Again/Hard/Good/Easy, scheduling persists.
- **Word list** — searchable, filterable (All / Due / Mastered).
- **Word detail page** — definition, examples, review history sparkline, edit, delete.
- **Insights** — vocab growth chart (cumulative words over time), retention rate (% correct), top failed words.
- **Settings** — profile, theme (light/dark/system), notification prefs, export/import.
- **Browser extension** — right-click any word on any webpage → save to VocabMaxx.
- **PWA install** — iPhone home screen install, offline review of cached cards.
- **Daily email digest** — Resend-powered, lists today's due cards (optional, opt-in).

### Out of scope (v1.0; on roadmap for v2.0+)
- Paid tier / Stripe integration.
- Team accounts / shared decks / collaboration.
- Audio pronunciation.
- AI-tutored conversational practice.
- i18n / non-English source languages.
- Mobile native apps (PWA covers this for v1).

## 6. Success metrics

### Activation
- **TTV (time-to-value):** New user signs up → adds their first word in under 90 seconds (P50).
- **First-week retention:** % of new users who return on day 2 and day 7.

### Engagement
- **Active review days per week:** target P50 ≥ 4 for users with ≥ 20 cards.
- **Capture rate:** median words added per active day, target ≥ 3.

### Quality
- **Definition acceptance:** % of generated definitions the user accepts without editing — target ≥ 90%.
- **Definition source mix:** target dictionary hit rate ≥ 70%; LLM fallback only when needed.
- **Latency:** P95 capture-to-saved < 2.0s on a 4G connection.
- **Crash-free sessions:** ≥ 99.5% (error monitoring deferred — tracked via Vercel logs).

### Reliability
- **Uptime:** ≥ 99.9% (Vercel + Supabase combined SLAs).
- **CI green rate:** ≥ 95% of merges land green on the first try.

## 7. Non-functional requirements

- **Performance:** Lighthouse ≥ 95 on mobile (FCP, LCP, CLS, TBT).
- **Accessibility:** WCAG 2.1 AA. Keyboard-navigable end-to-end. Screen-reader tested with VoiceOver and NVDA.
- **Privacy:** No third-party analytics with user-identifying telemetry. PostHog with `disable_session_recording` for v1.
- **Security:** RLS on every domain table. Auth required for every domain API route. Secrets in env vars only. See [`SECURITY.md`](SECURITY.md).
- **Data portability:** Full export available at all times.

## 8. Constraints

- **Solo dev, ~10 hours/week** (06:30-09:30 weekday deep-work blocks + weekends).
- **Hard budget cap: $0/month** through v1 (Supabase free, Vercel hobby, Resend free, PostHog free, DeepSeek pay-per-use).
- **No payment integration in v1** — premise is to ship the product, not the business model.
- **Mac storage constraint:** scaffolding decisions favor lightweight stacks (no Docker required for dev).

## 9. Go-to-market (v1.0)

GTM in v1 is intentionally minimal — the product is the artifact, not the business.

- **Launch surface:** personal LinkedIn post + GitHub README as the "live demo" link.
- **Audience:** professional network (recruiters, engineers, ex-colleagues).
- **Positioning:** "I built a vocab SRS app with a real backend and shipped it. Here's what I learned." Technical post, not a marketing post.
- **No paid acquisition.** No SEO play. No referrals.

If organic interest is non-zero after launch, v1.5 adds a waitlist and v2.0 considers a paid tier.

## 10. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Scope creep — "just one more feature" | High | High | Phase gates in [`ROADMAP.md`](ROADMAP.md). Nothing ships outside the roadmap. |
| LLM cost explosion | Medium | Medium | Hybrid pipeline (dict first); cache LLM results by `term` across all users. |
| Supabase free-tier exhaustion | Low (v1) | Medium | Monitor in Phase 10. Single user mostly. |
| Solo-dev burnout | Medium | High | Every phase ships a usable state. No phase > 2 weeks. |
| Claude Design handoff breaks layouts | Medium | Low | `DESIGN.md` defines contract. Feature components isolated. |
| Recruiters never see it | Medium | Medium | Polished README + live demo URL = artifact. Decoupled from "users discovered it." |

## 11. Out of scope (explicit)

The following are intentionally **not** v1 features. They are listed here so a future contributor doesn't waste time scoping them.

- Real-time collaboration / shared decks.
- Public profile pages / leaderboards / streaks.
- Mobile push notifications (email digest covers the use case).
- Native macOS or Windows desktop apps.
- Browser extension for Safari (Plasmo doesn't support Safari well as of writing).
- Custom card templates / cloze deletion / image cards.
- Audio TTS for pronunciation.
- Adaptive learning beyond SM-2 (e.g., FSRS — see [`ADR/0006`](ADR/0006-sm2-vs-fsrs.md)).
- Tag system / folders / multiple decks.

## 12. Glossary

| Term | Definition |
|---|---|
| **Card** | A persisted `Word` row + its current SRS state. The user-visible unit of study. |
| **Term** | The headword the user captured. Lowercased, trimmed. Unique per user. |
| **Definition source** | Either `dictionary` (free dictionaryapi.dev) or `llm` (DeepSeek fallback — see ADR 0007). |
| **Grade** | The user's self-rating after a recall attempt: Again (0), Hard (3), Good (4), Easy (5). |
| **SM-2** | SuperMemo 2 — the spaced repetition algorithm. See [`ADR/0006`](ADR/0006-sm2-vs-fsrs.md). |
| **Ease factor** | SM-2 multiplier controlling interval growth. Start 2.5, floor 1.3. |
| **Interval** | Days until next review. |
| **Repetitions** | Count of consecutive non-"Again" grades. Resets to 0 on Again. |
| **Due** | Card whose `due_date <= now()`. |
| **Mastered** | Card with `interval_days > 30`. UI-only label; no scheduling change. |
| **PWA** | Progressive Web App — installable, offline-capable web app. |
| **RLS** | Row-Level Security — Postgres feature enforcing per-user data isolation. |

---

**Approval log**

- 2026-06-07 — v0.1 drafted by Lekhan, approved for Phase 0 execution.
