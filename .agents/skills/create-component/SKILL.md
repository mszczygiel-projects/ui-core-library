---
name: create-component
description: >
  End-to-end playbook for adding a new component to the UI Core Library — from
  Figma semantic variables in [Core] Foundations, through the Component Set design
  in [Core] UI Library, token export, up to the Lit + React implementation.
  Trigger when the user wants to create a brand-new component "the same way Badge
  was made" (e.g. "stwórz komponent Chip/Tag/Alert", "new component end to end").
  For the implementation-spec step alone, use the `component-spec` skill instead.
---

# Create Component — Figma → tokens → Lit + React

Proven pipeline (established while building Badge, 2026-07). Four stages with
**hard user gates** between them. Never skip a gate, never start the next stage
before the user confirms.

```
Stage 1  Foundations variables  →  GATE: user publishes [Core] Foundations
Stage 2  Component Set design   →  GATE: user accepts design + publishes again if
                                   variables were added meanwhile
Stage 3  Token export           →  GATE: user runs Luckino export into the repo
Stage 4  Implementation (code)  →  tests + Storybook verification
```

Files: `[Core] Foundations` = `Xxn0guDvAfyIqEKB6kADE9`, `[Core] UI Library` =
`BzqkruN7r8mwWfFReznc83`. Reference implementations: Button (`179:100`,
interactive), Badge (`2037:98`, non-interactive), Chip (`2068:2859`, interactive
with a nested independently-interactive sub-component — the dismiss button).

---

## Stage 1 — Semantic variables in [Core] Foundations

Read the current collections first (`getLocalVariableCollectionsAsync`) — IDs and
mode IDs, never assume. Collections: Primitives Colors/Sizes/Motions/Shadows,
Themes (Default+Dark), Surfaces (Default+Subtle+Inverse+Primary), Sizes
(Mobile+Desktop).

### Color tokens — the 4×N recipe

For a component with `{variant}` × `{style}` × `{property}` (property =
background / text / border):

1. **Themes, base group**: `color/{component}/{variant}/{style}/{property}`
   - success/warning/error/info variants → alias `Themes.color.feedback.{v}.{base|on-base|subtle}`
   - neutral → alias `background.subtle` / `text.secondary` (subtle) or gray
     primitives + white (solid)
   - brand → alias `brand.primary` + `on-brand-primary.text.primary` (solid),
     brand primitives 100/700 (subtle)
2. **Themes, three surface groups**: the same set under
   `color/on-subtle/…`, `color/on-inverse/…`, `color/on-brand-primary/…` —
   alias the matching `on-{s}.feedback/background/text/brand` token when the
   source domain exists there; otherwise the same value as the base group.
3. **Surfaces**: `color/{component}/{variant}/{style}/{property}` with 4 modes:
   Default → Themes base, Subtle → `on-subtle` group, Inverse → `on-inverse`,
   Primary → `on-brand-primary`. **Components bind ONLY these.**

Rules that came out of Badge:

- **Scopes:** Surfaces variables → `v.scopes = ['ALL_SCOPES']` (designers must be
  able to pick them). Themes variables → `[]` (internal, hidden from pickers).
  `createVariable` does not guarantee the right value — set it explicitly.
- **Border = background:** when design wants border identical to fill, alias the
  border token to the _same group's_ background token (all 4 Themes groups +
  Surfaces). Future background changes then propagate automatically.
- **Text on fixed light tints (subtle style):** use a fixed dark primitive in
  BOTH Themes modes (e.g. green/950, red/900). Do NOT alias `feedback.base` —
  base lightens in Dark while the 100-tint background stays light → contrast
  collapses to ~2:1.
- **Contrast flags:** solid success/warning inherit `feedback.base` + white
  `on-base` (~3.4:1 / ~2.5:1). This is a system-level issue — fix (if ever) at
  the feedback tokens, not per component. Flag it to the user, don't silently
  change it.

### Size tokens

In the **Sizes** collection: `{component}/{size}/{property}` +
size-independent `{component}/{property}`, e.g.
`badge/{small,medium}/{height,padding/inline,icon/size,font-size,line-height}`,
`badge/{font-family,font-weight,letter-spacing,gap,padding/inline--icon-only,rounded/radius,square/radius}`.
Each aliases a primitive (`size/5`, `spacing/2`, `text/xs`, `radius/full`…).
Same value in Mobile and Desktop unless the design differs.

### Verify before handing over

In one read: counts per collection, scopes histogram, and resolve a few alias
chains to hex for every Themes mode and every Surfaces mode (walk
`valuesByMode` until a raw color). Then ask the user to **publish** — new
variables are importable in other files only after publication.

---

## Stage 2 — Component Set in [Core] UI Library

- One page per component; Component Set with Figma properties named like
  `Variant / Style / Size / Shape / Content` + component props (`Text` TEXT,
  `Icon` INSTANCE_SWAP with a default icon from the icon library).
- Root per variant: Auto Layout, fixed height, padding/gap per size. Icon slot
  and label as children. Non-interactive components get NO state variants.
- **Bind colors from Surfaces only** (fills, text, icon fills, strokes).
  Sizes/typography from the Sizes collection; radius semantic (Themes/Sizes).
- Cross-file binding mechanics (all learned the hard way):
  - `importVariableByKeyAsync`/`importStyleByKeyAsync` are **session-scoped** —
    import by key at the top of EVERY `use_figma` call that binds.
  - `setBoundVariableForPaint(paint, 'color', null)` **binds nothing silently**
    — assert `newPaint.boundVariables.color` after every call.
  - Library variables are importable **only after the library is published** —
    tokens created after the last publish throw "Variable with key … not found".
  - Drive bind passes from `variant.variantProperties` (e.g.
    `color/badge/{Variant.toLowerCase()}/{Style.toLowerCase()}/border`), never
    from layer order; verify with a readback + numeric spot-check
    (height/padding/fontSize per representative variant).
- **GATE:** user accepts the design. If any variables were created after the
  last publish, the user must publish again before the remaining bind passes.

---

## Stage 3 — Tokens into the repo

- The **user** exports Variables via Luckino into
  `packages/foundations/src/figma-exports/` (themes/surfaces/sizes/primitives).
- Run `pnpm foundations:build` — requires Node from `.nvmrc` (20+); if the shell
  has an old default, prefix `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH"`.
- Verify generated output:
  - `tokens.css` contains `--color-{component}-{variant}-{style}-{property}`
    (36 for a 6×2×3 matrix) and `--{component}-*` size vars;
  - each `[data-surface="…"]` block re-maps the component vars;
  - dark overrides land in `@media (prefers-color-scheme: dark)` (note: NOT
    `[data-theme="dark"]` — AGENTS.md description predates the current build);
  - build warnings: only pre-existing ones (radio violations); 0 circular,
    0 broken refs.
- Commit only when the user asks.

---

## Stage 4 — Implementation (Lit + React)

**Start with the `component-spec` skill** — produce the spec, then implement.
Conventions locked by Button/Badge:

### API naming

- Sizes are full words (`'small' | 'medium' | 'large'`), never `sm/md`. WC
  reflects size as the `data-size` attribute.
- Figma's `Style` property must be renamed in code — `style` is reserved
  (HTML attribute / React inline-style prop). Badge uses **`appearance`**.
- Content mode: WC uses an explicit boolean attribute (`icon-only`) + `label`
  attr for the accessible name (host gets `role="img"` + `aria-label`); React
  derives icon-only from `icon && children == null` and uses `aria-label`.
- Export types from the component file and re-export component + types from the
  package barrel (`src/index.ts` in both packages).

### CSS

- Local alias variables per variant×style block: `--_bg`, `--_text`,
  `--_border` — assigned in 12 selector blocks
  (`:host([variant='x'][appearance='y'])` / `.ui-x--variant.ui-x--style`),
  consumed once in the base rule. Default combo also on bare `:host`/`.ui-x`.
- **:host padding pitfall:** the consumer-level reset (`* { padding: 0 }`)
  outranks `:host` rules from inside the shadow tree. Padding (and anything the
  global reset touches) must live on an inner element (`.content`), exactly like
  Button. Height, colors, fonts, gap on `:host` are fine.
- Border width: no per-component token → use `var(--control-border-width)`.
  Never invent var names — every `var(--…)` must exist in `tokens.css`.
- Line-height tokens are unitless ratios; they pair correctly ONLY with the same
  size's font-size token. If Figma shows equal px line-height across sizes, use
  a fixed `--size-{n}` instead (Button case).
- Non-interactive components: no `focusStyles`, no state selectors.
- **`:host(:has(...))` silently drops the whole rule** in at least one shadow-DOM
  engine used by this project's Storybook build — `:has()` alone works, and
  `:host(.plain-class)` alone works, but nesting `:has()` inside `:host()`
  doesn't (`CSSStyleSheet.replaceSync` drops the rule with no error). Needed
  whenever a host-level style (e.g. a focus ring around the whole component)
  must react to ONE specific interactive descendant having focus while a
  SEPARATE descendant (e.g. a nested dismiss button) must not trigger it —
  `delegatesFocus` + `:host(:focus-visible)` (the Button pattern) can't
  express that asymmetry either, since it reflects ANY inner focus. Fix:
  toggle a plain class on the host from `focus`/`blur` handlers on the specific
  inner element, gated on `event.target.matches(':focus-visible')`, then style
  with `:host(.that-class)`. Verify by enumerating
  `shadowRoot.adoptedStyleSheets[i].cssRules` — a screenshot alone won't catch
  a silently-dropped rule. See chip's `chip.ts`/`chip.styles.ts` for the
  working pattern.
- **Verify contrast on all 4 Surfaces before shipping any style with a
  transparent or non-fixed background** (e.g. an `outline` appearance). A
  "subtle text = fixed dark primitive" token (see Stage 1 rule above) is only
  safe when paired with the component's OWN fixed light tint background: the
  moment a style has a transparent/surface-dependent background, that same
  text primitive sits directly on the page surface color and can lose almost
  all contrast on Inverse/Primary surfaces (near-black text on a black
  surface, for example). This is a Foundations-level gap (on-inverse/
  on-brand-primary groups lacking a lighter text variant for brand/warning),
  not a per-component bug — flag it, don't silently invent a component-local
  fix.

### Stories + tests + verification

- Stories are co-located; WC stories use React `createElement` (framework is
  react-vite — no `html` tag); icons via `svgMap` (WC) / `@…/ui-core-icons/react` (React).
- Always include an **OnSurfaces story** (4 `data-surface` wrappers with
  `background-color: var(--color-background-default)`) — it proves the whole
  Surfaces pipeline through the component.
- Tests: WC `@open-wc/testing` (defaults, attribute reflection, slots, ARIA);
  React Vitest + Testing Library (class mapping, derived modes, className/style
  forwarding, ARIA). Run `pnpm test:wc`, `pnpm test:react`, `pnpm lint`.
- Visual check in Storybook (`pnpm storybook`) via the browser: light AND dark
  (`prefers-color-scheme` emulation resets on navigation — re-apply after every
  `navigate`), probe computed styles (padding/height/font/line-height), check
  the console for errors.

### Constraint reminders

- Zero hardcoded values; semantic tokens only (Surfaces layer for colors).
- No Tailwind utilities and no inline styles inside component internals
  (forwarded `style` prop is the only exception).
- Lit: Shadow DOM + `*.styles.ts`; React: light DOM + co-located `.css` with
  `ui-{component}__el--mod` classes.
- Naming and comments in English. Co-located stories/tests. README per
  component directory (see Button/Badge for the format).
