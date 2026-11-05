# Tokens

The tokens come from the variables of [Core] Foundations. [Decision 02](../decisions/02-design-tokens.md) holds their rules, and the skill `ui-core-tokens` how to read each error of the build.

## Changing tokens

1. Read the live variables and compare them with `packages/foundations/figma/`. If they differ, export the collections again, as [the Figma guide](figma.md#exporting-variables) describes, before planning.
2. Change the variables and their metadata in Figma, within the approved step. `pnpm nx run foundations:figma-metadata --output <file outside the repository>` lists the metadata every variable should carry.
3. Publish the library and export the changed collections, as [the Figma guide](figma.md#exporting-variables) describes.
4. Run `pnpm nx run foundations:build` and fix every error in Figma, never in the exports or the pipeline.
5. Run `pnpm nx run foundations:test`. When names changed on purpose, run `pnpm tokens:snapshot` and commit `token-names.txt` with the exports.
6. Give a new role a place in `apps/storybook/src/foundations/pages.json`, and check the Foundations pages in Storybook.
7. Rebuild the guidelines of [Core] Foundations, as [the Figma guide](figma.md#updating-the-guidelines) describes.

## Troubleshooting

- **The names test fails on its snapshot.** The emitted names changed. If that was intended, run `pnpm tokens:snapshot`. Otherwise fix the change in Figma.
- **Storybook shows old tokens.** It reads the built packages. Run `pnpm nx run foundations:build`.
