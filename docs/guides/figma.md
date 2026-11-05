# Figma

The library is designed in three files: [[Core] Foundations](https://www.figma.com/design/Xxn0guDvAfyIqEKB6kADE9) holds the variables and styles, [[Core] Icons](https://www.figma.com/design/lRdwn99eZTt6gCFeqc2Seh) the icons and [[Core] UI Library](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83) the components. [Decision 10](../decisions/10-figma.md) holds the rules, and the skill `ui-core-figma` the Plugin API protocol that agents follow.

Write to these files only within an approved step: read the state, list the changes, write them and compare a control read with the plan. An agent follows the same protocol and writes only in a step you approved. The tasks below are yours, since the Plugin API cannot publish a library, run another plugin or upload guidelines.

## Publishing the libraries

After a change, publish the libraries in the order their dependencies run, and accept the updates in the files that use them:

1. [Core] Foundations.
2. [Core] Icons, which binds the variables of Foundations.
3. [Core] UI Library, which binds both.

Publish only the libraries that changed.

## Exporting variables

1. In [Core] Foundations, export the changed collections with the Luckino plugin, with their Figma metadata.
2. Replace the files in `packages/foundations/figma/` with the exports, unchanged. Never edit them by hand.
3. Continue with [the tokens guide](tokens.md#changing-tokens).

## Exporting icons

Within an approved step, export every icon component of [Core] Icons with `exportAsync` through the Plugin API, with Figma's default settings, and replace the files in `packages/icons/figma/` unchanged. An agent runs the export through the Figma MCP server, as the skill `ui-core-figma` describes. Continue with [the icons guide](icons.md#changing-icons).

## Publishing Code Connect

Code Connect shows the code of a component in Dev Mode. Publish it yourself; an agent publishes only in a step you approved for publishing.

1. Create a Figma personal access token with write access to Code Connect and read access to file content, and put it in `.env` as `FIGMA_ACCESS_TOKEN`, as `.env.example` shows. `.env` is never committed.
2. Check what would be published, without publishing:

   ```sh
   pnpm figma:react publish --dry-run
   pnpm figma:wc publish --dry-run
   ```

3. Preview how the snippets render in Dev Mode, then publish:

   ```sh
   pnpm figma:react preview
   pnpm figma:react publish
   pnpm figma:wc publish
   ```

4. In [Core] UI Library, select an instance in Dev Mode and check its snippet.

Figma shows one framework at a time, React by default. A team admin switches it in Admin › Settings › Resources › Code Connect; the connections of the other framework stay stored. `pnpm figma:react unpublish` removes the published React templates.

## Documentation links

Every component set links to its page on the hosted documentation site, which Dev Mode and the assets panel show.

1. Run `pnpm guidelines:build`. It writes `tools/guidelines/dist/documentation-links.json`: the link of each component set, by node.
2. Within an approved step, write the links into [Core] UI Library through the Plugin API (`node.documentationLinks = [{ uri }]`) and read them back. An agent does it as the skill `ui-core-figma` describes.
3. Publish [Core] UI Library.

A new component set, a renamed page or a moved component needs this again.

## Updating the guidelines

The libraries carry guidelines that Figma's agent reads whenever a prompt runs with the library enabled. They come from the specifications, the component pages, the tokens and the icons, so a change to any of them can change the guidelines.

1. Run `pnpm guidelines:build`. It writes `tools/guidelines/dist/ui-library`, `dist/foundations` and `dist/icons`.
2. In each Figma file, open Library › Manage guidelines, replace the files with those of its folder and apply the changes.
3. Ask Figma's agent for a small screen from the library, such as a login form, and check that it uses the components with listed values and no raw colours.
