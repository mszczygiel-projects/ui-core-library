# color-roles

Migration-time tooling for the Themes `color/*` refactor: **138 Surfaces roles → 63**.

Nothing here ships. `packages/foundations` never imports it.

## Why a second set of tools next to `../`

The 2026-08-10 restructure was value-preserving by construction — it moved variables without
changing what anything resolved to, so `snapshot.mjs --check` reporting *zero* drift was the
whole proof.

This refactor is not that. Folding 138 roles into 63 **moves values on purpose**, so a drift
count proves nothing on its own. The question changes from "did anything move?" to "did
anything move *onto its own background*?" — which needs a different oracle.

| Command | What it answers |
| --- | --- |
| `node validate.mjs` | Is the mapping total, and does every target survive? Exits 1 on any gap. |
| `node validate.mjs --drift` | Which tokens change value, per theme × surface combination. |
| `node contrast.mjs` | Which foreground/background pairs get *worse* and land under 3:1. |
| `node contrast.mjs --causes` | The same, collapsed to root causes — 73 rows become 18. |
| `node contrast.mjs --all` | Every failing pair, whether or not the refactor moved it. |

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
pale tint with no surface awareness. As a *chip* fill that is fine. As a *field* fill it
resolves to #f4fbf6 on the Inverse surface while the field's ink flips to white — 1.02:1.
Checking a foreground against the page instead of against its co-located fill is exactly
what let the on-inverse control tokens ship broken once already.

## What the numbers mean today

```
mapping     138 → 63,  100% covered,  72 token-level overrides
drift       314 of 726 component tokens change value in at least one combination
contrast    73 pairs get worse and land under 3:1
```

Of those 73, **70 are the `warning` debt** — one known, accepted trade — and 3 are the
`filled` field's error ink on the Inverse surface. Everything else that the fold broke was
either fixed in the map or was already broken before it.

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
