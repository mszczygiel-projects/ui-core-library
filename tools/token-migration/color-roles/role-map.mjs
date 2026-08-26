// Today's 138 Surfaces colour roles → the 63 that survive.
//
// Most of this is a straight fold: a role whose name describes one component's variant
// collapses onto the semantic role it always meant. The exceptions are in TOKEN_OVERRIDES,
// where one source role feeds two different targets depending on which component reads it.

export const ROLE_MAP = {
  // ── Action ────────────────────────────────────────────────────────────────────────
  // focus/active fold into hover (their values are already identical today, except the
  // tertiary anomaly this fixes); both disabled leaves fold into the flat disabled tones.
  ...Object.fromEntries(
    ['primary', 'secondary', 'tertiary', 'danger'].flatMap((c) => [
      [`action/${c}/base/default`, `action/${c}/base/default`],
      [`action/${c}/base/hover`, `action/${c}/base/hover`],
      [`action/${c}/base/focus`, `action/${c}/base/hover`],
      [`action/${c}/base/active`, `action/${c}/base/hover`],
      [`action/${c}/base/disabled`, 'disabled/background'],
      [`action/${c}/on-base/default`, `action/${c}/on-base/default`],
      [`action/${c}/on-base/hover`, `action/${c}/on-base/hover`],
      [`action/${c}/on-base/focus`, `action/${c}/on-base/hover`],
      [`action/${c}/on-base/active`, `action/${c}/on-base/hover`],
      [`action/${c}/on-base/disabled`, 'disabled/text'],
    ]),
  ),

  // ── Background ────────────────────────────────────────────────────────────────────
  'background/default': 'background/default',
  'background/sunken': 'background/sunken',
  'background/subtle': 'background/subtle',
  'background/inverse': 'background/inverse',
  'background/overlay': 'background/overlay',
  'background/brand-primary': 'background/brand-primary',
  'background/tint': 'background/tint',
  transparent: 'background/transparent',
  'transparent-black': 'background/scrim',

  // ── Border ────────────────────────────────────────────────────────────────────────
  // The four-step ramp. Today's generic `border/default` is the *lightest* edge
  // (container chrome), so it moves down to `subtle` and the separator tone takes its name.
  'border/default': 'border/subtle',
  'separator/foreground': 'border/default',
  'neutral/outline/border/default': 'border/default',
  'border/strong/default': 'border/strong',
  'outline/border/default': 'border/strong',
  'track/default': 'border/strong',
  'border/strong/hover': 'border/stronger',
  'outline/border/hover': 'border/stronger',
  'track/hover': 'border/stronger',
  'border/strong/disabled': 'disabled/background',
  'outline/border/disabled': 'disabled/background',
  'track/disabled': 'disabled/background',

  // ── Brand ─────────────────────────────────────────────────────────────────────────
  'brand/primary': 'brand/primary/default',
  'brand/secondary': 'brand/secondary/default',
  'brand/tertiary': 'brand/tertiary/default',
  'brand/subtle/background/hover': 'brand/primary/light',
  'brand/subtle/background/active': 'brand/primary/light',
  'brand/solid/background/hover': 'brand/primary/dark',
  'brand/subtle/text/default': 'brand/primary/dark',
  'brand/outline/text/default': 'brand/primary/dark',

  // ── Text ──────────────────────────────────────────────────────────────────────────
  'text/primary': 'text/primary',
  'text/secondary': 'text/secondary',
  'text/muted': 'text/muted',
  'text/brand': 'text/brand',
  'outline/text/default': 'text/primary',
  'outline/text/hover': 'text/primary',
  'filled/text/default': 'text/primary',
  'outline/label/default': 'text/secondary',
  'outline/label/hover': 'text/secondary',
  'neutral/subtle/text/default': 'text/secondary',
  'outline/placeholder/default': 'text/placeholder',
  'filled/placeholder/default': 'text/placeholder',
  'outline/placeholder/disabled': 'disabled/text',
  'filled/text/disabled': 'disabled/text',

  // ── Disabled ──────────────────────────────────────────────────────────────────────
  'disabled/surface': 'disabled/background',
  'filled/background/disabled': 'disabled/background',
  'filled/border/disabled': 'disabled/background',

  // ── Field chrome (the `filled` variant's own surface) ──────────────────────────────
  'filled/background/default': 'background/sunken',
  'filled/background/hover': 'background/sunken',
  'filled/border/default': 'background/sunken',
  'filled/border/hover': 'background/sunken',
  // NOT `feedback/success/subtle`: that is a fixed pale tint with no surface awareness,
  // and this is a *field background*. On the Inverse surface the field's ink flips to
  // white while the tint stays #f4fbf6 — 1.02:1. The success state tints the border and
  // the ink, never the fill, so the fill follows the ordinary field background.
  'filled/background/success': 'background/sunken',

  // ── Neutral (Chip/Badge neutral variant) ──────────────────────────────────────────
  'neutral/solid/background/hover': 'background/inverse',
  'neutral/solid/background/selected': 'background/inverse',
  'neutral/subtle/base/hover': 'background/subtle',

  // ── Accent fills that were their own family ───────────────────────────────────────
  'checked/background/default': 'action/primary/base/default',
  'checked/border/default': 'action/primary/base/default',
  'checked/base/hover': 'action/primary/base/hover',
  'checked/mark/default': 'action/primary/on-base/default',
  'ghost/text/active': 'action/primary/base/hover',
  'outline/background/active': 'action/primary/base/hover',

  // ── Feedback ──────────────────────────────────────────────────────────────────────
  ...Object.fromEntries(
    ['success', 'info', 'warning', 'error'].flatMap((c) => [
      [`feedback/${c}/base`, `feedback/${c}/base`],
      [`feedback/${c}/subtle`, `feedback/${c}/subtle`],
      [`feedback/${c}/on-base`, `feedback/${c}/on-base`],
      // Ink roles fold onto `base`: it is the only dark step left.
      [`${c}/outline/text/default`, `feedback/${c}/base`],
      // error is the one colour with no `subtle/text` role — it never had one.
      ...(c === 'error' ? [] : [[`${c}/subtle/text/default`, `feedback/${c}/base`]]),
      // Swap-on-hover: a solid chip lightens to its own tint, a subtle chip fills in.
      [`${c}/solid/background/hover`, `feedback/${c}/subtle`],
      [`${c}/subtle/background/hover`, `feedback/${c}/base`],
      [`${c}/subtle/background/active`, `feedback/${c}/base`],
    ]),
  ),
  'outline/text/error': 'feedback/error/base',
  'outline/icon/error': 'feedback/error/base',
  'filled/text/error': 'feedback/error/base',

  // ── Pass-through ──────────────────────────────────────────────────────────────────
  'icon/default': 'icon/default',
  'ring/default': 'ring/default',
  'link/default': 'link/default',
  'link/hover': 'link/hover',
};

// Themes-only colours today: they have no Surfaces counterpart, so they are neither roles
// nor component tokens and a blanket "delete every Themes colour that is not a role" takes
// them out. They are live — reset.css styles ::selection from them. The refactor promotes
// them into Surfaces so the group is mirrored like every other, per the target list.
export const PROMOTE_TO_SURFACES = ['selection/background', 'selection/text'];

// One source role, two destinations — resolved per consuming component token.
// Keys are `Components` token paths without the leading `color/`.
export const TOKEN_OVERRIDES = {
  // The outline variant tints on hover/active rather than filling, so its `*/active`
  // background reads the subtle tint, not the base fill the subtle variant swaps to.
  ...Object.fromEntries(
    ['success', 'info', 'warning', 'error'].map((c) => [
      `chip/${c}/outline/background/active`,
      `feedback/${c}/subtle`,
    ]),
  ),
  'chip/brand/outline/background/active': 'brand/primary/light',

  // `feedback/success/on-base` is today's generic "white ink on any solid fill" — a naming
  // accident. Each solid surface points at its own on-base instead.
  //
  // The ink also has to follow the swap: where the fill moves from `base` to `subtle` on
  // hover, white ink would land on a near-white tint (1.05:1), and where it moves the other
  // way, dark ink would land on a saturated fill. `SWAP` lists the states whose background
  // changes side, so `text` and `background` always describe the same surface.
  ...Object.fromEntries(
    ['success', 'info', 'warning', 'error'].flatMap((c) => {
      const SWAP = ['hover', 'active', 'selected'];
      const REST = ['default', 'focus'];
      return [
        [`badge/${c}/solid/text`, `feedback/${c}/on-base`],
        // solid: base fill → subtle tint on swap, so the ink darkens to `base`.
        ...REST.map((s) => [`chip/${c}/solid/text/${s}`, `feedback/${c}/on-base`]),
        ...SWAP.map((s) => [`chip/${c}/solid/text/${s}`, `feedback/${c}/base`]),
        // subtle: subtle tint → base fill on swap, so the ink lightens to `on-base`.
        ...SWAP.map((s) => [`chip/${c}/subtle/text/${s}`, `feedback/${c}/on-base`]),
        // outline stays transparent until it is selected, when it fills with `base`.
        [`chip/${c}/outline/text/selected`, `feedback/${c}/on-base`],
      ];
    }),
  ),
  // Brand does NOT swap. Its solid variant darkens on hover (`default` → `dark`) instead of
  // lightening the way a feedback chip does, so the ink stays white throughout; the subtle
  // variant stays pale throughout, so its ink stays dark. Mirroring the feedback swap here
  // put `brand/primary/dark` on `brand/primary/dark` — 1.00:1.
  ...Object.fromEntries(
    ['default', 'hover', 'focus', 'active'].flatMap((s) => [
      [`chip/brand/solid/text/${s}`, 'feedback/success/on-base'],
      [`chip/brand/subtle/text/${s}`, 'brand/primary/dark'],
    ]),
  ),
  // `selected` is the one state where a subtle or outline chip fills solid, so its ink
  // has to leave the dark step or it lands on `brand/primary/default` (1.64:1).
  'chip/brand/solid/text/selected': 'feedback/success/on-base',
  'chip/brand/subtle/text/selected': 'feedback/success/on-base',
  'chip/brand/outline/text/selected': 'feedback/success/on-base',

  // An in-range calendar day is a pale brand tint, not a disabled surface. Routing it
  // through `disabled/background` works in the Default theme by coincidence (#dde3fd) and
  // breaks in Dark, where that role is a dark grey and the dark-blue ink drops to 1.69:1.
  'calendar/day/background/in-range': 'brand/primary/light',

  // Neutral solid is the inverse-tone pill. Its fill flips with the surface, so a constant
  // white ink lands on a white pill (1.00:1) the moment the surface inverts. `background/default`
  // is the fill's complement by construction — the two are defined against each other in
  // every mirror — so the pair tracks the flip instead of fighting it.
  ...Object.fromEntries(
    ['default', 'hover', 'focus', 'active', 'selected'].flatMap((s) => [
      [`chip/neutral/solid/text/${s}`, 'background/default'],
      [`chip/neutral/outline/text/selected`, 'background/default'],
      [`chip/neutral/subtle/text/selected`, 'background/default'],
    ]),
  ),
  'badge/neutral/solid/text': 'background/default',
  // Brand and neutral solid inks deliberately stay on `feedback/success/on-base`.
  // It reads wrong and it is the one wart this refactor does not remove, but the
  // alternative is worse: `action/primary/on-base/default` FLIPS to #174ba0 on the
  // Inverse and Primary surfaces, while `brand/primary` does not flip at all — so a
  // brand badge would render blue ink on a blue fill. Every `*/on-base` role is #ffffff
  // in all eight combinations; this one is the only non-flipping white available.
  // The real fix is making `brand/*` surface-aware, which is its own change.

  // `action/primary/base/disabled` (#dde3fd) doubles as the resting brand-subtle fill.
  ...Object.fromEntries(
    ['background', 'border'].flatMap((p) =>
      ['default', 'focus'].map((s) => [`chip/brand/subtle/${p}/${s}`, 'brand/primary/light']),
    ),
  ),
  'badge/brand/subtle/background': 'brand/primary/light',
  'badge/brand/subtle/border': 'brand/primary/light',
  'chip/brand/outline/background/hover': 'brand/primary/light',
};
