# token-migration

Migration-time tooling for the token restructure described in
[`packages/foundations/docs/token-audit.md`](../../packages/foundations/docs/token-audit.md).

Not part of the build. Nothing here ships — `packages/foundations` never imports it.

## Why these exist

The restructure removes ~2400 mirror variables from Figma and re-points every component
token at a semantic role. It is correct **if and only if** every token still resolves to
the same colour in every theme × surface combination. The CSS diff cannot show that (it is
enormous by design) and Chromatic only covers what a story happens to render. So the
regression check has to resolve the token graph itself.

That is the one thing `build-tokens.ts` never does: it emits one CSS block per mode and
lets the cascade compose them, so it never resolves a _combination_ of collection modes.

## Tools

| Command                                                  | What it does                                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `node tools/token-migration/snapshot.mjs`                | Writes `snapshots/baseline.json` — every component-facing token's value in all 8 theme × surface combinations |
| `node tools/token-migration/snapshot.mjs --check <file>` | Re-resolves the current exports and diffs against a baseline. Exit 1 on any drift                             |
| `node tools/token-migration/derive-roles.mjs`            | Writes `out/role-map.json` + `out/roles.md` — the proposed role set and the token → role mapping              |
| `node tools/token-migration/generate-figma-scripts.mjs`  | Writes `out/figma/*.js` — the Plugin API payloads, chunked under the 50 000-char `use_figma` limit            |

The first two accept `--input <dir>` to point at a different set of Luckino exports.

## Approved names

`role-names.overrides.json` holds the role names a human has settled, keyed by any one token
of the cluster they rename. `out/` is generated, so an edit there is lost on the next run —
this file is where a naming decision survives. A key matching no cluster fails the run rather
than silently reverting to the heuristic.

| Name                                     | Why it is not the generated one                                                                                                                                                                                                                                                    |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `border/strong/{default,hover,disabled}` | The generated `border/*` collided with the existing generic `border/default`, which is the subtle container edge (`#ededed`, used by dropdown/popover/dialog/drawer). The checkbox/radio edge is a much stronger `#717374` — a different role that happened to want the same name. |
| `transparent-black`                      | A second fully-transparent role (`rgba(0,0,0,0)`, 5 `button.ghost.separator.*` tokens) next to `transparent` (`rgba(255,255,255,0)`, 54 tokens). Identical on screen. The name states the redundancy so the pending merge does not get forgotten.                                  |
| `disabled/surface`                       | The 9-token cluster the heuristic called `outline/border/disabled` is mostly _backgrounds_ (`control.outline`, `checkbox`, `radio`) with six chip borders — a flat disabled tone, not a border role.                                                                               |
| `outline/border/disabled`                | Freed by the rename above, and given to the single token that actually is one: `control.outline.border.disabled`.                                                                                                                                                                  |
| `checked/base/hover`                     | The cluster spans checkbox background **and** border **and** radio dot, across hover and active. Pinning it to `border` misdescribed 6 of its 8 consumers; `base` follows the existing `action/*/base/*` idiom for "the accent fill".                                              |
| `neutral/subtle/base/hover`              | Same reason: background + border across hover and active, so neither `background` nor `active` alone is honest.                                                                                                                                                                    |

## Two traps the migration walked into

Both were caught by a check, not by inspection — worth knowing before migrating a fork.

**Themes-only colour tokens.** `selection/background` and `selection/text` have no Surfaces
counterpart, so they are neither roles nor component tokens, and "delete every Themes colour
that is not a role" takes them out. They are live — `reset.css` styles `::selection` from
them. `KEEP_THEMES_ONLY` in step 06 is derived from the exports so a future orphan is caught
the same way.

**Aliases inherited by the new roles.** Step 01 copies each role's value verbatim from the
token it was derived from, which is what makes it value-preserving — but Themes aliases
another Themes variable in 2448 places, so mirrors like `color/on-subtle/transparent`
inherited a pointer to a component token that step 06 deletes. 131 references would have
dangled. Step 05 re-points them and asserts no resolved value moved.

The cleanup's dry run reports both: it lists what would go **and** every surviving variable
that would end up aliasing something deleted. Never skip it.

### Rejected: hiding the Components collection

Marking the collection `hiddenFromPublishing` would keep 726 tokens out of the picker in
client files. It does not work: `[Core] UI Library` binds these variables **across files**
(measured — 331 of its Chip bindings resolve to remote `Surfaces` variables), and a
collection hidden from publishing never reaches the published library, so there would be
nothing for step 04 to rebind to.

## The migration workflow

```bash
# 1. Baseline, before touching anything
node tools/token-migration/snapshot.mjs

# 2. Derive the role set, then REVIEW out/roles.md — names without a ✎ are still heuristic.
#    Settle any of them in role-names.overrides.json and re-run; never edit out/.
node tools/token-migration/derive-roles.mjs

# 2b. Regenerate the Figma payloads from the settled names
node tools/token-migration/generate-figma-scripts.mjs

# 3. Run the Figma migration (out/figma/*.js, executed through use_figma, in order)
#    01 roles → 02 surfaces → 03 components → 04 rebind (once per page)
#    → 05 repair aliases → 06 cleanup (destructive, DRY_RUN first)

# 4. Re-export from Luckino, then prove nothing moved
node tools/token-migration/snapshot.mjs --check tools/token-migration/snapshots/baseline.json
```

Step 4 must report **no drift**. A merge of the two `transparent` roles is the one known
exception: it renders identically but changes the value string, so it shows up as drift.
Do it as its own reviewed commit, then re-baseline.

## Self-check

`snapshot.mjs` fails loudly if the resolver has collapsed a mode dimension — the failure
where every surface returns the `Default` value, the snapshot compares equal no matter
what the migration does, and the whole check is worthless. The trap is real: an alias must
be resolved using the mode of the **target's** collection, not the mode name carried down
the chain, or a `Surfaces=Subtle` lookup silently falls back to `Themes=Default`.
