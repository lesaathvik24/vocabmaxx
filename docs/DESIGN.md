# Design System & Claude Design Handoff — VocabMaxx

**Audience:** the engineer wiring designs into code; the designer (Claude Design) producing them.
**Goal:** designs and code share one vocabulary, one token system, and a clean interface so the gap between "designed" and "shipped" is hours, not days.

---

## 1. Design principles

1. **Calm, not noisy.** Vocab is a focus activity. The UI should disappear once the user is in flow.
2. **Reading-first typography.** Definitions and examples are the product. The type rendering must respect that.
3. **Keyboard parity.** Every action achievable with mouse must be achievable with keyboard. No mouse-only gestures.
4. **Mobile-equivalent.** The phone view is not a compromise. Capture and review must feel native at 375px wide.
5. **Direct manipulation.** Flip a card by tapping it, not by pressing a flip button.
6. **One affordance per task.** Don't offer three ways to delete a word. Pick the obvious one and remove the rest.

## 2. Visual language

### 2.1 Type

- **Display / brand:** Inter Tight (weight 600) — used only for the marketing hero and `<h1>` on landing.
- **UI:** Inter (weights 400, 500, 600) — everywhere else.
- **Reading:** "Source Serif 4" — used for the definition + example text on review cards and word detail. The serif signals "this is the substance, not chrome."
- **Mono:** "JetBrains Mono" — code, keyboard hints, debug strings.

All three are bundled via `next/font` (Inter, Inter Tight, Source Serif, JetBrains Mono) — zero external font fetches at runtime.

### 2.2 Color tokens

Defined as CSS variables in `app/globals.css`, mapped through Tailwind v4. Light + dark variants.

```
--background           # base canvas
--foreground           # primary text
--muted                # secondary surfaces
--muted-foreground     # secondary text
--border               # 1px borders
--card                 # elevated surface
--accent               # interactive accent (also used for due-banner)
--accent-foreground    # text on accent
--destructive          # delete actions, errors
--ring                 # focus ring
--success              # toast success
--warning              # toast warning, near-due
```

Source: shadcn defaults. The accent is **not** brand-flashy — leaning slate/indigo for focus on the content.

### 2.3 Spacing

Tailwind defaults (`1` = 0.25rem). Composition rules:
- Card padding: `p-6` desktop, `p-4` mobile.
- Section vertical rhythm: `space-y-6` for forms, `space-y-12` for marketing.
- Touch targets: minimum 44×44px (Apple HIG).

### 2.4 Radius + shadow

- Cards: `rounded-2xl` (16px).
- Inputs: `rounded-lg` (8px).
- Buttons: `rounded-lg`.
- Shadows: barely-there — `shadow-sm` for cards, `shadow-md` only for modals.

### 2.5 Iconography

`lucide-react` (already a shadcn peer dep). No emoji in chrome UI. Icons are 1px stroke, 20px default, 24px in large CTAs.

## 3. Component library — what exists where

| Layer | Folder | Examples |
|---|---|---|
| Primitives (shadcn) | `components/ui/` | `button.tsx`, `input.tsx`, `dialog.tsx`, `toast.tsx`, `dropdown-menu.tsx` |
| Layout | `components/layout/` | `AppShell`, `Sidebar`, `Topbar`, `MarketingFooter` |
| Marketing | `components/marketing/` | `Hero`, `FeatureGrid`, `CTA`, `Pricing` |
| Capture | `components/capture/` | `AddWordInput`, `ParagraphExtractor`, `BulkUploader` |
| Review | `components/review/` | `FlipCard`, `GradeButtons`, `SessionProgress`, `SessionDoneScreen` |
| Words | `components/words/` | `WordList`, `WordRow`, `WordDetail`, `WordEditor` |
| Insights | `components/insights/` | `GrowthChart`, `RetentionGauge`, `ProblemWords` |
| Dashboard | `components/dashboard/` | `DueBanner`, `RecentCaptures` |

**Rule:** never put a hand-rolled `<button>` in a page. Use `<Button>` from `components/ui/button.tsx`. If a variant doesn't exist, extend the `cva` config in the primitive.

## 4. Claude Design handoff contract

Claude Design generates frontend visuals outside this repo. The handoff has three steps:

### Step 1 — design intent

Designer (the user, via Claude Design) defines:
- The screen or component name (e.g. `ReviewCard`, `Dashboard`).
- A 1-2 sentence purpose.
- The data the component receives (matches a TypeScript interface in `lib/domain/` or a service return type).
- The interactive states it must support (idle, loading, error, empty, success).

### Step 2 — design output

Claude Design returns a single JSX/TSX file that:
- Imports only from `@/components/ui/*` (shadcn primitives), `lucide-react`, and `react`.
- Uses **Tailwind classes only** for styling. No inline styles. No CSS modules. No styled-components.
- Uses **only the color tokens** in §2.2. No hex codes, no `bg-blue-500`.
- Accepts a typed `Props` interface matching the TypeScript types in this repo.
- Renders all interactive states the designer specified.
- Has no hardcoded data — accepts props for everything.

### Step 3 — wiring

The engineer (Claude in this repo) places the design at the correct path in `components/<feature>/<Name>.tsx`, then writes the surrounding code that:
- Fetches data via a service or React Query hook.
- Passes typed data to the component.
- Connects callbacks (e.g. `onGrade`) to API mutations.
- Adds the component to the page.
- Writes a Vitest component test for empty + loading + error states.

If a Claude Design output violates the contract (uses hex colors, hardcoded data, missing prop types), the engineer rejects it and asks for a revision rather than patching.

## 5. State patterns

### Loading

Every async UI region has three states. Use the `<Skeleton>` primitive for loading.

```
{ status: 'loading'  } → <Skeleton />
{ status: 'error'    } → <ErrorPanel error={...} />
{ status: 'success'  } → <Content data={...} />
{ status: 'empty'    } → <EmptyState illustration={...} ctaLabel={...} />
```

These are exhaustive — `status` is a discriminated union, `never` enforced at the switch.

### Error

Errors surface via the toast system. Never a modal. Never an inline banner that pushes content down (causes layout shift).

Error copy is written, not generated: every typed error in `lib/domain/errors.ts` has a corresponding human-readable message in `lib/utils/error-messages.ts`. The mapping is exhaustive (TS enforces).

### Empty

Empty states are first-class. Each has:
- An illustration (line-art SVG, no images).
- A 6-word headline ("No words yet").
- A primary CTA that takes the user to the action that resolves it.

## 6. Accessibility checklist (every component)

- [ ] Keyboard navigable in DOM order.
- [ ] Focus ring visible (uses `--ring` token; `focus-visible:` selector).
- [ ] All interactive elements have either visible text or `aria-label`.
- [ ] Color is never the only signal (icons + text).
- [ ] Form inputs paired with `<label>` (Radix primitives handle this).
- [ ] Dialogs trap focus and restore on close (Radix handles).
- [ ] Live regions for async updates ("Word added").

Verified manually with VoiceOver during Phase 10 polish; automated checks via `@axe-core/playwright` in `tests/e2e/`.

## 7. Responsive breakpoints

Use Tailwind defaults:

| Token | Width | Used for |
|---|---|---|
| `default` | < 640px | Phone |
| `sm:` | ≥ 640px | Phablet |
| `md:` | ≥ 768px | Tablet portrait |
| `lg:` | ≥ 1024px | Desktop / tablet landscape |
| `xl:` | ≥ 1280px | Wide desktop |

The sidebar collapses to a top-bar drawer below `md:`. Review cards are fluid-max-width `420px` on mobile, `560px` on desktop.

## 8. Motion

- **Restraint.** Default to none.
- **Where used:**
  - Toasts: fade + slide in 150ms.
  - Card flip: 200ms cubic-bezier, respects `prefers-reduced-motion`.
  - Page transitions: none. Next App Router default.
- **Token:** `transition-base = 150ms ease-out`, `transition-flip = 200ms cubic-bezier(0.4, 0, 0.2, 1)`.

## 9. Marketing-specific design

The landing page has more visual personality than the app:
- Large display type (Inter Tight 600, up to 5xl).
- Single accent color (still indigo) used boldly in the hero.
- One above-the-fold animated visual showing a card flip + grade — implemented as a Lottie-free CSS animation, no third-party motion lib.
- Three feature sections. No more.
- Pricing page exists but is "Free during beta — sign up." No tiers yet.

## 10. Naming conventions

- **Components:** PascalCase. One per file. Filename matches export.
- **Hooks:** `useXxx` camelCase. Co-located with the page that uses them or in `lib/hooks/` if shared.
- **Variants:** use `cva` (class-variance-authority — shadcn dep) for component variants. No prop-drilled boolean className combinators.

## 11. Donts

- No global CSS beyond `globals.css` (tokens + Tailwind layers only).
- No inline `style={{...}}` except for dynamic transforms (e.g. chart positioning).
- No third-party UI kit (MUI, Chakra, Mantine). shadcn primitives only.
- No animation libraries (no framer-motion, no GSAP) in v1. CSS transitions cover the budget.
- No icon font (Font Awesome, etc.). lucide-react only.
- No hand-cut grids — use CSS Grid + Tailwind.

## 12. Cross-references

- Component implementations land per phase in [`ROADMAP.md`](ROADMAP.md).
- Service interfaces components consume: [`TECH_SPEC.md`](TECH_SPEC.md) §4.
- Accessibility checks integrated into testing: [`CONTRIBUTING.md`](CONTRIBUTING.md) §6.
