// [Core] Foundations — step 05: re-point surviving aliases away from doomed tokens.
//
// Step 01 copies each new role's value verbatim from the token it was derived from, which is
// what makes it value-preserving. The side effect: Themes aliases another Themes variable in
// 2448 places, so a mirror like color/on-subtle/transparent inherited an alias pointing at
// color/control/outline/background/default — a component token step 06 deletes.
//
// Left alone that is 131 dangling references. This re-points each to the equivalent role and
// asserts the resolved value did not move. Needs no mapping data: the Components entry of the
// same bare name already aliases exactly the role in question.
//
// Run after step 03, before step 06.

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
const KEEP_THEMES_ONLY = new Set(['selection/background', 'selection/text']);
const MIRROR_PREFIXES = ['on-subtle/', 'on-inverse/', 'on-brand-primary/'];
const splitName = (name) => {
  const n = name.replace(/^color\//, '');
  for (const p of MIRROR_PREFIXES)
    if (n.indexOf(p) === 0) return { prefix: p, bare: n.slice(p.length) };
  return { prefix: '', bare: n };
};

const colls = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const nameOfColl = new Map(colls.map((c) => [c.id, c.name]));
const byId = new Map(vars.map((v) => [v.id, v]));
const themes = colls.find((c) => c.name === 'Themes');
const surfaces = colls.find((c) => c.name === 'Surfaces');
const components = colls.find((c) => c.name === 'Components');
if (!themes || !surfaces || !components) throw new Error('run steps 01–03 first');
const themesByName = new Map(
  vars.filter((v) => v.variableCollectionId === themes.id).map((v) => [v.name, v]),
);
const compByName = new Map(
  vars.filter((v) => v.variableCollectionId === components.id).map((v) => [v.name, v]),
);
const compMode = components.modes[0].modeId;

const doomedIds = new Set();
for (const v of vars) {
  const cn = nameOfColl.get(v.variableCollectionId);
  if (cn !== 'Themes' && cn !== 'Surfaces') continue;
  if (v.name.indexOf('color/') !== 0) continue;
  const { bare } = splitName(v.name);
  if (ROLE_NAMES.has(bare) || KEEP_THEMES_ONLY.has(bare)) continue;
  doomedIds.add(v.id);
}

const roleFor = (doomedName) => {
  const { bare } = splitName(doomedName);
  const comp = compByName.get('color/' + bare);
  if (!comp) return null;
  const a = comp.valuesByMode[compMode];
  if (!a || a.type !== 'VARIABLE_ALIAS') return null;
  const surfVar = byId.get(a.id);
  return surfVar ? surfVar.name.replace(/^color\//, '') : null;
};

const resolveVar = (v, tm, sm, d) => {
  d = d || 0;
  if (!v || d > 14) return '<deep>';
  const coll = colls.find((c) => c.id === v.variableCollectionId);
  const want = coll.name === 'Themes' ? tm : coll.name === 'Surfaces' ? sm : null;
  const mId = want && v.valuesByMode[want] !== undefined ? want : coll.modes[0].modeId;
  const val = v.valuesByMode[mId];
  if (val && val.type === 'VARIABLE_ALIAS') return resolveVar(byId.get(val.id), tm, sm, d + 1);
  if (val && typeof val === 'object' && 'r' in val) {
    const h = (n) =>
      Math.round(n * 255)
        .toString(16)
        .padStart(2, '0');
    const a = val.a === undefined ? 1 : val.a;
    return h(val.r) + h(val.g) + h(val.b) + (a === 1 ? '' : ':' + a.toFixed(2));
  }
  return String(val);
};
const COMBOS = [];
for (const t of themes.modes) for (const s of surfaces.modes) COMBOS.push([t.modeId, s.modeId]);
const snapshot = (v) => COMBOS.map(([t, s]) => resolveVar(v, t, s)).join('~');

const fixes = [],
  failures = [],
  drift = [];
for (const v of vars) {
  if (doomedIds.has(v.id)) continue;
  for (const [mId, val] of Object.entries(v.valuesByMode)) {
    if (!val || val.type !== 'VARIABLE_ALIAS' || !doomedIds.has(val.id)) continue;
    const doomedVar = byId.get(val.id);
    const role = roleFor(doomedVar.name);
    if (!role) {
      failures.push(v.name + ' → ' + doomedVar.name + ' (no role)');
      continue;
    }
    const { prefix } = splitName(doomedVar.name);
    const replacement = themesByName.get('color/' + prefix + role);
    if (!replacement) {
      failures.push(v.name + ' → missing color/' + prefix + role);
      continue;
    }
    const before = snapshot(v);
    v.setValueForMode(mId, { type: 'VARIABLE_ALIAS', id: replacement.id });
    if (snapshot(v) !== before) drift.push(v.name);
    fixes.push(v.name + ' → color/' + prefix + role);
  }
}

return {
  repaired: fixes.length,
  valueDrift: drift.length,
  failures: failures.length,
  failureSample: failures.slice(0, 10),
  sample: fixes.slice(0, 8),
  mutatedNodeIds: fixes.slice(0, 50),
  verdict:
    drift.length === 0 && failures.length === 0 ? 'REPAIRED, NO VALUE CHANGED' : 'NEEDS REVIEW',
};
