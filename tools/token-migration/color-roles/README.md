# color-roles

Migration-time tooling for the Themes `color/*` refactor: **138 Surfaces roles → 63**.

Nothing here ships. `packages/foundations` never imports it.

## Why a second set of tools next to `../`

The 2026-08-10 restructure was value-preserving by construction — it moved variables without
changing what anything resolved to, so `snapshot.mjs --check` reporting _zero_ drift was the
whole proof.

This refactor is not that. Folding 138 roles into 63 **moves values on purpose**, so a drift
count proves nothing on its own. The question changes from "did anything move?" to "did
anything move _onto its own background_?" — which needs a different oracle.

| Command                      | What it answers                                                          |
| ---------------------------- | ------------------------------------------------------------------------ |
| `node validate.mjs`          | Is the mapping total, and does every target survive? Exits 1 on any gap. |
| `node validate.mjs --drift`  | Which tokens change value, per theme × surface combination.              |
| `node contrast.mjs`          | Which foreground/background pairs get _worse_ and land under 3:1.        |
| `node contrast.mjs --causes` | The same, collapsed to root causes — 73 rows become 18.                  |
| `node contrast.mjs --all`    | Every failing pair, whether or not the refactor moved it.                |

## The files

- `target.mjs` — the 63 roles, plus `VALUE_OVERRIDES` (roles the refactor re-values) and
  `MIRROR_VALUE_OVERRIDES` (mirror values it repairs).
- `role-map.mjs` — `ROLE_MAP` for the 138 → 63 fold, and `TOKEN_OVERRIDES` for the ~70
  component tokens where one source role has to feed two different targets.

## Two things the checks caught that inspection did not

**`byKey` is a `Map`.** Indexing it like an object returns `undefined` for every lookup, so
every comparison skips and the run reports a clean zero. `validate.mjs` now probes
`text/primary` across all four surfaces and refuses to continue if they collapse to one
value — the same self-check `../snapshot.mjs` carries, for the same reason.

**A fold is only a bug when it lands on its own background.** `feedback/*/subtle` is a fixed
pale tint with no surface awareness. As a _chip_ fill that is fine. As a _field_ fill it
resolves to #f4fbf6 on the Inverse surface while the field's ink flips to white — 1.02:1.
Checking a foreground against the page instead of against its co-located fill is exactly
what let the on-inverse control tokens ship broken once already.

## What the numbers mean today

```
mapping     138 → 63,  100% covered
contrast    36 pairs get worse and land under 3:1 — all of them warning
```

`contrast.mjs` first reported 73 and was wrong: it skipped any pair whose fill was
transparent, which is exactly the outline variants. `audit.mjs` composites those over the
page the way a browser does and found 125. Driving the built Storybook and reading computed
styles off the live Chip grid is what exposed the gap in the first place.

The 125 came down to 36 in three moves, each one a role that had to start flipping with the
surface: the `feedback` family, the `border` ramp, and `text/brand`. What remains is the
`warning` debt alone, and only in the three light cells.

## The dependency that only appears once you flip something

`feedback/success/on-base` was doing duty as a **generic white** for sixteen tokens with
nothing to do with success — a brand chip's label, the danger button's text, an error
checkbox's mark. While every `on-base` was a constant white this read as merely untidy. The
moment the family becomes surface-aware, all sixteen break at once.

`repair-inks.mjs` fixes them by deriving each ink from the fill it sits on. Deriving found
the right answers **and several wrong ones** — the switch's checked icon sits on the thumb,
not the track — so the fills follow the rule and the inks are an explicit reviewed list.

### The `warning` debt

Folding `warning/subtle/text` (#562f1a) into `feedback/warning/base` (#fb7a2a) costs the
contrast: warning ink on its own tint drops 10.84:1 → 2.49:1, and white on the base fill is
2.65:1. The whole `orange` ramp was checked — **no value serves both roles**; the first that
clears 4.5:1 in both directions is `orange/1000` #562f1a, which is brown, not orange.

`success` had the same problem and an escape: `green/950` #008140 clears both (4.98:1 and
4.74:1), so `VALUE_OVERRIDES` darkens it and the regression disappears. Orange has no such
step, so the debt is recorded rather than hidden.

### Mirror repairs

Three mirror values are wrong **today**, independently of any folding:

```
Dark/Inverse    text/secondary #2d2f31 on background/subtle  #4f5153 → 1.69:1
Dark/Inverse    text/secondary #2d2f31 on background/sunken  #717374 → 2.82:1
Default/Primary background/default #174ba0 on background/inverse #151419 → 2.23:1
```

`on-inverse/background/{sunken,subtle}` carry the same value in Default and Dark, so when the
Dark theme flips the ink the surface under it does not follow. The `filled/*` family masks
this today by keeping its own surface-aware copies; folding those away exposes it, so the
refactor repairs it instead of inheriting it.

## What still needs hands

Forty-eight bindings across 27 nodes cannot be re-pointed by script — icon `width`/`height`
on instances nested inside instances, and six `letterSpacing` bindings whose successor is a
`STRING`. The click-through list, with node ids and deep links, is in
[`manual-figma-fixes.md`](manual-figma-fixes.md).
