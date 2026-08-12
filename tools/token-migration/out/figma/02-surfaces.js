// [Core] Foundations — step 02: expose the new roles in the Surfaces collection.
//
// One variable per role, four modes, each aliasing the matching Themes mirror. This is the
// existing Surfaces convention unchanged — it just operates on 138 roles now.
// Idempotent: safe to re-run.

const ROLE_NAMES = [
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
];

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

for (const name of ROLE_NAMES) {
  const varName = 'color/' + name;
  try {
    const { v, created } = ensureVar(surfaces, varName, 'COLOR');
    const src = findVar('Themes', varName);
    if (src) v.scopes = src.scopes;
    for (const [surfaceMode, prefix] of [
      ['Default', ''],
      ['Subtle', 'on-subtle/'],
      ['Inverse', 'on-inverse/'],
      ['Primary', 'on-brand-primary/'],
    ]) {
      const target = findVar('Themes', 'color/' + prefix + name);
      if (!target) {
        report.errors.push(varName + ' → missing Themes mirror for ' + surfaceMode);
        continue;
      }
      v.setValueForMode(modeId(surfaces, surfaceMode), alias(target));
    }
    (created ? report.created : report.updated).push(varName);
  } catch (e) {
    report.errors.push(varName + ' → ' + e.message);
  }
}

return {
  created: report.created.length,
  updated: report.updated.length,
  skipped: report.skipped.length,
  errors: report.errors.slice(0, 20),
  errorCount: report.errors.length,
  createdNodeIds: report.created.slice(0, 50),
};
