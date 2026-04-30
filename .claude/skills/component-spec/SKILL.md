---
name: component-spec
description: >
  Generate a full implementation spec for a new UI component before writing any code.
  Trigger this skill at the start of every new component implementation — when the user
  says "implement component X", "add a new component", "start working on [ComponentName]",
  or provides a Figma link alongside a component name. Also trigger when the user asks
  "what do we need to build for X?" in a component context. Do NOT trigger for token
  changes, layout work, or Storybook-only tasks.
---

# Component Spec

Generates a structured implementation plan for a new UI component in ui-core-library,
covering both Lit (Web Components) and React implementations.

## Inputs

- **Component name** (required) — e.g. `Button`, `Badge`, `Tooltip`
- **Figma link** (optional) — link to the Component Set in `[Core] UI Library`

## What this skill produces

A spec document covering all decisions Claude Code needs before writing a single line.
Output directly in the conversation — no file created.

---

## Step 1 — Gather context

If a Figma link was provided, use the Figma MCP tool to read the component node:
- Component Set properties (variants, sizes, states)
- Auto Layout structure → maps to flex/grid in CSS
- Token usage on layers (fill, stroke, typography, spacing, radius)

If no Figma link: ask the user for the variant/state/size matrix before continuing.

---

## Step 2 — Produce the spec

Output a structured spec with the following sections. Keep each section tight — this
is a handoff document for implementation, not a design document.

### 1. Component overview
- Purpose in one sentence
- Figma Component Set location (file + frame path if known)
- Package scope: `@ui-core/wc` + `@ui-core/react` (always both unless stated otherwise)

### 2. API surface

List all props/attributes. For each:

| Prop/Attr | Type | Default | WC attr name | Notes |
|---|---|---|---|---|

WC attribute names are always kebab-case. Reflect to DOM attribute only for primitive
types (string, boolean, number). Complex types (arrays, objects) are property-only.

### 3. Variants & states matrix

Table: rows = variants/sizes, columns = interactive states.
Mark which combinations exist in Figma. Flag any that need special CSS treatment.

### 4. File structure

Exact files to create. Follow the established pattern:

packages/web-components/src/{component-kebab}/
{component-kebab}.ts          ← Lit element
{component-kebab}.styles.ts   ← Lit css`` styles
{component-kebab}.stories.ts  ← Storybook (html tag)
{component-kebab}.test.ts     ← @web/test-runner + @open-wc/testing
packages/react/src/{ComponentPascal}/
{ComponentPascal}.tsx         ← React component
{component-kebab}.css         ← co-located CSS, BEM-like prefix ui-{component}__el--mod
{ComponentPascal}.stories.tsx ← Storybook (JSX)
{ComponentPascal}.test.tsx    ← Vitest + Testing Library

Add barrel exports to:
- `packages/web-components/src/index.ts`
- `packages/react/src/index.ts`

### 5. Token mapping

Table: visual property → CSS custom property. Only semantic tokens (Surfaces layer).
Never Primitives. Format: `var(--color-{category}-{role}-{state})`.

| Visual property | CSS var | Notes |
|---|---|---|

List consumer hooks if any (e.g. `--{component}-color` with fallback pattern).

### 6. CSS architecture notes

**Lit:**
- `:host` = block element
- Simple element classes: `.label`, `.icon`, `.track`
- `:host([attr])` for variant/state modifiers
- Local alias variables per variant → applied in state selectors
- Focus ring: import `focusStyles` from `web-components/src/styles/focus.styles.ts`
- Animation: import `motionStyles` mixin if component animates

**React:**
- BEM-like class prefix: `ui-{component}__element--modifier`
- All styles in co-located `.css` — no inline styles, no Tailwind utilities
- Forward `style` prop to root element only (consumer positioning hook)
- Import CSS at top of `.tsx`

### 7. Storybook stories

List the stories to create:

| Story name | Description |
|---|---|

Default export uses `@ui-core/foundations/base.css` + story-level decorator if needed.
WC stories use `html` tag. React stories use JSX.

### 8. Tests to write

**WC (`{component}.test.ts`):**
- Renders without error
- Reflects each attribute correctly
- State transitions (if interactive)
- Slot content projected correctly (if component has slots)
- Accessibility attributes present

**React (`{ComponentPascal}.test.tsx`):**
- Renders without error
- Prop → class name mapping
- Forwards `className` and `style` to root
- Event handler callbacks (if interactive)

### 9. Accessibility checklist

- ARIA role (implicit from element or explicit `role=""`)
- `aria-label` / `aria-labelledby` strategy
- Keyboard interaction (if interactive)
- Focus visible — uses shared `focusStyles` mixin (WC) / `reset.css` focus ring (React)
- Color contrast — relies on semantic tokens; document if manual check needed

### 10. Open questions

List anything that needs design or product decision before implementation can start.
If Figma link was provided and all questions are answered, write "None."

---

## Constraint reminders (always include at bottom of spec)

These rules come from [CLAUDE.md](http://CLAUDE.md) and must be followed in implementation:

- Zero hardcoded values — every visual property via CSS custom property
- Semantic tokens only in components — never Primitives (`--color-{palette}-{shade}`)
- No Tailwind utilities inside component internals
- No inline styles inside component internals (forwarded `style` prop is the only exception)
- Lit: styles in `*.styles.ts`, shadow DOM, `:host`-based selectors
- React: styles in `*.css`, BEM-like prefix, light DOM
- Stories co-located next to component source
- Naming and comments in English
