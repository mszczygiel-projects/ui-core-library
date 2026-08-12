# [CMS] Foundations — proposed roles

Derived from the live fork (`3UC0Ha7bDOp0gyIrqFI923`) on 2026-08-12, before any change.

## Baseline

| Fact                              | Value                                               |
| --------------------------------- | --------------------------------------------------- |
| Variables in the fork             | 4633                                                |
| `Themes`                          | 3180 — of which **2364 are `on-*` mirrors** (74.3%) |
| `Surfaces` (component-facing)     | 788                                                 |
| `Sizes`                           | 368                                                 |
| Theme modes                       | `Green`, `DarkGreen`, `Blue`, `DarkBlue`            |
| Surface modes                     | `Default`, `Subtle`, `Inverse`, `Primary`           |
| Combinations per token            | **16** (not 8 as in Core)                           |
| Distinct behaviours across all 16 | **134**                                             |
| Tokens with one value in all 16   | 302                                                 |
| Baseline snapshot digest          | `f295e9cc`                                          |

The digest is the regression oracle: it is an FNV-1a hash over the sorted
`name=v1|…|v16` lines of all 788 component-facing tokens. If it is unchanged after the
migration, not a single resolved value moved.

## Outcome — migrated 2026-08-12

| Collection    | Before   | After                                                  |
| ------------- | -------- | ------------------------------------------------------ |
| `Themes`      | 3180     | **574** (408 mirrors + 143 base roles + 23 non-colour) |
| `Surfaces`    | 788      | 788 — **same variable ids**, now aliasing 134 roles    |
| `Sizes`       | 368      | 368 (untouched)                                        |
| Primitives ×4 | 297      | 297                                                    |
| **Total**     | **4633** | **2027** (−56.2%)                                      |

2918 variables deleted, 2190 of them `on-*` mirrors. The snapshot digest is `f295e9cc`
before and after: **no resolved value moved**, in any of the 16 combinations. Integrity scan
after deletion: 0 broken aliases, 0 self-references.

### Deviation from Core's structure — deliberate

Core moved every component-facing token into a separate single-mode `Components` collection.
The fork does **not**, and must not: creating new variables would issue new ids, and
`[CMS] Panel` carries **196 explicit `Surfaces` mode assignments on instance sub-nodes**,
which the Plugin API cannot rewrite (`setExplicitVariableModeForCollection` is a silent no-op
there, like every other write on such a node). Those nodes would lose surface switching with
no way to repair them.

Keeping the 788 tokens in `Surfaces` with their ids intact reaches the same variable count and
the same client-facing surface — 134 roles to configure, in `Themes` — with zero rebinding in
the consuming file. The only thing given up is picker hygiene: `Surfaces` cannot be hidden
from publishing the way Core's `Components` is.

`Sizes` was left alone for the same reason: it carries 20 286 bindings from `[CMS] Panel`.

### Kept beyond the role set

22 `Themes` variables are bound **directly** by nodes in `[CMS] Panel`, measured rather than
assumed. All 22 were retained. One is not a role and would otherwise have been deleted:
`color/control/outline/text/default`. This is the same class of trap that nearly removed the
live `selection/*` tokens during the Core migration.

## Naming sources

| Source                  | Count | Meaning                                                                                                                                              |
| ----------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fork's own generic role | 46    | The class already contains a role the client sees today (`background/default`, `text/muted`, …). It keeps that name — a Core vote may never take it. |
| Name from Core          | 67    | The class owns the majority of a Core role's consumers, so it inherits Core's name and the fork stays aligned.                                       |
| Minted                  | 21    | No counterpart. Named from the path its members share, dropping the component prefix when what remains still stands alone.                           |

## Divergence from Core — 21 roles

Applying Core's role map wholesale would have merged tokens that the fork resolves
differently. 717 of Core's 726 colour consumers exist here; of the 98 Core roles that have
consumers, **77 group identically and 21 split**. Examples:

| Core role                           | Splits in the fork into                               |
| ----------------------------------- | ----------------------------------------------------- |
| `background/default`                | 4 — select dropdown, popover, switch thumb, drawer    |
| `text/muted`                        | 2 — control hints (26) vs drawer grabber              |
| `feedback/success/on-base`          | 2 — 55 tokens vs `chip/neutral/outline/text/selected` |
| `action/primary/base/default`       | 2 — `button/ghost/text/default` vs 13 outline borders |
| `action/primary/base/disabled`      | 3                                                     |
| `action/danger/base/default`        | 2                                                     |
| `feedback/error/subtle`             | 2                                                     |
| `neutral/solid/background/selected` | 2                                                     |
| `disabled/surface`                  | 2                                                     |
| `filled/placeholder/default`        | 2                                                     |

These are preserved, not collapsed — the migration's contract is zero value drift. Whether
any of them is drift worth correcting against Core is a separate design decision.

## Roles

`[F]` fork generic · `[C]` from Core · `[N]` minted. Value shown is `Green/Default`;
_(const)_ marks a role identical in all 16 combinations.

| Role                              | Src | Tokens | Green/Default       |
| --------------------------------- | --- | ------ | ------------------- |
| feedback/error/on-base            | F   | 67     | #ffffff _(const)_   |
| transparent                       | C   | 54     | #ffffff00 _(const)_ |
| background/subtle                 | F   | 38     | #0c0c0d0d           |
| feedback/success/base             | F   | 31     | #1b9b54 _(const)_   |
| feedback/error/base               | F   | 31     | #b91313             |
| text/muted                        | F   | 27     | #9fa0a1             |
| action/danger/base/default        | F   | 23     | #b91313 _(const)_   |
| text/secondary                    | F   | 18     | #4f5153             |
| action/primary/on-base/active     | F   | 17     | #ffffff             |
| text/primary                      | F   | 16     | #1b1d1f             |
| brand/primary                     | F   | 15     | #2f9e63             |
| feedback/info/base                | F   | 15     | #0067db             |
| feedback/warning/base             | F   | 15     | #fb7a2a             |
| action/primary/base/active        | F   | 15     | #008148             |
| action/primary/on-base/disabled   | F   | 14     | #9fa0a1             |
| action/primary/base/default       | F   | 14     | #2f9e63             |
| action/primary/base/disabled      | F   | 12     | #fbfefc             |
| outline/placeholder/default       | C   | 9      | #717374             |
| action/secondary/base/active      | F   | 9      | #486882             |
| action/secondary/on-base/active   | F   | 9      | #ffffff             |
| feedback/success/subtle           | F   | 8      | #1b9b541a _(const)_ |
| feedback/info/subtle              | F   | 8      | #0368dc1a _(const)_ |
| feedback/warning/subtle           | F   | 8      | #fb7a2a1a _(const)_ |
| feedback/error/subtle             | F   | 8      | #cd2f2826 _(const)_ |
| action/primary/on-base/default    | F   | 8      | #ffffff             |
| action/danger/base/active         | F   | 8      | #fff8f6 _(const)_   |
| brand/subtle/background           | N   | 8      | #fbfefc _(const)_   |
| filled/text/default               | C   | 7      | #1b1d1f             |
| border/default                    | F   | 6      | #0c0c0d1a           |
| outline/background/active         | C   | 6      | #008148             |
| brand/subtle/text/default         | C   | 6      | #5eb982 _(const)_   |
| neutral/solid/background/selected | C   | 6      | #2d2f31             |
| neutral/solid/background/hover    | C   | 6      | #151419             |
| disabled/surface                  | C   | 6      | #0c0c0d1a           |
| brand/solid/background/hover      | C   | 6      | #8ecfa5 _(const)_   |
| success/solid/background/hover    | C   | 6      | #168c4b _(const)_   |
| warning/solid/background/hover    | C   | 6      | #ef6d10 _(const)_   |
| error/solid/background/hover      | C   | 6      | #a70000 _(const)_   |
| info/solid/background/hover       | C   | 6      | #0058cb _(const)_   |
| filled/placeholder/default        | C   | 5      | #717374             |
| transparent-black                 | C   | 5      | #00000000 _(const)_ |
| neutral/subtle/text/default       | C   | 5      | #4f5153             |
| switch/thumb                      | N   | 5      | #ffffff             |
| background/default                | F   | 4      | #ffffff             |
| outline/label/hover               | C   | 4      | #4f5153             |
| filled/icon                       | N   | 4      | #717374             |
| border/strong/hover               | C   | 4      | #2d2f31             |
| checked/base/hover                | C   | 4      | #008148             |
| neutral/solid/background          | N   | 4      | #2e6193             |
| neutral/subtle/base/hover         | C   | 4      | #d9d9d9             |
| brand/outline/text/default        | C   | 4      | #5eb982             |
| success/subtle/text/default       | C   | 4      | #008140 _(const)_   |
| success/outline/text/default      | C   | 4      | #008140             |
| warning/subtle/text/default       | C   | 4      | #562f1a _(const)_   |
| warning/outline/text/default      | C   | 4      | #562f1a             |
| error/outline/text/default        | C   | 4      | #b91313             |
| info/subtle/text/default          | C   | 4      | #0067db _(const)_   |
| info/outline/text/default         | C   | 4      | #0067db             |
| icon/default                      | F   | 3      | #2f9e63             |
| outline/background/disabled       | N   | 3      | #0c0c0d0d           |
| filled/text/disabled              | C   | 3      | #9fa0a1             |
| action/secondary/base/default     | F   | 3      | #112433             |
| action/secondary/base/disabled    | F   | 3      | #eaf2f8             |
| action/secondary/on-base/default  | F   | 3      | #ffffff             |
| ghost/text/active                 | C   | 3      | #008148             |
| checked/mark/default              | C   | 3      | #ffffff             |
| brand/subtle/background/hover     | C   | 3      | #e6f7eb _(const)_   |
| success/subtle/background/hover   | C   | 3      | #e6f7ea _(const)_   |
| warning/subtle/background/hover   | C   | 3      | #ffebdf _(const)_   |
| error/subtle/background/hover     | C   | 3      | #feece9 _(const)_   |
| info/subtle/background/hover      | C   | 3      | #eaf3ff _(const)_   |
| background/tint                   | F   | 3      | #0c0c0d05           |
| track/default                     | C   | 3      | #717374             |
| link/default                      | F   | 2      | #2f9e63             |
| outline/border/hover              | C   | 2      | #2d2f31             |
| outline/label/default             | C   | 2      | #4f5153             |
| filled/background/hover           | C   | 2      | #f7f7f7             |
| filled/background/success         | C   | 2      | #f7f7f7             |
| filled/border/hover               | C   | 2      | #f7f7f7             |
| filled/text/error                 | C   | 2      | #b91313             |
| action/tertiary/base/default      | F   | 2      | #2f9e63             |
| action/tertiary/base/active       | F   | 2      | #486882             |
| border/strong/default             | C   | 2      | #717374             |
| border/strong/disabled            | C   | 2      | #717374             |
| checked/background                | N   | 2      | #008148             |
| checked/border                    | N   | 2      | #008148             |
| select                            | N   | 2      | #ffffff             |
| neutral/outline/border/default    | C   | 2      | #d9d9d9             |
| neutral/outline/border            | N   | 2      | #9fa0a1             |
| brand/subtle/background/active    | C   | 2      | #d6f1de _(const)_   |
| success/subtle/background/active  | C   | 2      | #d6f1dd _(const)_   |
| warning/subtle/background/active  | C   | 2      | #ffd8be _(const)_   |
| error/subtle/background/active    | C   | 2      | #ffdcd6 _(const)_   |
| info/subtle/background/active     | C   | 2      | #dbebff _(const)_   |
| track/hover                       | C   | 2      | #4f5153             |
| track/disabled                    | C   | 2      | #d9d9d9             |
| switch/border                     | N   | 2      | #4f5153             |
| brand/secondary                   | F   | 1      | #112433             |
| brand/tertiary                    | F   | 1      | #2e6193 _(const)_   |
| background/sunken                 | F   | 1      | #f7f7f7             |
| background/inverse                | F   | 1      | #486882             |
| background/overlay                | F   | 1      | #0c0c0d26           |
| background/brand-primary          | F   | 1      | #2f9e63             |
| text/brand                        | F   | 1      | #2f9e63             |
| ring/default                      | F   | 1      | #2f9e63             |
| link/hover                        | F   | 1      | #008148             |
| outline/border/default            | C   | 1      | #717374             |
| outline/border/disabled           | C   | 1      | #717374             |
| outline/text/hover                | C   | 1      | #1b1d1f             |
| outline/text/error                | C   | 1      | #b91313             |
| outline/placeholder/disabled      | C   | 1      | #9fa0a1             |
| outline/icon/error                | C   | 1      | #b91313             |
| filled/background/default         | C   | 1      | #f7f7f7             |
| filled/background/disabled        | C   | 1      | #f7f7f7             |
| filled/border/default             | C   | 1      | #f7f7f7             |
| filled/border/disabled            | C   | 1      | #f7f7f7             |
| action/tertiary/base/focus        | F   | 1      | #2f9e63             |
| action/tertiary/base/disabled     | F   | 1      | #486882             |
| action/tertiary/on-base/disabled  | F   | 1      | #ffffff             |
| ghost/text/default                | N   | 1      | #2f9e63             |
| ghost/text/disabled               | N   | 1      | #fbfefc             |
| checked/background/default        | C   | 1      | #2f9e63             |
| checked/border/default            | C   | 1      | #2f9e63             |
| radio/checked/border/default      | N   | 1      | #2f9e63             |
| success/subtle/text               | N   | 1      | #008140             |
| warning/subtle/text               | N   | 1      | #562f1a             |
| error/subtle/text                 | N   | 1      | #b91313             |
| info/subtle/text                  | N   | 1      | #0067db             |
| neutral/outline/background/active | N   | 1      | #0c0c0d1a           |
| feedback/success/on-base          | C   | 1      | #ffffff             |
| switch/border/default             | N   | 1      | #717374             |
| separator/foreground              | C   | 1      | #9fa0a1             |
| drawer/background                 | N   | 1      | #f7f7f7             |
| drawer/grabber                    | N   | 1      | #9fa0a1             |

## Name overrides applied

The mechanical proposal was corrected in these 13 cases before the roles were created. The
table above already shows the pre-override names for the first two columns; these are what
actually exists in Figma:

| Mechanical                 | Applied                            | Why                                                                            |
| -------------------------- | ---------------------------------- | ------------------------------------------------------------------------------ | ----------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `select`                   | `background/panel`                 | Only one shared segment survived, and it named a component rather than a role. |
| `checked/background`       | `checked/background/hover`         | Core names the state; the class is hover + active.                             |
| `checked/border`           | `checked/border/hover`             | Same.                                                                          |
| `neutral/outline/border`   | `neutral/outline/border/hover`     | Would have read as a sibling of `…/default` while meaning something else.      |
| `switch/border`            | `switch/border/hover`              | Same.                                                                          |
| `switch/thumb`             | `switch/thumb/default`             | Completes Core's `…/default` convention.                                       |
| `filled/icon`              | `filled/icon/default`              | Same.                                                                          |
| `neutral/solid/background` | `neutral/solid/background/default` | Same.                                                                          |
| `brand/subtle/background`  | `brand/subtle/background/default`  | Same.                                                                          |
| `success                   | warning                            | error                                                                          | info/subtle/text` | `badge/…/subtle/text` | These four are Badge-only and genuinely differ in the fork from the Chip-driven `…/subtle/text/default`. Component-scoping is the honest name. |

### A naming bug the value guard caught

The first pass reserved only the _first_ generic role name held by a class. Nine classes carry
more than one. That let a different class win `feedback/success/on-base` through a Core vote,
while the fork's own variable of that name — with different values in both dark modes — sat in
another class. Reusing it would have silently changed a colour.

The pre-flight guard refused to write and reported the two mismatched modes. The fix is to
reserve **every** generic name a class carries, not just the one it adopts. Worth remembering:
the guard, not the derivation, is what made this safe.
