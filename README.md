# UI Core Library

Framework-agnostic UI component library published as private npm packages to GitHub Packages. Implements design tokens and components for both Web Components (Lit) and React.

## Packages

| Package | Description |
|---|---|
| `@ui-core/foundations` | Design tokens — CSS custom properties, Tailwind theme, TypeScript references |
| `@ui-core/icons` | SVG icon set — Web Component map + React components |
| `@ui-core/wc` | Web Components (Lit, Shadow DOM) |
| `@ui-core/react` | React components (React 18+, light DOM) |

## Requirements

- Node.js 20+
- pnpm 9+
- Nx CLI: `npm install -g nx`

## Setup

### 1. GitHub token

Create a GitHub personal access token with `read:packages` (install) and `write:packages` (publish) scopes:
[https://github.com/settings/tokens](https://github.com/settings/tokens)

Export it in your shell profile:

```bash
export GITHUB_TOKEN=ghp_yourtoken
```

The `.npmrc` at the project root picks it up automatically — never hardcode the token.

### 2. Install

```bash
pnpm install
```

## Development

```bash
pnpm storybook              # Storybook dev server (Lit + React)
pnpm foundations:build      # Rebuild tokens from Figma exports
pnpm icons:build            # Rebuild icon set from src/svg/
```

## Testing

```bash
pnpm test                   # All suites
pnpm test:foundations       # Token build tests (Vitest, Node)
pnpm test:icons             # Icon build tests (Vitest, Node)
pnpm test:react             # React component tests (Vitest + jsdom)
pnpm test:wc                # Web Component tests (@web/test-runner + Playwright)
```

## Build & publish

```bash
pnpm build                  # Build all packages (dependency order via Nx)
pnpm publish                # Publish to GitHub Packages (runs build first)
```

`GITHUB_TOKEN` must be set to publish.

## Linting & formatting

```bash
pnpm lint                   # ESLint
pnpm lint:fix               # Auto-fix
pnpm format                 # Prettier
pnpm format:check           # CI check
```

## Consuming in another project

Add `.npmrc` to the consuming project root:

```
@ui-core:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Install packages:

```bash
pnpm add @ui-core/foundations @ui-core/react
# or
pnpm add @ui-core/foundations @ui-core/wc
```

Import CSS in your global stylesheet:

```css
/* Tailwind project */
@import '@ui-core/foundations/tailwind.css';

/* Non-Tailwind project */
@import '@ui-core/foundations/tokens.css';

/* Optional: reset + typography utility classes */
@import '@ui-core/foundations/base.css';
```

Per-client brand overrides go on `:root` after the imports:

```css
:root {
  --color-brand-primary: #00632a;
  --color-brand-primary-hover: #004d20;
  --color-brand-primary-contrast: #ffffff;
}
```
