// Proves the colour-role refactor before a single variable is touched in Figma.
//
//   node tools/token-migration/color-roles/validate.mjs
//   node tools/token-migration/color-roles/validate.mjs --drift   # full per-token drift list
//
// Three things it checks, in order of how badly each fails:
//   1. Totality  — every one of today's Surfaces roles maps somewhere, and every target
//                  is a role that actually survives. A gap here means step 06 would
//                  delete a role something still points at.
//   2. Shape     — every override key is a real Components token.
//   3. Drift     — re-resolves all 864 component-facing tokens in all 8 theme × surface
//                  combinations against the baseline. Everything that moves is listed.
//                  The CSS diff cannot show this; it never resolves a *combination*.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SURFACE_MODES, THEME_MODES, componentFacingTokens, loadTokens, resolve } from '../lib/tokens.mjs';
import { TARGET_ROLES, DEPRECATED_KEPT, VALUE_OVERRIDES, MIRROR_VALUE_OVERRIDES, VALUE_SOURCE } from './target.mjs';
import { ROLE_MAP, TOKEN_OVERRIDES, PROMOTE_TO_SURFACES } from './role-map.mjs';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const INPUT = join(ROOT, 'packages', 'foundations', 'src', 'figma-exports');
const BASELINE = join(import.meta.dirname, '..', 'snapshots', 'color-roles-baseline.json');

const { all, byKey } = loadTokens(INPUT);

const surfaceRoles = all
  .filter((t) => t.collection === 'Surfaces' && t.path.startsWith('color.'))
  .map((t) => t.path.replace(/^color\./, '').replace(/\./g, '/'));

const targetSet = new Set([...TARGET_ROLES, ...DEPRECATED_KEPT]);
const problems = [];

// 1 — totality
const promoted = new Set(PROMOTE_TO_SURFACES);
const unmapped = surfaceRoles.filter((r) => !ROLE_MAP[r] && !promoted.has(r));
if (unmapped.length) problems.push(['ROLE BEZ MAPOWANIA', unmapped]);

const roleSet = new Set(surfaceRoles);
const phantom = Object.keys(ROLE_MAP).filter((r) => !roleSet.has(r));
const themesColours = new Set(
  all
    .filter((t) => t.collection === 'Themes' && t.path.startsWith('color.'))
    .map((t) => t.path.replace(/^color\./, '').replace(/\./g, '/')),
);
const badPromotions = PROMOTE_TO_SURFACES.filter((r) => !themesColours.has(r) || roleSet.has(r));
if (badPromotions.length) problems.push(['PROMOCJA NIEMOŻLIWA', badPromotions]);
if (phantom.length) problems.push(['MAPOWANIE DLA NIEISTNIEJĄCEJ ROLI', phantom]);

const badTargets = [...new Set(Object.values(ROLE_MAP))].filter((t) => !targetSet.has(t));
if (badTargets.length) problems.push(['CEL SPOZA LISTY DOCELOWEJ', badTargets]);

// 2 — override shape
const componentPaths = new Set(
  all
    .filter((t) => t.collection === 'Components' && t.path.startsWith('color.'))
    .map((t) => t.path.replace(/^color\./, '').replace(/\./g, '/')),
);
const badOverrideKeys = Object.keys(TOKEN_OVERRIDES).filter((k) => !componentPaths.has(k));
if (badOverrideKeys.length) problems.push(['OVERRIDE DLA NIEISTNIEJĄCEGO TOKENU', badOverrideKeys]);

const badOverrideTargets = [...new Set(Object.values(TOKEN_OVERRIDES))].filter(
  (t) => !targetSet.has(t),
);
if (badOverrideTargets.length) problems.push(['OVERRIDE CELUJE POZA LISTĘ', badOverrideTargets]);

for (const [label, items] of problems) {
  console.error(`\n✗ ${label} (${items.length})`);
  for (const i of items.slice(0, 40)) console.error(`    ${i}`);
  if (items.length > 40) console.error(`    … i ${items.length - 40} więcej`);
}

const unusedTargets = TARGET_ROLES.filter(
  (t) => !Object.values(ROLE_MAP).includes(t) && !Object.values(TOKEN_OVERRIDES).includes(t),
);

console.log(`\nRole Surfaces dziś:        ${surfaceRoles.length}`);
console.log(`Role docelowe:             ${TARGET_ROLES.length} (+${DEPRECATED_KEPT.length} zachowana)`);
console.log(`Cele użyte w mapowaniu:    ${new Set(Object.values(ROLE_MAP)).size}`);
console.log(`Bez dzisiejszego konsumenta: ${unusedTargets.length}${unusedTargets.length ? ` — ${unusedTargets.join(', ')}` : ''}`);
console.log(`Promowane z Themes do Surfaces: ${PROMOTE_TO_SURFACES.length} — ${PROMOTE_TO_SURFACES.join(', ')}`);
console.log(`Overrides na poziomie tokenu: ${Object.keys(TOKEN_OVERRIDES).length}`);

if (problems.length) {
  console.error('\n✗ Mapowanie niekompletne — nie generuj skryptów Figmy.');
  process.exit(1);
}

// 3 — drift. Where a target role keeps a name that exists today it inherits that value;
// where it is a rename, VALUE_SOURCE names the role it takes its value from.

// `byKey` is a Map keyed `Collection.path` — indexing it like an object returns undefined
// for every lookup, which makes every comparison silently skip and the whole check report
// a clean zero. That is the exact failure this tool exists to catch, so it asserts below.
const roleValue = (role, theme, surface) => {
  const ov = VALUE_OVERRIDES[role];
  if (ov) return resolve(byKey, ov[theme] ?? ov.Default, { Themes: theme, Surfaces: surface });
  // A non-Default surface reads the role through its mirror, so a mirror repair has to be
  // applied here rather than on the base role.
  const mirror = { Subtle: 'on-subtle', Inverse: 'on-inverse', Primary: 'on-brand-primary' }[surface];
  const mv = mirror && MIRROR_VALUE_OVERRIDES[`${mirror}/${VALUE_SOURCE[role] ?? role}`];
  if (mv && mv[theme]) return resolve(byKey, mv[theme], { Themes: theme, Surfaces: surface });
  const src = VALUE_SOURCE[role] ?? role;
  const dotted = src.replace(/\//g, '.');
  const key = byKey.has(`Surfaces.color.${dotted}`)
    ? `Surfaces.color.${dotted}`
    : `Themes.color.${dotted}`; // selection/* is Themes-only until it is promoted
  if (!byKey.has(key)) return null; // brand-new role, no value today
  return resolve(byKey, key, { Themes: theme, Surfaces: surface });
};

// Self-check: prove the resolver still separates the surface axis. If every surface
// returns the Default value the comparison below is worthless no matter what it prints.
const probe = ['Default', 'Subtle', 'Inverse', 'Primary'].map((s) =>
  resolve(byKey, 'Surfaces.color.text.primary', { Themes: 'Default', Surfaces: s }),
);
if (new Set(probe).size < 2) {
  console.error(`\n✗ Resolver zwinął oś surface (${probe.join(', ')}) — check nic nie mierzy.`);
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
const combos = THEME_MODES.flatMap((t) => SURFACE_MODES.map((s) => [t, s]));
const tokens = componentFacingTokens(all);

const drift = [];
let compared = 0;
for (const t of tokens) {
  const short = t.path.replace(/^color\./, '').replace(/\./g, '/');
  if (!t.path.startsWith('color.')) continue;
  const before = baseline.values[t.path];
  if (!before) continue;

  // What this token points at after the refactor.
  const currentRef = typeof t.value === 'string' ? t.value : Object.values(t.value)[0];
  const m = /^\{Surfaces\.color\.(.+)\}$/.exec(String(currentRef ?? ''));
  if (!m) continue;
  const oldRole = m[1].replace(/\./g, '/');
  const newRole = TOKEN_OVERRIDES[short] ?? ROLE_MAP[oldRole];
  if (!newRole) continue;

  compared += 1;
  const after = combos.map(([th, su]) => roleValue(newRole, th, su));
  const moved = combos
    .map((c, i) => [c, before[i], after[i]])
    .filter(([, b, a]) => a !== null && String(b) !== String(a));
  if (moved.length) drift.push({ short, oldRole, newRole, moved });
}

if (compared === 0) {
  console.error('\n✗ Nie porównano ani jednego tokenu — mapowanie klucza jest zepsute.');
  process.exit(1);
}

console.log(`\nTokeny component-facing:   ${tokens.length}`);
console.log(`Porównane:                 ${compared}`);
console.log(`Tokeny ze zmianą wartości: ${drift.length}`);

const byPair = new Map();
for (const d of drift) {
  const k = `${d.oldRole} → ${d.newRole}`;
  byPair.set(k, (byPair.get(k) ?? 0) + 1);
}
console.log(`\n=== DRYF, zgrupowany po parze ról (${byPair.size}) ===`);
for (const [k, n] of [...byPair].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${k}`);
}

if (process.argv.includes('--drift')) {
  console.log('\n=== DRYF, per token ===');
  for (const d of drift) {
    console.log(`\n  ${d.short}`);
    console.log(`    ${d.oldRole} → ${d.newRole}`);
    for (const [[th, su], b, a] of d.moved) console.log(`      ${th}/${su}: ${b} → ${a}`);
  }
}
