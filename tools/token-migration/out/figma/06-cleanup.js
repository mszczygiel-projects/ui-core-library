// [Core] Foundations — step 06: delete the superseded variables. RUN LAST.
//
// Only after step 04 reports every page rebound and step 05 reports zero dangling aliases and the snapshot oracle is green on a fresh
// export. Deleting first would strand the bindings in [Core] UI Library.
//
// Removes:
//   • Themes  — every colour variable that is not a role (the per-component rows)
//   • Themes  — every on-*/ mirror of a non-role
//   • Surfaces— every colour variable that is not a role
//
// DRY_RUN = true only reports what would go. Flip it once the list looks right.

const DRY_RUN = true;
const ROLE_NAMES = new Set([
  'brand/primary',
  'brand/secondary',
  'brand/tertiary',
  'background/default',
  'background/sunken',
  'background/subtle',
  'background/inverse',
  'background/overlay',
  'background/brand-primary',
  'background/tint',
  'text/primary',
  'text/secondary',
  'text/muted',
  'text/brand',
  'icon/default',
  'border/default',
  'ring/default',
  'link/default',
  'link/hover',
  'feedback/success/base',
  'feedback/success/subtle',
  'feedback/success/on-base',
  'feedback/info/base',
  'feedback/info/subtle',
  'feedback/info/on-base',
  'feedback/warning/base',
  'feedback/warning/subtle',
  'feedback/warning/on-base',
  'feedback/error/base',
  'feedback/error/subtle',
  'feedback/error/on-base',
  'action/primary/base/default',
  'action/primary/base/hover',
  'action/primary/base/focus',
  'action/primary/base/active',
  'action/primary/base/disabled',
  'action/primary/on-base/default',
  'action/primary/on-base/hover',
  'action/primary/on-base/focus',
  'action/primary/on-base/active',
  'action/primary/on-base/disabled',
  'action/secondary/base/default',
  'action/secondary/base/hover',
  'action/secondary/base/focus',
  'action/secondary/base/active',
  'action/secondary/base/disabled',
  'action/secondary/on-base/default',
  'action/secondary/on-base/hover',
  'action/secondary/on-base/focus',
  'action/secondary/on-base/active',
  'action/secondary/on-base/disabled',
  'action/tertiary/base/default',
  'action/tertiary/base/hover',
  'action/tertiary/base/focus',
  'action/tertiary/base/active',
  'action/tertiary/base/disabled',
  'action/tertiary/on-base/default',
  'action/tertiary/on-base/hover',
  'action/tertiary/on-base/focus',
  'action/tertiary/on-base/active',
  'action/tertiary/on-base/disabled',
  'action/danger/base/default',
  'action/danger/base/hover',
  'action/danger/base/focus',
  'action/danger/base/active',
  'action/danger/base/disabled',
  'action/danger/on-base/default',
  'action/danger/on-base/hover',
  'action/danger/on-base/focus',
  'action/danger/on-base/active',
  'action/danger/on-base/disabled',
  'transparent',
  'neutral/solid/background/selected',
  'disabled/surface',
  'outline/placeholder/default',
  'filled/placeholder/default',
  'checked/base/hover',
  'outline/background/active',
  'checked/mark/default',
  'brand/subtle/text/default',
  'neutral/solid/background/hover',
  'brand/solid/background/hover',
  'success/solid/background/hover',
  'warning/solid/background/hover',
  'error/solid/background/hover',
  'info/solid/background/hover',
  'transparent-black',
  'neutral/subtle/text/default',
  'success/subtle/text/default',
  'warning/subtle/text/default',
  'info/subtle/text/default',
  'neutral/subtle/base/hover',
  'outline/label/hover',
  'filled/text/default',
  'border/strong/hover',
  'neutral/outline/border/default',
  'brand/outline/text/default',
  'success/outline/text/default',
  'warning/outline/text/default',
  'error/outline/text/default',
  'info/outline/text/default',
  'track/default',
  'track/hover',
  'outline/text/default',
  'filled/text/disabled',
  'ghost/text/active',
  'brand/subtle/background/hover',
  'success/subtle/background/hover',
  'warning/subtle/background/hover',
  'error/subtle/background/hover',
  'info/subtle/background/hover',
  'outline/border/hover',
  'outline/label/default',
  'filled/background/hover',
  'filled/background/success',
  'filled/border/hover',
  'filled/text/error',
  'border/strong/default',
  'border/strong/disabled',
  'checked/background/default',
  'checked/border/default',
  'brand/subtle/background/active',
  'success/subtle/background/active',
  'warning/subtle/background/active',
  'error/subtle/background/active',
  'info/subtle/background/active',
  'track/disabled',
  'outline/border/default',
  'outline/border/disabled',
  'outline/text/hover',
  'outline/text/error',
  'outline/placeholder/disabled',
  'outline/icon/error',
  'filled/background/default',
  'filled/background/disabled',
  'filled/border/default',
  'filled/border/disabled',
  'separator/foreground',
]);

// Themes-only colour tokens: no Surfaces counterpart, so they are neither roles nor
// component tokens, but they are live (reset.css styles ::selection from them).
const KEEP_THEMES_ONLY = new Set(['selection/background', 'selection/text']);

// ─── helpers ───────────────────────────────────────────────────────────────
const colls = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const collByName = new Map(colls.map((c) => [c.name, c]));
const key = (collectionId, name) => collectionId + '::' + name;
const varIndex = new Map(vars.map((v) => [key(v.variableCollectionId, v.name), v]));

const modeId = (coll, modeName) => {
  const m = coll.modes.find((x) => x.name === modeName);
  if (!m) throw new Error('missing mode "' + modeName + '" in collection ' + coll.name);
  return m.modeId;
};

const findVar = (collName, name) => {
  const c = collByName.get(collName);
  return c ? varIndex.get(key(c.id, name)) : undefined;
};

// Idempotent: re-running a chunk must not create a second variable with the same name.
const ensureVar = (coll, name, type) => {
  const existing = varIndex.get(key(coll.id, name));
  if (existing) return { v: existing, created: false };
  const v = figma.variables.createVariable(name, coll, type);
  varIndex.set(key(coll.id, name), v);
  return { v, created: true };
};

const alias = (v) => ({ type: 'VARIABLE_ALIAS', id: v.id });
const report = { created: [], updated: [], skipped: [], errors: [] };

const themes = collByName.get('Themes');
const surfaces = collByName.get('Surfaces');
if (!themes || !surfaces) throw new Error('missing Themes or Surfaces collection');

const MIRROR_PREFIXES = ['on-subtle/', 'on-inverse/', 'on-brand-primary/'];

/** Strips `color/` and any mirror prefix, leaving the bare role-or-component name. */
const bareName = (name) => {
  let n = name.replace(/^color\//, '');
  for (const p of MIRROR_PREFIXES) if (n.indexOf(p) === 0) n = n.slice(p.length);
  return n;
};

const doomed = [];
for (const v of vars) {
  const inThemes = v.variableCollectionId === themes.id;
  const inSurfaces = v.variableCollectionId === surfaces.id;
  if (!inThemes && !inSurfaces) continue;
  if (v.name.indexOf('color/') !== 0) continue; // typography/radius/ring stay
  const bare = bareName(v.name);
  if (ROLE_NAMES.has(bare)) continue; // roles stay
  if (KEEP_THEMES_ONLY.has(bare)) continue; // Themes-only live tokens stay
  doomed.push(v);
}

if (!DRY_RUN) {
  for (const v of doomed) {
    try {
      v.remove();
      report.created.push(v.name);
    } catch (e) {
      report.errors.push(v.name + ' → ' + e.message);
    }
  }
}

return {
  dryRun: DRY_RUN,
  wouldRemove: doomed.length,
  removed: DRY_RUN ? 0 : report.created.length,
  sample: doomed.slice(0, 30).map((v) => v.name),
  errorCount: report.errors.length,
  errors: report.errors.slice(0, 20),
};
