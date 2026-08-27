# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

All five packages are versioned in lockstep — one number covers
`ui-core-foundations`, `ui-core-icons`, `ui-core-wc` and `ui-core-react`.

While the project is on `0.x`, **breaking changes land in a minor bump**, per
[semver](https://semver.org/#spec-item-4). `1.0.0` will be a deliberate
statement that the public API has settled, not merely the next breaking release.

Releases before `0.10.0` are not documented here — see the git history.

## [0.17.1] — 2026-08-27

Two corrections to the role set 0.17.0 shipped. Both are renames or removals in the
public token API, and both are cheap: neither role is referenced by any component in
`ui-core-wc` or `ui-core-react`, so only consumer code written against 0.17.0 is affected.

### Removed

- **`--color-background-scrim`** — the colour set is now **62 roles**. It held a raw
  `#00000000`, the only member of `background/*` that did not alias a primitive, and
  duplicated `--color-background-transparent`: both are fully transparent, and the RGB
  behind alpha 0 is invisible in a solid fill. Its five consumers were
  `button/ghost/separator/*`, now pointing at `--color-background-transparent`. The name
  misled as well — the modal dim is `--color-background-overlay` (`black/400`), which is
  what a scrim actually is.

  **If you followed the 0.17.0 migration table from `--color-transparent-black`, go to
  `--color-background-transparent` instead.**

### Changed

- **`brand/{primary,secondary,tertiary}/{light,dark}` → `{subtle,strong}`**, so the brand
  tiers read like the border ramp (`subtle` → `default` → `strong`). These roles were
  introduced in 0.17.0, so nothing older is affected.

| before                       | after                         |
| ---------------------------- | ----------------------------- |
| `--color-brand-{tier}-light` | `--color-brand-{tier}-subtle` |
| `--color-brand-{tier}-dark`  | `--color-brand-{tier}-strong` |

- **Colour Styles in `[Core] Foundations` now cover the role set** — 16 → 31. Brand 3 → 9,
  Text 3 → 5, Background 6 → 8, Border 1 → 4, Disabled 0 → 2. Two of the existing sixteen
  were bound to `Themes` rather than `Surfaces` and so ignored `data-surface` on their own:
  `Brand/Primary` and `Text/Muted`. Both now bind `Surfaces`, like every other style.
  `Border/Default` is renamed `Border/Subtle`, since 0.17.0 moved the variable it points at
  under that name and the style label had been stale ever since.

## [0.17.0] — 2026-08-26

The Themes colour set went from **138 semantic roles to 63**. Where 0.15.0 moved
variables without changing a rendered value, this one **re-decides values on
purpose**: the old names described component variants rather than roles —
`outline/*` and `filled/*` were TextField chrome, the
`{success,warning,info,error}/{subtle,solid,outline}/*` families were Chip
states, and `action/*/{focus,active}` already carried hover's value.

Component tokens are untouched in name and count: all 978 stay, and only what they
point at changes. So the `--color-{component}-*` properties keep working, and just
two role references needed editing in Lit and React combined.

### Migration

**Roles that were renamed.** Everything else in the old set folded into one of
the 63 — the full mapping is in
[`tools/token-migration/color-roles/`](tools/token-migration/color-roles/README.md).

| before                                              | after                                                                |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| `--color-brand-primary`                             | `--color-brand-primary-default` (same for `-secondary`, `-tertiary`) |
| `--color-border-default`                            | `--color-border-subtle`                                              |
| `--color-separator-foreground`                      | `--color-border-default`                                             |
| `--color-border-strong-default` / `-hover`          | `--color-border-strong` / `--color-border-stronger`                  |
| `--color-outline-placeholder-default`               | `--color-text-placeholder`                                           |
| `--color-disabled-surface`                          | `--color-disabled-background`                                        |
| `--color-filled-text-disabled`                      | `--color-disabled-text`                                              |
| `--color-transparent` / `--color-transparent-black` | `--color-background-transparent` / `--color-background-scrim`        |

`--color-border-default` therefore changes meaning as well as name: it is now the
separator tone (`#9fa0a1`), not the container edge.

**`--color-action-primary-base-active` is deprecated**, not removed — 32 bindings
in `[Core] UI Library` sit on instance sub-nodes the Plugin API cannot rewrite.
It aliases `-hover`. Use `--color-action-primary-base-hover`; components now drive
hover, active and focus from that one token, and both disabled leaves fold into
`--color-disabled-background` / `--color-disabled-text`.

### Added

- `brand/{primary,secondary,tertiary}/{light,dark}` — a light and dark step per
  brand tier, for subtle fills and emphasis.
- `text/placeholder`, `disabled/{background,text}`, `border/stronger`,
  `background/{transparent,scrim}`.
- `selection/{background,text}` gained a `Surfaces` counterpart, so `::selection`
  finally responds to `data-surface`.

### Changed

- **`feedback/*`, `border/strong`, `border/stronger`, `ring/default` and
  `text/brand` are now surface-aware** — they carry different values per mirror
  instead of one value everywhere. `feedback/*/base` is the solid fill, the ink on
  `subtle`, and the ink on the page for an outline variant, and those want
  opposite luminance: light contexts keep the saturated step, dark contexts take
  `hue/300` with `subtle` dropping to `hue/1000`. Subtle chips and alerts in dark
  mode are now a dark tint of their hue rather than a near-white pill.
- `feedback/success/base` darkens to `green/950`. It is the one step that clears
  4.5:1 both as a fill under white ink and as ink on its own tint; the old value
  failed the first at 3.58:1.

### Fixed

- **The focus ring was invisible on inverse surfaces.** `ring/default` aliased the
  base row in `on-subtle` and `on-inverse`, so it never flipped — 2.23:1 on the
  dark inverse page, and in the `Dark` theme a white ring on a white page (1.00:1).
  All eight theme × surface combinations now clear 3:1, worst case 3.88.
- Three mirror values that failed contrast before this release:
  `on-inverse/background/{sunken,subtle}` carried one value across both themes, so
  Dark flipped the ink without flipping the surface under it (1.69:1).

### Known issues

- **`feedback/warning` does not meet WCAG AA in light contexts.** Warning ink on
  its own tint is 2.49:1 and white on the base fill is 2.65:1. The whole `orange`
  ramp was checked: no value serves both the solid fill and the ink on the tint —
  the first that clears 4.5:1 both ways is brown. Verify with
  `node tools/token-migration/color-roles/audit.mjs`, which should report warning
  and nothing else.

## [0.16.0] — 2026-08-23

A month/year picker behind the Calendar heading, plus a round of Web
Components form-field fixes: `name` now reflects to an attribute so form
submission actually includes it, re-enabling a field no longer leaves its
native control stuck disabled, and `DateField`/`DatePicker` no longer collapse
to the input's intrinsic width.

### Added

- **A month/year picker behind the `Calendar` / `<ui-calendar>` heading.**
  Clicking the month/year label zooms out from the day grid to a 12-month
  grid, then to a 24-year page, so a distant date — October 1987 from July
  2026, say — takes a few clicks instead of hundreds of chevron presses.
  Picking a year returns to its months, picking a month returns to its days;
  `Escape` steps back one level at a time. The same two header chevrons carry
  through every level and only change their stride (month → year → year
  page); year pages are aligned to fixed 24-year blocks so paging back and
  forth always lands on the same boundaries. A month or year is disabled only
  when `minDate`/`maxDate` rule it out entirely — a `disabledDates` predicate
  is deliberately left to the day grid, since one blocked day must not hide
  its whole month.

  ```tsx
  <Calendar startDate="1987-10-12" />
  ```

  ```html
  <ui-calendar start-date="1987-10-12"></ui-calendar>
  ```

- **Six new labels under `labels.calendar`** in `UiCoreLabels`: `previousYear`
  / `nextYear` (month-grid chevrons), `previousYears` / `nextYears`
  (year-grid chevrons), and the dynamic `chooseMonth(monthAndYear)` /
  `chooseYear(year)` naming the heading button — both receive the visible
  heading text, so the accessible name always contains what is on screen.
  Overridable globally through `configureUiCore` or per instance via the
  matching `Calendar` props / `ui-calendar` attributes (`prevYearLabel` /
  `prev-year-label`, and so on); `chooseMonthLabel` / `chooseYearLabel` are
  property-only, like every other function-shaped label. `DatePicker` /
  `ui-date-picker` do not forward these six — override them globally, or per
  instance on a standalone `Calendar`.

### Fixed

- **`name` on every form-associated Web Component was never reflected to an
  HTML attribute** (`CheckboxField`, `Combobox`, `DateField`,
  `FileInputField`, `NumberField`, `PasswordField`, `RadioField`,
  `SearchField`, `SelectField`, `SwitchField`, `TextField`, `TextareaField`).
  `ElementInternals.setFormValue(value)` takes the form-data entry's name from
  the host's `name` **content attribute**, not the JS property, so a `name`
  set only as a property — the common case under a framework binding —
  submitted with no name at all. The property is now `reflect: true`.
  `Combobox` (`multiple` mode) and `FileInputField` build their `FormData`
  entries directly and bake the name in at sync time, so they additionally
  now re-sync on a `name` change made after the first render, which they
  previously missed.
- **`formDisabledCallback` could drop its own write mid-update.** The callback
  fires both for an ancestor `<fieldset disabled>` and for the component's own
  reflected `disabled` attribute — the second case is redundant and arrives
  after `render()` has already read the old value, so the assignment landed
  too late and the control stayed stale. Most visibly: toggling `disabled`
  back off could leave the native control disabled. All twelve
  form-associated components above now track only the ancestor case
  (`disabled && !this.disabled`); `_isDisabled` already ORs in the property
  directly.
- **`DateField` / `DatePicker` collapsed to the input's intrinsic width
  instead of filling the field.** `ui-popover` / `Popover` is `inline-block`
  by default — correct when it wraps a trigger button, wrong once `DateField`
  wraps a full-width input — and nothing outside the picker's shadow root
  could reach in to override it. `ui-date-picker` and its React counterpart
  now push `display: block` down through the popover chain
  (`date-picker.styles.ts` in Lit; a compound `.ui-popover.ui-date-field`
  selector in React, since stylesheet order alone cannot be trusted to win).

## [0.15.1] — 2026-08-12

### Fixed

- **A fork with more than one theme mode rendered its non-base themes with the
  base theme's colours.** The Default surface block is emitted on `:root`, so any
  value reaching `Themes` was substituted there and then inherited already
  resolved — a `[data-theme]` container below had nothing left to re-declare it.
  Measured on a client fork with four theme modes: **76 properties wrong in one
  brand, 329 in another**, including a blue brand badge rendering green. The
  block is now repeated into every theme scope, the way the `Components` block
  already was.

  Only files that kept their component tokens in `Surfaces` are affected. Where
  the 0.15.0 restructure moved them into `Components`, the Default surface block
  is entirely self-referential and emits no line at all — which is why the Core
  package shows no difference before and after this fix, and why the regression
  reached a release: the file the build and the tests exercise cannot reproduce
  it. The new tests construct the fork's shape explicitly instead.

  **If you consume the tokens rather than generate them, nothing changes.** If
  you generate them from a multi-theme Figma file, rerun
  `ui-core-foundations build` — the previous output was wrong for every theme but
  the first.

## [0.15.0] — 2026-08-12

The Figma token set went from **4638 variables to 2078** without changing a single
rendered value. Setting up a design system for a new client is now ~138 semantic
roles instead of ~4000 rows. A **Comfortable / Compact density switch** then
landed on top, costing 36 more variables.

Nothing in the components moved: all 708 `--color-*` references in Lit and React
resolve exactly as before, verified against a pre-migration snapshot of every
token in all eight theme × surface combinations, and again by diffing the
generated CSS in a real browser. The same check covers density — every resolved
value in Comfortable is byte-identical to 0.14.0 across all 1974 custom
properties.

### Migration

**1. `--color-on-subtle-*`, `--color-on-inverse-*` and `--color-on-brand-primary-*`
are largely gone.** 2178 of the 2391 were removed; 414 remain (the ~138 semantic
roles × 3). These were always the internal machinery of the surface system — the
copies `[data-surface]` switches between — and `AGENTS.md` said not to use them,
but they were emitted, so this is a breaking change either way.

If you referenced one, use the surface-aware token instead. It already resolves to
the right value in every surface context, which is the entire point:

```css
/* before — pinned to one surface, ignored [data-surface] */
color: var(--color-on-inverse-text-primary);

/* after — follows the surface it is rendered in */
color: var(--color-text-primary);
```

**2. `--typography-eyebrow-font-familly` → `--typography-eyebrow-font-family`.**
The misspelling had also been suppressing the build's quoting rule, so the value
was emitted bare (`Ubuntu`) while every other font family was quoted. It is now
`"Ubuntu"`, consistent with the rest. Rendered output is unchanged.

**3. If you read the `tokens` TypeScript object**, per-component tokens moved:

```ts
tokens.surfaces.color.chip.neutral.solid.background.default; // before
tokens.components.color.chip.neutral.solid.background.default; // after

tokens.sizes.button.fontSize; // before
tokens.components.button.fontSize; // after
```

`tokens.surfaces` and `tokens.sizes` now hold only the semantic roles. The CSS
custom property names are untouched, so nothing changes if you use `var(--…)`.

### Added

- **Layout density — `data-density="compact"`.** A third context axis beside
  theme and surface, switching spacing, control heights and icon sizes.
  Typography, radius, stroke and colour do not react to it.

  ```html
  <html data-density="compact">
    <!-- or on any container, with nesting -->
    <table data-density="compact">
      <div data-density="comfortable">back to the roomier scale</div>
    </table>
  </html>
  ```

  `comfortable` is the default and needs no attribute — set it explicitly only to
  reset out of a compact ancestor. **Nothing changes for consumers who never set
  it:** every resolved value in Comfortable is identical to 0.14.0, checked
  property by property in a browser across all 1974 custom properties.

  Density composes with the other axes rather than multiplying them. A compact
  container inside `data-surface="subtle"` keeps the subtle palette, and a
  compact control on a wide viewport picks up the desktop step of the size ramp,
  not the mobile one — 113 custom properties move in Compact.

- **A `Density` collection** of 32 slots (`gap/*`, `padding/inline/*`,
  `padding/stack/*`, `icon/size/*`, `control/height/*`,
  `control/area/min-height/*`, `control/separator/inset`), read from
  `figma-exports/density.json` when present and skipped when absent, like
  `components.json`. Compact is a re-mapping rather than a second set of numbers:
  each slot points one step further down the ramps that already exist in `Sizes`,
  so a client fork re-points ~32 aliases instead of re-deciding ~83 values.

### Changed

- **A `Components` collection now holds every per-component token**, colour and
  dimension alike — 978 of them, each a single alias to a role. `Themes` and
  `Surfaces` carry the ~138 roles; `Sizes` carries the responsive roles. The
  layering is what shrank the set: the surface mirrors used to be duplicated
  across all 797 component-facing tokens, and now cover only the roles beneath
  them.
- **`build-tokens.ts` reads `figma-exports/components.json`** when it is present
  and ignores its absence, so a Figma file that has not been migrated still
  builds.
- **Precedence in `tokens.ts` is `Components > Surfaces > Themes`.** The
  collections share CSS variable names once the collection prefix is dropped, so
  only the most specific definition of a path reaches the public API.
- **A declaration is repeated into every scope where its value can change, and
  only there.** A custom property containing `var()` is substituted on the
  element the declaration applies to, and descendants inherit the substituted
  result — so an alias declared only on `:root` freezes there and ignores a
  `[data-surface]` or `[data-density]` container below it. Colours therefore
  repeat per theme and surface scope, and a dimension repeats per density scope
  **only when its alias chain reaches `Density`** (100 of 252 do). The rest stay
  on `:root` once, because the media query that drives them redeclares on the
  same element.
- **`Sizes` may now reference `Density`.** It always held two layers that were
  never separated — the `layout/*` / `icon/*` ramp and the `control/*` slots that
  alias it — and density belongs between them. Eight `control/*` roles now
  resolve through a density slot. This matters more than it sounds: form controls
  have no height token at all, so a text field's height is `padding-block` plus
  line-height, and without it density would visibly skip every field while
  buttons tightened around them.
- Generated output — `tokens.css` 859 → 497 KB, `tailwind.css` 335 → 120 KB,
  `tokens.ts` 305 → 135 KB, and declarations in `tokens.css` from 9658 to 6762.

### Removed

- **BREAKING — 2178 `on-*` mirror custom properties** from `tokens.css` and their
  `@theme` entries in `tailwind.css`. See Migration.
- **BREAKING — `--typography-eyebrow-font-familly`.** See Migration.

### Fixed

- **Two backwards layer references** (`Themes.color.radio.background.default` and
  `.hover` pointing down into `Surfaces`) that had been reported on every build.
  `pnpm foundations:build` is now warning-free.
- **`typography/eyebrow/font-family` was defined twice** — once in `Themes` as a
  raw value, once in `Sizes` aliasing _caption_ rather than eyebrow. The
  misspelling had kept the two from colliding. They now resolve through one
  source.
- **`packages/foundations/README.md` demonstrated the token object with
  `tokens.themes.color.onSubtle.brand.primary`** — the exact usage the
  architecture forbids. It now shows `tokens.surfaces.*`.
- **React's `Button` spaced its content with a raw ramp step**
  (`--layout-gap-inline-lg`) where the Lit element used the component token
  (`--button-gap`), and its `small` and `large` variants overrode no gap at all.
  Both resolve to 12px, so the two implementations looked identical — until
  density, under which Lit would have tightened and React would not.
- **42 component dimension tokens bypassed the semantic layer**, pointing
  straight at primitives, and three (`button/*/separator/inset`) held a hardcoded
  `4`. Adding density required a slot for each, so the layering defect is fixed
  as a side effect rather than as separate work.

### Known issues

- **`--color-transparent` is declared by both the `transparent` primitive and the
  new `transparent` role**, so the role wins inside a surface block. Both are
  fully transparent, so there is no visual difference, but the name is owned
  twice.
- **`letter-spacing` is typed inconsistently across the token set** —
  `notification/letter-spacing` is a number while the rest are percentage
  strings. Figma cannot change a variable's type in place, so straightening this
  out means recreating those variables.
- Two `transparent` roles exist (`rgba(0,0,0,0)` and `rgba(255,255,255,0)`)
  backing 59 tokens between them. They render identically and should be merged,
  but that changes value strings, so it was kept out of a migration whose
  contract was that no value moves.
- **In Figma only, 94 `*/icon/size` bindings in `[Core] UI Library` will not
  follow density.** They sit on instance sub-nodes carrying an explicit
  `boundVariables` override, and the Plugin API cannot write those — it accepts
  the call and silently does nothing, while `resetOverrides()` drops the value
  rather than restoring it. Generated CSS is unaffected; this is a design-file
  authoring artefact and clearing it needs a manual pass in the Figma UI.

## [0.14.0] — 2026-08-01

A file input with a drag-and-drop zone in both rendering targets, plus the
tokens, labels and icons it needs.

### Added

- **`FileInputField` for React (`@mszczygiel-projects/ui-core-react`)** and
  **`<ui-file-input-field>` for Web Components (`@mszczygiel-projects/ui-core-wc`)** —
  a drop zone wrapping a real, visually hidden `<input type="file">`. The
  picker, the keyboard behaviour and the accessible name come from the platform
  rather than from ARIA emulation, and the Lit element is
  **form-associated** (`ElementInternals` + `setFormValue`), so it submits with
  a surrounding `<form>` under its `name`.

  ```tsx
  const [files, setFiles] = useState<File[]>([]);
  <FileInputField
    label="Photo"
    description="PNG, SVG — max 2 MB"
    accept="image/png,image/svg+xml"
    maxSize={2 * 1024 * 1024}
    files={files}
    onChange={setFiles}
  />;
  ```

  ```html
  <ui-file-input-field label="Photo" accept="image/png" max-size="2097152"></ui-file-input-field>
  <script>
    field.addEventListener('ui-change', (e) => console.log(e.detail.files));
  </script>
  ```

  React follows the usual controlled/uncontrolled split (`files` + `onChange`,
  or `defaultFiles`); Lit reports through `ui-change`, `ui-reject` and
  `ui-remove`.

- **The presentation is derived from the selection, never set.** There is no
  `mode` prop — the field resolves `empty` / `filled` / `list` itself and
  reflects the result as `data-value`, mirroring the `Value` axis of the Figma
  Component Set. A single **image** in single-file mode gets an in-place
  preview with Replace / Remove; anything else — multiple files, or a
  non-image — stacks as a file list below the zone, because there is nothing
  to preview and a name with its size says more than a generic glyph blown up.
- **Validation is reported, not displayed.** `accept` (enforced on drops as
  well as through the native dialog), `maxSize` and `maxFiles` decide what
  enters the selection; everything refused is handed back through `onReject` /
  `ui-reject` with a `type` / `size` / `count` reason. The component renders no
  error message of its own — the wording depends on the app's tone and
  language, so `state="error"` plus `hint` stay the consumer's call.
- **Object URLs are owned by the component.** One per image in the current
  selection, revoked when the selection changes or the component goes away, so
  repeatedly swapping files does not leak blobs. Pass `File` objects, never
  URLs.
- **Two variants, three sizes.** `outline` draws a dashed border over the page
  background — the dash is the drop affordance, which is why it rides on the
  variant rather than on a token CSS `border-style` could not honour anyway;
  `filled` is a solid block with no visible edge. Field chrome otherwise rides
  on the shared `control/*` family, exactly like `TextField`.
- **`labels.fileInput`** in `UiCoreLabels` — `browse`
  (`Drag & drop or browse`), `replace` (`Replace`) and the dynamic
  `remove(fileName)` (`` `Remove ${fileName}` ``), overridable globally through
  `configureUiCore` or per instance via `prompt` / `replaceLabel` /
  `removeLabel`.
- **File input tokens**, surface-aware like every other component family:
  `--color-file-input-dropzone-*-dragover`, `--color-file-input-item-*` and
  `--color-file-input-preview-background`, plus the `on-subtle`, `on-inverse`
  and `on-brand-primary` variants, and the geometry set `--file-input-*`
  (including the `small-` / `large-` size ramps and the `item-` row metrics).

  Two of them are **translucent tints** —
  `--color-file-input-dropzone-background-dragover` and
  `--color-file-input-item-background-hover`. They are composited over the
  existing background with a one-colour `linear-gradient` and must never be
  assigned to `background-color`: substituting them directly replaces the
  opaque background and makes a `filled` zone get _lighter_ on hover.

- **`icon-file` and `icon-upload`** in `@mszczygiel-projects/ui-core-icons`.
  They join `icon-delete` in `REQUIRED_ICONS`, so a replacement icon set now
  has to cover all three.

### Changed

- Foundations token outputs (`figma-exports`, `tokens.css`, `tokens.ts`,
  `tailwind.css`) were regenerated to include the file input token families
  above.

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
