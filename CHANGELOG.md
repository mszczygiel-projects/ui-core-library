# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

All five packages are versioned in lockstep — one number covers
`ui-core-foundations`, `ui-core-icons`, `ui-core-wc` and `ui-core-react`.

While the project is on `0.x`, **breaking changes land in a minor bump**, per
[semver](https://semver.org/#spec-item-4). `1.0.0` will be a deliberate
statement that the public API has settled, not merely the next breaking release.

Releases before `0.10.0` are not documented here — see the git history.

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
