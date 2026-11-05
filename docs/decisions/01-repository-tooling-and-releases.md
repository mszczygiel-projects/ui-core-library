# Repository, tooling and releases

## Decision

### Layout

| Path                      | Package                                       | Contents                                                             |
| ------------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| `packages/foundations`    | `@mszczygiel-projects/ui-core-foundations`    | design tokens, the token CLI, the configuration of labels            |
| `packages/icons`          | `@mszczygiel-projects/ui-core-icons`          | icons and the icon CLI                                               |
| `packages/shared`         | `@mszczygiel-projects/ui-core-shared`         | component specifications and pure functions ([05](05-components.md)) |
| `packages/web-components` | `@mszczygiel-projects/ui-core-web-components` | Stencil web components                                               |
| `packages/react`          | `@mszczygiel-projects/ui-core-react`          | React components                                                     |
| `testing/contracts`       | private                                       | behaviour contracts that run against both implementations            |
| `apps/storybook`          | private                                       | the documentation site                                               |
| `tools/lint-rules`        | private                                       | the local Stylelint and ESLint rules ([07](07-styles.md))            |
| `tools/guidelines`        | private                                       | the guidelines of the Figma libraries ([10](10-figma.md))            |
| `tools/generators`        | private                                       | the generator of new components ([05](05-components.md))             |

A project arrives with its first need. Nx project names are the folder names.

### Boundaries

- Every project has exactly one `type:*` tag in `package.json` under `nx.tags`, named after its folder: `type:<package>`, `type:testing`, `type:app` or `type:tool`.
- `@nx/enforce-module-boundaries` enforces the table below. Its own rule rejects a project without a matching tag, so no extra script checks the tags.

  | Type                             | May depend on                    |
  | -------------------------------- | -------------------------------- |
  | `foundations`, `icons`, `shared` | nothing else in the repository   |
  | `web-components`, `react`        | `foundations`, `icons`, `shared` |
  | `testing`                        | the packages                     |
  | `app`                            | the packages, `tool`             |
  | `tool`                           | `foundations`, `icons`, `shared` |

- Neither component package imports the other, and no published package depends on a private project.
- Packages are consumed only through their `exports`, which point to `dist`. There are no path aliases. `publint` and `@arethetypeswrong/cli` check every published package.

### Tooling

- Node.js 24 LTS (`.nvmrc`), and pnpm 10 workspaces through Corepack.
- One pnpm catalog with `catalogMode: strict`. Tooling is pinned to exact versions.
- Supply chain: `minimumReleaseAge: 1440`, and only the packages in `onlyBuiltDependencies` run install scripts.
- Nx 24, with Nx Cloud and analytics off. Nx is upgraded with `nx migrate`.
- TypeScript 6, strict everywhere, tests and scripts included. ES modules only, and relative imports carry `.ts`.
- ESLint 10 with typescript-eslint strict type-checked rules, Prettier 3 and Vitest.
- Snapshots of public names and APIs, such as `token-names.txt`, are Vitest file snapshots: a test fails when they differ, and `vitest -u` rewrites them.
- Use an existing, free and maintained tool before writing one. The repository writes its own tool only when none exists.

### Workflow

- `pnpm verify` is the quality gate, and every commit passes it. GitHub Actions runs it on every pull request and on `main`.
- Chromatic runs the visual tests on `main` and on pull requests labelled `visual` ([08](08-testing.md)).
- Lefthook scans staged files for secrets, checks formatting, keeps commit messages in Conventional Commits and rejects pushes to `main`.
- Pull requests are squashed. The title follows Conventional Commits and is checked in CI, because it becomes the commit on `main`.

### Releases

- Every published package has the same version and is released together with `nx release` under one tag, such as `v1.0.0`. Internal dependencies use `workspace:^`.
- Nothing is published before 1.0.0. That release comes once every planned component is done. There are no pre-releases.
- `release.yml` publishes, and only when started by hand, never by a push or a merge. It runs on `main`, runs `pnpm verify` first and is a dry run unless that option is turned off. The [release guide](../guides/releases.md) holds the steps.
- Packages go to npmjs.com as public packages with provenance, which links each tarball to the workflow run that built it. The token in the secret `NPM_TOKEN` publishes them until the packages exist on npm. After that, trusted publishing through the workflow's identity replaces it.
- The version comes from the Conventional Commits since the last tag. The first release names `1.0.0` explicitly, because without an earlier tag Nx starts at 0.0.1.
- The packages carry the licence `UNLICENSED` until a licence is chosen. They are public to read and install, but give no rights to reuse.
- A release changes nothing on `main`: the versions are set on the runner, the tag marks the released commit, and the changelog is the notes of the GitHub Release. The `package.json` files of the repository keep `0.0.0`, and the next version starts from the last tag.
- Semantic versioning applies from 1.0.0, and the changelog starts there. Token names, icon names and component APIs are public API.

### Agent tooling

- Agent skills come only from the makers of the tools in use, plus `composition-patterns` from `vercel-labs/agent-skills` for the React API. The `skills` CLI installs them, `skills-lock.json` pins them, and their files are not committed.
- The project's own skills, `ui-core-*`, live in `.agents/skills/`, and `.claude/skills` links there.
- Plugins and MCP servers are added only by decision. Today these are the official Figma plugin and Storybook's MCP server.

## Why

The packages depend closely on each other, so they share one version and one gate. Tools enforce the boundaries, so review does not have to.

## Rejected

- Independent package versions: consumers would have to find compatible sets.
- Rebase merging: every intermediate commit would reach the release notes.
