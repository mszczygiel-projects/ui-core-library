# Documentation site

Storybook documents the library for its consumers. [Decision 09](../decisions/09-documentation.md) holds its rules, and the skill `ui-core-docs` the shape of a component page.

## Changing the site

- Consumer guides live in `apps/storybook/src/guides`, the Foundations pages in `apps/storybook/src/foundations` and the component pages in `apps/storybook/src/components`.
- The order of the sidebar is written in `apps/storybook/.storybook/preview.tsx`. The map `pages.json` lists the Foundations pages and what they show, and tests keep both in step.
- The site reads the built packages. Rebuild a changed package, for example with `pnpm nx run foundations:build`, before you look at it.
- The CSS of the site may use raw values, but only token names that exist.
- MDX pages render no Markdown tables. Use lists, or a block of the site.
- The sections Usage, Variants & tone, Sizes & density and States of a component page also become its Figma guidelines.
