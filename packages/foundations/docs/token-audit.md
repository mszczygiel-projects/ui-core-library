# Token audit — why there were 4638 variables, and how they became 2069

> Measured 2026-08-10 against `[Core] Foundations`, `[Core] UI Library`, `[CMS] Foundations`
> and `[CMS] Panel`. **The restructure has been carried out** — `[Core] Foundations` and
> `[Core] UI Library` are migrated; `[CMS] Foundations` is not. Numbers in "Measurements",
> "Multiplier 1/2" and "The CMS fork" describe the state before it, and still describe the
> CMS fork today. The deriver that produced it was removed once the forks were folded.

## The problem this documents

`[Core] Foundations` held **4638 variables**. The cost was not storage — it was that
standing up a design system for a new client meant facing 4000 rows with no way to tell
which of them were decisions and which were plumbing.

The scale was an illusion. The system expresses **112 distinct colour behaviours** — the
same 112 before and after the restructure, which is how we know nothing was lost.

## Measurements

|                                                                   |                      |
| ----------------------------------------------------------------- | -------------------- |
| Variables in `[Core] Foundations`                                 | 4638                 |
| Variables components actually bind (the `Surfaces` collection)    | 797                  |
| **Distinct behaviours those 797 express** (2 themes × 4 surfaces) | **112**              |
| `on-subtle` / `on-inverse` / `on-brand-primary` mirrors           | 2391 (51.6%)         |
| …of which are exact copies of their base token                    | 1736                 |
| `Themes` variables identical in `Default` and `Dark`              | 2974 of 3216 (92.5%) |
| `Themes` variables aliasing another `Themes` variable             | 2448                 |
| Declarations in `tokens.css` that are `on-*` machinery            | 4831 of 9658 (50.0%) |
| Component-facing tokens that actually change with the surface     | 323 of 797           |

Two multipliers produce the other 4500 rows.

### Multiplier 1 — the surface mirrors

Figma resolves one mode dimension per collection, so combining themes with surfaces needs
a cartesian somewhere. Today it is done with rows: `Themes` holds four full copies of the
component-facing set (`base`, `on-subtle`, `on-inverse`, `on-brand-primary`) and `Surfaces`
aliases into whichever copy matches its mode. Every `Surfaces` token has the identical
shape:

```jsonc
"$value": {
  "Default": "{Themes.color.chip.neutral.solid.background.default}",
  "Subtle":  "{Themes.color.on-subtle.chip.neutral.solid.background.default}",
  "Inverse": "{Themes.color.on-inverse.chip.neutral.solid.background.default}",
  "Primary": "{Themes.color.on-brand-primary.chip.neutral.solid.background.default}"
}
```

The mechanism is sound. The **layer** is wrong: it mirrors all 797 component-facing tokens
when only the generic roles underneath them need surface awareness. `on-subtle` is a
verbatim copy of its base token for **763 of 797** entries (95.7%); the 34 real overrides
are confined to `background.default`, `control.filled` and `action.tertiary`.

### Multiplier 2 — the per-component cartesian

Each component enumerates `family × variant × property × state` as flat tokens, whether or
not the cells differ:

| Component  | Tokens | Rows in `Themes` (×4) | Distinct behaviours |
| ---------- | ------ | --------------------- | ------------------- |
| chip       | 328    | 1312                  | 47                  |
| button     | 100    | 400                   | 18                  |
| control    | 84     | 336                   | 29                  |
| switch     | 48     | 192                   | 15                  |
| badge      | 36     | 144                   | 19                  |
| checkbox   | 30     | 120                   | 14                  |
| radio      | 30     | 120                   | 14                  |
| select     | 20     | 80                    | 11                  |
| pagination | 15     | 60                    | 7                   |
| calendar   | 12     | 48                    | 9                   |

Chip is 6 colour families × 3 variants × 3 properties × 6 states, plus 4 dismiss tokens.
All six families carry a byte-identical skeleton. 328 tokens, 1312 rows, 47 behaviours —
**28% of the entire file is one component.**

## The evidence that matters: the CMS fork

`[CMS] Foundations` is a fork with 4633 variables and four theme modes
(`Green`, `DarkGreen`, `Blue`, `DarkBlue`). Comparing its modes against each other:

| Change                                        | Variables that actually differ |
| --------------------------------------------- | ------------------------------ |
| A whole second brand theme (`Green` → `Blue`) | **18 of 3180**                 |
| Light → dark (`Green` → `DarkGreen`)          | 276 of 3180                    |
| Identical in all four modes                   | 2887 of 3180 (90.8%)           |

The 18 are exactly what you would expect a brand switch to touch: `color/brand/primary`,
`color/brand/secondary`, `color/background/inverse` and the `action/*/base/*` ramps. The
other 3162 rows were carried across mechanically.

That is the whole argument. Onboarding a client is an 18-to-300 variable job presented as
a 3180 variable job.

## Defects found along the way

**The internal mirrors are public API.** `AGENTS.md` states that `on-subtle`, `on-inverse`
and `on-brand-primary` are internal and "not for component use", but all 2391 are exported
in `tokens.ts` and emitted as `@theme` entries in `tailwind.css`. Nothing enforces the rule
— and `packages/foundations/README.md` demonstrates the token object with
`tokens.themes.color.onSubtle.brand.primary`, teaching the exact usage the architecture
forbids.

**Two backwards layer references.** `pnpm foundations:build` reports them on every run:

```
⚠ VIOLATION: Themes.color.radio.background.default → Surfaces.color.control.outline.background.default
⚠ VIOLATION: Themes.color.radio.background.hover   → Surfaces.color.control.outline.background.hover
```

`Themes` is above `Surfaces`, so these point the wrong way down the chain. Both resolve to
the transparent role and get absorbed by the migration, but they are worth knowing about:
warnings that are always present stop being read.

**`[CMS] Panel` binds deleted modes.** Eight nodes carry explicit `Themes` mode ids
(`2109:0`, `2110:1`) that no longer exist in the collection. Unrelated to this migration and
worth fixing separately.

**Some component tokens were bound to `Themes`, not `Surfaces`.** Before the restructure
both collections carried the same variable names, so the Figma picker offered
`color/button/primary/text/active` twice with no way to tell them apart — and a few nodes
ended up on the Themes copy, bypassing the surface system entirely. Found during the
migration on three pages: Button (2 variables), Checkbox (2), Radio (1) — 9 occurrences.
They render correctly on the default surface and silently ignore `data-surface`, which is
why nobody noticed. The restructure removes the ambiguity: after it, a component token
exists in exactly one collection.

**`[Core] UI Library` binds an orphaned library.** 36 bindings on the NumberInput page point
at `control/outline/border/width` in a collection named `Semantic`
(key `b8b917f3…`) that no longer appears among the file's available libraries. It is a size
token, so the colour restructure does not touch it, but the binding has no source to
resolve against.

## Target structure

Keep the mirror mechanism, move it down to the roles:

```
Primitives (215, unchanged)
  ↓
Themes — modes: Default | Dark | …client themes
    color/…                    138 roles   ← the only thing a client sets
    color/on-subtle/…          138
    color/on-inverse/…         138
    color/on-brand-primary/…   138
                             = 552
  ↓
Surfaces — modes: Default | Subtle | Inverse | Primary
    color/…                    138
  ↓
Components — 1 mode
    color/chip/…, color/button/…   726 names, each a single alias to a role
  ↓
[Core] UI Library binds the Components collection
```

In Figma a component token needs no modes of its own: an alias resolves in the mode context
of the **consuming node**, so pointing at a surface-aware role inherits the surface
awareness for free. 726 single-mode variables replace 726 rows × 4 mirrors.

**CSS does not work the same way, and the difference decides the emission strategy.** A
custom property containing `var()` is substituted at computed-value time on the element the
declaration applies to; descendants inherit the already-substituted result. So this is
_not_ enough:

```css
:root {
  --color-chip-x: var(--color-role-y);
} /* frozen at :root */
[data-surface='subtle'] {
  --color-role-y: green;
} /* chip-x stays red */
```

Verified in Chromium: inside the subtle container the role is green while the chip token is
still red. The build therefore repeats the Components declaration list into every scope
where a role can change — the base theme, each additional theme, and each surface. That is
what `buildTokensCss` does, and `tokens-transformer.test.ts` locks it in.

Measured after the migration ran on 2026-08-10:

|                                     | Before | After                       |
| ----------------------------------- | ------ | --------------------------- |
| Figma variables                     | 4638   | **2069**                    |
| — `Themes`                          | 3216   | 580                         |
| — `Surfaces`                        | 797    | 138                         |
| — `Components`                      | —      | 726                         |
| Rows a client sets up               | ~4000  | **138 roles** + brand ramps |
| `tokens.css` declarations           | 9658   | 6580                        |
| `tokens.css` size                   | 859 KB | 487 KB                      |
| `tailwind.css` size                 | 335 KB | 120 KB                      |
| `tokens.ts` size                    | 305 KB | 133 KB                      |
| `--color-*` references in Lit/React | 708    | 708, unchanged              |
| Build warnings                      | 2      | **0**                       |

The CSS shrinks by roughly a third rather than the two thirds the variable count suggests,
because the component layer is emitted per scope. The repeated blocks are byte-identical,
so gzip removes most of their cost on the wire. The variable count — the thing that makes a
new client's setup painful — is the reduction that matters here.

**One breaking change, in the TypeScript object only.** `tokens.surfaces.color.chip.*` is now
`tokens.components.color.chip.*`. The CSS custom properties are untouched, so nothing in Lit
or React moved, and the `tokens` object has no in-repo consumers.

**The mirrors are still public API**, just far fewer of them: 414 (`138 roles × 3`) instead of 2391. Narrowing that export is a separate change.

### Where 138 comes from

Computed on full 8-way tuples, not estimated:

- 71 existing generic roles (`background/*`, `text/*`, `icon/*`, `border/*`, `ring/*`,
  `link/*`, `feedback/*`, `brand/*`, `action/*`, `selection/*`)
- 432 of 726 component tokens (59.5%) already match one of them in **all eight**
  combinations
- the remaining 294 collapse into **67 new roles**; only 11 serve a single token, so the
  set is genuinely shared rather than a rename

138 exceeds 112 on purpose. Two roles may hold the same value today and mean different
things — `border/default` and `background/subtle` are the same grey right now. Collapsing
them would take away a client's ability to move one without the other, which is the
flexibility this whole exercise is meant to protect.

Role names were proposed by the deriver and settled by hand; the reasoning for each approved
name lived alongside it in `tools/token-migration/`, removed after the forks were folded.
Eight were settled; the rest are the generated proposals.

## The `Sizes` collection — a different problem

`Sizes` was audited next, on the assumption it had the same pathology. It does not.

There is **no mirror multiplier**: a size variable with two modes is one row, so 252
component-scoped tokens cost 252 rows, not 1008. Moving them into `Components` and adding
roles would _increase_ the count from 410 to ~430. Volume was never the issue here.

The real defect was layering. **141 of 252 component tokens (56%) aliased a primitive
directly**, bypassing any semantic layer — `button.font-weight` → `font-weight.semibold`, so
a client wanting "all controls medium" had to edit every component token or move the
primitive and change everything.

A layering pass ran on 2026-08-10: 9 new generic roles, **71 tokens re-pointed, zero value
drift**. What it deliberately did _not_ do, and why:

- **65 tokens stayed on their primitive.** Value-matching, which worked for colour, is weak
  for dimensions — `size.10` (40px) backs a calendar hit area, a switch track width and an
  icon size, three unrelated concepts. Worse, the semantically right role often changes the
  value: routing `button.font-weight` (600) through `control.font-weight` (400) would restyle
  every button. Those need design decisions, not a mechanical pass.
- **~17 one-off dimensions stayed too.** `dialog.large.max-width` is not a reusable role; a
  role above it would be the same token renamed.

The 252 component-scoped size tokens then moved into `Components`, so one rule covers every
component token regardless of kind: `Components` holds 978 (726 colour + 252 dimension) and
`Sizes` keeps 167 responsive roles. Zero value drift on both oracles, zero difference in the
generated CSS.

The cost, accepted deliberately: ~100 bindings in `[Core] UI Library` still point at the old
`Sizes` variables. They render correctly — Figma keeps resolving a deleted variable — but the
references are stale. `getVariableByIdAsync` still returns deleted variables, so "does the id
resolve" is not a test for this; comparing the bound name against the **published** library is.

### The lesson worth keeping

The rebind script skipped array-shaped `boundVariables`, which is where every text style
binding lives (`fontSize`, `fontFamily`, `lineHeight`, `fontWeight`). Its verification pass
skipped them too — **the tool and its check were wrong in the same way**, so the first sweep
reported Chip clean while 840 bindings had not moved. It surfaced only by chasing a single
four-binding discrepancy that did not add up.

Two Figma behaviours made the rest expensive, both worth knowing before migrating a fork:

- `setBoundVariable` on a node **inside an instance** reports success and changes nothing.
  The owner is the source node, reachable as the tail of the `I<path>;<sourceId>` id — which
  also reaches variants whose subtree is hidden and `findAll` never enters.
- An array of length 2 on a text node is usually **not** two styled segments; it is the
  inherited binding plus a stale instance override. `setRangeBoundVariable` clears it,
  `setBoundVariable` does not.

Three things surfaced that the plan had not predicted:

- **`button/*/padding/inline` held two different aliases** (16 mobile / 32 desktop). A
  single-mode `Components` collection would have collapsed them and buttons would have lost
  their desktop padding. They now alias `layout/padding/inline/adaptive`, a deliberately
  responsive role.
- **`notification/{,description/}letter-spacing` is `FLOAT`** where every other
  letter-spacing in the system is `STRING` (a percentage). They cannot alias
  `tracking/normal`, and Figma cannot change a variable's type — fixing it means recreating
  them.
- **`typography/eyebrow/font-familly` was a typo masking a duplicate.** Renaming it collided
  with a `Sizes` variable of the same name that pointed at _caption_ instead of eyebrow.
  Both now resolve through the Themes value, which makes the `Sizes` declaration a
  self-reference that `resolveCssLine` drops.

## What this deliberately does not do

- **Collapse duplicate states.** 307 component tokens hold the same value as another state
  in their group (`focus` = `hover` and so on). Removing them would shrink the file further
  and cost a client the ability to differentiate those states. After migration they are
  one-line aliases and cost almost nothing.
- **Merge the two transparent roles.** `rgba(0,0,0,0)` and `rgba(255,255,255,0)` back 59
  tokens between them and render identically. Worth merging, but it changes value strings,
  so it belongs in its own reviewed commit — not inside a migration whose contract is that
  no value changes.
- **Touch `Sizes`** (410 variables). Same cartesian shape, far smaller, not the pain point.
- **Migrate `[CMS] Foundations`.** Forks do not inherit from Core; it can move later.

## Verification

The oracle recorded every component-facing token's value in all eight combinations, before
and after; the diff had to be empty. Rebuild it if another restructure comes: resolve each
token through every theme × surface pair, hash the result, and compare the two digests.
