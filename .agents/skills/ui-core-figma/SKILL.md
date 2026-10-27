---
name: ui-core-figma
description: Use when reading or changing the Figma files of UI Core Library through the Figma MCP server (use_figma and the Plugin API) - variables and their metadata (scopes, code syntax, descriptions), collections, components, bindings, library publishing and updates - or when planning a step that works in Figma. Holds the write protocol, the limits and the silent failures of the Plugin API.
---

# Working in Figma

`docs/decisions/10-figma.md` decides when and how Figma may change, and `docs/guides/figma.md` holds the owner's tasks: publishing, exports, Code Connect and guidelines. This is the Plugin API checklist.

## Before a call

- Load the vendor skill `figma-use` before every `use_figma` call, and `figma-generate-library` as well for variables and components. Where they disagree with this skill, AGENTS.md or a decision, the repository wins.
- The [Core] files change only within the approved scope: read the current state and dependencies, prepare a dry run listing every change, write, then compare a control snapshot with the plan. The dry run and corrections that achieve the agreed result need no separate approval.
- A change to the agreed API, appearance or behaviour, an additional effect on other components or an exception to the rules needs a new decision before the affected writes. Present only that difference and continue independent work. Publishing remains separate.
- Experiments run on trial files in the team project, never on the [Core] files, and the owner deletes them after the step.
- Only the owner publishes a library, enables it in a file, accepts its updates and exports the variables with Luckino. The Plugin API can do none of this.

## Limits

- The MCP server allows 200 calls a day and 10 a minute. Plan a step as a few large calls, run them one after another, and never poll.
- The code of one call is at most 50,000 characters, and its return value at most 20 KB. Return counts, IDs and hashes, and ask for details only where something differs.
- Generate large scripts in chunks. Check a chunk by compiling it as an async function (`new AsyncFunction(source)`); `node --check` rejects the top-level `await` that `use_figma` allows.
- Make every chunk idempotent: find or create, never create blindly, so that a re-run after a failure duplicates nothing.

## Reading

- Every call starts on the first page. A scan of several pages calls `await figma.setCurrentPageAsync(page)` for each page; `page.loadAsync()` alone leaves the page empty, and the scan reports zero without an error. Report the nodes scanned per page next to the hits: a page with content and zero nodes means the scan failed.
- In a file that subscribes to a library, `getLocalVariableCollectionsAsync()` does not return the library's collections. Reach them through `figma.teamLibrary` or through the bindings of a node.
- `importVariableByKeyAsync` works only for published variables, and its result lasts for the call unless the call binds it.
- A subscribing file keeps its own copy of every library variable and refreshes it only when the owner accepts the library update. When the file and the library disagree, compare the file's copy with a fresh import first.
- Set `figma.skipInvisibleInstanceChildren = false` before a complete binding scan. Otherwise a hidden instance can report no children. Return a hidden-instance child count as evidence that the scan reached them.
- A colour with alpha 0 still reads as its raw channels. Measure contrast against the nearest opaque ancestor, and composite a partial alpha onto it.

## Writing

A write that throws nothing has not necessarily happened. Read every write back, and compare the number of changed items with the number expected.

- `setBoundVariableForPaint` returns a new paint, which has to be assigned back. Given `null` instead of a variable, it returns an unbound paint without an error. Compare the rendered colour and opacity with `resolveForConsumer(node)`: a binding can retain a stale paint value. If they differ, copy the resolved channels and alpha into the paint while keeping its binding.
- On a layer inside an instance, `setBoundVariable` does nothing for the width and the height, and `resize()` does nothing; the editor cannot change them either. Padding can be rebound there, and paints work through `setBoundVariableForPaint` and a new array. When the main component lives in another file, fix it there.
- An instance lists an overridden binding as `boundVariables` in the `overriddenFields` of its `overrides`, not under the name of the property. Look for that field when you count the bindings that will follow their main component.
- On any text layer, `setBoundVariable` does nothing for `fontFamily`, `fontWeight`, `fontSize`, `lineHeight` and `letterSpacing`. Use `setRangeBoundVariable(0, text.characters.length, field, variable)`.
- `resetOverrides()` is not a fix: the layer falls back to the component's own default, and the API cannot undo it.
- `layoutMode` on a layer inside an instance is ignored. Only detaching helps; it changes node IDs, so it is acceptable only for static documentation frames.
- `swapComponent()` invalidates the references to the instance's children for the rest of the call. Swap last, and change the new children in the next call.
- To change a hidden layer, first set `figma.skipInvisibleInstanceChildren = false`. If it is still inaccessible, reveal it and return its ID, change it in the next call, then restore the visibility of exactly those IDs.
- In a component set with grid layout, a cloned variant lands on its source, and writes to `x` and `y` are ignored. Place it with `child.setGridChildPosition(row, column)`.
- On a vertical frame, `primaryAxisSizingMode` is the height and `counterAxisSizingMode` the width. A child that fills a hugging parent freezes its width; check hugging by changing the content, not by reading the width.
- Reading a property that does not exist throws. Look for it with `Object.getOwnPropertyNames` along the prototype chain.

## Tokens

- Before changing a role that is not one component's own token, list every variable that aliases it, in every mode, and what binds them. One role can colour both a text and a fill.
- Every variable carries its metadata (decision 02): its scopes, its WEB code syntax and, for a role or a brand value, a description. Take them from `pnpm nx run foundations:figma-metadata --output <file>`, never from memory or from the current bindings; write the differences, and compare the control snapshot with that file. A new or renamed variable gets its metadata in the same write as its value.
- Primitives stay published and receive the scopes of their purpose. Brand inputs and the Themes roles copied by Surfaces, with their copies, get no scopes. Primitives without a matching field also get none; do not use `ALL_SCOPES` to expose them. A boolean keeps all scopes: Figma rejects any others. Narrowing the scopes of a number changes the `$type` that Luckino exports (`spacing`, `borderRadius`); the token pipeline reads the kind from the value instead.
- Before narrowing scopes, scan the bindings of the UI Library. A binding outside the new scopes keeps working, but it shows either a rule to widen or a binding for a component step to fix.
- The WEB code syntax keeps its wrapper: `setVariableCodeSyntax('WEB', 'var(--color-text-primary)')`.
- The Plugin API reads a quotation mark in a description as `&quot;`, and the export decodes it. Write descriptions without quotation marks, and decode the entity before comparing a control read with the exports.
- Before you delete or move a variable, scan every file that binds it: the UI Library and [Core] Icons, whose icon components bind their own size. A swapped icon inside an instance takes its size from its own component. Moving a variable takes two publishes: first publish the new variable and rebind every consumer, then publish again and delete the old one.
- Hide a variable from publishing only when no file binds it directly. A direct binding keeps the last published value for good, and no update reaches it; aliases to a hidden variable keep working.
- Names, exports and the token build follow the skill `ui-core-tokens`.

Until `tools/figma` holds the script, this loop writes the metadata, one chunk of the plan per call. `entries` lists `[collection, name, scopes, web, description]`; `scopes` is `null` for a boolean and `description` `undefined` where it stays. Run it twice: the second run must change nothing.

```js
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const collectionName = Object.fromEntries(collections.map((c) => [c.id, c.name]));
const variables = await figma.variables.getLocalVariablesAsync();
const byName = new Map(
  variables.map((v) => [`${collectionName[v.variableCollectionId]}|${v.name}`, v]),
);
const changed = { scopes: 0, code: 0, description: 0 };
const missing = [];
for (const [collection, name, scopes, web, description] of entries) {
  const variable = byName.get(`${collection}|${name}`);
  if (variable === undefined) {
    missing.push(`${collection}/${name}`);
    continue;
  }
  if (scopes !== null && [...variable.scopes].sort().join() !== [...scopes].sort().join()) {
    variable.scopes = scopes;
    changed.scopes++;
  }
  if (variable.codeSyntax.WEB !== web) {
    variable.setVariableCodeSyntax('WEB', web);
    changed.code++;
  }
  if (description !== undefined && variable.description !== description) {
    variable.description = description;
    changed.description++;
  }
}
return { ...changed, missing };
```

## Styles

- A text style binds a variable with `style.setBoundVariable(field, variable)`; read `boundVariables` and `fontName` back, since Figma resolves the font from the bound weight and family.
- Letter spacing, text case and the shapes of shadows cannot be bound: write them with the values of their variables, and compare them with the variables in the control snapshot.
- An effect style takes its colour through `figma.variables.setBoundVariableForEffect(effect, 'color', variable)`, which returns a new effect for a new `effects` array.
- Find a style by its key, which a rename keeps, and delete a style only when `getStyleConsumersAsync()` in this file and a scan of the UI Library find no consumer.

## Documentation pages

- The Foundations pages are generated from the map `apps/storybook/src/foundations/pages.json` and the live variables. [`doc-pages.md`](doc-pages.md) holds the builder, its check and when to run them; never edit a generated frame by hand.

## Components

- Component sets follow decision 10: the names, properties and part layers of the code, `interaction` as a design-only property, and bindings to the Components layer and the Foundations styles, with the focus-ring roles as the one exception. TextField also has the design-only `valueState: empty | filled`, and Badge `content: label | icon-label | icon`; code derives these layouts from the value and the content. A boolean prop that only shows or hides a part, such as `dismissible` of Chip, may be a boolean property named after the prop, listed in `design.booleans`.
- Before changing a component set, count its instances in other components with `getInstancesAsync()` and their overrides from `overrides`. Keep the nodes of the layers they override: rename and rebind a layer, never replace it, or the overrides fall back to the defaults. Delete a variant only when it has no instance.
- A component step commits nothing of its component set. After the last change to the set, it rebuilds the legend of the page with the builder in [`component-pages.md`](component-pages.md): the page holds that legend and the card with the set, and no other documentation.
- Code Connect uses the repository CLI: `pnpm figma:react` selects React and `pnpm figma:wc` selects Web Components. Both sets stay next to their implementations and pass `pnpm figma:check`; the CLI preview checks their rendered output with a local token.
- Templates omit code defaults, false booleans and empty optional text, retain nonempty content, and respect icon and hint visibility. Keep TextField's `defaultValue` in React and `value` in HTML. Do not emit design-only properties or false HTML boolean attributes.
- The owner publishes after `publish --dry-run` and checks Dev Mode. Agents publish only in an explicitly approved publishing step, with the dry run, approval, write and control read. Do not publish from CI or use the MCP mapping tools for this workflow.
- On Pro, [Core] UI Library and React are the normal active selection. A team admin switches frameworks in Admin → Settings → Resources → Code Connect; previous connections are retained but inactive.
- Load the vendor skill `figma-code-connect` before writing a template. Decision 10 takes precedence over its older plan restrictions and publishing guidance; never edit the vendor skill.

## Icons

- Every icon of [Core] Icons is a component `icon/<kebab-name>`: a 24 by 24 frame with one vector, stroked 1.5 wide in the colour of `color/icon/default`.
- Export with `exportAsync({ format: 'SVG_STRING' })` and the default settings, a few icons per call to stay under the 20 KB return limit, and write each string to `packages/icons/figma/<name>.svg` unchanged. Compare each file's length with the length the export reported.
- The export fails on a component without visible layers, and a vector placed outside its frame widens the viewBox. Read `x`, `y`, `width` and `height` of the vector against a sound icon before writing a fix.
- `pnpm nx run icons:generate` is the check after every export: it names the file and the rule an icon breaks.
