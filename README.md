# UI Core Library

Framework-agnostic UI component library published as private npm packages to GitHub Packages. Implements design tokens and components for both Web Components (Lit) and React.

|           |                                                                  |
| --------- | ---------------------------------------------------------------- |
| Storybook | https://mszczygiel-projects.github.io/ui-core-library/           |
| Chromatic | https://www.chromatic.com/library?appId=69f357f4fd00c35ca47a1781 |

|                           |                                                                        |
| ------------------------- | ---------------------------------------------------------------------- |
| Figma: [Core] Foundations | https://www.figma.com/design/Xxn0guDvAfyIqEKB6kADE9/-Core--Foundations |
| Figma: [Core] Icons       | https://www.figma.com/design/lRdwn99eZTt6gCFeqc2Seh/Icons-Default      |
| Figma: [Core] UI Library  | https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/-Core--UI-Library  |

## Packages

| Package                                    | Description                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| `@mszczygiel-projects/ui-core-foundations` | Design tokens — CSS custom properties, Tailwind theme, TypeScript references |
| `@mszczygiel-projects/ui-core-icons`       | SVG icon set — Web Component map + React components                          |
| `@mszczygiel-projects/ui-core-wc`          | Web Components (Lit, Shadow DOM)                                             |
| `@mszczygiel-projects/ui-core-react`       | React components (React 18+, light DOM)                                      |

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

## Visual regression (Chromatic)

Chromatic runs automatically on every pull request and push to non-main branches.

### One-time setup

1. Create a project at [chromatic.com](https://www.chromatic.com) and copy the **Project ID** and **Project Token**.
2. Set the Project ID in [`chromatic.config.json`](chromatic.config.json):
   ```json
   { "projectId": "your-project-id" }
   ```
3. Add `CHROMATIC_PROJECT_TOKEN` as a **GitHub Actions secret**:
   `GitHub repo → Settings → Secrets and variables → Actions → New repository secret`

### Run locally

```bash
CHROMATIC_PROJECT_TOKEN=<token> pnpm chromatic
```

Chromatic builds Storybook, uploads it, and reports visual diffs. The run exits 0 even when there are changes (`exitZeroOnChanges: true`) — review and accept/reject diffs on chromatic.com.

`onlyChanged: true` speeds up runs by only testing stories affected by changed files (TurboSnap).

---

## Consuming in another project

Add `.npmrc` to the consuming project root:

```
@mszczygiel-projects:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Install packages:

```bash
pnpm add @mszczygiel-projects/ui-core-foundations @mszczygiel-projects/ui-core-react
# or
pnpm add @mszczygiel-projects/ui-core-foundations @mszczygiel-projects/ui-core-wc
```

Import CSS in your global stylesheet:

```css
/* Tailwind project */
@import '@mszczygiel-projects/ui-core-foundations/tailwind.css';

/* Non-Tailwind project */
@import '@mszczygiel-projects/ui-core-foundations/tokens.css';

/* Optional: reset + typography utility classes */
@import '@mszczygiel-projects/ui-core-foundations/base.css';
```

Per-client brand overrides go on `:root` after the imports:

```css
:root {
  --color-brand-primary: #00632a;
  --color-brand-primary-hover: #004d20;
  --color-brand-primary-contrast: #ffffff;
}
```

## Generating your own tokens / icons

Both `@mszczygiel-projects/ui-core-foundations` and `@mszczygiel-projects/ui-core-icons` ship a CLI so a consumer project can regenerate `tokens.css` / `tailwind.css` / `tokens.ts` from its own Luckino export, or build an icon set from its own SVG sources.

```bash
# Tokens — input dir must contain primitives.json, themes.json, surfaces.json, sizes.json (Luckino exports).
pnpm exec ui-core-foundations build \
  --input ./figma-exports \
  --output ./src/generated/foundations

# Icons — input dir must contain icon-*.svg files.
pnpm exec ui-core-icons build \
  --input ./brand-icons \
  --output ./src/generated/icons
```

The generated `tokens.css` / `tailwind.css` are drop-in replacements for the versions exported from the package — import them instead when the project needs its own brand tokens. The generated `svg-map.js` and `react/` folder likewise replace the default icon set.

## Component docs

Component-specific behavior is documented next to implementation files:

- [React Button](packages/react/src/Button/README.md)
- [React IconButton](packages/react/src/IconButton/README.md)
- [React Loader](packages/react/src/Loader/README.md)
- [React CheckboxField](packages/react/src/CheckboxField/README.md)
- [React RadioField](packages/react/src/RadioField/README.md)
- [React PasswordField](packages/react/src/PasswordField/README.md)
- [React SearchField](packages/react/src/SearchField/README.md)
- [React SelectField](packages/react/src/SelectField/README.md)
- [React TextField](packages/react/src/TextField/README.md)
- [Web Components Button](packages/web-components/src/button/README.md)
- [Web Components IconButton](packages/web-components/src/icon-button/README.md)
- [Web Components Loader](packages/web-components/src/loader/README.md)
- [Web Components CheckboxField](packages/web-components/src/checkbox-field/README.md)
- [Web Components RadioField](packages/web-components/src/radio-field/README.md)
- [Web Components PasswordField](packages/web-components/src/password-field/README.md)
- [Web Components SearchField](packages/web-components/src/search-field/README.md)
- [Web Components SelectField](packages/web-components/src/select-field/README.md)
- [Web Components TextField](packages/web-components/src/text-field/README.md)
