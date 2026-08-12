// [Core] Foundations — step 01.1/1: create the new semantic roles.
//
// Each role is created in Themes as `color/<name>` plus three mirrors
// (`color/on-subtle/<name>`, `color/on-inverse/<name>`, `color/on-brand-primary/<name>`),
// which is the same mirror convention the existing generic roles already use — only now it
// carries 138 roles instead of 797 component tokens.
//
// Each entry is [roleName, sampleToken] — a token that already has exactly the behaviour the
// role is meant to carry. The script copies that token's values instead of embedding them, so
// the result is value-preserving by construction: no hex round-trip, nothing to drift.
// Idempotent: safe to re-run.

const ROLES = [
  ['transparent', 'control/outline/background/default'],
  ['neutral/solid/background/selected', 'badge/neutral/solid/background'],
  ['disabled/surface', 'control/outline/background/disabled'],
  ['outline/placeholder/default', 'control/outline/placeholder/default'],
  ['filled/placeholder/default', 'control/filled/placeholder/default'],
  ['checked/base/hover', 'checkbox/checked/background/hover'],
  ['outline/background/active', 'button/outline/background/active'],
  ['checked/mark/default', 'checkbox/checked/mark/default'],
  ['brand/subtle/text/default', 'badge/brand/subtle/text'],
  ['neutral/solid/background/hover', 'chip/neutral/solid/background/hover'],
  ['brand/solid/background/hover', 'chip/brand/solid/background/hover'],
  ['success/solid/background/hover', 'chip/success/solid/background/hover'],
  ['warning/solid/background/hover', 'chip/warning/solid/background/hover'],
  ['error/solid/background/hover', 'chip/error/solid/background/hover'],
  ['info/solid/background/hover', 'chip/info/solid/background/hover'],
  ['transparent-black', 'button/ghost/separator/default'],
  ['neutral/subtle/text/default', 'badge/neutral/subtle/text'],
  ['success/subtle/text/default', 'badge/success/subtle/text'],
  ['warning/subtle/text/default', 'badge/warning/subtle/text'],
  ['info/subtle/text/default', 'badge/info/subtle/text'],
  ['neutral/subtle/base/hover', 'chip/neutral/subtle/background/hover'],
  ['outline/label/hover', 'control/outline/label/hover'],
  ['filled/text/default', 'control/filled/text/default'],
  ['border/strong/hover', 'checkbox/border/hover'],
  ['neutral/outline/border/default', 'chip/neutral/outline/border/default'],
  ['brand/outline/text/default', 'chip/brand/outline/text/default'],
  ['success/outline/text/default', 'chip/success/outline/text/default'],
  ['warning/outline/text/default', 'chip/warning/outline/text/default'],
  ['error/outline/text/default', 'chip/error/outline/text/default'],
  ['info/outline/text/default', 'chip/info/outline/text/default'],
  ['track/default', 'switch/track/default'],
  ['track/hover', 'switch/track/hover'],
  ['outline/text/default', 'control/outline/text/default'],
  ['filled/text/disabled', 'control/filled/text/disabled'],
  ['ghost/text/active', 'button/ghost/text/active'],
  ['brand/subtle/background/hover', 'chip/brand/subtle/background/hover'],
  ['success/subtle/background/hover', 'chip/success/subtle/background/hover'],
  ['warning/subtle/background/hover', 'chip/warning/subtle/background/hover'],
  ['error/subtle/background/hover', 'chip/error/subtle/background/hover'],
  ['info/subtle/background/hover', 'chip/info/subtle/background/hover'],
  ['outline/border/hover', 'control/outline/border/hover'],
  ['outline/label/default', 'control/outline/label/default'],
  ['filled/background/hover', 'control/filled/background/hover'],
  ['filled/background/success', 'control/filled/background/success'],
  ['filled/border/hover', 'control/filled/border/hover'],
  ['filled/text/error', 'control/filled/text/error'],
  ['border/strong/default', 'checkbox/border/default'],
  ['border/strong/disabled', 'checkbox/border/disabled'],
  ['checked/background/default', 'checkbox/checked/background/default'],
  ['checked/border/default', 'checkbox/checked/border/default'],
  ['brand/subtle/background/active', 'chip/brand/subtle/background/active'],
  ['success/subtle/background/active', 'chip/success/subtle/background/active'],
  ['warning/subtle/background/active', 'chip/warning/subtle/background/active'],
  ['error/subtle/background/active', 'chip/error/subtle/background/active'],
  ['info/subtle/background/active', 'chip/info/subtle/background/active'],
  ['track/disabled', 'switch/track/disabled'],
  ['outline/border/default', 'control/outline/border/default'],
  ['outline/border/disabled', 'control/outline/border/disabled'],
  ['outline/text/hover', 'control/outline/text/hover'],
  ['outline/text/error', 'control/outline/text/error'],
  ['outline/placeholder/disabled', 'control/outline/placeholder/disabled'],
  ['outline/icon/error', 'control/outline/icon/error'],
  ['filled/background/default', 'control/filled/background/default'],
  ['filled/background/disabled', 'control/filled/background/disabled'],
  ['filled/border/default', 'control/filled/border/default'],
  ['filled/border/disabled', 'control/filled/border/disabled'],
  ['separator/foreground', 'breadcrumbs/separator/foreground'],
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
const THEME_MODES = ['Default', 'Dark'];
const byId = new Map(vars.map((v) => [v.id, v]));

for (const [roleName, sample] of ROLES) {
  // The sample lives in Surfaces; each of its surface modes aliases one Themes mirror.
  const src = findVar('Surfaces', 'color/' + sample);
  if (!src) {
    report.errors.push(roleName + ' → missing sample token color/' + sample);
    continue;
  }

  for (const [surface, prefix] of [
    ['Default', ''],
    ['Subtle', 'on-subtle/'],
    ['Inverse', 'on-inverse/'],
    ['Primary', 'on-brand-primary/'],
  ]) {
    const name = 'color/' + prefix + roleName;
    try {
      const srcAlias = src.valuesByMode[modeId(surfaces, surface)];
      if (!srcAlias || srcAlias.type !== 'VARIABLE_ALIAS') {
        report.errors.push(name + ' → sample has no alias in surface mode ' + surface);
        continue;
      }
      const mirror = byId.get(srcAlias.id);
      if (!mirror) {
        report.errors.push(name + ' → sample mirror not found for ' + surface);
        continue;
      }

      const { v, created } = ensureVar(themes, name, 'COLOR');
      v.scopes = mirror.scopes;
      for (const theme of THEME_MODES) {
        const mId = modeId(themes, theme);
        // Copy verbatim — an alias stays the same alias, a raw colour stays the same colour.
        v.setValueForMode(mId, mirror.valuesByMode[mId]);
      }
      (created ? report.created : report.updated).push(name);
    } catch (e) {
      report.errors.push(name + ' → ' + e.message);
    }
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
