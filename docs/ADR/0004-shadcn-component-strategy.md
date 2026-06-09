# ADR 0004 — shadcn/ui as the component strategy

**Status:** Accepted
**Date:** 2026-06-07

---

## Context

VocabMaxx needs a component library. The wrong choice here affects velocity (how fast we can build screens), visual quality (recruiter judgment in < 3 seconds), accessibility (screen readers, keyboard nav), and bundle size. The frontend visuals come from Claude Design — the component strategy must make that handoff frictionless.

## Decision

Use **shadcn/ui** as the component foundation.

- Install via `npx shadcn@latest add <component>` — components are copied into `components/ui/` and owned by the repo.
- Extend via `cva` (class-variance-authority) for variants.
- Style entirely with Tailwind v4 classes and CSS custom properties for the design token layer.
- Add only what's needed; components are not auto-imported.

## What "shadcn" is and is not

shadcn is **not a published npm package you depend on**. It is a CLI that copies component source into your repo. You own the code. The registry is the source; your copy is yours to fork.

This is the key differentiator from MUI, Chakra, Mantine, etc.

## Alternatives considered

### 1. Material UI (MUI)
- Massive, battle-tested, opinionated Material Design.
- Theming is a ceremony; overriding Material's default styles is a fight.
- Large bundle (> 100 kB gzipped for basic usage).
- Rejected: heavy, opinionated in a way that conflicts with the visual design goals.

### 2. Chakra UI
- Good DX, accessible, themeable.
- Uses Emotion CSS-in-JS — extra runtime, potential SSR hydration issues with App Router.
- Rejected: the CSS-in-JS runtime conflicts with RSC.

### 3. Radix UI primitives (headless, unstyled)
- shadcn is built on Radix under the hood.
- Pure headless — every component needs manual styling.
- Rejected: styling overhead without adding a system on top of it defeats the purpose.

### 4. No library — hand-roll everything
- Maximum control, zero external decisions.
- Solo dev building 10+ screens — accessibility primitives (focus trapping, ARIA) are > 1 day each to get right.
- Rejected: accessible modals, dropdowns, toasts alone would eat a week.

### 5. Mantine
- Excellent v7 with Tailwind compatibility improvements.
- Peer to shadcn; slightly less ecosystem momentum as of 2026.
- Rejected: shadcn is further ahead in the Claude Design / RSC ecosystem.

## Consequences

### Positive
- **Owned code** — no upstream breaking changes; no library upgrade that breaks your app.
- **Accessible primitives** (from Radix) built in — focus trapping, ARIA, keyboard nav handled.
- **Claude Design-compatible** — Claude Design understands shadcn's component API; designs map 1:1 to components.
- **Tailwind-native** — no CSS-in-JS, no module conflicts, works perfectly with RSC.
- **Small bundle** — import only what you use; components are tree-shaken.

### Negative
- **Not zero opinion** — component names are fixed (Button not PrimaryButton). New contributors must know the shadcn API.
- **Versioning** — shadcn updates the registry; pulling updates requires re-running the CLI. Non-blocking, but manual.

## Verification

- `npx shadcn@latest add button input dialog toast dropdown-menu` succeeds.
- A Claude Design-generated component importing from `@/components/ui/*` renders without modification.
- Lighthouse accessibility score ≥ 90 on the first form page.

## References

- All primitives in `components/ui/`.
- Design system context: [`DESIGN.md`](../DESIGN.md).
- Token definitions: `app/globals.css`.
