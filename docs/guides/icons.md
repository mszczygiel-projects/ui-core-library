# Icons

The icons come from [Core] Icons. [Decision 04](../decisions/04-icons.md) holds their rules.

## Changing icons

1. Change the icon components in [Core] Icons, within the approved step.
2. Export them, as [the Figma guide](figma.md#exporting-icons) describes.
3. Run `pnpm nx run icons:build` and fix every error in Figma.
4. When names changed on purpose, run `pnpm icons:snapshot` and commit `icon-names.txt`.
5. Rebuild the guidelines of [Core] Icons, as [the Figma guide](figma.md#updating-the-guidelines) describes.

## Icons that components require

A component that imports an icon adds its name to `packages/icons/required-icons.txt`. The build of the library and the `ui-core-icons` CLI of a consumer fail when a set lacks one.

## Troubleshooting

- **The names test fails on its snapshot.** The export names changed. If that was intended, run `pnpm icons:snapshot`. Otherwise fix the change in Figma.
