# Icons

## Decision

### Source and names

- [Core] Icons is the source of truth. In a step approved for it, every icon component is exported with `exportAsync` of the Plugin API and Figma's default settings. The exports are committed byte for byte in `packages/icons/figma/`, and CI never reads Figma.
- One name in three places: `icon/chevron-down` in Figma, `chevron-down.svg` on disk and `iconChevronDown` in code. Names are kebab case, and a badly named file stops the build instead of being renamed.
- `icon-names.txt` is the snapshot of the export names, which are public API from 1.0.0.

### The package

- The package exports one constant per icon, holding its normalized `<svg>`, from one module without side effects. Bundlers keep only the icons that are imported, and the package depends on no framework.
- **Allowed content**: only `svg`, `g` and basic shapes, with geometry, colour paint and `transform`. Scripts, handlers, links, images, ids, styles and titles stop every build.
- **Design rules**: viewBox `0 0 24 24`, one solid colour, and every shape drawn with a fill, never a stroke. They are errors in the library's build.
- **Normalization**: svgo minifies every icon, paints it in `currentColor` and sizes it `1em`. The module is generated, never committed.

### Using icons in components

- The consumer renders an icon. A web component takes it in the `leading-icon` or `trailing-icon` slot, and a React component takes a node in `leadingIcon` or `trailingIcon`. IconButton uses `icon` in both implementations.
- The receiving component sets the size and the colour, and hides the icon from assistive technology. An icon that carries meaning alone takes the component's `label`.
- Button, IconButton, SplitButton and LinkButton centre the artwork in the icon wrapper. A wrapper that inherits `font-size` sizes its `1em` artwork from the action's icon token. A wrapper can set its own artwork size within the token-sized box.
- The consumer mirrors directional artwork. A component never mirrors every icon.

### `Icon` in React

- `ui-core-react` exports `Icon`, which renders a string of SVG in a span: React shows a string as text, so every application would otherwise write the same `dangerouslySetInnerHTML` wrapper.
- It is a helper, not a component of the library ([05](05-components.md)), and has no web counterpart.
- The span is always `aria-hidden`. A name goes on the element around it, so the types reject a role, a name, a description and `tabIndex`.
- Without `size`, the icon takes the font size around it, so in a slot it takes the icon size of the receiving component. A default size would override that.
- `size` is a step of the icon roles, `2xs` to `lg`, and follows the density. An unknown value is ignored.
- `svg` is any string and is inserted as markup. The consumer passes only trusted strings, since the checks of the CLI run when a set is built, never at run time.

### The consumer's icon set

- `ui-core-icons build --input <dir> --output <dir>` builds a package directory, with the same name and exports, from the consumer's SVG files, after the same checks.
- Design rules are warnings for a consumer's set. Anything but plain shapes stays an error.
- The build fails when the set lacks an icon that the component packages import. That list, `required-icons.txt`, is derived from their imports and published with the package.
- The application points its package manager at the built package (`pnpm.overrides`, `overrides` or `resolutions`), so bundlers, server renders and tests all use it.
- svgo is an optional peer dependency of the CLI, never a runtime dependency.

## Why

One string per icon works in both frameworks without svgr or a component per icon. Checking at build time stops unsafe or broken SVG before it reaches a component.

A fill gives one convention for colour: a component in Figma binds the colour to the fill of the vector, so any set of icons drawn with fills takes it, whichever library it comes from. A fill also scales with the icon in Figma, as it does in code; a stroke keeps its weight in Figma.

## Rejected

- A `ui-icon` web component: its prop would hold a whole SVG, while a prop holds only short text, and `innerHTML` already renders the string.
- A default size of `Icon`: it overrides the icon size of the slot that holds the icon.
- A size in pixels: it bypasses the tokens and the density.
- A type of its own for the strings of a set: it complicates the icons package and the CLI, and cannot prove where a string came from.
- Renaming bad file names automatically: names would change without a decision.
