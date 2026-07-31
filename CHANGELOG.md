# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

All five packages are versioned in lockstep — one number covers
`ui-core-foundations`, `ui-core-icons`, `ui-core-wc` and `ui-core-react`.

While the project is on `0.x`, **breaking changes land in a minor bump**, per
[semver](https://semver.org/#spec-item-4). `1.0.0` will be a deliberate
statement that the public API has settled, not merely the next breaking release.

Releases before `0.10.0` are not documented here — see the git history.

## [0.13.0] — 2026-07-31

A new Drawer component in both rendering targets, plus a border-only group
separator in the listbox surface.

### Added

- **`Drawer` for React (`@mszczygiel-projects/ui-core-react`)** and
  **`<ui-drawer>` for Web Components (`@mszczygiel-projects/ui-core-wc`)** —
  an edge-anchored modal panel built on the native `<dialog>` element and
  rendered in the browser top layer via `showModal()`, so focus trapping,
  inerting the page behind and Escape all come from the platform and no
  `z-index` is involved.

  It is a deliberately plain container: it owns the surface, the scroll and the
  close affordance, and nothing else. Unlike `Dialog` / `<ui-dialog>` it has no
  title, description or footer regions — headings, toolbars and action rows are
  the consumer's to compose. That means **there is nothing for `role="dialog"`
  to be named by unless you name it**: set `label`, or point `aria-labelledby`
  at your own heading.

  It is also fully **controlled** — the component never applies its own open
  state. Escape, the backdrop, the close button and the drag gesture only
  report the request:

  ```tsx
  const [open, setOpen] = useState(false);
  <Drawer open={open} onOpenChange={(d) => setOpen(d.open)} placement="right" label="Filters">
    <h2>Filters</h2>
  </Drawer>;
  ```

  ```html
  <ui-drawer open placement="right" label="Filters">…</ui-drawer>
  <script>
    drawer.addEventListener('open-change', (e) => (drawer.open = e.detail.open));
  </script>
  ```

- **Three placements, no size axis.** `right` / `left` span the full viewport
  height at `--drawer-width`; `bottom` is a sheet that hugs its content, capped
  at `90dvh`, with only its top corners rounded. Below `48rem` a side drawer
  keeps its edge and its animation and only widens to the full viewport — it
  deliberately does not turn into a bottom sheet.
- **Opt-in drag-to-dismiss on the bottom sheet** (`dragToDismiss` /
  `drag-to-dismiss`), via the `DragDismissController` / `useDragDismiss`
  primitive already shared with the dialog. Release dismisses past 25% of the
  sheet's height, or on a flick above 0.5 px/ms measured over the last 100 ms.
  It is bottom-only and never the only way out — Escape, the backdrop and the
  close button all stay live, since a pointer gesture is unreachable by keyboard
  and screen reader.
- **`labels.drawer.close`** in `UiCoreLabels` (English default: `Close drawer`),
  overridable globally through `configureUiCore` or per instance via
  `closeLabel` / `close-label`.
- **Drawer tokens**, surface-aware like every other component family:
  `--color-drawer-{background,border,grabber}` plus the `on-subtle`,
  `on-inverse` and `on-brand-primary` variants, and the geometry set
  `--drawer-{width,radius,border-width,padding-inline,padding-stack,gap}` and
  `--drawer-grabber-{width,height,gap}`.
- **Unlabelled groups in the listbox surface render as a bare rule.** A group
  whose `label` is omitted takes the group header's border-only variant — no
  text, no sticky behaviour — for dividing runs of options that need no naming.
  A rule above the first group would separate it from nothing, so it is left
  out, and such a group drops its `aria-labelledby` rather than pointing at an
  empty name. Applies to `Listbox`, `SelectField` and `Combobox` in both
  packages.
- **`--select-dropdown-gap`** — one token now spaces everything in the dropdown
  panel: headers, separators and option wrappers alike.

### Changed

- `SelectField`'s native `<select>` mirror contributes an unlabelled group's
  `<option>`s flat, because a nameless `<optgroup>` renders as an empty row in
  the platform menu.
- Foundations token outputs (`figma-exports`, `tokens.css`, `tokens.ts`,
  `tailwind.css`) were regenerated. Besides the drawer tokens above,
  `--select-dropdown-radius` and `--notification-radius` now resolve through the
  responsive `--radius-md-mobile` / `--radius-md-desktop` pair instead of the
  flat `--radius-md`.

### Known issues

- `--color-drawer-grabber` resolves to `text/muted`, which lands at 2.45–3.85:1
  against the drawer background on light surfaces — below the 3:1 WCAG 1.4.11
  asks of a control affordance. Accepted for now because the grabber is
  decorative and `aria-hidden` and the gesture is never the only way out; the
  real fix is a neutral token in the 3–4.5:1 band, which Foundations lacks
  (the ramp jumps from `border/default` at 1.2:1 straight to `text/secondary`
  at 8:1).

## [0.12.0] — 2026-07-28

The token build no longer knows a fixed list of theme names. Every mode of the
Figma `Themes` collection is emitted as its own `[data-theme="…"]` selector, so a
project generating tokens from its own Figma file gets a working theme switch for
each of its modes without touching the build.

### Added

- **A selector per Figma theme mode in `tokens.css`.** The base mode (`Default`,
  or the first mode when there is none) lands on `:root`; every other mode gets
  `[data-theme="<kebab-case mode name>"]` — `DarkGreen` → `[data-theme="dark-green"]`.
  One attribute on `<html>` switches the whole page:

  ```html
  <html data-theme="dark">
    …
  </html>
  ```

  A mode block carries only the tokens whose value differs from the base mode,
  plus the aliases that transitively depend on them — everything else inherits
  from `:root`.

- **`data-theme="default"` is now an explicit selector**, so the base theme can be
  pinned rather than relied on through the absence of the attribute. This is how a
  page forces the light theme on a dark-mode OS.
- **`--no-auto-dark` on the `ui-core-foundations build` CLI**, and the matching
  `autoDarkMode` option on `buildTokens()`. It drops the
  `@media (prefers-color-scheme: dark)` mirror of the `Dark` mode for projects that
  always drive the theme from `data-theme`. Every mode is still emitted as
  `[data-theme="…"]` either way.
- **Surfaces modes are discovered from the export too.** A client mode the Core
  library does not ship (e.g. `BrandHighlight`) is emitted as
  `[data-surface="brand-highlight"]` using the same kebab-case rule; the four
  shipped modes keep their emission order.
- **`⚠ UNMAPPED MODE` warning for unknown Sizes modes.** Sizes is the one
  collection with a fixed mode list, because a mode there maps to a media query
  and the build has no breakpoint for a name it does not know. Such a mode is now
  reported instead of dropped silently.
- **The build logs the theme modes it found**, so a mode that never made it into
  the CSS is visible:

  ```
  — 3 theme modes: Default (:root), Dark ([data-theme="dark"]), DarkGreen ([data-theme="dark-green"])
  ```

- Theming documentation in the root README and `packages/foundations/README.md`,
  covering `data-theme` vs. `data-surface`, the system-preference fallback and the
  CLI flags.

### Changed

- **The `Dark` mode is now primarily an attribute selector.** It previously existed
  only inside `@media (prefers-color-scheme: dark)`; it is now emitted as
  `[data-theme="dark"], [data-theme="dark"] [data-surface="default"]`, with the
  media query kept as a mirror scoped to `:root:not([data-theme])`. The OS setting
  therefore still applies by default, but an explicit `data-theme` always wins over
  it. Rendered output is unchanged for a project that sets no theme attribute.
- `buildTokensCss()` takes a trailing options argument (`{ autoDarkMode }`). This is
  a build-script API, not part of the package's public exports.
- `tokens.css` was regenerated with the new theme blocks.

### Fixed

- **React `TextField` icon slots in the `inner` variant collapsed to zero height.**
  The slots have a fixed `height` with block padding larger than it, so under
  `border-box` sizing the padding ate the whole box and left no content area —
  slotted controls sized with `height: 100%` rendered invisibly. This affected the
  SearchField clear button, the PasswordField toggle, the DateField calendar button
  and the NumberField steppers. The slots now size the block axis from the content
  out.

## [0.11.0] — 2026-07-23

This release adds a new Breadcrumbs component to both rendering targets and
wires it into the shared foundations token/config layers.

### Added

- **`Breadcrumbs` for React (`@mszczygiel-projects/ui-core-react`)** with
  customizable `items`, `size` and `separator`, plus `onSelect` for integrating
  client-side routing while keeping semantic links in the markup.
- **`<ui-breadcrumbs>` for Web Components (`@mszczygiel-projects/ui-core-wc`)**
  with equivalent navigation behavior, including a cancelable `ui-select` event
  for router handoff.
- **Responsive breadcrumb behavior in both implementations**:
  automatic wrapping and a collapsed mobile trail (leading ellipsis + last two
  crumbs) below `48rem`, while preserving full-path announcements for assistive
  technology.
- **Public exports for Breadcrumbs APIs** in React and Web Components package
  entry points, including related item/detail and sizing/separator types.
- **Component documentation, stories and test coverage** for Breadcrumbs in both
  React and Web Components packages.

### Changed

- Foundations config now includes a **`labels.breadcrumbs.label`** leaf in
  `UiCoreLabels` (with English default: `Breadcrumb`) so the root breadcrumb
  navigation label can be localized through `configureUiCore`.
- Foundations token outputs (`figma-exports`, `tokens.css`, `tokens.ts`,
  `tailwind.css`) were regenerated to include Breadcrumbs semantic color/size
  tokens used by the new component.

## [0.10.0] — 2026-07-22

The library no longer owns any of the English text it renders, and no longer
owns the icon set the components draw with. Both are now the consumer's to
supply.

### Migration

**1. Install the icon package explicitly.** It moved from a dependency of the
component packages to a peer dependency, so your project now controls the single
installed copy:

```bash
pnpm add @mszczygiel-projects/ui-core-icons
```

Without this, installation or module resolution fails. This is the only change
in this release that breaks an existing project.

**2. If you annotate against `UiCoreConfig`, drop the removed fields.**
`toastContainer`, `dir` and `iconSet` no longer exist, and the `IconSet` type is
no longer exported. No runtime behaviour depended on them — `configureUiCore`
was not exported before this release, so none of them could be set.

**3. If you read a label prop back off a component instance**, expect
`undefined` where you previously got an English string. Rendered output is
unchanged; the text now resolves from the config at render time instead of
sitting in the prop's default.

### Added

- **`configureUiCore()` is now exported.** Until this release it existed but was
  absent from the package entry point, so the config could not be set at all.
- **`labels` config — every UI string the components render on their own.**
  15 groups covering Loader, Button, Listbox, SelectField, Combobox, SearchField,
  PasswordField, NumberField, Pagination, Chip, Notification, Dialog, Calendar,
  DatePicker and DateField, with English defaults built in. Merging is per leaf,
  so overriding one string leaves its siblings alone. Static labels are plain
  strings; labels containing a variable are functions, so a translator controls
  the whole sentence rather than a fragment.

  ```ts
  configureUiCore({
    labels: {
      dialog: { close: 'Zamknij okno' },
      pagination: { item: (page) => `Strona ${page}` },
    },
  });
  ```

- **Per-instance label props on components that had none:** `loadingLabel`
  (Button, IconButton, LinkButton), `clearLabel` (SearchField, SelectField,
  Combobox), `removeChipLabel` (Combobox), `closeLabel` (Dialog, Notification),
  `showLabel` / `hideLabel` (PasswordField). Each overrides the global config for
  that one instance.
- **`locale` config is now wired up.** Calendar, DateField and DatePicker resolve
  it as `component prop ?? config.locale ?? navigator.language ?? 'en-US'`. It
  affects only dates the components format themselves — never UI copy.
- **`@mszczygiel-projects/ui-core-icons/required-icons`** — the 14 icons the
  component packages render themselves, published as `REQUIRED_ICONS` and the
  `RequiredIconName` type so a replacement set can be typed against the contract.
- **The icons CLI now fails on an incomplete set**, listing every missing file.
  A missing icon renders nothing at all and reports no error, so this is a hard
  failure rather than a warning.
- `resetUiCoreLabels()` for restoring the built-in English labels in tests.
- `UiCoreLabels`, `UiCoreLabelsOverrides` and `UiCoreConfigOverrides` types.

### Changed

- **BREAKING — `@mszczygiel-projects/ui-core-icons` is a peer dependency** of
  `ui-core-wc` and `ui-core-react`, matching how `ui-core-foundations` is already
  treated. This is what makes a bundler alias reliably reach the components' own
  icon imports, so a project can swap the icon set at build time. See
  "Using your own icon set inside the components" in the README.
- **BREAKING — label props are optional with no default value.** Affects `label`
  (Loader), `emptyLabel` / `loadingLabel` / `createLabel` (Listbox, Combobox,
  SelectField), `dismissLabel` (Chip), `decrementLabel` / `incrementLabel`
  (NumberField), the Pagination label set, `prevMonthLabel` / `nextMonthLabel`
  (Calendar, DatePicker), `applyLabel` / `clearLabel` (DatePicker, DateField) and
  `calendarButtonLabel` (DateField). What renders is unchanged.
- `configureUiCore()` accepts `UiCoreConfigOverrides` instead of
  `Partial<UiCoreConfig>`, so `labels` can be given partially.
- The `locale` config defaults to `''` rather than `'en'`, so an unset locale
  falls through to the runtime locale — preserving what the date components did
  before the config was wired in.

### Removed

- **BREAKING — `toastContainer`, `dir` and `iconSet` from `UiCoreConfig`**, and
  the `IconSet` type from the public exports. All three were introduced during
  planning and never read by any component.
  - `toastContainer` — Notification is an inline banner, not a toast, and the
    library's overlays use the native top layer rather than portals.
  - `dir` — the components' CSS uses logical properties, so right-to-left already
    works from the native `<html dir="rtl">` attribute.
  - `iconSet` — icon selection is build-time (see the peer dependency change
    above); a runtime switch would force every set into the bundle and defeat
    tree-shaking.

### Fixed

- The Lit listbox used two different fallbacks for the same `loadingLabel` —
  `'Loading'` for the spinner's accessible name and `'Loading...'` for the
  visible text. Both now resolve from one source.
- Removed stale compiled artifacts (`config.js`, `index.js`, `tokens.js` and
  their `.d.ts` files) that had been committed under `packages/foundations/src/`.
  They shadowed the real TypeScript sources during module resolution, so
  Storybook and the test runner were reading a `tokens.js` that had drifted to a
  third of the real token set.
