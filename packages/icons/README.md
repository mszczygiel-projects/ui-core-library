# @ui-core/icons

Icon package. Provides React components and a raw SVG map generated from `src/svg`.

## Usage

### React components

Named exports from `@ui-core/icons/react`. Each component accepts all standard `SVGProps<SVGSVGElement>` props (`className`, `style`, `aria-label`, etc.) and renders a scalable icon that inherits `color` from the parent via `currentColor`.

```tsx
import { IconAlert, IconSearch, IconUser } from '@ui-core/icons/react';

<IconAlert />
<IconSearch className="w-5 h-5 text-red-500" />
<IconUser aria-label="User profile" />
```

Available components: `IconAlert` `IconCart` `IconChevronDown` `IconChevronLeft` `IconChevronRight` `IconChevronUp` `IconClose` `IconContact` `IconDanger` `IconDelete` `IconEye` `IconEyeSlash` `IconFlag` `IconHeart` `IconHome` `IconInfo` `IconMenu` `IconRefresh` `IconSearch` `IconSettings` `IconShoppingBag` `IconStar` `IconSwap` `IconTicket` `IconUser` `IconUsers`

### SVG map (framework-agnostic)

```ts
import { svgMap } from '@ui-core/icons';
import type { IconName } from '@ui-core/icons';

const svg: string = svgMap['icon-alert']; // raw optimised SVG string

// Type-safe icon name:
const name: IconName = 'icon-search';
const markup = svgMap[name];
```

`svgMap` is a plain `Record<IconName, string>` — useful for non-React rendering, SSR preloading, or custom icon components.

## Build

```bash
pnpm --filter @ui-core/icons run build
```

The build script reads SVG files from `src/svg`, normalizes names to the `icon-*` convention, optimizes SVG content, and regenerates the full `dist` folder.

## Test

```bash
pnpm --filter @ui-core/icons run test
```

## Conventions

- Add new icons only to `src/svg`.
- Generated files are written to `dist`.
- Do not manually edit files in `dist`.
- React exports are available from `@ui-core/icons/react`.
