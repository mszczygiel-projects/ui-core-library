# figma-exports

Source of truth for the token build pipeline. **Commit these files to the repo.**

## Contents

One JSON file per Figma Variables collection, in [W3C Design Tokens](https://www.designtokens.org/tr/drafts/) format:

| File              | Collection                                                                         | Modes                                     | Extra modes allowed?                   |
| ----------------- | ---------------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------- |
| `primitives.json` | `Primitives Colors`, `Primitives Sizes`, `Primitives Motion`, `Primitives Shadows` | —                                         | —                                      |
| `themes.json`     | `Themes`                                                                           | `Default`, `Dark`                         | yes → `[data-theme="…"]`               |
| `surfaces.json`   | `Surfaces`                                                                         | `Default`, `Subtle`, `Inverse`, `Primary` | yes → `[data-surface="…"]`             |
| `sizes.json`      | `Sizes`                                                                            | `Mobile`, `Desktop`                       | **no** — reported as `⚠ UNMAPPED MODE` |

The Modes column lists what the Core file contains, not what the build accepts. Themes and
Surfaces modes are read from the JSON, so a client fork can add `DarkGreen`, `TenantLight`
or any other mode and get a selector for it — the name is kebab-cased
(`DarkGreen` → `[data-theme="dark-green"]`). The mode named `Default`, or the first one when
there is none, becomes the `:root` baseline that the others override.

Sizes is the exception: a mode there maps to a media query, and the build has no breakpoint
for a name it does not know, so anything beyond `Mobile`/`Desktop` is reported rather than
emitted.

## How to regenerate

These files are exported **manually** from Figma using the [Luckino](https://www.figma.com/community/plugin/1253571037551066995) plugin, one file per Variables collection.

The Figma REST API for Variables is Enterprise-only, so we don't fetch them automatically — the plugin is the cheapest supported path.

Workflow:

1. Open the Figma file with the Variables you want to export.
2. Run the Luckino plugin → export as W3C Design Tokens JSON → one file per collection.
3. Drop the 4 files here, overwriting the previous versions.
4. From the repo root: `pnpm foundations:build`.
5. Check the summary line it prints — it lists every theme mode it found and the selector
   each one got, so a mode missing from the export shows up immediately.
