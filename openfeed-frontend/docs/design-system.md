# OpenFeed Design System

The single human-readable source of truth for the app's design language. Token
values defined here are mirrored 1:1 in `app/globals.css`. When a visual
decision is needed, it is recorded here first, then implemented.

**Direction:** warm editorial — warm off-white surfaces, softened charcoal text,
Lora serif for headlines, Geist sans for UI. Monochrome-warm (no brand accent
hue). Light-first; a dark theme is structured for but deferred.

**Guiding principle (YAGNI):** every token, utility, and primitive below has at
least one real consumer in the codebase. Nothing is defined speculatively.

Status legend: ✅ locked · 🔲 pending approval

---

## 1. Color roles ✅

Semantic roles, not raw `base-100/200/300` names. Light values below. Each role
is a CSS variable that flips under the (deferred) dark theme; components only
ever reference the role, never a raw value.

Muted/subtle text tiers are **solid colors, not opacity**, so contrast stays
predictable on any surface (opacity over a colored fill drifts). This collapses
today's ~7 different `text-base-content/XX` opacities into two named ink tiers.

| Role | oklch (light) | Replaces | Consumers |
|---|---|---|---|
| `--surface` | `98.2% 0.004 75` | base-100 | page background |
| `--surface-raised` | `99.5% 0.002 75` | (new) | modals, cards — near-white, reads elevated |
| `--surface-sunken` | `95.5% 0.006 75` | base-200 | inputs, soft buttons, subtle fills |
| `--border` | `89.5% 0.010 75` | base-300 | borders, dividers |
| `--text` | `32% 0.014 75` | base-content | primary text, CTA fill |
| `--text-muted` | `50% 0.012 75` | base-content/70 | secondary body copy |
| `--text-subtle` | `62% 0.010 75` | base-content/50–40 | meta, placeholders, captions |
| `--accent` | `= --text` | base-content | primary CTA, active/selected states |
| `--accent-foreground` | `= --surface` | base-100 | text/icons on accent |
| `--danger` | `55% 0.22 27` | error | error text/states |
| `--danger-foreground` | `97% 0.02 27` | error-content | text on danger |
| `--success` | `58% 0.14 150` | (was DaisyUI default) | copy-confirm checkmark |

**Decisions:** monochrome-warm — the primary CTA stays dark charcoal
(`accent = text`), no brand hue. Raised surfaces get a distinct near-white tint
(not just shadow). `--success` is newly defined because today it's silently
inherited from DaisyUI and would break on removal. Exact muted/subtle/raised
values are the agreed starting point and may be nudged during Phase 0 visual
verification (must preserve the current feel and pass contrast on `--surface`).

Elevation ramp: `--surface-sunken` < `--surface` < `--surface-raised`.

```css
/* implementation preview — exact form finalized in Phase 0 */
:root {
  --surface:          oklch(98.2% 0.004 75);
  --surface-raised:   oklch(99.5% 0.002 75);
  --surface-sunken:   oklch(95.5% 0.006 75);
  --border:           oklch(89.5% 0.010 75);
  --text:             oklch(32%   0.014 75);
  --text-muted:       oklch(50%   0.012 75);
  --text-subtle:      oklch(62%   0.010 75);
  --accent:           var(--text);
  --accent-foreground: var(--surface);
  --danger:           oklch(55%   0.22  27);
  --danger-foreground: oklch(97%  0.02  27);
  --success:          oklch(58%   0.14  150);
}
```

---

## 2. Typography ✅

**Fonts:** `--font-sans` = Geist (UI + body + prose), `--font-serif` = Lora.
Serif is reserved strictly for **headlines** (`heading-article`, `heading-modal`);
everything else, including long-form article prose, is sans.

**Type scale** (only steps with real consumers; the `text-[11px]` one-off is
removed → `xs`). Each step carries a paired line-height (Tailwind v4
`--text-*` + `--text-*--line-height`):

| Step | Size / line-height | Role |
|---|---|---|
| `xs` | 12 / 1.4 | captions, meta |
| `sm` | 14 / 1.5 | default UI + body (dominant) |
| `base` | 16 / 1.65 | long-form article prose |
| `lg` | 18 / 1.35 | modal heading (serif) |
| `xl` | 20 / 1.3 | article headline (serif) |
| `2xl` | 24 / 1.25 | section heading |
| `4xl` → `5xl` | ~34 → 48 / 1.05–1.1 | page hero |

**Named styles** (size step + color role; semibold headings, `tracking-tight`
on `2xl`+):

| Class | Font | Step | Color | Notes |
|---|---|---|---|---|
| `heading-page` | sans | 4xl→5xl@md | `--text` | hero |
| `heading-section` | sans | 2xl | `--text` | **new** — homes the onboarding h1 + share article title (were raw `text-2xl font-semibold`) |
| `heading-article` | serif | xl | `--text` | leading-snug |
| `heading-modal` | serif | lg | `--text` | |
| `text-prose` | sans | base | `--text` | **new** — long-form body (leading-relaxed) |
| `text-body` | sans | sm | `--text-muted` | secondary copy (softened) |
| `text-subtle` | sans | sm | `--text-subtle` | |
| `text-caption` | sans | xs | `--text-subtle` | **renamed** from `.text-muted` to avoid clashing with the `--text-muted` color role |

**Decisions:** body copy stays **softened** (`text-body` = `--text-muted`),
preserving the headline → summary → meta hierarchy. Long-form prose stays
**sans (Geist)**; serif headlines only. `.text-muted` style renamed →
`text-caption`.

## 3. Spacing & sizing ✅

**Spacing scale:** Tailwind's default 4px scale. No custom spacing tokens —
nothing recurs enough to justify naming one (YAGNI). Rhythm conventions to
follow consistently:

- intra-group stacks: `gap-2` / `gap-3`
- between distinct groups: `gap-6`
- modal section spacing: `gap-4` / `gap-6`
- list-item vertical padding: `py-4`

**Control height:** a single **40px (`h-10`)** for all form controls — inputs,
textareas, and the default (`md`) button size — so controls aligned in a row
share a baseline. Buttons keep their horizontal padding (`px-5` primary, `px-4`
soft) and set height via `h-10` on `inline-flex` centered content. `text`
buttons are inline links and are exempt (no control box).

**Single-consumer layout dimensions stay inline** as arbitrary values rather
than becoming tokens (YAGNI): e.g. the modal `max-h-[calc(100vh-5em)]`, the
landing `min-h-[70vh]`. The article-card thumbnail (`grid-cols-[108px_1fr]`) is
aligned to a round `w-24` (96px) for tidiness but remains a local layout value.

## 4. Radius ✅

Wired into Tailwind `@theme` so the `rounded-*` utilities match our scale (today
`--radius-lg` is dead and `rounded-lg` silently renders Tailwind's default 8px).

| Token | Value | Consumers |
|---|---|---|
| `--radius-sm` | 4px | images, small chips, skeleton bits |
| `--radius-md` | 6px | **all controls** — inputs, buttons, soft buttons, tags |
| `--radius-lg` | 10px | cards, containers (MCQFlow), modals |
| `full` | 9999px | pills, avatars, spinners |

**Decision:** tight / editorial character (4 · 6 · 10) — faithful to today's 6px
controls, and the 10px card radius now actually renders. Collapses the
`rounded-xs`/`rounded-sm`/`rounded-box` mix: inputs unify from 2–4px → `md`
(6px); `rounded-box` (SectionArticles) → `lg`; bare `rounded` skeleton bits →
`sm`. On mobile the bottom-sheet modal keeps `rounded-t-lg` (top corners only).

## 5. Elevation & motion ✅

**Elevation.** Flat by default — list rows (`NewsItemCard`) and containers
(`MCQFlow`) separate via border/divider, never shadow. The **modal/overlay is
the only elevated surface**.

| Token | Value (warm-tinted) | Consumer |
|---|---|---|
| `--shadow-md` | soft & warm — `0 4px 24px oklch(18% 0.01 75 / 0.12)` + hairline layer | modal/overlay |

`--shadow-sm` is **cut** (no consumer); reintroduce only when a real hover-lift
or card needs it. The modal drops `shadow-2xl` → `shadow-md`; the raised tint
(§1) + dimmed backdrop + border carry most of the separation. Exact shadow
layering finalized in Phase 0.

**Motion.**

| Token | Value | Consumers |
|---|---|---|
| `ease-soft` | `cubic-bezier(0.16, 1, 0.3, 1)` | all transitions |
| `--duration-fast` | 120ms | hover/color micro-interactions |
| `--duration-base` | 200ms | image fade-in, modal transitions |

The image fade adopts `base` (replacing its one-off `duration-300`), so `base`
now has a real consumer. Spinners use Tailwind's built-in `animate-spin`.

## 6. Container widths ✅

The root layout no longer imposes a single width. The body keeps centering +
padding; **each route opts into a named width**. Wired into `@theme` so
`max-w-*` utilities exist (Tailwind v4 generates `max-w-app` etc. from
`--container-*`).

| Token | Value | Consumers |
|---|---|---|
| `--container-app` | 48rem (768px) | feed / main app shell |
| `--container-prose` | 42rem (672px) | share article; landing hero |
| `--container-form` | 28rem (448px) | signin, onboarding |

**Decisions:** main feed column narrows 896 → **768** for a focused, editorial
single-column read. `form` unifies the divergent signin (384) / onboarding (448)
widths to 448. Landing folds into `prose` (no dedicated token — YAGNI). The
root `max-w-4xl` is removed; the feed layout applies `max-w-app`, auth/onboarding
apply `max-w-form`, share/landing apply `max-w-prose`.

## 7. Z-index layers ✅

Only two stacking consumers exist, so **no `--z-*` tokens** (YAGNI) — we use
Tailwind's numeric `z-*` utilities with a documented convention:

| Layer | Value | Consumer |
|---|---|---|
| content | auto | default |
| sticky | `z-30` | sticky search/filter bar |
| overlay | `z-50` | modal / overlay |

**Decision:** the modal's `z-999` is replaced with `z-50`. Native
`<dialog>.showModal()` renders in the browser top layer regardless, so a sane
value is sufficient. Introduce named tokens only if a third independent layer
(e.g. toast, popover) ever appears.

## 8. Component inventory & primitive APIs ✅

**Class-merge utility:** add `tailwind-merge` + a `lib/utils/cn.ts` helper
(`cn(...) => twMerge(...)`; `clsx` added only if conditional composition needs
it). No `cva` — over-engineered for 1–3 variants each. `cn` also fixes the
current join bug where consumer `className` collides with base classes.

**Primitives (`components/ui/`)** — built only where a real repeated consumer
exists:

| Primitive | Consumers | API |
|---|---|---|
| `Button` (refactor) | many | `variant: "primary" \| "secondary" \| "text"`; native `<button>` props; `cn` merge. Inlines today's `.btn-*` styling; `h-10` (md) per §3. |
| `IconButton` | many (pagination, modal, MCQ, chips) | square `h-10 w-10`; **`aria-label` required by types**; renders an icon child. Enforces a11y by construction. |
| `Input` | 3 | native `<input>` props; one styled control (bg `--surface-sunken`, `--border`, `radius-md`, `h-10`, focus ring). Kills `.input-field` + 3 inline variants. |
| `Skeleton` | 4 | `className`-driven pulse box; replaces DaisyUI `skeleton`. |
| `Spinner` | 2 | `size?`; replaces `loading-spinner` + MCQFlow's inline spinner. |
| `Modal` (retoken existing) | 4 | unchanged API; `--surface-raised` + `shadow-md` + `radius-lg` + `z-50`. |

**Decisions / YAGNI cuts:** icon-only buttons get a **dedicated `IconButton`**
(square, `aria-label` required). **No `Textarea` primitive** (1 consumer —
FeedbackModal — styled inline with shared token utilities). **No `Heading`
component** (headings are `@utility` classes per §2). **No Button `size` prop**
(one size today). **`Tag`/`Badge` deferred** to the filter-modal screen
migration, where its 2 consumers (interest/source chips) live. Typography
helper classes become `@utility`; `.btn-*`/`.input-field` are kept transitionally
and deleted once their primitives land (plan Phase 4).
