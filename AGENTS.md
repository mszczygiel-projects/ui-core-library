# AGENTS.md

Instructions for AI agents working in this repository.

## Project

UI Core Library provides:

- design tokens (`foundations`) and icons, with CLIs for a consumer's own set;
- component specifications and pure functions (`shared`);
- every component implemented natively twice, as a Stencil web component and as a React component.

Storybook documents it for consumers. Three Figma files design it: [Core] Foundations, [Core] Icons and [Core] UI Library. Nothing is published before 1.0.0.

Sources of truth, in this order:

1. [docs/decisions](docs/decisions/README.md)
2. [CONTRIBUTING.md](CONTRIBUTING.md) for the way of working, and [the guides](docs/guides/README.md) for tasks
3. the Storybook pages
4. the code

When they disagree, report the conflict and propose a resolution instead of choosing silently.

## Language

- Talk to the owner in Polish, write proposals in Polish, and explain technical terms plainly.
- Everything in the repository is in English: code, comments, documentation, commit messages and pull requests.

## Way of working

- Follow [CONTRIBUTING.md](CONTRIBUTING.md): proposal, approval, a `step/<n>-<slug>` branch, small commits, `pnpm verify`, documentation, a pull request.
- The skill `ui-core-step` holds the checklist.
- Approval covers the agreed result and the corrections needed to reach it. A new decision, an extra effect on other components or an exception goes back to the owner. Continue independent work meanwhile.
- Never make an architectural decision silently. Record it by editing [docs/decisions](docs/decisions/README.md) (skill `ui-core-decision`).
- The repository is self-contained. Never refer to other repositories, earlier implementations or migration work.

## Rules

1. Every visual value in a component comes from a design token. Never hardcode one, and never invent a token, class or icon name: take it from `token-names.txt` or `icon-names.txt`.
2. Component CSS reads only the Components layer, the focus-ring roles and the motion primitives. It declares only `--_*` properties and uses logical properties ([07](docs/decisions/07-styles.md)).
3. Tokens change in Figma, never in the exports or the generated files. `knownViolations` only shrinks ([02](docs/decisions/02-design-tokens.md)).
4. Types, allowed values, defaults and label keys of a component live once, in its specification in `shared`. Both implementations import them ([05](docs/decisions/05-components.md)). A new component starts from `pnpm component:new`, never from files written by hand or copied.
5. Neither component package imports the other. `shared` holds no rendering, DOM, CSS or framework code. Time, time zone, language and randomness arrive as arguments.
6. Component APIs follow the vocabulary and pairing rules of [06](docs/decisions/06-component-api.md). Text a component renders comes from props or `configureUiCore` labels, never from a template.
7. Respect the module boundaries, and never disable `@nx/enforce-module-boundaries`.
8. Prefer an existing, free and maintained tool to writing one.

## Code

- TypeScript is strict everywhere: no `any`, no non-null assertions, and bracket access for dynamic keys.
- Relative imports carry `.ts`, and types use `import type`.
- Every block has braces, and class members are separated by a blank line.
- Tests live next to the code as `*.test.ts` or `*.test.tsx`.
- Comments explain why, not what.
- A new dependency goes into the pnpm catalog, and the proposal says why it is needed.

## Figma

- Read before writing.
- In an approved step, follow the write protocol of [10](docs/decisions/10-figma.md): dry run, write, control read.
- Never delete a variable, style or component before its bindings point elsewhere.
- Experiments run on trial files, never on the [Core] files.
- The owner publishes libraries, exports variables and uploads the guidelines that `pnpm guidelines:build` writes. Code Connect is published only in a step approved for it.

## Agent tooling

- Vendor skills are installed with `pnpm skills:install` and never committed or edited. Project skills (`ui-core-*`) live in `.agents/skills/` and are committed.
- Never add community skills, MCP servers or plugins without a decision.
- Never run commands that rewrite the agent setup, such as `nx configure-ai-agents`.
- Where a skill conflicts with this file or a decision, this file and the decisions win.

## Commits and pull requests

- Use Conventional Commits, one coherent change per commit, and a message that explains why.
- Commit only on the step's branch. Never push to `main`, never merge, and never bypass the hooks.
- The pull request title follows Conventional Commits, because the owner squashes it.

## Never

- Publish packages, push to `main`, or write to the Figma files without the owner's approval for that step.
- Weaken lint rules, module boundaries or TypeScript strictness to make a check pass.
- Commit secrets.
