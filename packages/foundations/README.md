# @ui-core/foundations

Design foundations package. Provides design tokens (as CSS custom properties and a typed JS object) plus utility CSS for typography, Tailwind integration and resets.

## Usage

### CSS — tokens and typography

Import CSS files in your app entry point or global stylesheet. All paths are available as package subpath exports.

```ts
// Design tokens — CSS custom properties (--color-*, --spacing-*, etc.)
import '@ui-core/foundations/tokens.css';

// Tailwind CSS token bridge (maps tokens to Tailwind utilities)
import '@ui-core/foundations/tailwind.css';

// Typography utility classes (.text-body, .text-heading-xl, etc.)
import '@ui-core/foundations/typography.css';

// CSS reset
import '@ui-core/foundations/reset.css';

// Base styles (recommended default pairing: reset + tokens)
import '@ui-core/foundations/base.css';

// Default web font faces
import '@ui-core/foundations/fonts/default.css';
```

### JS — typed token values

`tokens` is a deeply nested object where each leaf is a CSS custom property reference (`var(--…)`). Use it for dynamic styles or to avoid magic strings when accessing token values in JS/TS.

```ts
import { tokens } from '@ui-core/foundations';
import type { TokenKey } from '@ui-core/foundations';

// Access a token value — returns e.g. "var(--color-themes-brand-primary)"
const brandColor = tokens.themes.color.onSubtle.brand.primary;

// TokenKey is a union of all valid dot-separated token paths
function getToken(key: TokenKey) { ... }
```

## Build

```bash
pnpm --filter @ui-core/foundations run build
```

Build pipeline:

- `scripts/build-tokens.ts` generates token artifacts from `src/figma-exports`
- `scripts/build-typography.ts` generates typography utilities
- TypeScript compilation runs with `tsconfig.build.json`

## Test

```bash
pnpm --filter @ui-core/foundations run test
```

## Conventions

- Source exports live in `src`.
- Generated CSS and token files are regenerated from Figma exports.
- Do not edit generated artifacts manually unless you are intentionally patching generated output.
