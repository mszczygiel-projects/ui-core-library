# Manual Figma fixes — what the Plugin API cannot do

Everything else in the token migration and the density layer was scripted. These are the
remainder, with the reason each one resisted automation. Node ids are clickable via
`https://www.figma.com/design/<fileKey>/?node-id=<id>` (replace `:` with `-`).

## Fixed since this list was first written

`badge/medium/height` in `[CMS] Foundations` was the fork's only responsive height (24 → 32)
and was left out of density because Compact needed a responsive counterpart. It now has one —
`layout/height/adaptive` / `-compact` in `Sizes`, slot `control/height/adaptive` in `Density` —
and resolves to **24 ⇒ 20 mobile, 32 ⇒ 24 desktop**. The fork's dimension digest is unchanged,
so Comfortable did not move. 67 tokens now react to density, with no remaining exceptions
beyond the deliberate zeros and geometry.

---

## 1. Letter-spacing — 26 bindings, but only 10 nodes to touch

**Why the API cannot do it.** The target variables are typed `STRING` (they alias
`tracking/normal`, a percentage string). Figma's UI happily binds a `STRING` to a node's
`letterSpacing`, but `setBoundVariable` and `setRangeBoundVariable` both refuse:

```
in setBoundVariable: variable of resolved type 'STRING' cannot be bound to 'letterSpacing'
```

Changing the variables to `FLOAT` would let the API bind them, but Figma cannot change a
type in place — recreating means new ids, which breaks every live binding, and the tokens
would lose their alias to `tracking/normal` and become hardcoded zeros. Worse trade than the
defect.

**Nothing renders wrong.** A dead binding keeps its last resolved value, which here is `0`.
This is a "missing variable" badge in the editor, not a visual bug.

**The 10 nodes worth fixing** — all plain nodes in `[Core] UI Library`
(`BzqkruN7r8mwWfFReznc83`). Bind `letterSpacing` to `Components :: checkbox/field/letter-spacing`
or `… :: radio/field/letter-spacing` respectively.

| Page                  | Nodes                                                                                |
| --------------------- | ------------------------------------------------------------------------------------ |
| Checkbox (`1145:317`) | `1145:1144`, `1145:1147`, `1150`, `1153`, `1156` — all "accept terms and conditions" |
| Radio (`1217:1338`)   | `1217:1385`, `1388`, `1391`, `1394`, `1397` — all "remember me"                      |

**Fixing those 10 clears 26.** The other 2 in Core and all 14 in `[CMS] Panel` are instance
reflections of `1145:1156` and `1217:1397`, carrying no override of their own — the same
cascade that cleared the 12 `file-input` bindings after the last publish. Publish Core UI
Library afterwards and let Panel take the update.

---

## 2. Icon sizes — 47 nodes, 94 bindings

**Why the API cannot do it.** Each is an instance sub-node whose parent instance holds an
explicit `boundVariables` override pinning a variable that no longer exists. Writes to such a
node are **silent no-ops** — `setBoundVariable` returns without error and changes nothing, and
`resize()` behaves the same. `minWidth` at least says so out loud:
`This property cannot be overridden in an instance: min-size`.

`resetOverrides()` is instance-wide and destructive: it clears the pin, but the node then falls
back to whatever the main component says, which for a swapped icon is that icon's own default
size. Measured on the Dialog close button: 20px became 24px. So it is not a fix.

**Nothing renders wrong** here either — the last resolved value is the correct one. The cost is
that a client fork cannot retarget these, and the editor shows them as detached.

The fix is per node in the Figma UI: select the icon, bind W and H to the live variable in
`Components`.

| Page                     | Count | Variable                                           |
| ------------------------ | ----- | -------------------------------------------------- |
| DatePicker (`2117:2855`) | 10    | `button/small/icon/size`, `button/large/icon/size` |
| Dialog (`2203:5549`)     | 8     | `button/small/icon/size`                           |
| Button (`101:6`)         | 6     | `button/icon/size`, `button/large/icon/size`       |
| FileInput (`2399:620`)   | 6     | `button/small/icon/size`                           |
| Pagination (`2148:3941`) | 6     | `button/icon/size`                                 |
| Popover (`2082:2686`)    | 4     | `button/small/icon/size`                           |
| Drawer (`2374:2367`)     | 3     | `button/small/icon/size`                           |
| Calendar (`2097:2739`)   | 2     | `button/small/icon/size`                           |
| Chip (`2060:98`)         | 2     | `chip/medium/icon/size`                            |

---

## 3. The Dialog close button — one node, and it is a regression I caused

`[Core] UI Library` → Dialog page → variant `Size=Small, Variant=Default` → node
`I2216:43;199:2857` ("icon/close"). **It is 24×24 and should be 20×20.**

I ran `resetOverrides()` on the enclosing `CloseButton` instance while testing whether that
could clear a dead binding. It cleared it, and the icon — which is swapped to `icon/close`,
a remote component that is intrinsically 24×24 — lost the 20px size the override had been
supplying. I captured and restored the instance's name, sizing modes and stroke, but the size
itself cannot be written back: every geometry write on an instance sub-node is a no-op.

**Fix:** select the node in the Figma UI and set W and H to 20, or bind them to
`Components :: button/small/icon/size`.

**Lesson recorded:** `resetOverrides()` is not a repair tool. It does not restore an intended
value, it discards an override and takes whatever the main component happens to say — and on a
swapped instance that is a different component with different geometry.
