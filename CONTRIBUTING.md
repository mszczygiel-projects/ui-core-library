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
```

`pnpm install` also installs the Git hooks. `pnpm skills:install` restores the agent skills pinned in `skills-lock.json`. Run it again when the lock changes. In a new shell, select Node 24 again before running anything.

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

| Command                                         | What it does                                                          |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `pnpm verify`                                   | The quality gate. It must pass before every commit.                   |
| `pnpm nx run-many -t lint typecheck test build` | The project targets.                                                  |
| `pnpm nx run <project>:<target>`                | One target of one project.                                            |
| `pnpm nx sync`                                  | Updates TypeScript references after adding a project or a dependency. |
| `pnpm format`                                   | Formats every file with Prettier.                                     |
| `pnpm secrets:check`                            | Scans the repository for secrets.                                     |
| `pnpm skills:install`                           | Restores the pinned agent skills.                                     |

## Troubleshooting

- **`nx sync:check` fails.** Run `pnpm nx sync` and commit the updated references.
- **A dependency cannot be installed.** It may be younger than a day. Wait, or pin the previous version in the catalog.
