---
name: ui-core-tokens
description: Use when working with the design tokens or icons of UI Core Library - writing token names in styles, updating the Figma exports, reading the errors of the token or icon build, updating the snapshots of names or the token exceptions, or using the ui-core-foundations and ui-core-icons CLIs.
---

# Tokens and icons

`docs/decisions/02-design-tokens.md`, `03-branding-and-consumer-tokens.md` and `04-icons.md` hold the rules. `docs/guides/tokens.md` and `docs/guides/icons.md` hold the order of the commands. This is the checklist.

## Writing styles

- Never invent a token name. Look it up in `packages/foundations/token-names.txt`:
  - `css` lines for CSS;
  - `ts` lines for `tokens.ts`;
  - `class` lines for the text style classes.
- Text in one of the library's text styles uses its class, such as `ui-text-body`, rather than repeating the typography roles.
- Component CSS reads only Components tokens, focus-ring roles and motion primitives. A missing token is a change in Figma, proposed in the step, never a hardcoded value.
- A new component token is compared with the roles first, and named like those before it:
  - `<component>/<part>/<property>`;
  - `<component>/<size>/<part>/<property>` for a size other than `medium`;
  - `color/<component>/<part>/<state>`.

  A component without interaction has no state, such as `color/loader/indicator`. Keep the `control/*` family shared until a component needs its own value.

## Changing tokens

- Tokens change in Figma, in an approved step. The owner exports them with Luckino, with their Figma metadata, and the exports replace the files in `packages/foundations/figma/` unchanged. Never edit them by hand.
- Run `pnpm nx run foundations:build` and read its report:
  - **A broken alias, a cycle or a name claimed twice**: a mistake in Figma. Report it, never work around it in the pipeline.
  - **An unlisted rule violation**: fix it in Figma. An approved geometry alias goes into `primitiveAliases` with its `token`, `target` and `reason`. It never permits a raw value.
  - **A known violation that no longer occurs**: delete its line from `knownViolations`. Never add a line there.
  - **A `scopes`, `code-syntax` or `description` violation**: fix it in Figma with what `pnpm nx run foundations:figma-metadata --output <file>` writes, with the file outside the repository. `metadata` means the export was made without it.
  - **A variable that no scope rule knows**: give its kind a rule in `src/pipeline/figma.ts`, with a test.
- Run `pnpm nx run foundations:test`. When names change on purpose, run `pnpm tokens:snapshot` and commit `token-names.txt` with the exports. Name the changed names in the pull request.
- Never change a naming rule of the pipeline to absorb a bad name. Rename the variable in Figma.
- Give a new role a place in `apps/storybook/src/foundations/pages.json`, or an exemption with its reason. A step that writes to Figma also rebuilds the Figma pages that show the changed tokens.

## Changing icons

- Icons change in [Core] Icons. In an approved step, export every icon component with `exportAsync` and the default settings, and replace the files in `packages/icons/figma/` unchanged.
- `pnpm nx run icons:build` checks every icon strictly. Fix a broken rule in Figma, never in the SVG.
- When names change on purpose, run `pnpm icons:snapshot` and commit `icon-names.txt`.
- `required-icons.txt` lists the icons that the component packages import. The library's set and every consumer's set must hold them.

## Consumers' own sets

- `ui-core-foundations build --input <exports> --output <dir> [--strict]` builds a consumer's tokens. Rule violations are warnings unless `--strict`.
- `ui-core-icons build --input <svg dir> --output <dir>` builds a consumer's icon package, with the same name and exports. Design rules are warnings there, while anything but plain shapes and a missing required icon are errors.
- A branding need is met by the three tiers of decision 03, never by a new semantic role.
- The commands, their flags and their output files are public API from 1.0.0. The Storybook page Guides/Custom tokens and icons documents them for consumers. Change both together.
