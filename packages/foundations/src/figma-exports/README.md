# figma-exports

Source of truth for the token build pipeline. **Commit these files to the repo.**

## Contents

One JSON file per Figma Variables collection, in [W3C Design Tokens](https://www.designtokens.org/tr/drafts/) format:

| File              | Collection                                                                         | Modes                                     |
| ----------------- | ---------------------------------------------------------------------------------- | ----------------------------------------- |
| `primitives.json` | `Primitives Colors`, `Primitives Sizes`, `Primitives Motion`, `Primitives Shadows` | —                                         |
| `themes.json`     | `Themes`                                                                           | single mode (flattened)                   |
| `surfaces.json`   | `Surfaces`                                                                         | `Default`, `Subtle`, `Inverse`, `Primary` |
| `sizes.json`      | `Sizes`                                                                            | `Mobile`, `Desktop`                       |

## How to regenerate

These files are exported **manually** from Figma using the [Luckino](https://www.figma.com/community/plugin/1253571037551066995) plugin, one file per Variables collection.

The Figma REST API for Variables is Enterprise-only, so we don't fetch them automatically — the plugin is the cheapest supported path.

Workflow:

1. Open the Figma file with the Variables you want to export.
2. Run the Luckino plugin → export as W3C Design Tokens JSON → one file per collection.
3. Drop the 4 files here, overwriting the previous versions.
4. From the repo root: `pnpm --filter @ui-core/tokens run tokens:build`.
