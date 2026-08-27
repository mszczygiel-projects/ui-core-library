# UI Core Library — Project Summary

> Generated: 2026-04-28

Keep this file, AGENTS.md, up to date when architecture, tooling, workflows, or contributor guidance changes.

This file is the canonical instruction source for coding agents. Files like CLAUDE.md should point here instead of duplicating instructions.

---

## 1. What This Project Is

`ui-core-library` is a **framework-agnostic, business-domain-independent UI component library**. It is designed to be reused across different client projects (sports, e-commerce, SaaS, etc.) and published as private npm packages to GitHub Packages.

The project consists of two tightly coupled layers:

- **Design** — Figma: foundations (Variables + Text Styles + Color Styles) + base components (Core UI Library)
- **Code** — a Nx monorepo implementing those foundations and components in multiple technologies

---

## 2. Architecture & Stack

### Repository structure

```
ui-core-library/              ← Nx monorepo, pnpm workspace
├── packages/
│   ├── foundations/          @mszczygiel-projects/ui-core-foundations
│   ├── icons/                @mszczygiel-projects/ui-core-icons
│   ├── web-components/       @mszczygiel-projects/ui-core-wc      (Lit + Shadow DOM)
│   └── react/                @mszczygiel-projects/ui-core-react   (React 18+, light DOM)
└── apps/
    └── storybook/            ← documentation + visual development
```

### Tech stack

| Layer              | Technology                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------- |
| Monorepo           | Nx + pnpm                                                                                 |
| Web Components     | Lit (Shadow DOM)                                                                          |
| React              | React 18+ (light DOM)                                                                     |
| Foundations (code) | TypeScript + CSS custom properties                                                        |
| Tailwind           | v4 — configured via `@theme inline` in `tailwind.css`                                     |
| Documentation      | Storybook                                                                                 |
| Testing (WC)       | @web/test-runner + Playwright (Chromium) + @open-wc/testing; build scripts: Vitest (node) |
| Testing (React)    | Vitest + jsdom + Testing Library; build scripts: Vitest (node)                            |
| Testing (tokens)   | Vitest (node)                                                                             |
| Visual regression  | Chromatic                                                                                 |

### Nx configuration notes

- `build` targets depend on `^build` — packages build in dependency order automatically.
- `publish` depends on `build` — always builds before publishing.
- `test` and `build` are cached by Nx.
- `defaultBase` is `main`.

---

## 3. Client Design System — AI Agent

When creating a client design system based on [Core] Foundations, use the dedicated AI agent guides:

- **[`packages/foundations/docs/ai-design-system-agent.md`](packages/foundations/docs/ai-design-system-agent.md)** — Workflow, step-by-step instructions, color palette derivation, accessibility rules, Figma Plugin API patterns
- **[`packages/foundations/docs/token-schema-reference.md`](packages/foundations/docs/token-schema-reference.md)** — Complete list of all Variable collections, modes, and variable names

Flow: client provides brand assets → AI agent fills in Variables in a forked Figma file using `use_figma` → user exports via Luckino → `pnpm foundations:build`

---

## 4. Figma — Structure

Two separate Figma files in the "UI Core Library" project:

- **`[Core] Foundations`** — Variables (tokens) + Text Styles + Color Styles: colors, spacing, typography, radius, shadows. **Source of truth.** Published as a Figma shared library.
- **`[Core] UI Library`** — base components built on top of Foundations. Published as a Figma shared library.

Variables and Styles are both "foundations" — they define the design language values, not component structure. Text Styles are the design-side equivalent of `typography.css` in code — they show designers what `heading-h1` or `body-small` looks like, while the actual values come from Variables.

Per client: a separate Figma project with a file **forked** from Core UI Library (fork = copy, not live inheritance — Core changes must be manually propagated to client forks).

> Key insight: Figma alias-to-alias variable changes sync unreliably. Value-based changes (hex, numeric) are more dependable. Workarounds: manually re-add library, use "Update remote libraries," or trigger re-publish via a trivial edit.

---

## 4. Foundations — Tokens & Styles

### Package structure (`packages/foundations`)

```
packages/foundations/   @mszczygiel-projects/ui-core-foundations
  scripts/
    build-tokens.ts      ← Variables JSON → tokens.css / tailwind.css / tokens.ts
    build-typography.ts  ← Text Styles JSON → typography.css
  src/
    figma-exports/       ← JSON source files from Luckino (committed)
      primitives.json
      themes.json
      surfaces.json
      sizes.json
      text-styles.json
    tokens.css           ← generated by build-tokens.ts     (do not hand-edit)
    tailwind.css         ← generated by build-tokens.ts     (do not hand-edit)
    tokens.ts            ← generated by build-tokens.ts     (do not hand-edit)
    typography.css       ← generated by build-typography.ts (do not hand-edit)
    reset.css            ← hand-written: box-model, focus ring, selection, reduced-motion
    base.css             ← hand-written: @import reset.css + typography.css (shortcut)
    config.ts            ← hand-written: configureUiCore() / getUiCoreConfig() + UiCoreLabels
                            (see "UI text & i18n — the labels convention" in §6)
    fonts/
      default.css        ← hand-written: Roboto via Google Fonts — Storybook/dev only
```

Consumers choose exactly what they need:

```css
@import '@mszczygiel-projects/ui-core-foundations/tokens.css'; /* only tokens — e.g. Tailwind project with own reset */
@import '@mszczygiel-projects/ui-core-foundations/tailwind.css'; /* tokens + Tailwind theme mapping */
@import '@mszczygiel-projects/ui-core-foundations/reset.css'; /* reset only */
@import '@mszczygiel-projects/ui-core-foundations/typography.css'; /* typography classes only */
@import '@mszczygiel-projects/ui-core-foundations/base.css'; /* reset + typography (shortcut) */
```

**Font loading** is a consumer responsibility. The library only consumes `var(--typography-body-font-family)`, etc. `fonts/default.css` is for Storybook and local development only — never auto-imported, never for production.

---

### Token collection architecture

Tokens are organized in 6 Figma collections. The structure represents a layered reference chain:

```
Primitives Colors + Primitives Sizes  ← raw values, no modes
           ↓
        Themes                        ← semantic aliases, modes: Default | Dark | …any client mode
           ↓
        Surfaces                      ← context aliases, modes: Default | Subtle | Inverse | Primary
        Sizes                         ← responsive aliases, modes: Mobile | Desktop
        Density                       ← context aliases, modes: Comfortable | Compact
```

Each layer references only the layer above it — never below or across. `Surfaces` and
`Density` are both context layers and both switch on an attribute; they differ only in what
they carry, colour versus dimension, and they compose without interfering.

> **This layering was restructured on 2026-08-10.** The set went from 4638 variables to
> **2078** without changing a single rendered value: the mirrors stopped carrying all 797
> component-facing tokens, and the per-component tokens moved into a `Components` collection
> of single aliases.
>
> **The colour half was folded again on 2026-08-26**: `Themes` 580 → 282 and `Surfaces`
> 138 → 64, so a client now configures **62 roles**. Unlike the first pass this one moves
> values on purpose — the old names described component variants (`outline/*` and `filled/*`
> were TextField chrome, the `{success,warning,info,error}/{subtle,solid,outline}/*` families
> were Chip states), so folding them is a re-decision, not a rename. `Components` keeps all
> 978 tokens and every CSS custom property name, which is why the two component packages
> needed two edits between them. Tooling and the contrast oracle:
> [`tools/token-migration/color-roles/`](tools/token-migration/color-roles/README.md).
> Measurements, rationale and the migration scripts:
> [`packages/foundations/docs/token-audit.md`](packages/foundations/docs/token-audit.md)
> and [`tools/token-migration/`](tools/token-migration/README.md).
>
> **`[CMS] Foundations` was migrated separately on 2026-08-12** (4633 → 2027), with one
> deliberate difference: its component tokens stayed in `Surfaces` instead of moving to a new
> `Components` collection, because that would have reissued their ids and `[CMS] Panel` holds
> 196 explicit `Surfaces` mode assignments on instance sub-nodes that the Plugin API cannot
> rewrite. Same reduction, same 134 client-facing roles, zero rebinding —
> [`tools/token-migration/out/cms-roles.md`](tools/token-migration/out/cms-roles.md).
> Forks still do not inherit from Core; each migration is its own pass.

### Layer 5 — Components

Every per-component token, colour and dimension alike, in one **single-mode** collection:
`color/chip/*`, `color/button/*` alias a `Surfaces` role; `button/font-size`,
`chip/small/height` alias a `Sizes` role. `build-tokens.ts` picks up
`figma-exports/components.json` when it exists and ignores its absence, so a fork that has not
been migrated still builds.

The rule holds without exceptions: if a token is component-scoped, it is in `Components`.
`Sizes` keeps only the responsive roles.

**One accepted cost.** Roughly 100 bindings in `[Core] UI Library` still point at the old
`Sizes` variables — icon `width`/`height` and a few text properties on instances nested
inside instances, where `setBoundVariable` reports success and silently does nothing. They
render the last resolved value, so nothing looks wrong, but the references are stale and only
a manual pass in the Figma UI clears them.

**`letter-spacing` is typed inconsistently** and it bites on every operation:
`notification/letter-spacing` is `FLOAT` while the rest are `STRING` percentages, and Figma
refuses to bind a `STRING` variable to a node's `letterSpacing` property — which is why those
tokens' bindings could not be moved even though the tokens themselves were. Figma cannot
change a variable's type in place, so fixing it means recreating them.

Two asymmetries make this work, and both are easy to get backwards:

- **In Figma one mode is enough.** An alias resolves in the mode context of the consuming
  node, so a component token follows theme and surface through the role it points at.
- **In CSS it is not.** A custom property containing `var()` is substituted on the element
  the declaration applies to, and descendants inherit the substituted result — so an alias
  emitted only on `:root` freezes there and ignores a `[data-surface]` container below it.
  `buildTokensCss` therefore repeats the whole Components block into every theme and surface
  scope. Verified in Chromium; locked in by `tokens-transformer.test.ts`.

Precedence in `tokens.ts` is **Components > Surfaces > Themes**: the collections share CSS
variable names once the collection prefix is dropped, so only the most specific definition of
a path reaches the public API.

**Surfaces take precedence over Themes in `tokens.ts`.** If a Themes variable has a corresponding Surfaces alias, only the Surfaces version is exported (it is surface-aware). If a Themes variable has no Surfaces counterpart, it is exported directly from Themes.

### Layer 1 — Primitives

Defined on `:root`. Contain raw values only — never referenced by components directly.

- **Colors:** `--color-{palette}-{shade}` — palettes: `gray`, `green`, `red`, `blue`, `orange`, `black`, `white`, `brand-primary`, `brand-secondary`, `transparent`
- **Spacing/Size:** `--spacing-{n}` (0–16, 0.25rem steps), `--size-{n}`, `--radius-{t}`
- **Typography:** `--text-{size}`, `--text-{size}--line-height`, `--font-weight-{name}`, `--tracking-{name}`
- **Shadows:** split into shape + color, composed into composite tokens: `--shadow-{2xs|xs|sm|md|lg|xl|2xl}`, `--inset-shadow-{2xs|xs|sm}`

### Layer 2 — Themes

Semantic aliases. Naming: `--color-{category}-{subcategory}-{role}-{state}`.

**Every Figma mode of the Themes collection is emitted — the build does not know a fixed
list of theme names.** The base mode (the one named `Default`, or the first mode when there
is none) lands on `:root`; every other mode gets its own attribute selector, so one
`data-theme` on `<html>` or `<body>` switches the whole page:

| Figma mode    | Selector                                                               |
| ------------- | ---------------------------------------------------------------------- |
| `Default`     | `:root, [data-theme="default"], [data-surface="default"]`              |
| `Dark`        | `[data-theme="dark"], [data-theme="dark"] [data-surface="default"]`    |
| `DarkGreen`   | `[data-theme="dark-green"], [data-theme="dark-green"] [data-surface…]` |
| `TenantLight` | `[data-theme="tenant-light"], …`                                       |

Mode name → attribute value is kebab-case (`modeSlug()`): camelCase is split, spaces and
underscores become hyphens, everything is lowercased. A mode block carries only the tokens
whose value differs from the base mode, plus the aliases that transitively depend on them —
everything else inherits from `:root`. A client fork can add as many modes as it likes
without touching the build.

The second selector in each pair (`[data-theme="x"] [data-surface="default"]`) exists because
a nested `data-surface="default"` container resets the surface context back to the page
theme; without it that container would fall back to the base mode's colors.

**`Dark` additionally mirrors into `@media (prefers-color-scheme: dark)`**, scoped to
`:root:not([data-theme])` so the OS setting only applies when no theme has been chosen
explicitly — `data-theme="default"` forces light even on a dark OS. Pass `--no-auto-dark`
to the CLI (or `autoDarkMode: false` to `buildTokens()`) to drop that mirror in projects that
always drive the theme from the attribute.

**The colour set is exactly 62 roles**, and the list is closed — a name that is not on it
does not belong in `Themes`:

```
brand/       primary|secondary|tertiary × default|subtle|strong            →  9
background/  default sunken subtle inverse overlay brand-primary
             tint transparent                                            →  8
text/        primary secondary muted placeholder brand                    →  5
disabled/    background text                                             →  2
icon/        default                                                     →  1
border/      subtle default strong stronger                              →  4
ring/        default                                                     →  1
feedback/    success|info|warning|error × base|subtle|on-base            → 12
action/      primary|secondary|tertiary|danger × base|on-base
             × default|hover                                             → 16
link/        default hover                                               →  2
selection/   background text                                             →  2
```

**Only `default` and `hover` survive as action states.** Components drive `hover`, `active`
and `focus` from the one `hover` token, and both disabled leaves fold into `disabled/*`.
Adding `action/*/base/active` back would put the state matrix in the token set again, which
is the thing this list exists to prevent.

`action/primary/base/active` is the one exception still present, and it is deprecated: 32
bindings in `[Core] UI Library` sit on instance sub-nodes where `setBoundVariable` is a
silent no-op, so it cannot be deleted by script. It aliases `hover`. Do not use it.

#### A role that is read on a surface must flip with it

`base` in the `feedback` family is the solid fill AND the ink on `subtle` AND the ink on the
page for an outline variant. Those want opposite luminance, so the role carries different
values per mirror — light contexts keep the saturated step, dark contexts take `hue/300`
with `subtle` dropping to `hue/1000`. `border/strong` and `border/stronger` do the same,
because the border ramp is the Switch track as well as the field outline, and so does
`ring/default`.

**The focus ring is the one where getting this wrong is a blocker, not a blemish.** It used
to alias the base row in `on-subtle` and `on-inverse`, so it never flipped: the brand blue
stayed on the dark inverse page at 2.23:1, and in the `Dark` theme — where the base row was
white — the inverse page is white too, giving a white ring on white at 1.00:1. Its steps are
picked against **both** `background/default` and `background/subtle`, because `ring/offset`
draws a gap in whatever is underneath and the ring can end up adjacent to a card rather than
the page. `brand/primary/800` light / `500` dark clears 3:1 in all eight cells (worst 3.88);
`600` in the dark cells drops that to 3.22.

**Which mirror is "dark" is not what its name suggests.** It comes from the resolved
luminance of `background/default` in that cell: `on-inverse` is DARK under the Default theme
and LIGHT under `Dark`, because inverting a dark page yields a light one.

| mirror             | Default theme | Dark theme |
| ------------------ | ------------- | ---------- |
| _(base)_           | light         | dark       |
| `on-subtle`        | light         | dark       |
| `on-inverse`       | **dark**      | **light**  |
| `on-brand-primary` | dark          | dark       |

**Known debt: `feedback/warning`.** Folding `warning/subtle/text` into `feedback/warning/base`
costs contrast in the three light cells — warning ink on its own tint is 2.49:1 and white on
the base fill is 2.65:1. The whole `orange` ramp was checked and **no value serves both the
solid fill and the ink on the tint**; the first that clears 4.5:1 both ways is `orange/1000`,
which is brown. `success` had the same problem and an escape at `green/950`, which is applied.
Verify with `node tools/token-migration/color-roles/audit.mjs` — it should report warning and
nothing else.

Themes also contains non-color tokens: `--typography-*`, `--radius-*`, `--ring-*`. These have **no Surfaces equivalent** and may be used directly in components — Surfaces does not override them.

### Layer 3 — Surfaces

Override `--color-*` variables per surface context. Activated via HTML attribute.

| Attribute                | Selector                   | Context       |
| ------------------------ | -------------------------- | ------------- |
| _(none)_                 | `:root`                    | Default white |
| `data-surface="subtle"`  | `[data-surface="subtle"]`  | Subtle/gray   |
| `data-surface="inverse"` | `[data-surface="inverse"]` | Dark/inverse  |
| `data-surface="primary"` | `[data-surface="primary"]` | Brand primary |

Like Themes, the surface modes come from Figma rather than a fixed list — a mode the Core
library does not ship (say `BrandHighlight`) is emitted as `[data-surface="brand-highlight"]`
using the same `modeSlug()` rule.

All child components adapt automatically — no component-level changes required.

### Layer 4 — Sizes

Responsive typography tokens. Modes: **Mobile** → `:root`, **Desktop** → `@media (min-width: {breakpoint/xl})`. Only variables whose Desktop value differs from Mobile are emitted.

Pattern: `--typography-{role}-{property}` (e.g. `--typography-body-font-size`). No HTML attributes needed for responsive behavior.

Sizes is the one collection with a fixed mode list, because a mode here maps to a media
query and the build has no breakpoint for a name it does not know. Any other mode is
reported as `⚠ UNMAPPED MODE` rather than dropped silently — add the breakpoint handling
before adding the mode in Figma.

### Layer 6 — Density

Layout density, switched by an attribute: **Comfortable** (base) → `:root` and
`[data-density="comfortable"]`, **Compact** → `[data-density="compact"]`. It carries 32
**slots** — `gap/*`, `padding/inline/*`, `padding/stack/*`, `icon/size/*`,
`control/height/*`, `control/area/min-height/*`, `control/separator/inset` — and every
component dimension in scope aliases a slot instead of a ramp step or a primitive.

Compact is a **re-mapping, not a second set of numbers**: each slot points one step further
down the `layout/*` and `icon/*` ramps that already exist in `Sizes`. That is why adding
density cost ~32 aliases rather than ~83 new values, and why a client fork re-points slots
instead of re-deciding sizes.

Only spacing, control heights and icon sizes react to density. Typography, radius, stroke and
colour do not.

**The base mode names its own attribute as well as `:root`.** Without
`[data-density="comfortable"]` in that selector, a comfortable container nested inside a
compact one would keep inheriting the compact values, because `:root` never matches a
container further down the tree. `Surfaces` solves the same problem with its
`[data-theme="x"] [data-surface="default"]` pair.

**The two axes compose without a cartesian.** A slot aliases a ramp step, and the ramp step
may be responsive; substitution happens on the `[data-density]` element, which has already
inherited the media-query-adjusted ramp value from `:root`. Verified in Chromium at 376px and
1280px: Compact on desktop resolves to the desktop step, not the mobile one. The single
responsive slot, `padding/inline/adaptive`, therefore needs a responsive counterpart in
`Sizes` (`layout/padding/inline/adaptive-compact`) rather than a frozen value.

**Emission is asymmetric and it matters.** `buildTokensCss` repeats a declaration into every
density scope **only when its alias chain reaches `Density`** — `dependsOnCollection()`
decides. A dimension that stops at a `Sizes` role stays on `:root` once, because a media query
redeclares that role on the same element and the declaration recomputes on its own. Repeating
all 252 dimensions instead would emit ~750 lines that could never change.

**`Sizes` is allowed to reference `Density`, and that is not an oversight.** `Sizes` conflates
two layers that were never separated: the ramp (`layout/*`, `icon/*`) and the `control/*` slots
that alias it. Density belongs between them, so eight `control/*` roles now point at Density
slots — `control/padding/stack` → `Density.padding/stack/xs` → `Sizes.layout/padding/stack/md`.
The variable graph stays acyclic; only the collection order does not.

Splitting the collection instead is not available: **1583 live bindings in `[Core] UI Library`
point at those roles, 193 of them on instance sub-nodes the Plugin API cannot rewrite.** The
same emission rule covers them — a `control/*` role that reaches Density moves out of the
`:root` block into the density scopes.

This matters far beyond the eight roles: **form controls have no height token at all.** A
TextField's height is `padding-block` plus line-height, and its padding comes from
`--control-padding-stack` read straight from CSS. 89 references across the two component
packages resolve through these roles, so without them density would visibly skip every field
while buttons and chips tightened around them.

**A density-aware `Sizes` role must not also vary by breakpoint.** The Desktop block writes to
`:root`, so such a role would freeze there and stop following the attribute. Put the responsive
step in the ramp entry the slot aliases instead — that is what
`layout/padding/inline/control-adaptive` exists for. The build warns with
`⚠ DENSITY × BREAKPOINT` rather than emitting something that silently half-works.

### Build pipeline: Figma → Code

Two separate scripts, one shared `pnpm foundations:build` command that runs both.

**Script 1 — `build-tokens.ts`** (Variables → CSS/TS/Tailwind)

1. Export Variables from Figma using **Luckino** (W3C Design Tokens JSON, one file per collection).
2. Drop 4 files into `src/figma-exports/`: `primitives.json`, `themes.json`, `surfaces.json`, `sizes.json`. Two more, `components.json` and `density.json`, are read when present and skipped when not (see "Layer 5" and "Layer 6") — a fork that has neither still builds, byte for byte as before.
3. Run `pnpm foundations:build` — generates:

| Output file    | Purpose                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------ |
| `tokens.css`   | `:root { --color-brand-primary: #…; }` — raw values, all collections, all modes            |
| `tailwind.css` | `@import "./tokens.css"` + `@theme inline { … }` — thin Tailwind v4 adapter, no raw values |
| `tokens.ts`    | TypeScript references to CSS vars (semantic tokens only, Surfaces-over-Themes precedence)  |

**Script 2 — `build-typography.ts`** (Text Styles → CSS utility classes)

1. Export Text Styles from Figma using **Luckino** → `text-styles.json`.
2. Drop into `src/figma-exports/text-styles.json`.
3. Same `pnpm foundations:build` — generates `typography.css`.

Luckino exports Text Styles as JSON with Variable references (`{typography.body.font-size}`). The script resolves these to `var(--typography-body-font-size)` and generates utility classes.

**Class naming convention:**

| Figma name   | CSS class          |
| ------------ | ------------------ |
| `Body`       | `.text-body`       |
| `Caption`    | `.text-caption`    |
| `Heading/H1` | `.text-heading-h1` |
| `Heading/H2` | `.text-heading-h2` |
| `Body Small` | `.text-body-small` |

Transformation rule: `name.toLowerCase().replace(/\//g, '-').replace(/\s+/g, '-')` → prefix `.text-`.

4. Commit both the source JSON files and the generated output files.

> Why Luckino instead of the Figma REST API? The `/v1/files/:id/variables/local` endpoint is gated behind the Enterprise plan. Luckino reads Variables and Styles via the Plugin API (free).

### Token reference rules — quick guide

| What you're styling | Token to use                          | Example                                          |
| ------------------- | ------------------------------------- | ------------------------------------------------ |
| Component color     | `--color-{semantic}` (Surfaces layer) | `var(--color-button-primary-background-default)` |
| Typography          | `--typography-*` (Themes/Sizes)       | `var(--typography-body-font-size)`               |
| Spacing / layout    | `--spacing-*` / `--size-*`            | `var(--spacing-4)`                               |
| Border radius       | `--radius-*`                          | `var(--radius-md)`                               |
| Shadow              | `--shadow-*` (composite)              | `var(--shadow-md)`                               |

**Do not use directly in components:**

| ❌ Avoid                                                                    | Why                                                                          |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `--color-{palette}-{shade}`                                                 | Primitive — bypasses all semantic and surface context                        |
| `--color-on-subtle-*`, `--color-on-inverse-*`, `--color-on-brand-primary-*` | Internal Themes variables used by the surface system — not for component use |
| Raw values (`#fff`, `1rem`, `400`)                                          | Breaks theming entirely                                                      |

### Unit conversion rules

- `font-weight` paths → unitless
- `tracking` / `letter-spacing` paths → `em`
- `line-height` paths → unitless `calc(lhRem / fsRem)` ratio
- Everything else → `rem` (÷ 16)
- `0` → bare `0` (no unit)

### Build warnings (non-blocking, always exit 0)

- `⚠ VIOLATION` — reference crosses layer boundary (e.g. Themes → Surfaces)
- `⚠ CIRCULAR` — alias cycle
- `⚠ BROKEN REF` — alias points to non-existent token
- `⚠ UNPAIRED line-height` — line-height without sibling font-size

---

## 5. Icons

### Design rules

- **Consistent viewBox** — all icons share the same `viewBox` (e.g. `0 0 24 24`). This ensures technical consistency: every icon occupies the same bounding box and scales predictably in any context.
- **Size is controlled by CSS, not the icon** — the icon never defines its own size. The component (e.g. Button) sets `width`/`height` via CSS. The icon fills that space.
- **Optical vs. mathematical equality** — different shapes (e.g. chevron, circle) have naturally "empty" areas within the viewBox. Mathematically equal padding around icons does not always equal visually equal padding. This is expected and acceptable — `viewBox` provides technical consistency, optical adjustments are a design concern handled in Figma.
- **Colors always via `currentColor`** — hardcoded fill/stroke values are replaced during the build. Icons inherit color from the surrounding CSS `color` property.

### Source

SVG files in `packages/icons/src/svg/`. Naming convention: `icon-{name}.svg` (prefix mandatory, kebab-case for multi-word names). The hyphen - between `icon` and name is not a word separator.

### Build pipeline

`pnpm icons:build` → `dist/`:

- `svg-map.js` — `svgMap` record (icon name → optimized SVG string) — for Lit and non-React consumers
- `icon-names.d.ts` — `IconName` union type derived from filenames
- `dist/react/` — one React component per icon (`.jsx` + `.d.ts`) + barrel `index.js`

SVG optimization (svgo): removes Figma metadata, preserves `viewBox`, replaces hardcoded colors with `currentColor`, strips fixed `width`/`height` so icons scale via CSS.

### Usage

```tsx
// React
import { IconChevronDown } from '@mszczygiel-projects/ui-core-icons/react';
<IconChevronDown style={{ color: 'var(--color-feedback-error-base)', width: 24 }} />;

// Lit / vanilla
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
html`${unsafeSVG(svgMap['icon-chevron-down'])}`;
```

### The required-icon contract — update it when a component uses a new icon

A consumer can replace the whole icon set with their own via a bundler alias (see README). That only works if their set covers every icon the components render themselves, so that list is an explicit contract in [`packages/icons/scripts/required-icons.ts`](packages/icons/scripts/required-icons.ts).

**When you make a component use a new icon from `svgMap` or `/react`, add it to `REQUIRED_ICONS` in the same commit.** A test in `build-icons.test.ts` scans both component packages and fails if you forget; the icons build then fails for anyone whose set lacks the icon, which is the point — a missing icon renders nothing at all and reports no error.

The list is hand-maintained rather than derived, because at least one call site resolves its key at runtime (`number-field.ts` picks between `icon-minus` and `icon-plus`), so a static import scan would silently under-report.

`@mszczygiel-projects/ui-core-icons` is a **peer dependency** of `wc` and `react` — the same treatment `foundations` gets, for the same reason: the app owns the single copy so an alias reaches the library's own imports. Never move it back to `dependencies`.

There is **no runtime icon-set switch** and no `iconSet` config field. Selection is build-time; a runtime toggle would force both sets into every bundle and kill tree-shaking.

---

## 6. Components — Implementation Rules

### Core rules (both Lit and React)

- **Zero hardcoded values** — only CSS custom properties from `@mszczygiel-projects/ui-core-foundations`
- Every component maps to a Component Set in Figma (Properties: size, variant, state)
- Auto Layout in Figma = flex/grid in code
- Naming and comments in English
- Lit and React are **separate implementations** sharing the same token set

### Shared primitives behind the field components

`ui-select-field` / `SelectField` and `ui-combobox` / `Combobox` are compositions, not monoliths:

| Layer        | Lit                                 | React                      | Responsibility                                                               |
| ------------ | ----------------------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| Positioning  | `ui-popover` (`trigger="manual"`)   | `Popover`                  | flip/shift, top-layer rendering                                              |
| Option list  | `renderListbox()` + `listboxStyles` | `<Listbox>`                | options, sticky group headers, empty/loading, check marks, create row        |
| Field chrome | `controlFieldStyles`                | `styles/control-field.css` | size ramp and per-variant colour aliases (`--_bg`, `--_text`, `--_label`, …) |

Four things about this that are easy to get wrong:

1. **There is no `<ui-listbox>` element.** `aria-activedescendant` and `aria-controls` are id references, and **id references do not resolve across a shadow boundary**. So on the Lit side the list is a render function that draws into the _caller's_ shadow root, keeping the trigger and the options in one tree. React has no such constraint and ships a real `<Listbox>` component. The asymmetry is deliberate — see `packages/web-components/src/listbox/README.md`.
2. **The panel surface belongs to the listbox, not to the popover.** The listbox owns background, border, radius, padding, max-height and scrolling (`select-dropdown-*` tokens) so it also works inline. Whenever it is floated inside a popover, neutralise the popover chrome (`::part(panel)` / `::part(content)` in Lit, descendant rules in React) or two surfaces will stack.
3. **The popover shrink-wraps its trigger, and a full-width field must undo that.** `ui-popover` / `.ui-popover` is `display: inline-block` — right when it wraps a button, wrong when it wraps a field, because the field then collapses to the input's intrinsic width (~20 characters) instead of filling its host. Every field built on it un-shrinks the chain itself: SelectField and Combobox style their own `<ui-popover>`, DateField reaches it through `ui-date-picker` (which passes `display: block` down to its popover in `date-picker.styles.ts`, since `::part()` stops at the first shadow boundary). A consumer cannot fix this from outside — nothing is exported across those roots — so a new field composition owns the rule from day one. In React the same fix needs a compound selector (`.ui-popover.ui-date-field`) or `width: 100%`, or stylesheet order decides which single-class rule wins.
4. **The `select-*` token family is shared.** `--color-select-option-*`, `--color-select-dropdown-*`, `--select-option-group-*` and friends back _every_ listbox surface, including the Combobox — the prefix is historical, not a scope. Do not rename it to `listbox-*` without a full audit; it is published API.

### Icons inside a field: chrome vs. action

A field's icons split into two roles, and they do **not** share a token family:

| Role                | Examples                                                                                                        | Alias family                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Decorative — chrome | leading search / mail glyph, any non-interactive slot icon                                                      | `--_icon`, `--_icon-hover`, `--_icon-active` → `--color-control-{variant}-icon-*`                   |
| Interactive         | SearchField clear, PasswordField eye, NumberField steppers, DateField calendar, Select/Combobox chevron & clear | `--_icon-action`, `--_icon-action-hover`, `--_icon-action-active` → `--color-action-primary-base-*` |

The action aliases are declared once per package (`textFieldStyles` / `controlFieldStyles` in Lit, `TextField.css` / `styles/control-field.css` in React) and are deliberately **variant-agnostic** — `action/primary` is identical for outline, filled and underlined, unlike the `--_icon` family.

Two rules that keep the two roles from bleeding into each other:

1. **Field state beats the action colour.** In `success` / `error` / `disabled` the interactive controls fall back to `--_icon-success` / `--_icon-error` / `--_icon-disabled`. A red clear button reads as "this field is broken", which is the point; `action/primary/base/disabled` is a background token and has far too little contrast to serve as a foreground.
2. **React decides on the slot, Lit on the button.** Lit's buttons carry `icon icon--trailing` in the same shadow root, so each component's stylesheet overrides its own `.clear` / `.toggle` / `.stepper` rule. React slots consumer nodes into a `<span class="ui-text-field__icon">`, so `TextField.css` keys off `.ui-text-field__icon:has(button)` and the buttons stay on `color: inherit` — one place decides, and a decorative `trailingIcon` is untouched.

### UI text & i18n — the labels convention

**Components never own translated text.** Every string a component can render on its own lives in `packages/foundations/src/config.ts` under `UiCoreLabels`, with English as the built-in fallback. The consumer's i18n stack feeds real strings in — there is no locale table, no message catalogue, and no translation logic anywhere in the library.

**Static vs. dynamic — the one rule that decides the type:**

| Label content                              | Type                | Example                                                   |
| ------------------------------------------ | ------------------- | --------------------------------------------------------- |
| Fully static                               | `string`            | `labels.dialog.close` → `'Close dialog'`                  |
| Contains a variable (count, user input, …) | `(…args) => string` | `labels.pagination.item` → `` (page) => `Page ${page}` `` |

A label that embeds a variable is **always** a function, never a prefix the component concatenates. Word order differs between languages, so the whole string has to be the translator's to write.

**Resolution order — identical in Lit and React:**

```
per-instance prop  ??  getUiCoreConfig().labels.<path>
```

The prop is always optional and has **no default value**. The English string lives only in `defaultLabels`; a component that defaults its own prop to `'Close'` puts the text back where it cannot be translated.

```ts
// Lit
@property({ type: String, attribute: 'close-label' }) closeLabel?: string;
// …in render():
aria-label=${this.closeLabel ?? getUiCoreConfig().labels.dialog.close}
```

```tsx
// React — resolve once at the top of the component, not inline per usage
const labels = getUiCoreConfig().labels.pagination;
const itemAriaLabel = getItemAriaLabel ?? labels.item;
```

The prop's type mirrors the label's type: `string` for static leaves, `(…args) => string` for dynamic ones, so a per-instance override behaves exactly like a global one.

**Passing a label down to a child component:** don't resolve it in the parent — forward the raw `undefined` and let the child do its own config lookup. In Lit that means `ifDefined()`, otherwise the attribute is set to an empty string and the child's fallback never runs:

```ts
apply-label=${ifDefined(this.applyLabel)}   // ✅ child resolves from config
apply-label=${this.applyLabel}              // ❌ renders aria-label=""
```

**Consumer usage:**

```ts
import { configureUiCore } from '@mszczygiel-projects/ui-core-foundations';

configureUiCore({
  labels: {
    dialog: { close: 'Zamknij okno' },
    pagination: { item: (page) => `Strona ${page}` },
  },
});
```

Merging is **per leaf** — overriding `labels.listbox.empty` leaves `create` and `loading` on their English defaults. Call it once at app boot: the config is a plain module-level object, so React does not re-render components that already read a label.

**Out of scope — pluralization, dates, numbers.** The library never embeds `Intl` logic for UI copy, and never picks a plural form. Components take **pre-formatted strings** or a **formatter callback prop**; anything locale-dependent is computed by the consumer and passed in. (`Calendar`'s `Intl.DateTimeFormat` use is the deliberate exception: it formats _data_ the component owns — the date of a grid cell — not copy. Never extend that pattern to UI text.)

**`config.locale` serves that exception, and only it.** Calendar, DateField and DatePicker resolve their locale through one helper, `resolveLocale()` in each package's `calendar/date-utils.ts`:

```
component prop  ??  getUiCoreConfig().locale  ??  navigator.language  ??  'en-US'
```

The config default is `''`, not `'en'` — an unset locale has to fall through to the runtime, which is what these components did before the config was wired in. Never read `config.locale` to pick UI text; that is what `labels` is for.

**Content text is not a label.** A headline, body copy, or an option's own name has no sane default and must be a required prop or a slot. It never gets a `labels` entry.

### Documentation convention (JSDoc/TSDoc) — required

JSDoc comments in component source are the **single source of truth** for all component documentation. Three layers are generated from them — none is maintained by hand:

1. **IDE hints** — `tsc` copies JSDoc into the published `.d.ts` files (`declaration: true` in both `tsconfig.build.json`s).
2. **Storybook autodocs** — React via react-docgen, Lit via the Custom Elements Manifest (`custom-elements.json`, generated by `cem:build`).
3. **`dist/llms.txt`** — per-package component reference for AI agents, generated during `build` (see "llms.txt generation" below).

**React — document the exported Props interface** (react-docgen-typescript parses interfaces):

- One-sentence component description as the interface's top JSDoc block
- One `@example` per component showing typical usage
- Every prop gets a one-line description; non-obvious defaults get `@default`

```tsx
/**
 * Inline spinner indicating a pending asynchronous operation.
 *
 * @example
 * <Loader size="small" label="Loading results" />
 */
export interface LoaderProps {
  /**
   * Spinner diameter.
   * @default 'default'
   */
  size?: 'small' | 'default' | 'large';
  /** Accessible name announced by screen readers. @default 'Loading' */
  label?: string;
}
```

**Lit — document the class:**

- One-sentence component description as the class's top JSDoc block
- One `@example` per component showing typical usage (markdown code fence)
- `@element` tag name
- `@slot` for every slot (unnamed slot: `@slot - description`)
- `@fires` for every custom event dispatched
- `@cssprop` for every documented CSS custom property override hook
- Every `@property` gets a one-line description; non-obvious defaults get `@default`

````ts
/**
 * Inline spinner indicating a pending asynchronous operation.
 *
 * @element ui-loader
 *
 * @example
 * ```html
 * <ui-loader data-size="small" label="Loading results"></ui-loader>
 * ```
 *
 * @cssprop --loader-color - Spinner color. Defaults to `--color-icon-default`.
 */
@customElement('ui-loader')
export class UiLoader extends LitElement {
  /**
   * Spinner diameter.
   * @default 'default'
   */
  @property({ type: String, reflect: true, attribute: 'data-size' }) size = 'default';
}
````

Semantic-token references in descriptions (`--color-icon-default`) are documentation, not values — the zero-hardcoded-values rule applies to CSS, not JSDoc.

### Lit (Web Components) — CSS architecture

- Styles in co-located `*.styles.ts` files using Lit `css\`\`` tagged template literal
- Shadow DOM provides style isolation — no BEM block prefix needed
- Convention: `:host` for block, simple element classes (`.label`, `.icon`), `:host([attr])` for variant/state modifiers
- Local CSS variable aliases per variant (e.g. `--button-bg-default`, `--button-fg-hover`) — map global semantic tokens to local variables, then apply in state selectors
- Focus ring via shared mixin `focusStyles` from `web-components/src/styles/focus.styles.ts`
- `prefers-reduced-motion` handled via shared mixin `motionStyles`

### React — CSS architecture

React components render in the **light DOM** — no style isolation. The styling strategy reflects this:

**Co-located CSS file — primary approach:**

Every React component has a `component.css` file next to it. All visual styles live there — never as inline styles, never as Tailwind utilities inside component internals.

```
packages/react/src/loader/
  Loader.tsx       ← imports ./loader.css, applies class names only
  loader.css       ← all visual styles: layout, color, animation, states
  Loader.stories.tsx
  Loader.test.tsx
```

Class naming uses a BEM-like prefix (`ui-{component}__element--modifier`) to avoid collisions in the light DOM:

```css
/* loader.css */
.ui-loader { ... }
.ui-loader__spinner { ... }
.ui-loader__spinner--small { ... }
.ui-loader__spinner--large { ... }
```

The component applies classes only — no style objects:

```tsx
// Loader.tsx
import './loader.css';

<span className={['ui-loader', className].filter(Boolean).join(' ')} style={style}>
  <span className={`ui-loader__spinner ui-loader__spinner--${size}`} />
</span>;
```

**Why not inline styles:**

Inline styles (`style={{ ... }}`) have the highest CSS specificity — consumers cannot override them via cascade or utility classes. They also cannot express `@keyframes`, `@media`, or pseudo-classes. **Inline styles are forbidden inside component internals.**

The only exception: the `style` prop passed by the consumer is forwarded to the root element as-is. This allows consumers to set positioning (`position`, `margin`, `top`) without requiring wrapper elements. It must never be used to apply component-owned visual styles.

**Why not Tailwind inside components:**

Tailwind utility classes are for **page layout and consumer-side composition** — not for component internals. Inside a component, utilities like `flex`, `rounded-full`, or `animate-spin` create tight coupling to Tailwind's output and make overriding harder. Use CSS custom properties directly in the co-located CSS file instead.

**Token usage in CSS files:**

All values must reference CSS custom properties from `@mszczygiel-projects/ui-core-foundations`. Never hardcode colors, sizes, or durations:

```css
/* ✅ correct */
.ui-loader {
  color: var(--loader-color, var(--color-icon-default));
}
.ui-loader__spinner {
  animation-duration: var(--duration-700);
}

/* ❌ wrong */
.ui-loader {
  color: #174ba0;
}
.ui-loader__spinner {
  animation-duration: 700ms;
}
```

Acceptable hardcoded values: sub-pixel geometry (e.g. `border-width: 1.5px`, `2px`, `2.5px`) where no token exists at that precision.

**Consumer hook pattern:**

Components expose CSS custom property hooks (e.g. `--loader-color`) that consumers can set without touching internal class names. The hook has no definition in the library — its absence causes automatic fallback to the semantic token default:

```css
.ui-loader {
  /* --loader-color is undefined by default → fallback to semantic token */
  color: var(--loader-color, var(--color-icon-default));
}
```

Consumer override:

```css
:root {
  --loader-color: var(--color-brand-secondary);
}
```

**For programmatic use (canvas, dynamic inline values):** import `tokens` from `@mszczygiel-projects/ui-core-foundations` — TypeScript references to CSS var names, never raw values.

---

## 7. Workflow & Tooling

### Development workflow

```
Planning & decisions  →  Chat (UI Core Library project in Claude)
Implementation        →  Claude Code (folder: ui-core-library/)
File-based tasks      →  Cowork (linked to this project)
```

### Storybook — setup & story location

One Storybook instance covers both Lit (Web Components) and React. The framework is `@storybook/react-vite`; WC stories render custom elements through React's `createElement`, so a single renderer serves both packages.

**Autodocs** (`tags: ['autodocs']` in `preview.ts`) generates a docs page with a props table per component:

- **React stories** — table extracted by react-docgen from the Props interface JSDoc.
- **WC stories** — table extracted from `packages/web-components/custom-elements.json` (Custom Elements Manifest, generated by `cem:build` from the Lit class JSDoc). `preview.ts` registers it via `setCustomElementsManifest()`; each WC story sets `component: 'ui-<tag>'` so the docs renderer can find the declaration. The manifest is regenerated automatically before `storybook dev`/`storybook build` (pre-scripts in `apps/storybook/package.json`) — run `pnpm --filter @mszczygiel-projects/ui-core-wc run cem:build` manually if you edit Lit JSDoc while Storybook is running.

**Story location — co-located:**

Stories live next to the component source file. When you change a component, the story is right there.

```
packages/web-components/src/button/
  button.ts
  button.styles.ts
  button.stories.ts    ← co-located
  button.test.ts

packages/react/src/button/
  Button.tsx
  Button.stories.tsx   ← co-located
```

`apps/storybook/.storybook/main.ts` collects them via glob:

```ts
stories: [
  '../../packages/web-components/src/**/*.stories.ts',
  '../../packages/react/src/**/*.stories.tsx',
];
```

**No watchers needed — Vite aliases resolve packages from source:**

```ts
// apps/storybook/.storybook/main.ts
viteFinal: (config) => {
  config.resolve.alias = {
    '@mszczygiel-projects/ui-core-foundations': path.resolve(
      __dirname,
      '../../../packages/foundations/src',
    ),
    '@mszczygiel-projects/ui-core-wc': path.resolve(
      __dirname,
      '../../../packages/web-components/src',
    ),
    '@mszczygiel-projects/ui-core-react': path.resolve(__dirname, '../../../packages/react/src'),
    '@mszczygiel-projects/ui-core-icons': path.resolve(__dirname, '../../../packages/icons/src'),
  };
  return config;
};
```

Vite watches source files directly — changes to components are reflected immediately via HMR, no intermediate build step needed.

**Exception:** generated files (`tokens.css`, `typography.css`, `custom-elements.json`) have no source Vite can watch — their sources are Figma JSON and Lit JSDoc. Run the matching build once after changing them.

```
Daily dev:               pnpm storybook   (cem:build runs automatically via pre-script)
After Figma export:      pnpm foundations:build  →  pnpm storybook
After Lit JSDoc changes: pnpm --filter @mszczygiel-projects/ui-core-wc run cem:build  (only if Storybook is already running)
```

### llms.txt generation

Both component packages ship a generated `dist/llms.txt` — a markdown reference (per the [llms.txt convention](https://llmstxt.org)) with one section per component: description, props/attributes table, events/slots (Lit), and the `@example` snippet verbatim. AI agents consuming the published packages read it instead of parsing source.

- `packages/react/scripts/generate-llms.ts` — reads react-docgen-typescript output programmatically (+ the Props interface JSDoc for description/example) → `dist/llms.txt`
- `packages/web-components/scripts/generate-llms.ts` — reads `custom-elements.json` → `dist/llms.txt`

Generation is wired into each package's `build` script after the TS build step — never edit `dist/llms.txt` by hand; fix the JSDoc instead. Transformer logic lives in `scripts/llms-transformer.ts` per package, covered by Vitest (node) tests like the foundations/icons build scripts.

### Key commands

```bash
# Development
pnpm storybook              # dev Storybook — covers both Lit and React
pnpm foundations:build      # rebuild tokens + typography from figma-exports/
pnpm icons:build            # rebuild icons from src/svg/
pnpm --filter @mszczygiel-projects/ui-core-wc run cem:build   # rebuild custom-elements.json from Lit JSDoc

# Build & publish
pnpm build                  # build all packages (Nx, respects dependency order)
pnpm publish                # publish to GitHub Packages registry

# Linting & formatting
pnpm lint                   # ESLint
pnpm lint:fix               # auto-fix
pnpm format                 # Prettier
pnpm format:check           # CI check

# Testing
pnpm test                   # all test suites
pnpm test:foundations       # @mszczygiel-projects/ui-core-foundations — Vitest (node)
pnpm test:react             # @mszczygiel-projects/ui-core-react — Vitest + jsdom, then build-script tests (node)
pnpm test:wc                # @mszczygiel-projects/ui-core-wc — @web/test-runner + Playwright, then build-script tests (node)

# Watch modes
pnpm --filter @mszczygiel-projects/ui-core-foundations run test:watch
pnpm --filter @mszczygiel-projects/ui-core-react run test:watch
pnpm --filter @mszczygiel-projects/ui-core-react run test:ui     # Vitest UI
pnpm --filter @mszczygiel-projects/ui-core-wc run test:watch

# Visual regression
pnpm chromatic              # requires CHROMATIC_PROJECT_TOKEN env var
```

### Consumer CLI

Both `@mszczygiel-projects/ui-core-foundations` and `@mszczygiel-projects/ui-core-icons` expose a `bin` so a downstream project can rerun the same pipelines against its own sources:

```bash
pnpm exec ui-core-foundations build --input ./figma-exports --output ./src/generated/foundations
pnpm exec ui-core-icons       build --input ./brand-icons    --output ./src/generated/icons
```

`ui-core-foundations build` also takes `--no-auto-dark`, which drops the
`@media (prefers-color-scheme: dark)` mirror of the `Dark` theme mode. Use it in a project
whose theme is always set through `data-theme`; every mode is still emitted as
`[data-theme="…"]` either way (see "Layer 2 — Themes").

The CLIs are thin wrappers around `packages/*/scripts/build-*.ts`. Defaults match in-package paths, so `pnpm foundations:build` / `pnpm icons:build` behave exactly as before; the published bin entries are the `tsc`-compiled `dist/scripts/cli.js`. Scripts are compiled by a per-package `tsconfig.scripts.json` (loose strict, `types: ["node"]`) — separate from the source `tsconfig.build.json` so package types stay strict.

### GitHub Packages — setup

Add `.npmrc` at project root and in every consuming project:

```
@mszczygiel-projects:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Set `GITHUB_TOKEN` as an environment variable (never commit it).

### Consuming the library in another project

```bash
pnpm add @mszczygiel-projects/ui-core-foundations @mszczygiel-projects/ui-core-react
# or
pnpm add @mszczygiel-projects/ui-core-foundations @mszczygiel-projects/ui-core-wc
```

```css
/* global.css */

/* Tailwind projects — tokens + Tailwind theme mapping: */
@import '@mszczygiel-projects/ui-core-foundations/tailwind.css';

/* Non-Tailwind projects — only tokens: */
/* @import '@mszczygiel-projects/ui-core-foundations/tokens.css'; */

/* Add reset + typography classes (optional): */
@import '@mszczygiel-projects/ui-core-foundations/base.css';
/* or granularly: */
/* @import '@mszczygiel-projects/ui-core-foundations/reset.css'; */
/* @import '@mszczygiel-projects/ui-core-foundations/typography.css'; */

/* Per-client brand overrides: */
:root {
  --color-brand-primary: #00632a;
  --color-brand-primary-hover: #004d20;
  --color-brand-primary-contrast: #ffffff;
}
```

### Node / tooling requirements

- Node.js 20+
- pnpm 9+
- Nx CLI: `npm install -g nx`

---

## 8. Key Architectural Principles (Summary)

1. **Zero hardcoded values** — every visual property in every component references a CSS custom property from `@mszczygiel-projects/ui-core-foundations`.
2. **Semantic tokens in components, never Primitives** — use `--color-button-primary-background-default`, not `--color-brand-primary-500`.
3. **Surface context is automatic** — place `data-surface` on a container and all children adapt. No per-component changes needed.
4. **Build pipeline is unidirectional** — Figma → Luckino JSON → build scripts → generated files. `build-tokens.ts` handles Variables; `build-typography.ts` handles Text Styles. Never hand-edit generated files.
5. **Shadow DOM vs. light DOM requires different strategies** — global CSS doesn't pierce Shadow DOM; Lit components use shared mixins for focus and motion.
6. **Font loading is a consumer concern** — library provides CSS variable declarations only.
7. **Lit and React are separate implementations** — they share tokens, not code.
8. **Figma and code share the same vocabulary** — `[Core] Foundations` in Figma = `@mszczygiel-projects/ui-core-foundations` in code. Designers and developers operate on the same mental model.
9. **Figma forking is copying, not inheriting** — client forks must be manually updated when Core changes. Stable variable naming minimizes propagation overhead.
10. **Planning happens in chat, implementation in Claude Code** — every planning session should end with a prepared prompt for Claude Code.
