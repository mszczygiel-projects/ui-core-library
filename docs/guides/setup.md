# Setup

## First run

Use Node.js 24 from `.nvmrc` and pnpm through Corepack:

```sh
nvm install
nvm use
corepack enable
pnpm install
pnpm skills:install
pnpm --filter @mszczygiel-projects/ui-core-storybook exec playwright install chromium
pnpm nx run storybook:storybook
```

- `pnpm install` also installs the Git hooks.
- `pnpm skills:install` restores the agent skills pinned in `skills-lock.json`. Run it again when the lock changes.
- Chromium runs the story tests and the contracts. Install it again when Playwright changes.
- Storybook builds the packages it reads, then serves the site at `http://localhost:6006`, with its MCP server for agents at `/mcp`. Leave it running and work in another terminal.
- In a new shell, select Node 24 again before running anything.

## Where things are

| Path                                 | What you change there                                                         |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| `packages/foundations`               | the token pipeline, its CLI and `configureUiCore`; the tokens come from Figma |
| `packages/icons`                     | the icon pipeline and its CLI; the icons come from Figma                      |
| `packages/shared/src/components`     | the specification of each component, which both implementations import        |
| `packages/web-components/src/<name>` | a Stencil web component                                                       |
| `packages/react/src/<name>`          | a React component                                                             |
| `testing/contracts/src/specs`        | the behaviour contract of each component, run against both implementations    |
| `apps/storybook/src`                 | the documentation site: guides, Foundations pages, component pages, stories   |
| `tools`                              | lint rules, the Figma guidelines and the component generator                  |

[Decision 01](../decisions/01-repository-tooling-and-releases.md) holds the boundaries between them. The hosted site at https://mszczygiel-projects.github.io/ui-core-library/ shows `main`, and Chromatic its visual tests.

## Commands

| Command                                         | What it does                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| `pnpm verify`                                   | The quality gate. It must pass before every commit.                            |
| `pnpm nx run-many -t lint typecheck test build` | The project targets.                                                           |
| `pnpm nx run <project>:<target>`                | One target of one project.                                                     |
| `pnpm nx sync`                                  | Updates TypeScript references after adding a project or a dependency.          |
| `pnpm nx run storybook:storybook`               | Serves the documentation site on port 6006.                                    |
| `pnpm nx run storybook:test`                    | Runs the site's unit tests and every story with axe in Light and Dark.         |
| `pnpm nx run contracts:test`                    | Builds both component packages and runs every behaviour contract.              |
| `pnpm component:new <Name> --category <Cat>`    | Generates a new component, as [the components guide](components.md) describes. |
| `pnpm shared:snapshot`                          | Rewrites the API snapshot of `shared` after an intended change.                |
| `pnpm tokens:snapshot`                          | Rewrites `token-names.txt` after an intended change of names.                  |
| `pnpm icons:snapshot`                           | Rewrites `icon-names.txt` after an intended change of names.                   |
| `pnpm guidelines:build`                         | Writes the guidelines of the three Figma libraries for upload.                 |
| `pnpm figma:check`                              | Parses the Code Connect templates of both frameworks without a token.          |
| `pnpm lint:css`                                 | Lints every stylesheet with the token rules.                                   |
| `pnpm format`                                   | Formats every file with Prettier.                                              |
| `pnpm secrets:check`                            | Scans the repository for secrets.                                              |
| `pnpm skills:install`                           | Restores the pinned agent skills.                                              |

## Troubleshooting

- **`nx sync:check` fails.** Run `pnpm nx sync` and commit the updated references.
- **A test cannot start a browser.** Install Chromium again with the command of the first run.
- **A dependency cannot be installed.** It may be younger than a day, the minimum release age. Wait, or pin the previous version in the catalog.

The other guides list the problems of their area.
