# Handoff: VocabMaxx — "Cobalt" Cosmetic Redesign

## Overview
A full visual redesign of VocabMaxx (vocabulary capture + spaced-repetition review app). The **flow and functionality are unchanged** — this is a cosmetics/UX pass that lifts the app to an "Apple-grade SaaS" bar. Direction name: **Cobalt**. Six screens are specified: Marketing Landing, Dashboard, Review session, Capture (add word), Words library, and Insights — each in **web (desktop)** and **mobile** layouts.

## About the Design Files
The file in this bundle (`VocabMaxx — Cobalt.dc.html`) is a **design reference created in HTML** — a prototype showing intended look and behavior. It is **not production code to copy directly**. The `.dc.html` format wraps the markup in a custom `<x-dc>` runtime and uses inline styles for streaming preview; do not lift it verbatim.

Your task: **recreate these designs in the existing VocabMaxx codebase** (Next.js App Router + React + Tailwind, per the current repo) using its established component patterns, not by pasting this HTML. Where the repo already has a component (`FlipCard`, `StatTiles`, `Sidebar`, etc.), restyle it to match this spec rather than rebuilding.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, radii, and shadows are specified below with exact values. Recreate pixel-accurately using the codebase's existing Tailwind config and component library. Extend the Tailwind theme with the tokens in the Design Tokens section.

---

## Design Tokens

### Color
| Token | Hex | Use |
|---|---|---|
| `primary` | `#2f5bea` | Brand cobalt — buttons, active nav, links, key accents |
| `primary-hi` | `#4f77ff` | Gradient top / hover |
| `primary-glow` | `#6b8cff` | Gradient tail |
| `primary-wash` | `#eaf0fe` | Active nav bg, chips, tinted fills |
| `ink` | `#1a1d29` | Primary text |
| `ink-2` | `#454a58` | Body text (critique lists) |
| `slate` | `#5c6270` | Secondary text |
| `slate-2` | `#7a8091` | Tertiary text |
| `mute` | `#8a8f9c` | Muted labels |
| `faint` | `#9aa0b0` | Faint meta / placeholders |
| `canvas` | `#e7e9ef` | App/page backdrop (behind cards) |
| `app-bg` | `#f6f8fc` | Screen background inside frames |
| `surface` | `#ffffff` | Cards |
| `surface-2` | `#fbfcfe` | Sidebar / subtle raised rows |
| `line` | `#e9ecf3` | Hairline borders |
| `line-2` | `#eef1f8` | Track/progress background, inner dividers |
| `success` | `#1f9e6a` | Retention, "Mastered", "Easy" |
| `success-wash` | `#e6f6ee` | Mastered pill bg |
| `warn` | `#e8863b` | Streak, "New" status, due-today dot |
| `warn-wash` | `#fff2e6` | New pill bg |
| `danger` | `#d1493c` | "Again" grade |
| `danger-line` | `#f0c8c4` | "Again" border |
| Heatmap ramp | `#eef1f8` → `#cdd6ee` → `#9db0e8` → `#2f5bea` | Activity intensity (Less→More) |

### Gradients
- **Hero / "Due now":** `linear-gradient(120deg, #2f5bea, #4f77ff 55%, #6b8cff)`
- **Logo mark:** `linear-gradient(145deg, #4f77ff, #2f5bea)`
- **Retention area fill:** vertical `#2f5bea` @ .22 alpha → transparent

### Typography
- **Family:** system SF stack — `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif`.
- **Numeric family:** `Inter` with `font-feature-settings:"tnum" 1` (tabular figures) for all stats, counts, phonetics, dates, kbd. Apply via a `.num` utility.
- **Scale (px / weight / tracking):**
  - Display hero (landing web): 60 / 700 / -0.035em, line-height 1.02
  - Section title (canvas): 34 / 700 / -0.025em
  - Page h2 (dashboard greeting): 26 / 700 / -0.02em
  - Card word (review front web): 44 / 700 / -0.025em
  - Stat number: 28 / 700 / -0.02em
  - Body large: 18–20 / 400 / line-height 1.5
  - Body: 14–15 / 400–500
  - Label/eyebrow: 11 / 600 / 0.1–0.14em / uppercase
  - Meta: 12–13 / 500

### Radius
Cards 16 · large cards 18–20 · frames 26 · inputs 10–14 · pills 99 · phone bezel 44 · phone screen 33 · logo mark 8–9.

### Shadow
- Card: `0 1px 2px rgba(20,30,60,.04)`
- Raised card: `0 2px 4px rgba(20,30,60,.05), 0 20px 44px -26px rgba(20,30,60,.3)`
- Frame: `0 2px 4px rgba(20,30,60,.05), 0 40px 90px -40px rgba(20,30,60,.4)`
- Primary button: `0 8px 20px -8px rgba(47,91,234,.6)`
- Hero banner: `0 18px 40px -20px rgba(47,91,234,.7)`

### Spacing
Base 4px scale. Common: card padding 16–20, screen gutters 26–28 (web) / 18 (mobile), grid gaps 13–16, section gaps large.

### Glass top bar
`background: rgba(255,255,255,.72); backdrop-filter: blur(18px); border-bottom: 1px solid #e9ecf3;` height 56–64.

---

## Screens / Views

> Copy (exact text), layout, and per-component styling below. All screens share the glass top bar, the token palette, and tabular figures for numerics.

### 1. Marketing Landing (web + mobile)
- **Purpose:** First impression / conversion.
- **Layout (web):** Glass nav (logo + "VocabMaxx" + Features/How it works/Pricing links, right-aligned "Sign in" + primary "Get started"). Centered hero with radial glow behind. Product screenshot card (macOS traffic-light chrome) overlapping below hero. White "How it works" 3-column feature strip. Dark (`#0e1220`) footer.
- **Hero copy:** eyebrow pill "Now with AI-generated example sentences"; H1 "Every word you meet, remembered for good."; sub "Capture a word in one tap. VocabMaxx writes the definition, builds the flashcard, and schedules it so it sticks — using spaced repetition that adapts to you."; primary CTA "Start learning free →", secondary "▶ Watch demo"; trust line "Free forever · No card required · 12,000+ learners".
- **Feature strip:** heading "Three steps. Zero busywork." → cards **1 · Capture / 2 · Review / 3 · Master**, each with a 44px `primary-wash` icon tile and one-line body (see file for exact copy).
- **Mobile:** same hero stacked, 33px H1, single full-width CTA, condensed product card.

### 2. Dashboard (web + mobile)
- **Purpose:** Land the user on one clear next action.
- **Layout (web):** glass top bar (logo, search, primary "Add word ⌘K", avatar) · 214px left sidebar (Learn: Dashboard[active]/Review[badge 12]/Sidequests; Library: Capture/Words; streak promo card) · main column.
- **Main:** date "Monday, July 14" + h2 "Good afternoon, Lekhan" → **Due banner** (hero gradient, "DUE NOW / 12 cards ready / About 4 minutes · spaced just right" + white "Start review →" button) → **4 stat tiles** (248 Words learned · 9d Current streak `warn` · 87% Retention `success` · 340 Sidequest XP `primary`) → 2-col row: **This week** (progress bar 18/25 + 7 bar mini-chart, Sunday highlighted primary) and **Recent captures** (colored-dot list rows).
- **Active nav item:** `primary-wash` bg, `primary` text, weight 600.
- **Mobile:** stacked; due banner, 2×2 stat grid, recent captures card; **bottom tab bar** (Home[active]/Review/center + FAB/Words/You) with glass bg.

### 3. Review session (web + mobile)
- **Purpose:** Spaced-repetition flashcard grading.
- **Layout:** minimal top bar — "‹ End session" left, centered thin progress bar (25%), "3 / 12" right. Background `#eef1f8` to float the card.
- **Card (revealed state, web):** 560px white 24px-radius card. Header: eyebrow "Adjective", word "ephemeral" (44px), phonetic "/əˈfem(ə)rəl/". Body: "DEFINITION" label (primary) + definition; "IN CONTEXT" + italic example with the word bolded in primary, left border accent; synonym pills.
- **Grade buttons (4-up grid under card):** each shows label + interval hint.
  - **Again** — white, `danger` text, `danger-line` border, "< 1 min"
  - **Hard** — white, `slate` text, `line` border, "6 min"
  - **Good** — solid `primary`, white, shadow, "1 day" (primary/recommended)
  - **Easy** — white, `success` text, `#b9e6d0` border, "4 days"
  - Hint line: "Space bar to flip · 1–4 to grade".
- **Mobile:** front (unrevealed) state — card shows eyebrow/word/phonetic + "tap to reveal", grades condensed to `<1m/6m/1d/4d`.

### 4. Capture / Add word (web + mobile)
- **Purpose:** Add a word with instant auto-definition preview before commit.
- **Layout:** top bar "Add a word" + "Esc to close". Centered (max 760) column: caption "Type a word, we'll do the rest" → large 64px input with 2px primary border, search icon, typed word "ephemeral" + blinking caret, green "✓ Found" affordance → helper "Definition fetched automatically · edit anything before saving" → **preview card**.
- **Preview card:** header (eyebrow "Adjective" / word 32px / phonetic / edit-pencil button) · body ("DEFINITION" + text, "EXAMPLE SENTENCES" + two left-border quotes with word bolded primary, synonym pills) · footer bar (`surface-2`) with warn dot "Will be due for review today", "Cancel" + primary "＋ Add to library".
- **Mobile:** compact input, single preview card, full-width primary "Add to library".

### 5. Words library (web + mobile)
- **Purpose:** Scan and manage the collection.
- **Layout (web):** top bar (logo, "Words", "248 total", search, "Add word") · filter pill row (**All 248**[active primary] / New 14 / Learning 62 / Mastered 172 + right "Recent" sort) · **table card**.
- **Table columns:** `2fr Word | 3fr Definition | 1.1fr Status | 1.3fr Memory | 0.9fr Due` with uppercase header row on `surface-2`. Each row: word + phonetic, definition, **status pill**, **memory-strength bar**, due text. Alternate row tint `surface-2`.
  - Status pills: **New** = `warn` on `warn-wash`; **Learning** = `primary` on `primary-wash`; **Mastered** = `success` on `success-wash`.
  - Memory bar: 6px track `line-2`, fill colored by status, width = strength % (e.g. New 22%, Learning 55%, Mastered 92%).
- **Mobile:** search field, **horizontally scrollable** filter pills (`overflow-x:auto`, non-shrinking pills), stacked cards each with word + status pill + due + definition + strength bar.

### 6. Insights (web + mobile)
- **Purpose:** Show progress worth returning for.
- **Layout (web):** top bar with segmented control (30 days[active]/90 days/All) · 3 KPI tiles (Retention 87% ▲4% `success`; Reviews this month 412 ▲18%; Avg. session 4.2min) · 2-col: **Retention over time** area+line chart (SVG, primary line, gradient fill, gridlines, x labels) and **Library by status** donut (SVG, success/primary/warn segments, center total 248) with legend · full-width **Review activity heatmap** (7-row × ~18-col grid using the heatmap ramp, "🔥 9-day streak · longest 21", Less→More legend).
- **Mobile:** stacked — retention KPI + mini area chart, donut + legend, streak summary card.

---

## Interactions & Behavior
Behavior is unchanged from the current app; apply these visual states:
- **Buttons/nav/pills:** hover ≈ `opacity .85` or one step lighter; active nav uses `primary-wash`/`primary`. Primary buttons keep their shadow.
- **Review:** card flips front↔revealed (keep existing `FlipCard` logic); Space flips, keys 1–4 map to Again/Hard/Good/Easy; "Good" is the visually recommended default.
- **Capture:** on input, fetch definition and render the live preview card (existing fetch logic); "✓ Found" appears when resolved; "Add to library" commits.
- **Links:** default and hover colors must be defined from `primary` (don't leave browser-blue).
- **Responsive:** desktop = sidebar shell; mobile = bottom tab bar + stacked cards; filter strips scroll horizontally on mobile.
- **Transitions:** 150–200ms ease on hover/color; card flip keeps current timing.

## State Management
No new state introduced — reuse existing: due queue count, current card index / total, reveal toggle, grade → SM-2 scheduler, capture input + fetched-definition object, words list + active filter + sort, insights range selector. Restyle only.

## Assets
- **Icons:** simple line icons (search, plus, grid/dashboard, layers/review, target/sidequests, bar-chart/words, user, chevrons, arrows, pencil, play, check). Match to the repo's existing icon set (e.g. lucide-react) — no custom SVGs required.
- **Logo:** "V" monogram on `linear-gradient(145deg,#4f77ff,#2f5bea)`, 8–9px radius. Reuse existing brand mark if present.
- **Avatar:** initial "L" on soft blue radial. Replace with real user avatar.
- **Fonts:** system SF stack (no webfont needed); Inter for tabular numerics if not already bundled.
- No raster images ship in this design — the landing "product shot" is a styled DOM card, recreate as a component or swap for a real screenshot.

## Files
- `VocabMaxx — Cobalt.dc.html` — the full hifi design reference (all 6 screens, web + mobile) on a single pan/zoom canvas. Top of the file also contains the written UX critique (what changed cosmetically + UX issues fixed).
