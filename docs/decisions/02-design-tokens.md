# Design tokens

## Decision

### Collections

The variables of [Core] Foundations live in these collections:

- **Primitives**, in four collections: Colors, Sizes, Motions and Shadows. They hold raw values, the brand ramps among them (`--color-brand-{primary,secondary,tertiary}-*`).
- **Themes**: colour roles with their hidden copies per surface, plus brand values, the typography that does not change with size, strokes and shadows.
- **Surfaces**, with the modes Default, Subtle, Inverse and Primary.
- **Sizes**, with the modes Mobile, Desktop, Mobile Compact and Desktop Compact. It holds everything that changes with the screen or the density: type sizes, line heights, gaps, paddings, icon sizes, heights and page layout.
- **Components**: the tokens of components and of component families such as `control/*`.

### Aliases

- Themes aliases Primitives and Themes. Surfaces aliases Primitives and Themes. Sizes aliases Primitives and Sizes.
- Components alias Themes, Surfaces, Sizes and Components. A Components token aliases a primitive only in two cases:
  - **Layout constants and motion**: values that no brand or mode changes.
  - **The exact geometry aliases of `primitiveAliases`**, each with a reason.
- Raw values live only in Primitives, the brand values of Themes and the layout constants.

### Names

- Themes and Sizes name purposes, never components. Anything named after a component or a family lives in Components.
- Mode names are a convention that the build reads. `Light` and `Dark` are the base brand. `<Brand> Light` and `<Brand> Dark` are a further brand. The first mode is the base one, on `:root`.
- Every emitted name is public API from 1.0.0: CSS custom properties, Tailwind keys, the exports of `tokens.ts`, the `ui-text-*` classes and the context attributes. `token-names.txt` is a snapshot of them, and the build fails until a rename updates it.
- The pipeline fails on a Figma name that it would have to normalize. Names never contain a brand.

### State model

- Component tokens have the states `default`, `active` (hover and pressed), `disabled`, and, where needed, `selected`/`checked` and `error`/`success`.
- Focus is shown only by the focus-ring roles. The keyboard highlight of an option is `highlighted`.
- A state token equal to `default` everywhere is not created. A role never mixes purposes with different contrast requirements.

### Metadata in Figma

- Every variable has the scopes its name describes, never all scopes. Primitives are published, with scopes for their fields.
- Every variable has a WEB code syntax, the `var()` of its custom property.
- Every role and brand value has a one-sentence description.
- The build checks all of this in the exports. `foundations:figma-metadata` writes the expected metadata and the differences.

### Pipeline

- **Input**: the Figma exports in `packages/foundations/figma/`, committed byte for byte. Nobody edits them by hand.
- **Outputs**: `tokens.css`, `tailwind.css` (Tailwind 4 `@theme inline reference`, so Tailwind declares no token again), `typography.css`, `tokens.json` (the manifest) and the typed references of `tokens.ts`. They are built and never committed.
- **CSS scopes**: Themes modes map to `[data-theme]`, and Dark is also mirrored onto `prefers-color-scheme`. Surfaces map to `[data-surface]`. Densities map to `[data-density]`, with the Desktop values in a media query from `breakpoint/lg` (1024 px).
- **Cascade layers**: every stylesheet of the library declares the order `theme, base, components, utilities, ui-core-tokens`, which extends Tailwind's, and `tokens.css` puts every token in `ui-core-tokens`. The tokens come after Tailwind's `theme`, whose defaults share names with them, such as `--font-mono`, in whichever order a page imports the files.
- **Typography classes**: one per typography group, `ui-text-<group>`, in the layer `components.ui-core`.
- **Line heights**: an aliased line height keeps its designed length when the paired font sizes differ.
- **Errors**:
  - Unreadable exports, missing aliases, cycles and name clashes stop every build.
  - Layer and metadata rules are errors in the library's strict build, and warnings in a consumer's build.
  - `token-exceptions.json` lists layout constants, `primitiveAliases` and known violations. Known violations only shrink.

## Why

A component token that skips a layer stops following the theme, the surface or the brand, and nobody notices. The build makes such breaks fail instead of ship.

## Rejected

- Hand-written tokens: Figma would drift from code.
- Hidden primitives: designers need fixed values too, and scopes guide them.
- Tokens outside any layer: an override imported before them lost without a warning, and an override in a layer of the page could never win.
- Tokens in a sublayer of Tailwind's `theme`, or in a layer before it: Tailwind's own declarations in `theme` win over them, so its defaults replace tokens of the same name.
