# [Core] Foundations — proposed `Density` slots

Derived 2026-08-12 from `packages/foundations/src/figma-exports/{components,sizes,primitives}.json`.
Nothing has been changed in Figma yet.

## The emission model is proven, not assumed

A Chromium probe at 376px and 1280px settled the four open questions:

| Question                                                                             | Result                                                                                                                                         |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Does a dimension alias declared only on `:root` follow a `[data-density]` container? | **No** — frozen at 16px (mobile) / 20px (desktop) inside `compact`. Repeating the block per density scope is required, exactly as for colours. |
| Does repeating it work?                                                              | Yes, in every case.                                                                                                                            |
| Nesting — comfortable inside compact, and the reverse?                               | Both correct.                                                                                                                                  |
| Density × `data-surface`?                                                            | Independent, in both nesting orders.                                                                                                           |
| Density × media query?                                                               | **Composes for free.** Compact at desktop resolved to the desktop-adjusted ramp step (10px), not the mobile one.                               |

That last row is what justifies "step down the ramp" over per-density raw values: a slot that
aliases a responsive ramp step keeps its responsiveness without any cartesian.

## What the 102 in-scope tokens point at today

| Target                               | Count | Assessment                                      |
| ------------------------------------ | ----- | ----------------------------------------------- |
| `Primitives Sizes.spacing` / `.size` | 39    | bypasses the semantic layer — nothing to switch |
| `Sizes.layout.*`                     | 32    | a ramp step, used as if it were a slot          |
| `Sizes.icon.*`                       | 20    | same                                            |
| `Sizes.control.*`                    | 8     | correct today                                   |
| raw `4`                              | 3     | breaks the zero-hardcoded rule                  |

Both ramps turn out to be dense 4px grids (`spacing` 0–64, `size` 0–128), so every step-down
below already exists as a primitive. No new primitives are needed.

## Proposed slots — 32

Comfortable always equals today's resolved value; that is the zero-drift contract. Compact is
one step down the 4px grid.

### `gap/*` — 30 consumers

| Slot      | Comfortable | Compact   |
| --------- | ----------- | --------- |
| `gap/2xs` | 4           | 4 — floor |
| `gap/xs`  | 8           | 4         |
| `gap/sm`  | 12          | 8         |
| `gap/md`  | 16          | 12        |

### `padding/inline/*` — 16 consumers

| Slot                      | Comfortable | Compact   |
| ------------------------- | ----------- | --------- |
| `padding/inline/2xs`      | 4           | 4 — floor |
| `padding/inline/xs`       | 8           | 4         |
| `padding/inline/sm`       | 12          | 8         |
| `padding/inline/md`       | 16          | 12        |
| `padding/inline/lg`       | 24          | 16        |
| `padding/inline/xl`       | 32          | 24        |
| `padding/inline/adaptive` | 16 → 32     | 12 → 24   |

`adaptive` is the one responsive slot. Compact needs a responsive counterpart, so one new ramp
entry is added to `Sizes`: `layout/padding/inline/adaptive-compact` (md → 2xl). Without it,
compact would freeze this padding at a single value and lose the breakpoint.

### `padding/stack/*` — 12 consumers

| Slot                | Comfortable | Compact   |
| ------------------- | ----------- | --------- |
| `padding/stack/2xs` | 4           | 4 — floor |
| `padding/stack/xs`  | 8           | 4         |
| `padding/stack/sm`  | 12          | 8         |
| `padding/stack/md`  | 16          | 12        |
| `padding/stack/lg`  | 20          | 16        |
| `padding/stack/xl`  | 24          | 20        |
| `padding/stack/2xl` | 32          | 24        |

### `icon/size/*` — 21 consumers

| Slot                 | Comfortable | Compact    |
| -------------------- | ----------- | ---------- |
| `icon/size/2xs`      | 12          | 12 — floor |
| `icon/size/xs`       | 16          | 12         |
| `icon/size/sm`       | 20          | 16         |
| `icon/size/md`       | 24          | 20         |
| `icon/size/lg`       | 32          | 24         |
| `icon/size/hit-area` | 40          | 32         |

### `control/height/*` and `control/area/min-height/*` — 17 consumers

| Slot                         | Comfortable | Compact    |
| ---------------------------- | ----------- | ---------- |
| `control/height/2xs`         | 20          | 20 — floor |
| `control/height/xs`          | 24          | 20         |
| `control/height/sm`          | 32          | 24         |
| `control/height/md`          | 48          | 40         |
| `control/area/min-height/sm` | 80          | 64         |
| `control/area/min-height/md` | 96          | 80         |
| `control/area/min-height/lg` | 128         | 96         |

### `control/separator/inset` — 3 consumers

| Slot                      | Comfortable | Compact |
| ------------------------- | ----------- | ------- |
| `control/separator/inset` | 4           | 4       |

Replaces the three hardcoded `4`s on `button/*/separator/inset`. It does not vary with density;
the slot exists to remove the raw value, which is a rule violation regardless.

## Judgement calls, stated rather than buried

1. **Floors.** A 4px gap, a 4px padding, a 12px icon and a 20px control height stay unchanged in
   Compact. One step down from 4 is 0, which collapses the layout rather than tightening it.
2. **`icon/size/hit-area` (40px) shrinks to 32px** — decided by the user against the safer
   default. Its two consumers, `calendar/day/size` and `pagination/item/size`, are pointer
   targets and 40px is already under the 44px guidance, so Compact takes them further below it.
   The reasoning accepted: the CMS is a desktop panel driven by a mouse, and Compact is an
   explicit user choice rather than a default. Worth revisiting if the panel ever ships a
   touch-first view — it is a single alias to change.
3. **Text areas do shrink** (80/96/128 → 64/80/96). A compact textarea showing fewer lines is
   the point of the mode, and these are not pointer targets.
4. **Three tokens stay out of density entirely**, because their value is geometry rather than
   spacing: `calendar/day/gap` (a deliberate 0), `drawer/grabber/height` (a 4px affordance) and
   `popover/arrow/size` (the arrow's geometry, not an icon).

## Result

99 of the 102 in-scope tokens repoint onto 32 slots. 39 tokens stop bypassing the semantic
layer, and 3 hardcoded values disappear — so the layering defect this uncovered gets fixed as a
side effect, not as separate work.

---

## Second pass — the `control/*` roles

The first pass covered the `Components` collection, and that turned out to be only part of the
surface. Form controls have **no height token at all**: a TextField's height is `padding-block`
plus line-height, and the padding comes from `--control-padding-stack`, a `Sizes` role read
straight from component CSS. Buttons tightened in Compact; every field did not.

Measured: **14 `Sizes` roles, 89 references across `packages/web-components` and
`packages/react`**. Four of them (`*/has-icon`, `control/label/inline-gap`) are not Figma
variables at all — component CSS computes them from `--control-icon-size` and
`--control-padding-inline`, so they follow for free.

### Why the roles were repointed rather than moved

Moving them into `Density` would have been the tidy answer, and it is not available:
**1583 live bindings in `[Core] UI Library` point at these roles, 193 of them on instance
sub-nodes** the Plugin API cannot rewrite. Deleting the roles would break all 1583.

Repointing keeps every variable, every id and every binding, and makes the role density-aware
in Figma and in CSS alike. The cost is that `Sizes` now references `Density` at the collection
level. `ALLOWED_DEPS` was relaxed deliberately: `Sizes` was always two layers in one — the
`layout/*` / `icon/*` ramp, and the `control/*` slots that alias it — and Density belongs
between them. The variable graph stays acyclic.

### What changed

| Role                          | Comfortable | Compact | Now aliases                      |
| ----------------------------- | ----------- | ------- | -------------------------------- |
| `control/icon/size`           | 20          | 16      | `Density.icon/size/sm`           |
| `control/large/icon/size`     | 24          | 20      | `Density.icon/size/md`           |
| `control/padding/stack`       | 8           | 4       | `Density.padding/stack/xs`       |
| `control/large/padding/stack` | 12          | 8       | `Density.padding/stack/sm`       |
| `control/small/padding/stack` | 4           | 4       | `Density.padding/stack/2xs`      |
| `control/padding/inline`      | 12 → 16     | 8 → 12  | `Density.padding/inline/control` |

`control/small/icon/size`, `control/small/padding/inline` and `control/large/padding/inline`
alias their base role, so they follow without being touched.

The inline padding is the one responsive role, so Compact needs a responsive counterpart —
two new ramp entries, `layout/padding/inline/control-adaptive` (md → lg) and
`…-control-adaptive-compact` (sm → md). Without them Compact would freeze that padding at a
single value and lose the breakpoint.

**Verified:** digest over the 420 pre-existing dimension names is `5549b710` before and after —
Comfortable unchanged. 86 tokens now move in Compact, up from 78.

**Rule this establishes:** a density-aware `Sizes` role must not also vary by Sizes mode. The
Desktop block writes to `:root`, so it would freeze there. Put the breakpoint in the ramp entry
the slot aliases. The build warns with `⚠ DENSITY × BREAKPOINT` instead of emitting something
that half-works.
