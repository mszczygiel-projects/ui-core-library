# Token Schema Reference

> Complete list of all Figma Variables in the [Core] Foundations structure.
> Used by the AI agent as a quick lookup — "what variables exist, what type, what modes."
>
> For workflow and derivation rules, see [ai-design-system-agent.md](./ai-design-system-agent.md).

---

## Collection 1: Primitives Colors

**Modes:** single (Value)
**Rule:** Raw hex / rgba values only. No references to other variables.
**What you change:** brand.primary._, brand.secondary._, gray._, green._, red._, blue._, orange._
**What you never change:** black._, white.\* (fixed opacity scales), transparent

### transparent

| Variable      | Type  | Value                                 |
| ------------- | ----- | ------------------------------------- |
| `transparent` | color | `rgba(255,255,255,0)` — do not change |

### black (opacity scale — do not change)

| Variable     | Type  | Value                 |
| ------------ | ----- | --------------------- |
| `black/100`  | color | `rgba(12,12,13,0.05)` |
| `black/200`  | color | `rgba(12,12,13,0.10)` |
| `black/300`  | color | `rgba(12,12,13,0.20)` |
| `black/400`  | color | `rgba(12,12,13,0.40)` |
| `black/500`  | color | `rgba(12,12,13,0.70)` |
| `black/600`  | color | `rgba(12,12,13,0.80)` |
| `black/700`  | color | `rgba(12,12,13,0.85)` |
| `black/800`  | color | `rgba(12,12,13,0.90)` |
| `black/900`  | color | `rgba(12,12,13,0.95)` |
| `black/1000` | color | `#0c0c0d`             |

### white (opacity scale — do not change)

| Variable     | Type  | Value                    |
| ------------ | ----- | ------------------------ |
| `white/100`  | color | `rgba(255,255,255,0.05)` |
| `white/200`  | color | `rgba(255,255,255,0.10)` |
| `white/300`  | color | `rgba(255,255,255,0.20)` |
| `white/400`  | color | `rgba(255,255,255,0.40)` |
| `white/500`  | color | `rgba(255,255,255,0.70)` |
| `white/600`  | color | `rgba(255,255,255,0.80)` |
| `white/700`  | color | `rgba(255,255,255,0.85)` |
| `white/800`  | color | `rgba(255,255,255,0.90)` |
| `white/900`  | color | `rgba(255,255,255,0.95)` |
| `white/1000` | color | `#ffffff`                |

### gray (adjust undertone to match brand)

`gray/50`, `gray/100`, `gray/200`, `gray/300`, `gray/400`, `gray/500`, `gray/600`, `gray/700`, `gray/800`, `gray/900`, `gray/1000`

### green (semantic — success color)

`green/50`, `green/100`, `green/200`, `green/300`, `green/400`, `green/500`, `green/600`, `green/700`, `green/800`, `green/900`, `green/950`, `green/1000`

### red (semantic — error color)

`red/50`, `red/100`, `red/200`, `red/300`, `red/400`, `red/500`, `red/600`, `red/700`, `red/800`, `red/900`, `red/950`, `red/1000`

### blue (semantic — info color)

`blue/50`, `blue/100`, `blue/200`, `blue/300`, `blue/400`, `blue/500`, `blue/600`, `blue/700`, `blue/800`, `blue/900`, `blue/950`, `blue/1000`

### orange (semantic — warning color)

`orange/50`, `orange/100`, `orange/200`, `orange/300`, `orange/400`, `orange/500`, `orange/600`, `orange/700`, `orange/800`, `orange/900`, `orange/950`, `orange/1000`

### brand/primary ⭐ (set from client's primary brand color)

`brand/primary/100`, `brand/primary/200`, `brand/primary/300`, `brand/primary/400`, `brand/primary/500`, `brand/primary/600`, `brand/primary/700`

### brand/secondary ⭐ (set from client's secondary brand color)

`brand/secondary/100`, `brand/secondary/200`, `brand/secondary/300`, `brand/secondary/400`, `brand/secondary/500`, `brand/secondary/600`, `brand/secondary/700`

---

## Collection 2: Primitives Sizes

**Modes:** single (Value)
**Rule:** Raw numeric values (px). No references.
**What you change:** `radius/*` values to match brand archetype. Optionally `spacing/*` if client has a very specific scale (rare).
**What you don't change:** `text/*`, `font-weight/*`, `tracking/*`, `breakpoint/*`, `spacing/*`, `size/*` — these are universal scales.

### spacing (universal 4px grid — do not change)

`spacing/0` (0) · `spacing/1` (4) · `spacing/2` (8) · `spacing/3` (12) · `spacing/4` (16) · `spacing/5` (20) · `spacing/6` (24) · `spacing/7` (28) · `spacing/8` (32) · `spacing/9` (36) · `spacing/10` (40) · `spacing/11` (44) · `spacing/12` (48) · `spacing/13` (52) · `spacing/14` (56) · `spacing/15` (60) · `spacing/16` (64) · `spacing/none` (0)

### size

`size/0` (0) · `size/1` (4) · `size/2` (8) · `size/3` (12) · `size/4` (16) · `size/5` (20) · `size/6` (24) · `size/7` (28) · `size/8` (32) · `size/10` (40) · `size/12` (48) · `size/14` (56) · `size/16` (64) · `size/20` (80) · `size/24` (96) · `size/32` (128)

### radius ⭐ (adjust to brand archetype)

| Variable      | Default value | Enterprise | Consumer | Minimal |
| ------------- | ------------- | ---------- | -------- | ------- |
| `radius/none` | 0             | 0          | 0        | 0       |
| `radius/xs`   | 2             | 2          | 2        | 0–1     |
| `radius/sm`   | 4             | 2–4        | 4–6      | 0–2     |
| `radius/md`   | 6             | 4–6        | 8–10     | 2–4     |
| `radius/lg`   | 8             | 6–8        | 12–16    | 4–6     |
| `radius/xl`   | 12            | 8–10       | 16–20    | 6–8     |
| `radius/2xl`  | 16            | 12         | 20–24    | 8–12    |
| `radius/3xl`  | 24            | 16         | 28–32    | 12–16   |
| `radius/4xl`  | 32            | 20         | 36–40    | 16–20   |
| `radius/full` | 9999          | 9999       | 9999     | 9999    |

### text (type scale — do not change)

Sizes in px: `text/xs` (12) · `text/sm` (14) · `text/base` (16) · `text/lg` (18) · `text/xl` (20) · `text/2xl` (24) · `text/3xl` (30) · `text/4xl` (36) · `text/5xl` (48) · `text/6xl` (60) · `text/7xl` (72) · `text/8xl` (96) · `text/9xl` (128)

Line heights (same naming + `-line-height` suffix): `text/xs-line-height` (16) · `text/sm-line-height` (20) · `text/base-line-height` (24) · etc.

### font-weight (do not change)

`font-weight/thin` (100) · `font-weight/extralight` (200) · `font-weight/light` (300) · `font-weight/normal` (400) · `font-weight/medium` (500) · `font-weight/semibold` (600) · `font-weight/bold` (700) · `font-weight/extrabold` (800) · `font-weight/black` (900)

### tracking (do not change)

`tracking/tighter` (-5%) · `tracking/tight` (-2.5%) · `tracking/normal` (0) · `tracking/wide` (2.5%) · `tracking/wider` (5%) · `tracking/widest` (10%)

### breakpoint (do not change — build pipeline requires `breakpoint/xl = 1280`)

`breakpoint/sm` (640) · `breakpoint/md` (768) · `breakpoint/lg` (1024) · `breakpoint/xl` (1280) · `breakpoint/2xl` (1536)

---

## Collection 3: Primitives Motions

**Modes:** single
**Do not change** unless client has specific animation requirements.

`easing/ease-linear` · `easing/ease-in` · `easing/ease-out` · `easing/ease-in-out`

`duration/0` (0ms) · `duration/75` · `duration/100` · `duration/150` · `duration/200` · `duration/300` · `duration/500` · `duration/700` · `duration/1000`

---

## Collection 4: Primitives Shadows

**Modes:** single
**Do not change** in most cases.

`shadow-shape/none` · `shadow-shape/2xs` · `shadow-shape/xs` · `shadow-shape/sm` · `shadow-shape/md` · `shadow-shape/lg` · `shadow-shape/xl` · `shadow-shape/2xl`

`inset-shadow-shape/none` · `inset-shadow-shape/2xs` · `inset-shadow-shape/xs` · `inset-shadow-shape/sm`

`shadow-color/default` (rgba black 10%) · `shadow-color/soft` (rgba black 5%) · `shadow-color/strong` (rgba black 25%)

---

## Collection 5: Themes

**Modes:** `Default` (light), `Dark` — in the Core file. A client fork may add more; the token
build emits `[data-theme="<kebab-case name>"]` for every mode past the base one.
**Rule:** Aliases to Primitives variables. Almost all values are `createVariableAlias(primitiveVar)`.
**Total variables:** 1,348

### color/brand/

| Variable                | Default (Light)       | Dark                  |
| ----------------------- | --------------------- | --------------------- |
| `color/brand/primary`   | `brand/primary/500`   | `brand/primary/400`   |
| `color/brand/secondary` | `brand/secondary/400` | `brand/secondary/400` |
| `color/brand/tertiary`  | `gray/200`            | `gray/200`            |

### color/background/

| Variable                         | Default (Light)         | Dark                    | Notes                     |
| -------------------------------- | ----------------------- | ----------------------- | ------------------------- |
| `color/background/default`       | `white/1000`            | `gray/900`              | Page background           |
| `color/background/sunken`        | `gray/100`              | `gray/800`              | Input, form backgrounds   |
| `color/background/subtle`        | `gray/200`              | `gray/700`              | Cards, sidebars           |
| `color/background/inverse`       | `gray/900`              | `white/1000`            | Inverse sections          |
| `color/background/overlay`       | `black/100`             | `black/100`             | Modal backdrop            |
| `color/background/brand-primary` | → `color/brand/primary` | → `color/brand/primary` | Brand-colored backgrounds |

### color/text/

| Variable               | Default (Light)         | Dark                    |
| ---------------------- | ----------------------- | ----------------------- |
| `color/text/primary`   | `gray/1000`             | `gray/50`               |
| `color/text/secondary` | `gray/700`              | `gray/200`              |
| `color/text/muted`     | `gray/500`              | `gray/300`              |
| `color/text/brand`     | → `color/brand/primary` | → `color/brand/primary` |

### color/icon/

| Variable             | Default (Light)         | Dark      |
| -------------------- | ----------------------- | --------- |
| `color/icon/default` | → `color/brand/primary` | `gray/50` |

### color/border/

| Variable               | Default (Light) | Dark       |
| ---------------------- | --------------- | ---------- |
| `color/border/default` | `gray/200`      | `gray/200` |

### color/ring/

| Variable             | Default (Light)         | Dark         |
| -------------------- | ----------------------- | ------------ |
| `color/ring/default` | → `color/brand/primary` | `white/1000` |

### color/link/

| Variable             | Default (Light)                       | Dark                                    |
| -------------------- | ------------------------------------- | --------------------------------------- |
| `color/link/default` | → `color/action/primary/base/default` | → `color/action/secondary/base/default` |
| `color/link/hover`   | → `color/action/primary/base/hover`   | → `color/action/secondary/base/hover`   |

### color/feedback/ (success / info / warning / error)

Pattern: `color/feedback/{type}/base`, `color/feedback/{type}/subtle`, `color/feedback/{type}/on-base`

| Variable                         | Default (Light) | Dark         |
| -------------------------------- | --------------- | ------------ |
| `color/feedback/success/base`    | `green/800`     | `green/700`  |
| `color/feedback/success/subtle`  | `green/100`     | `green/900`  |
| `color/feedback/success/on-base` | `white/1000`    | `white/1000` |
| `color/feedback/error/base`      | `red/800`       | `red/700`    |
| `color/feedback/error/subtle`    | `red/100`       | `red/900`    |
| `color/feedback/error/on-base`   | `white/1000`    | `white/1000` |
| `color/feedback/info/base`       | `blue/800`      | `blue/700`   |
| `color/feedback/info/subtle`     | `blue/100`      | `blue/900`   |
| `color/feedback/info/on-base`    | `white/1000`    | `white/1000` |
| `color/feedback/warning/base`    | `orange/800`    | `orange/700` |
| `color/feedback/warning/subtle`  | `orange/100`    | `orange/900` |
| `color/feedback/warning/on-base` | `white/1000`    | `white/1000` |

### color/action/ (primary / secondary / tertiary / danger)

Pattern: `color/action/{variant}/base/{state}` and `color/action/{variant}/on-base/{state}`
States: `default`, `hover`, `focus`, `active`, `disabled`

| Group                      | base/default → Primitive | on-base/default → Primitive |
| -------------------------- | ------------------------ | --------------------------- |
| `color/action/primary/*`   | `brand/primary/500`      | `white/1000`                |
| `color/action/secondary/*` | `brand/secondary/400`    | `white/1000`                |
| `color/action/tertiary/*`  | `gray/200`               | `gray/800`                  |
| `color/action/danger/*`    | `red/800`                | `white/1000`                |

Hover states → darker shade (+1 shade). Active → darker still (+2 shades). Disabled → `gray/300` (base) / `gray/400` (on-base).

### color/button/ (primary / secondary / outline / ghost / danger)

Each button variant has: `background/{state}`, `text/{state}`, `border/{state}`, `separator/{state}`
States: `default`, `hover`, `focus`, `active`, `disabled`

**button/primary** — brand's main CTA button:
| Property/State | Default (Light) | Dark |
|---|---|---|
| `color/button/primary/background/default` | → `color/brand/primary` | → `color/brand/primary` |
| `color/button/primary/background/hover` | `brand/primary/600` | `brand/primary/300` |
| `color/button/primary/background/focus` | → `color/brand/primary` | → `color/brand/primary` |
| `color/button/primary/background/active` | `brand/primary/700` | `brand/primary/200` |
| `color/button/primary/background/disabled` | `gray/200` | `gray/700` |
| `color/button/primary/text/default` | `white/1000` | `white/1000` |
| `color/button/primary/text/disabled` | `gray/500` | `gray/400` |
| `color/button/primary/border/default` | `transparent` | `transparent` |
| `color/button/primary/separator/default` | `brand/primary/400` | `brand/primary/600` |

**button/secondary** — secondary action:
| Property/State | Default (Light) | Dark |
|---|---|---|
| `color/button/secondary/background/default` | → `color/brand/secondary` (or light brand variant) | similar |
| `color/button/secondary/text/default` | `white/1000` | `white/1000` |

**button/outline** — outlined/ghost-ish:
| Property/State | Default (Light) | Dark |
|---|---|---|
| `color/button/outline/background/default` | `transparent` | `transparent` |
| `color/button/outline/border/default` | `gray/300` | `gray/600` |
| `color/button/outline/text/default` | → `color/text/primary` | → `color/text/primary` |

**button/ghost** — minimal, no border:
| Property/State | Default (Light) | Dark |
|---|---|---|
| `color/button/ghost/background/default` | `transparent` | `transparent` |
| `color/button/ghost/text/default` | → `color/text/primary` | → `color/text/primary` |

**button/danger** — destructive action:
| Property/State | Default (Light) | Dark |
|---|---|---|
| `color/button/danger/background/default` | `red/800` | `red/700` |
| `color/button/danger/text/default` | `white/1000` | `white/1000` |

### color/control/outline/ and color/control/filled/

These are form input (text field) color tokens. Pattern:

`color/control/{style}/{element}/{state}`

- styles: `outline`, `filled`
- elements: `background`, `border`, `text`, `placeholder`, `icon`, `label`, `hint`
- states: `default`, `hover`, `active`, `success`, `error`, `disabled`

Total variables per style: ~36 (6 elements × 6 states = 36).

Mapping rule:

- `outline/background/default` → `transparent` (all states except disabled → `background/subtle`)
- `outline/border/default` → `gray/600` (Light) / `gray/50` (Dark)
- `outline/border/hover` → `gray/800`
- `outline/border/success` → → `color/feedback/success/base`
- `outline/border/error` → → `color/feedback/error/base`
- `outline/text/default` → → `color/text/primary`
- `outline/text/error` → → `color/feedback/error/base`

### color/checkbox/ and color/radio/

Checkboxes and radio buttons follow the same structure:

**checkbox:**
`color/checkbox/background/{state}` (6 states), `color/checkbox/border/{state}` (6 states), `color/checkbox/checked/background/{state}` (6 states), `color/checkbox/checked/border/{state}` (6 states), `color/checkbox/checked/mark/{state}` (6 states)

Default checked state: background → `brand/primary/500`, mark → `white/1000`

**radio:**
`color/radio/background/{state}` (6), `color/radio/border/{state}` (6), `color/radio/checked/dot/{state}` (6), `color/radio/checked/background/{state}` (6), `color/radio/checked/border/{state}` (6)

### color/select/

`color/select/dropdown/background` · `color/select/dropdown/border`
`color/select/option/background/{state}` (4 states: default, hover, active, disabled)
`color/select/option/text/{state}` · `color/select/option/icon/{state}` · `color/select/option/check/{state}` (default, active)

### color/selection/

`color/selection/background` · `color/selection/text`
(Text selection highlight, e.g. `brand/primary/200` + `brand/primary/900`)

### color/on-subtle/, color/on-inverse/, color/on-brand-primary/

These are surface-context overrides within Themes. They define token values for when content is placed on a Subtle, Inverse, or Primary surface.

Each has subgroups matching the main categories: `action`, `background`, `border`, `brand`, `button`, `checkbox`, `control`, `feedback`, `icon`, `link`, `radio`, `ring`, `select`, `text`

**Rule:** These rarely need changing when updating a client brand. The main exceptions:

- `color/on-inverse/*` — ensure text is light enough on dark inverse backgrounds
- `color/on-brand-primary/*` — ensure text/icons are readable on brand-primary backgrounds (usually white)

### Non-color Themes tokens

| Variable                          | Type    | Modes        | Notes                             |
| --------------------------------- | ------- | ------------ | --------------------------------- |
| `typography/heading/font-family`  | string  | Default/Dark | Heading font name                 |
| `typography/body/font-family`     | string  | Default/Dark | Body font name                    |
| `typography/caption/font-family`  | string  | Default/Dark | Caption/small text font           |
| `typography/eyebrow/font-familly` | string  | Default/Dark | Note: typo in original (double l) |
| `radius/sm/mobile`                | number  | Default/Dark | Alias to Primitives Sizes         |
| `radius/sm/desktop`               | number  | Default/Dark | Alias to Primitives Sizes         |
| `radius/md/mobile`                | number  | Default/Dark | Alias to Primitives Sizes         |
| `radius/md/desktop`               | number  | Default/Dark | Alias to Primitives Sizes         |
| `radius/lg/mobile`                | number  | Default/Dark | Alias to Primitives Sizes         |
| `radius/lg/desktop`               | number  | Default/Dark | Alias to Primitives Sizes         |
| `shadow/color/default`            | color   | Default/Dark | Shadow color                      |
| `shadow/color/soft`               | color   | Default/Dark |                                   |
| `shadow/color/strong`             | color   | Default/Dark |                                   |
| `shadow/elevation/1`              | string  | Default/Dark | Card, tile shadow                 |
| `shadow/elevation/2`              | string  | Default/Dark | Dropdown, popover                 |
| `shadow/elevation/3`              | string  | Default/Dark | Modal, dialog                     |
| `shadow/elevation/4`              | string  | Default/Dark | Toast, floating panel             |
| `shadow/interactive/default`      | string  | Default/Dark | Resting interactive element       |
| `shadow/interactive/hover`        | string  | Default/Dark | Hover state                       |
| `shadow/interactive/active`       | string  | Default/Dark | Active/pressed state              |
| `shadow/inset/default`            | string  | Default/Dark | Input field                       |
| `shadow/inset/subtle`             | string  | Default/Dark |                                   |
| `button/text-transform/uppercase` | boolean | Default/Dark | ⭐ Set per client preference      |
| `ring/style`                      | string  | Default/Dark | Focus ring CSS value              |
| `ring/offset`                     | number  | Default/Dark | Focus ring offset                 |
| `link/text-decoration/underline`  | boolean | Default/Dark | Whether links are underlined      |

---

## Collection 6: Surfaces

**Modes:** `Default`, `Subtle`, `Inverse`, `Primary` — extra client modes are emitted the same
way, as `[data-surface="<kebab-case name>"]`.
**Rule:** All variables are aliases to Themes variables.
**What you change:** Almost nothing. Surfaces auto-inherit from Themes.

Total variables: same set as Themes color variables, but with 4 surface modes.

Example structure for `color/brand/primary`:

- Default → `Themes.color/brand/primary`
- Subtle → `Themes.color/on-subtle/brand/primary`
- Inverse → `Themes.color/on-inverse/brand/primary`
- Primary → `Themes.color/on-brand-primary/brand/primary`

---

## Collection 7: Sizes

**Modes:** `Mobile`, `Desktop` — fixed. Unlike Themes and Surfaces, this collection takes no
extra modes: a mode here maps to a media query and the build has no breakpoint for an unknown
name, so it warns (`⚠ UNMAPPED MODE`) instead of emitting.
**Rule:** Mix of aliases to Primitives + raw values for Desktop overrides.
**Total variables:** 229
**What you change:** Font families, radius values, button uppercase preference.

### typography/heading/\*

Variants: `display`, `display/large`, `title`, `subtitle`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`

Per variant properties: `font-family`, `font-weight`, `font-size`, `line-height`, `letter-spacing`
Some variants also have: `font-weight-strong`

### typography/body/\*

Properties: `font-family`, `font-weight`, `font-weight-strong`, `font-size`, `line-height`, `letter-spacing`
Variants: (base), `small`, `large`

### typography/caption/\*

Properties: `font-family`, `font-weight`, `font-size`, `line-height`, `letter-spacing`, `text-tranform` (note: typo in original)

### typography/eyebrow/\*

Properties: `font-family`, `font-weight`, `font-size`, `line-height`, `letter-spacing`, `text-transform`

### typography/link/\*

Properties: `font-weight`

### radius/\*

`radius/none`, `radius/sm`, `radius/md`, `radius/lg`, `radius/pill`

### stroke/\*

`stroke/border` (border width) · `stroke/ring` (focus ring width)

### layout/\*

`layout/padding/inline/{xs,sm,md,lg,xl}` · `layout/padding/stack/{sm,md,lg,xl}`
`layout/gap/inline/{sm,md,lg,lg-2}` · `layout/gap/stack/{sm,md,lg,xl}`
`layout/container/max-width` · `layout/container/padding-inline`

### icon/\*

`icon/sm` · `icon/md` · `icon/lg`

### control/\* (form inputs)

`control/font-family`, `control/font-weight`, `control/font-size`, `control/line-height`
`control/radius`, `control/border/width`, `control/icon/size`, `control/letter-spacing`
`control/padding/inline`, `control/padding/inline-has-icon`, `control/padding/stack`

Sizes: `control/small/*` and `control/large/*` — same properties, different values

Label tokens: `control/label/font-size`, `control/label/line-height`, `control/label/font-weight`, `control/label/font-family`, `control/label/letter-spacing`, `control/label/text-transform`

Floating label: `control/label/floating/font-size`, `control/label/floating/line-height`, `control/label/floating/letter-spacing`, `control/label/floating/font-weight`, `control/label/floating/font-family`, `control/label/floating/text-transform`

Hint: `control/hint/font-size`, `control/hint/line-height`, `control/hint/font-weight`

Underlined control borders: `control/underlined/border/width/{default,hover,active,error,success,disabled}`

### button/\* ⭐

| Variable                          | Notes                         |
| --------------------------------- | ----------------------------- |
| `button/font-family`              | Button font                   |
| `button/font-weight`              | Button font weight            |
| `button/font-size`                | Default button font size      |
| `button/line-height`              |                               |
| `button/radius`                   | ⭐ Adjust per brand archetype |
| `button/letter-spacing`           |                               |
| `button/border/width`             |                               |
| `button/icon/size`                |                               |
| `button/text-transform/uppercase` | ⭐ true / false               |
| `button/padding/inline`           |                               |
| `button/padding/stack`            |                               |
| `button/separator/inset`          |                               |

Sizes: `button/small/*` and `button/large/*`

### checkbox/\*

`checkbox/radius`, `checkbox/size/default`, `checkbox/border/width`
`checkbox/field/gap`, `checkbox/field/font-family`, `checkbox/field/font-weight`, `checkbox/field/font-size`, `checkbox/field/line-height`, `checkbox/field/letter-spacing`

### radio/\*

`radio/radius`, `radio/size/default`, `radio/border/width`, `radio/border/inner-width`
`radio/field/*` (same as checkbox/field)

### select/\*

`select/option/padding/{stack,inline}`, `select/option/radius`, `select/option/gap`
`select/option/small/*` and `select/option/large/*`
`select/dropdown/padding`, `select/dropdown/radius`, `select/dropdown/border/width`

### notification/\*

`notification/radius`, `notification/font-family`, `notification/font-size`, `notification/line-height`, `notification/font-weight`, `notification/letter-spacing`
`notification/description/*` (same set)
`notification/padding/inline`, `notification/padding/stack`
`notification/default/show-icon`, `notification/default/border/{left,right,top,bottom}`
`notification/subtle/show-icon`, `notification/subtle/border/{left,right,top,bottom}`

---

## Summary: What to Update Per Client

| Priority | Collection                   | Variables to update                                             |
| -------- | ---------------------------- | --------------------------------------------------------------- |
| ⭐⭐⭐   | Primitives Colors            | `brand/primary/*`, `brand/secondary/*` (7 shades each)          |
| ⭐⭐⭐   | Primitives Colors            | `gray/*` (11 shades — match brand undertone)                    |
| ⭐⭐     | Primitives Colors            | `green/*`, `red/*`, `blue/*`, `orange/*` (minor adjustments)    |
| ⭐⭐⭐   | Themes                       | `color/brand/*`, `color/button/primary/*` (main brand elements) |
| ⭐⭐     | Themes                       | `color/background/*`, `color/text/*`, `color/feedback/*`        |
| ⭐⭐     | Themes                       | `button/text-transform/uppercase`                               |
| ⭐       | Sizes                        | `typography/*/font-family` (all 4 font families)                |
| ⭐       | Sizes                        | `button/radius`, `radius/sm`, `radius/md`, `radius/lg`          |
| —        | Surfaces                     | Rarely changes — auto-inherits from Themes                      |
| —        | Primitives Sizes             | Rarely changes                                                  |
| —        | Primitives Motions / Shadows | Almost never changes                                            |
