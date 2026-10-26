# UI Core Library

Design tokens, icons and UI components for web applications. Every component exists twice, with one behaviour and one look: as a web component for any framework, or none, and as a React component.

| Package                                       | Contents                                                       |
| --------------------------------------------- | -------------------------------------------------------------- |
| `@mszczygiel-projects/ui-core-foundations`    | design tokens as CSS, Tailwind and TypeScript, and a token CLI |
| `@mszczygiel-projects/ui-core-icons`          | icons as SVG strings, and an icon CLI                          |
| `@mszczygiel-projects/ui-core-web-components` | web components, written with Stencil                           |
| `@mszczygiel-projects/ui-core-react`          | React components                                               |
| `@mszczygiel-projects/ui-core-shared`         | what both component packages share                             |

The library is in development, and nothing is published before 1.0.0.

## Quick start

With Node.js 24 and Corepack:

```sh
corepack enable
pnpm install
pnpm --filter @mszczygiel-projects/ui-core-storybook exec playwright install chromium
pnpm nx run storybook:storybook
```

The documentation site opens at `http://localhost:6006`. [The setup guide](docs/guides/setup.md) covers the rest.

## Where to read

| You want to                               | Read                                                |
| ----------------------------------------- | --------------------------------------------------- |
| use the library                           | the Storybook site: Guides, Foundations, Components |
| know how the library is developed         | [CONTRIBUTING.md](CONTRIBUTING.md)                  |
| change tokens, icons, components or Figma | [the guides](docs/guides/README.md)                 |
| know why something is the way it is       | [the decisions](docs/decisions/README.md)           |
| work on it as an agent                    | [AGENTS.md](AGENTS.md)                              |
