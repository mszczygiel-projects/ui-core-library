# Contributing

How to develop UI Core Library, for people and agents. [Decisions](docs/decisions/README.md) explain why things are as they are. This file explains how to work.

## Setup

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
- Chromium runs the story tests. Install it again when Playwright changes.
- Storybook builds the packages it reads, then serves the site at `http://localhost:6006`, with its MCP server for agents at `/mcp`. Leave it running and work in another terminal.
- In a new shell, select Node 24 again before running anything.

## The way of working

The library grows in steps. A step is one infrastructure change or one component, or a few components that only make sense together.

1. **Proposal.** The scope and every decision it needs, each with options and a recommendation. A component's proposal also covers:
   - the API of both implementations;
   - the changes in Figma and in the tokens;
   - what goes into `shared`;
   - the labels;
   - the regressions its contract will cover.

   The owner reads proposals in Polish. Everything in the repository is in English.

2. **Approval.** It covers the agreed API, appearance, behaviour and effects on shared tokens and components, and the corrections needed to reach that result. A new decision, an extra effect on other components or an exception to a rule goes back to the owner. Present only the difference, and continue with independent work meanwhile.
3. **Branch.** Create `step/<n>-<slug>` from an up-to-date `main`. Never commit on `main`.
4. **Implementation.**
   - Make small commits in Conventional Commits, each message saying why.
   - New behaviour comes with tests next to the code. A new check must fail once on a deliberate defect before it is trusted.
   - Run `pnpm verify` before every commit, and never bypass the hooks.
5. **Decisions and documentation.** A changed decision is edited in [docs/decisions](docs/decisions/README.md) in the same pull request. Update what the step touches: Storybook pages, package READMEs, this file, `AGENTS.md` and the project skills.
6. **Pull request.** The title follows Conventional Commits, since it becomes the commit on `main`. The description covers:
   - what the step does;
   - its decisions;
   - how to check it;
   - the open points.

   The owner reviews and squashes. Review comments get new commits on the same branch.

Figma is written only within an approved step, by the protocol in [decision 10](docs/decisions/10-figma.md).

## Changing tokens

1. Read the live variables and compare them with `packages/foundations/figma/`. If they differ, ask the owner for a fresh export before planning.
2. Change the variables and their metadata in Figma, within the approved step. `pnpm nx run foundations:figma-metadata --output <file outside the repository>` lists the metadata every variable should carry.
3. The owner publishes the library, exports the changed collections with Luckino, with Figma metadata, and the exports replace the files in `packages/foundations/figma/` unchanged.
4. Run `pnpm nx run foundations:build` and fix every error in Figma, never in the exports or the pipeline.
5. Run `pnpm nx run foundations:test`. When names changed on purpose, run `pnpm tokens:snapshot` and commit `token-names.txt` with the exports.
6. Give a new role a place in `apps/storybook/src/foundations/pages.json`, and check the Foundations pages in Storybook.

The skill `ui-core-tokens` holds the details, such as how to read each error of the build.

## Changing icons

1. Change the icon components in [Core] Icons, within the approved step.
2. Export them with `exportAsync` and replace the files in `packages/icons/figma/` unchanged.
3. Run `pnpm nx run icons:build` and fix every error in Figma.
4. When names changed on purpose, run `pnpm icons:snapshot` and commit `icon-names.txt`.

A component that imports an icon adds its name to `packages/icons/required-icons.txt`.

## Changing a component

1. Change its specification in `packages/shared/src/<name>.ts` first, and run `pnpm shared:snapshot`. The web component stops compiling until it declares every prop of the specification, and the React props follow it by construction.
2. Change the web component in `packages/web-components/src/<name>/` and the React component in `packages/react/src/<name>/`, each with the tests of its package. The skills `ui-core-stencil` and `ui-core-react` hold the details.
3. Change the contract in `testing/contracts/src/specs/<name>.contract.ts` for behaviour both share, and run `pnpm nx run contracts:test`.
4. Update the page and both story files in `apps/storybook/src/components/<category>/`, and the Code Connect templates beside the implementations.

The skill `ui-core-component` holds the order of a new component.

## Changing the documentation site

- Consumer guides live in `apps/storybook/src/guides`, and the Foundations pages in `apps/storybook/src/foundations`.
- The order of the sidebar is written in `apps/storybook/.storybook/preview.tsx`. The map `pages.json` lists the Foundations pages and what they show, and tests keep both in step.
- The site reads the built packages. Rebuild a changed package, for example with `pnpm nx run foundations:build`, before you look at it.
- The CSS of the site may use raw values, but only token names that exist.

## Changing a decision

Edit the decision file of the area so that it describes the new state, with its reasons and the rejected options. A new area gets a new file and a line in [the index](docs/decisions/README.md). Keep each decision about one page long.

## Definition of Done: a component

Copy this list into the pull request of a component and tick each item. Mark an item that does not apply as `N/A` with a reason. A passing test suite alone does not make a component done.

**Specification and API** ([05](docs/decisions/05-components.md), [06](docs/decisions/06-component-api.md))

- [ ] The specification in `shared` holds the types, values, defaults, labels, parts, events, category, status and Figma node.
- [ ] Both implementations use it, and every exception has its reason in the specification.
- [ ] The whole public API has JSDoc, and the summary sentence matches the page and Figma.

**Behaviour** ([06](docs/decisions/06-component-api.md), [08](docs/decisions/08-testing.md))

- [ ] The contract passes on both implementations. It covers the pattern's keys, the form, the validation, the labels and right-to-left text, where they apply.
- [ ] The regressions named in the proposal have cases.
- [ ] Framework-specific behaviour has package tests. React renders on the server and hydrates without warnings.

**Appearance** ([02](docs/decisions/02-design-tokens.md), [07](docs/decisions/07-styles.md))

- [ ] Every value comes from Components tokens with the standard states, compared with the roles before they were created.
- [ ] Stylelint passes, and the contract compares the computed appearance of both implementations.
- [ ] The owner has compared the component with Figma.

**Accessibility**

- [ ] Every story passes axe in Light and Dark.
- [ ] The owner has checked the component with VoiceOver when it brings a new interaction pattern.

**Documentation** ([09](docs/decisions/09-documentation.md))

- [ ] The page has its sections in order and names the pattern and its keys.
- [ ] The standard stories exist with the same names in both frameworks.
- [ ] The package READMEs list the component.

**Figma** ([10](docs/decisions/10-figma.md))

- [ ] The component set has the names, properties and part layers of the code, and binds only Components variables, Foundations styles and the focus-ring roles.
- [ ] The Code Connect templates of both frameworks pass `pnpm figma:check`.

**Done**

- [ ] The status in the specification is `done`.

Before 1.0.0, for all components at once:

- [ ] The owner has accepted the visual baselines.
- [ ] The Figma components link to their hosted pages.

## Commands

| Command                                         | What it does                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| `pnpm verify`                                   | The quality gate. It must pass before every commit.                    |
| `pnpm nx run-many -t lint typecheck test build` | The project targets.                                                   |
| `pnpm nx run <project>:<target>`                | One target of one project.                                             |
| `pnpm nx sync`                                  | Updates TypeScript references after adding a project or a dependency.  |
| `pnpm nx run storybook:storybook`               | Serves the documentation site on port 6006.                            |
| `pnpm nx run storybook:test`                    | Runs the site's unit tests and every story with axe in Light and Dark. |
| `pnpm nx run contracts:test`                    | Builds both component packages and runs every behaviour contract.      |
| `pnpm shared:snapshot`                          | Rewrites the API snapshot of `shared` after an intended change.        |
| `pnpm figma:check`                              | Parses the Code Connect templates of both frameworks without a token.  |
| `pnpm tokens:snapshot`                          | Rewrites `token-names.txt` after an intended change of names.          |
| `pnpm icons:snapshot`                           | Rewrites `icon-names.txt` after an intended change of names.           |
| `pnpm lint:css`                                 | Lints every stylesheet with the token rules.                           |
| `pnpm format`                                   | Formats every file with Prettier.                                      |
| `pnpm secrets:check`                            | Scans the repository for secrets.                                      |
| `pnpm skills:install`                           | Restores the pinned agent skills.                                      |

## Troubleshooting

- **`nx sync:check` fails.** Run `pnpm nx sync` and commit the updated references.
- **A token or icon test fails on a snapshot.** The emitted names changed. If that was intended, run `pnpm tokens:snapshot` or `pnpm icons:snapshot`. Otherwise fix the change in Figma.
- **Storybook shows old tokens or components.** It reads the built packages. Run `pnpm nx run-many -t build -p foundations web-components react`.
- **A fresh clone of the web components does not build.** Stencil reads `src/components.d.ts`, which is committed; restore it from Git if it went missing.
- **A story test cannot start a browser.** Install Chromium again with the command from Setup.
- **A dependency cannot be installed.** It may be younger than a day. Wait, or pin the previous version in the catalog.
