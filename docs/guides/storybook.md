# Documentation site

Storybook documents the library for its consumers. [Decision 09](../decisions/09-documentation.md) holds its rules, and the skill `ui-core-docs` the shape of a component page.

## Changing the site

- Consumer guides live in `apps/storybook/src/guides`, the Foundations pages in `apps/storybook/src/foundations` and the component pages in `apps/storybook/src/components`.
- The order of the sidebar is written in `apps/storybook/.storybook/preview.tsx`. The map `pages.json` lists the Foundations pages and what they show, and tests keep both in step.
- The site reads the built packages. Rebuild a changed package, for example with `pnpm nx run foundations:build`, before you look at it.
- The CSS of the site may use raw values, but only token names that exist.
- MDX pages render no Markdown tables. Use lists, or a block of the site.
- A code sample with blank lines goes into a file next to the page, such as `Combobox.remote-filtering.example.tsx`, which the page imports with `?raw` and shows with `<Source code={…} />`. Prettier strips the indentation of the lines after a blank line in a template string of an MDX page, and the file is checked by TypeScript and ESLint.
- The sections Usage, Variants & tone, Sizes & density and States of a component page also become its Figma guidelines.

## The hosted site

`storybook.yml` publishes the site to https://mszczygiel-projects.github.io/ui-core-library/ after every push to `main`, and you can run it by hand from Actions. A component page keeps its address as long as its `<Meta title>` stays the same: the Figma component sets link to it, so a renamed page needs new links in Figma ([the Figma guide](figma.md#documentation-links)).

## Visual tests

Chromatic compares a snapshot of every story, in Light and Dark, with its accepted baseline.

- Add the label `visual` to a pull request that changes how components look. The workflow `chromatic.yml` then builds the site and uploads it, and the check UI Tests links to the changes.
- Review the changes in Chromatic and accept the intended ones. A rejected change keeps the check failing.
- Every push to `main` runs it too, and its changes are accepted, since the merged pull request was reviewed.
- Never run Chromatic locally: each build counts every snapshot against the monthly limit.

## Troubleshooting

- **A snapshot changes on every build.** The story shows something that moves or depends on the time. Give it fixed data, or turn its snapshot off with `parameters: { chromatic: { disableSnapshot: true } }` and say why in a comment.
