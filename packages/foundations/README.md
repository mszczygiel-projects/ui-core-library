# @mszczygiel-projects/ui-core-foundations

Design foundations package. Provides design tokens (as CSS custom properties and a typed JS object) plus utility CSS for typography, Tailwind integration and resets.

## Usage

### CSS — tokens and typography

Import CSS files in your app entry point or global stylesheet. All paths are available as package subpath exports.

```ts
// Design tokens — CSS custom properties (--color-*, --spacing-*, etc.)
import '@mszczygiel-projects/ui-core-foundations/tokens.css';

// Tailwind CSS token bridge (maps tokens to Tailwind utilities)
import '@mszczygiel-projects/ui-core-foundations/tailwind.css';

// Typography utility classes (.text-body, .text-heading-xl, etc.)
import '@mszczygiel-projects/ui-core-foundations/typography.css';

// CSS reset
import '@mszczygiel-projects/ui-core-foundations/reset.css';

// Base styles (recommended default pairing: reset + tokens)
import '@mszczygiel-projects/ui-core-foundations/base.css';

// Default web font faces
import '@mszczygiel-projects/ui-core-foundations/fonts/default.css';
```

### Theming — `data-theme`

Each mode of the Figma `Themes` collection becomes its own attribute selector in
`tokens.css`. Set one attribute and every token below it switches:

```html
<html data-theme="dark">
  …
</html>
```

The base mode (`Default`) lives on `:root`, so no attribute is needed for it —
`data-theme="default"` is accepted too, and is the way to pin the light theme on a
dark-mode OS. Other modes use the kebab-cased mode name: `Dark` → `dark`,
`DarkGreen` → `dark-green`.

```css
/* generated in tokens.css */
:root,
[data-theme='default'],
[data-surface='default'] {
  --color-background-default: var(--color-white-1000);
}
[data-theme='dark'],
[data-theme='dark'] [data-surface='default'] {
  --color-background-default: var(--color-gray-900);
}
```

The package as published ships `Default` and `Dark`. **The build has no fixed list of theme
names** — regenerate with the CLI (see [Build](#build)) against a Figma file with more modes
and each one gets its own `[data-theme="…"]` block.

`Dark` is also mirrored into `@media (prefers-color-scheme: dark)`, scoped to
`:root:not([data-theme])` so the OS setting applies only until a theme is chosen explicitly.
Pass `--no-auto-dark` to the CLI to omit that mirror.

`data-theme` and `data-surface` are independent: the theme picks the palette, the surface
picks a context inside it. `data-surface="inverse"` under `data-theme="dark"` resolves
against the dark palette.

### JS — typed token values

`tokens` is a deeply nested object where each leaf is a CSS custom property reference (`var(--…)`). Use it for dynamic styles or to avoid magic strings when accessing token values in JS/TS.

```ts
import { tokens } from '@mszczygiel-projects/ui-core-foundations';
import type { TokenKey } from '@mszczygiel-projects/ui-core-foundations';

// Access a token value — returns e.g. "var(--color-on-subtle-brand-primary)"
const brandColor = tokens.themes.color.onSubtle.brand.primary;

// TokenKey is a union of all valid dot-separated token paths
function getToken(key: TokenKey) { ... }
```

## Build

```bash
pnpm --filter @mszczygiel-projects/ui-core-foundations run build
```

Build pipeline:

- `scripts/build-tokens.ts` generates token artifacts from `src/figma-exports`
- `scripts/build-typography.ts` generates typography utilities
- TypeScript compilation runs with `tsconfig.build.json`

Consumer projects can run the same pipeline against their own Luckino exports through the
`ui-core-foundations` bin — this is how a project gets tokens for its own set of theme modes:

```bash
pnpm exec ui-core-foundations build --input ./figma-exports --output ./src/generated/foundations
```

| Flag             | Effect                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| `-i, --input`    | Directory with `primitives.json`, `themes.json`, `surfaces.json`, `sizes.json`                                  |
| `-o, --output`   | Where to write `tokens.css`, `tailwind.css`, `tokens.ts`                                                        |
| `--no-auto-dark` | Skip the `@media (prefers-color-scheme: dark)` mirror of the `Dark` mode. `[data-theme]` blocks are unaffected. |

The build logs the modes it found, so a mode that never made it into the CSS is visible:

```
— 3 theme modes: Default (:root), Dark ([data-theme="dark"]), DarkGreen ([data-theme="dark-green"])
```

## Test

```bash
pnpm --filter @mszczygiel-projects/ui-core-foundations run test
```

## Conventions

- Source exports live in `src`.
- Generated CSS and token files are regenerated from Figma exports.
- Do not edit generated artifacts manually unless you are intentionally patching generated output.
