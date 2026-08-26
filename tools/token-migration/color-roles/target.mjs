// The 63 colour roles the Themes/Surfaces refactor keeps. Everything else in `color/*`
// is folded into one of these and then deleted.
//
// Names are the *new* names. `role-map.mjs` maps every one of today's 138 Surfaces roles
// onto one of them; `validate.mjs` proves the mapping is total and reports value drift.

export const TARGET_ROLES = [
  // Brand — default/light/dark per tier. light is the subtle fill, dark the emphasis step.
  'brand/primary/default', 'brand/primary/light', 'brand/primary/dark',
  'brand/secondary/default', 'brand/secondary/light', 'brand/secondary/dark',
  'brand/tertiary/default', 'brand/tertiary/light', 'brand/tertiary/dark',

  // Background — page and container surfaces. `transparent`/`scrim` keep the two
  // fully-transparent utility roles inside Surfaces so Components never reaches Primitives.
  'background/default', 'background/sunken', 'background/subtle', 'background/inverse',
  'background/overlay', 'background/brand-primary', 'background/tint',
  'background/transparent', 'background/scrim',

  'text/primary', 'text/secondary', 'text/muted', 'text/placeholder', 'text/brand',

  // Disabled — one flat tone for every disabled fill, one for every disabled ink.
  'disabled/background', 'disabled/text',

  'icon/default',

  // Border — four steps, light to dark. Each has a live consumer today, so the ramp
  // costs no value drift: subtle #ededed, default #9fa0a1, strong #717374, stronger #2d2f31.
  'border/subtle', 'border/default', 'border/strong', 'border/stronger',

  'ring/default',

  // Feedback — base fill, subtle tint, ink on the base fill.
  'feedback/success/base', 'feedback/success/subtle', 'feedback/success/on-base',
  'feedback/info/base', 'feedback/info/subtle', 'feedback/info/on-base',
  'feedback/warning/base', 'feedback/warning/subtle', 'feedback/warning/on-base',
  'feedback/error/base', 'feedback/error/subtle', 'feedback/error/on-base',

  // Action — only default and hover survive; components drive hover/active/focus from
  // the one `hover` token, and both disabled leaves fold into `disabled/*`.
  'action/primary/base/default', 'action/primary/base/hover',
  'action/primary/on-base/default', 'action/primary/on-base/hover',
  'action/secondary/base/default', 'action/secondary/base/hover',
  'action/secondary/on-base/default', 'action/secondary/on-base/hover',
  'action/tertiary/base/default', 'action/tertiary/base/hover',
  'action/tertiary/on-base/default', 'action/tertiary/on-base/hover',
  'action/danger/base/default', 'action/danger/base/hover',
  'action/danger/on-base/default', 'action/danger/on-base/hover',

  'link/default', 'link/hover',
  'selection/background', 'selection/text',
];

// Kept past the refactor despite not being in the target list: 32 bindings on Select and
// Combobox instance sub-nodes point at it, where setBoundVariable is a silent no-op.
// Re-valued to alias `action/primary/base/hover`, so it is visually indistinguishable.
// Removing it needs a manual pass in the Figma UI.
export const DEPRECATED_KEPT = ['action/primary/base/active'];

// Roles whose *value* the refactor changes, on top of the folding. Keyed by role, valued
// by the primitive each Themes mode points at.
//
// Only one entry, and it pays for itself twice: `feedback/success/base` is both the solid
// fill under white ink (3.58:1 today) and — once `success/subtle/text` folds into it — the
// ink on the subtle tint (would be 3.41:1). `green/950` is the single step in the ramp that
// clears 4.5:1 in both directions (4.98:1 and 4.74:1), so darkening it restores today's
// subtle-text contrast instead of losing it, and fixes the solid fill that was already
// failing. The same move does not exist for warning — see docs.
export const VALUE_OVERRIDES = {
  'feedback/success/base': { Default: 'Primitives Colors.green.950', Dark: 'Primitives Colors.green.950' },
};

// Mirror values the refactor repairs. Each is broken *today*, independently of any folding —
// proven by resolving the generic family against itself:
//
//   Dark/Inverse   text/secondary  #2d2f31  on  background/subtle  #4f5153  → 1.69:1
//   Dark/Inverse   text/secondary  #2d2f31  on  background/sunken  #717374  → 2.82:1
//   Default/Primary background/default #174ba0 on background/inverse #151419 → 2.23:1
//
// The cause is visible in the data: `on-inverse/background/{sunken,subtle}` carry the SAME
// value in Default and Dark, so when the Dark theme flips the ink to a dark tone the surface
// under it does not flip with it. Today the `filled/*` family masks this by carrying its own
// surface-aware copies; folding those away exposes it, so the refactor has to fix it rather
// than inherit it.
export const MIRROR_VALUE_OVERRIDES = {
  // Dark + Inverse is a LIGHT context — the inverse of a dark page. These follow the light
  // steps their non-mirrored counterparts use.
  'on-inverse/background/sunken': { Dark: 'Primitives Colors.gray.100' },
  'on-inverse/background/subtle': { Dark: 'Primitives Colors.gray.200' },
  // An inverse-tone pill on the brand surface has to contrast with the brand fill, not
  // approximate it. Dark mode already resolves to white here; Default did not.
  'on-brand-primary/background/inverse': { Default: 'Primitives Colors.white.1000' },
};

// Which of today's variables becomes each renamed role. This is the hinge of the whole
// migration: renaming in place keeps the Figma variable `id`, so every binding follows the
// change on its own — including the ~1 800 on instance sub-nodes that `setBoundVariable`
// cannot rewrite. A role missing here keeps its own name.
export const VALUE_SOURCE = {
  'border/subtle': 'border/default',
  'border/default': 'separator/foreground',
  'border/strong': 'border/strong/default',
  'border/stronger': 'border/strong/hover',
  'brand/primary/default': 'brand/primary',
  'brand/primary/light': 'action/primary/base/disabled',
  'brand/primary/dark': 'brand/solid/background/hover',
  'brand/secondary/default': 'brand/secondary',
  'brand/tertiary/default': 'brand/tertiary',
  'background/transparent': 'transparent',
  'background/scrim': 'transparent-black',
  'text/placeholder': 'outline/placeholder/default',
  'disabled/background': 'disabled/surface',
  'disabled/text': 'filled/text/disabled',
};

// Roles with no source variable at all — created from scratch, valued from primitives.
// The brand tiers are capacity for client forks; `selection/*` is promoted out of Themes,
// where it has lived without a Surfaces counterpart (and so without surface awareness).
export const NEW_ROLES = {
  'brand/secondary/light': 'Primitives Colors.brand.secondary.200',
  'brand/secondary/dark': 'Primitives Colors.brand.secondary.600',
  'brand/tertiary/light': 'Primitives Colors.gray.100',
  'brand/tertiary/dark': 'Primitives Colors.gray.600',
};

// ── Surface-aware roles ─────────────────────────────────────────────────────────────────
//
// Folding a surface-aware role into a constant one is what broke the outline chips, the
// field labels and the switch track: the old set carried `*/outline/text/default` and the
// `filled/*` family precisely so a coloured ink could flip with the page. With those gone,
// the surviving role has to do the flipping itself.
//
// Which cell is light and which is dark comes from the resolved luminance of
// `background/default`, not from the mode's name — `on-inverse` is DARK under the Default
// theme and LIGHT under Dark, because inverting a dark page yields a light one.
export const CONTEXT = {
  '': { Default: 'light', Dark: 'dark' },
  'on-subtle': { Default: 'light', Dark: 'dark' },
  'on-inverse': { Default: 'dark', Dark: 'light' },
  'on-brand-primary': { Default: 'dark', Dark: 'dark' },
};

// `base` does double duty — the solid fill AND the ink on `subtle` and on the page — so the
// two contexts need opposite luminance. Ramp steps chosen against the frontier: h/300 keeps
// the hue legible (h/50 scores higher but renders every state near-white), text on the pill
// lands ~9:1 and ink straight on the page ~6.8:1. The pill itself only clears ~1.2:1 against
// a near-black page; that is inherent to a tinted container in dark mode and is not a text
// contrast, but it IS a visible change from today's near-white pill on inverse surfaces.
export const FEEDBACK_RAMP = {
  success: 'green', info: 'blue', warning: 'orange', error: 'red',
};
export const FEEDBACK_STEPS = {
  light: { base: { success: '950', info: '900', warning: '800', error: '900' }, subtle: '100', onBase: null },
  dark: { base: '300', subtle: '1000', onBase: '1000' },
};

// The border ramp had the same defect for a simpler reason: it is the Switch track as well
// as the field outline, and a constant mid-grey disappears on a dark surface.
export const BORDER_STEPS = {
  light: { 'border/strong': 'gray.600', 'border/stronger': 'gray.800' },
  dark: { 'border/strong': 'gray.500', 'border/stronger': 'gray.300' },
};

// Stragglers of the same kind: a role that is dark enough for the page it was designed
// against, and too dark for a lighter one in the same theme. brand.primary/400 reads 3.6:1
// on the Dark theme's own page and 2.63:1 once the Subtle surface lifts it to #2d2f31.
// The on-inverse mirror moves the opposite way for the same reason: under the Dark theme it
// describes a LIGHT page, so lifting the base value drags it along and lands #6b92f7 on white.
export const EXTRA_VALUE_EDITS = [
  ['color/text/brand', 'Dark', 'brand.primary.300'],
  ['color/on-subtle/text/brand', 'Dark', 'brand.primary.300'],
  ['color/on-inverse/text/brand', 'Dark', 'brand.primary.500'],
];
