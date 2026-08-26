// Emits the Plugin API payloads for the colour-role refactor, chunked under the 50 000-char
// `use_figma` limit.
//
//   node tools/token-migration/color-roles/generate.mjs
//
// Step order is not cosmetic. Aliases are re-pointed FIRST, while the old role names still
// exist, because a re-point names its target — then the renames carry both the roles and
// everything now pointing at them, because Figma keeps the variable `id` across a rename.
// Deleting comes last, and only touches variables nothing references any more.

import { mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { loadTokens } from '../lib/tokens.mjs';
import { TARGET_ROLES, DEPRECATED_KEPT, VALUE_SOURCE, NEW_ROLES, VALUE_OVERRIDES, MIRROR_VALUE_OVERRIDES } from './target.mjs';
import { ROLE_MAP, TOKEN_OVERRIDES, PROMOTE_TO_SURFACES } from './role-map.mjs';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const OUT = join(import.meta.dirname, 'out');
const { all } = loadTokens(join(ROOT, 'packages', 'foundations', 'src', 'figma-exports'));

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const MIRRORS = ['on-subtle', 'on-inverse', 'on-brand-primary'];
const surfaceRoles = new Set(
  all.filter((t) => t.collection === 'Surfaces' && t.path.startsWith('color.'))
    .map((t) => t.path.replace(/^color\./, '').replace(/\./g, '/')),
);

const write = (name, header, body) =>
  writeFileSync(join(OUT, name), `// ${header}\n\n${body}\n`);

// Splits a list of statements into files that stay under the payload limit.
function chunked(prefix, header, items, wrap, limit = 40000) {
  const files = [];
  let buf = [];
  const flush = () => {
    if (!buf.length) return;
    const n = String(files.length + 1).padStart(2, '0');
    write(`${prefix}-${n}.js`, `${header} — part ${n}`, wrap(buf));
    files.push(`${prefix}-${n}.js`);
    buf = [];
  };
  for (const it of items) {
    buf.push(it);
    if (wrap(buf).length > limit) {
      buf.pop();
      flush();
      buf.push(it);
    }
  }
  flush();
  return files;
}

// ── Step 01 — re-point every Components colour alias ────────────────────────────────────
// The target is named by TODAY's variable name (VALUE_SOURCE), because the renames have not
// happened yet. A target that resolves to a role which does not exist is a generator bug,
// so it throws here rather than producing a payload that half-applies.
const repoints = [];
for (const t of all) {
  if (t.collection !== 'Components' || !t.path.startsWith('color.')) continue;
  const short = t.path.replace(/^color\./, '').replace(/\./g, '/');
  const raw = typeof t.value === 'string' ? t.value : Object.values(t.value)[0];
  const m = /^\{Surfaces\.color\.(.+)\}$/.exec(String(raw ?? ''));
  if (!m) continue;
  const oldRole = m[1].replace(/\./g, '/');
  const newRole = TOKEN_OVERRIDES[short] ?? ROLE_MAP[oldRole];
  if (!newRole) throw new Error(`brak mapowania dla ${short} (${oldRole})`);
  const targetToday = VALUE_SOURCE[newRole] ?? newRole;
  if (!surfaceRoles.has(targetToday)) {
    throw new Error(`${short} → ${newRole} wskazuje na nieistniejącą dziś rolę ${targetToday}`);
  }
  if (targetToday === oldRole) continue; // already correct
  repoints.push([short, targetToday]);
}

chunked(
  '01-repoint',
  `Re-point ${repoints.length} Components colour aliases onto the roles that survive`,
  repoints,
  // Encoded as `token>role;…` rather than JSON: the pairs share long prefixes and the
  // payload travels through a 50 000-char limit, so halving it buys headroom for free.
  (items) => `const PAIRS = ${JSON.stringify(items.map((p) => p.join('>')).join(';'))}
  .split(';').map((s) => s.split('>'));

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const comps = cols.find((c) => c.name === 'Components');
const surf = cols.find((c) => c.name === 'Surfaces');
const byName = {};
for (const id of comps.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v) byName[v.name] = v;
}
const roleByName = {};
for (const id of surf.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v) roleByName[v.name] = v;
}
const mode = comps.modes[0].modeId;
const done = [];
const missing = [];
for (const [token, role] of PAIRS) {
  const t = byName['color/' + token];
  const r = roleByName['color/' + role];
  if (!t || !r) { missing.push([token, role, !t ? 'token' : 'role']); continue; }
  t.setValueForMode(mode, { type: 'VARIABLE_ALIAS', id: r.id });
  done.push(token);
}
return { repointed: done.length, expected: PAIRS.length, missing };`,
);

// ── Step 02 — rename, in two phases ─────────────────────────────────────────────────────
// One-phase renaming collides: `border/default` has to become `border/subtle` before
// `separator/foreground` can take the name `border/default`. Rather than reason about the
// ordering, every variable is parked under a unique temporary name first.
const renames = [];
for (const role of [...TARGET_ROLES]) {
  const src = VALUE_SOURCE[role];
  if (!src || src === role) continue;
  renames.push([`color/${src}`, `color/${role}`]);
  for (const m of MIRRORS) renames.push([`color/${m}/${src}`, `color/${m}/${role}`]);
}

write(
  '02b-rename.js',
  `Rename ${renames.length} variables in place — two phases, so colliding names cannot clash`,
  `const PAIRS = ${JSON.stringify(renames)};

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const targets = cols.filter((c) => c.name === 'Themes' || c.name === 'Surfaces');
const byName = {};
for (const c of targets) {
  for (const id of c.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (v) (byName[v.name] = byName[v.name] || []).push(v);
  }
}
// Phase 1 — park under a unique name so no rename can collide with a name still in use.
const parked = [];
const missing = [];
PAIRS.forEach(([from], i) => {
  const vs = byName[from];
  if (!vs || !vs.length) { missing.push(from); return; }
  for (const v of vs) { v.name = '_migrating/' + i; parked.push([i, v.id]); }
});
// Phase 2 — settle on the final names.
let renamed = 0;
for (const [i, id] of parked) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (!v) continue;
  v.name = PAIRS[i][1];
  renamed += 1;
}
return { renamed, expectedPairs: PAIRS.length, missing };`,
);

// ── Step 03 — new roles, and the promotion of selection/* into Surfaces ─────────────────
write(
  '03-new-roles.js',
  'Create the roles that have no source variable, and give selection/* a Surfaces counterpart',
  `const NEW = ${JSON.stringify(NEW_ROLES)};
const PROMOTE = ${JSON.stringify(PROMOTE_TO_SURFACES)};
const MIRRORS = ${JSON.stringify(MIRRORS)};

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const themes = cols.find((c) => c.name === 'Themes');
const surf = cols.find((c) => c.name === 'Surfaces');
const modeId = (c, n) => (c.modes.find((m) => m.name === n) || c.modes[0]).modeId;

const prims = {};
for (const c of cols) {
  for (const id of c.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (v) prims[c.name + '.' + v.name.replace(/\\//g, '.')] = v;
  }
}
const themeByName = {};
for (const id of themes.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v) themeByName[v.name] = v;
}
const surfByName = {};
for (const id of surf.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v) surfByName[v.name] = v;
}

const created = [];
// A new role needs its base row plus all three mirrors, or a surface switch would drop it.
for (const [role, primitive] of Object.entries(NEW)) {
  const p = prims[primitive];
  if (!p) { created.push(['MISSING PRIMITIVE', primitive]); continue; }
  for (const name of ['color/' + role, ...MIRRORS.map((m) => 'color/' + m + '/' + role)]) {
    if (themeByName[name]) continue;
    const v = figma.variables.createVariable(name, themes, 'COLOR');
    v.scopes = ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL', 'STROKE_COLOR'];
    for (const m of themes.modes) v.setValueForMode(m.modeId, { type: 'VARIABLE_ALIAS', id: p.id });
    themeByName[name] = v;
    created.push(['themes', name]);
  }
}
// The Surfaces row is what makes a role surface-aware: one alias per mode, each pointing at
// the matching Themes mirror.
const surfaceFor = (role) => {
  if (surfByName['color/' + role]) return null;
  const v = figma.variables.createVariable('color/' + role, surf, 'COLOR');
  v.scopes = ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL', 'STROKE_COLOR'];
  const map = { Default: 'color/' + role, Subtle: 'color/on-subtle/' + role, Inverse: 'color/on-inverse/' + role, Primary: 'color/on-brand-primary/' + role };
  for (const m of surf.modes) {
    const t = themeByName[map[m.name] || map.Default];
    if (t) v.setValueForMode(m.modeId, { type: 'VARIABLE_ALIAS', id: t.id });
  }
  surfByName['color/' + role] = v;
  return v;
};
for (const role of Object.keys(NEW)) if (surfaceFor(role)) created.push(['surfaces', role]);

// selection/* exists in Themes today with no Surfaces counterpart, so it is invisible to the
// surface system. Give it the mirrors it never had, then the Surfaces row.
for (const role of PROMOTE) {
  const base = themeByName['color/' + role];
  if (!base) { created.push(['MISSING THEMES', role]); continue; }
  for (const m of MIRRORS) {
    const name = 'color/' + m + '/' + role;
    if (themeByName[name]) continue;
    const v = figma.variables.createVariable(name, themes, 'COLOR');
    v.scopes = base.scopes;
    for (const mode of themes.modes) v.setValueForMode(mode.modeId, { type: 'VARIABLE_ALIAS', id: base.id });
    themeByName[name] = v;
    created.push(['themes', name]);
  }
  if (surfaceFor(role)) created.push(['surfaces', role]);
}
return { created: created.length, detail: created };`,
);

// ── Step 04 — re-value ──────────────────────────────────────────────────────────────────
const valueEdits = [];
for (const [role, byMode] of Object.entries(VALUE_OVERRIDES)) {
  for (const [mode, primitive] of Object.entries(byMode)) valueEdits.push([`color/${role}`, mode, primitive]);
}
for (const [path, byMode] of Object.entries(MIRROR_VALUE_OVERRIDES)) {
  const [mirror, ...rest] = path.split('/');
  const role = rest.join('/');
  const renamed = TARGET_ROLES.find((r) => (VALUE_SOURCE[r] ?? r) === role) ?? role;
  for (const [mode, primitive] of Object.entries(byMode)) {
    valueEdits.push([`color/${mirror}/${renamed}`, mode, primitive]);
  }
}

write(
  '04-revalue.js',
  `Re-value ${valueEdits.length} rows: the success base, and the three mirrors that are broken today`,
  `const EDITS = ${JSON.stringify(valueEdits)};

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const themes = cols.find((c) => c.name === 'Themes');
const byName = {};
for (const id of themes.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v) byName[v.name] = v;
}
const prims = {};
for (const c of cols) {
  for (const id of c.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (v) prims[c.name + '.' + v.name.replace(/\\//g, '.')] = v;
  }
}
const applied = [];
const missing = [];
for (const [name, modeName, primitive] of EDITS) {
  const v = byName[name];
  const p = prims[primitive];
  const mode = themes.modes.find((m) => m.name === modeName);
  if (!v || !p || !mode) { missing.push([name, modeName, primitive, !v ? 'var' : !p ? 'primitive' : 'mode']); continue; }
  v.setValueForMode(mode.modeId, { type: 'VARIABLE_ALIAS', id: p.id });
  applied.push([name, modeName]);
}
return { applied: applied.length, expected: EDITS.length, missing };`,
);

// ── Step 02a — delete what nothing points at ────────────────────────────────────────────
// This runs BEFORE the renames, not after, and the reason is a name collision rather than
// tidiness: `border/strong/default` has to become `border/strong`, but Figma cannot hold a
// variable named `color/border/strong` while `color/border/strong/disabled` still exists as
// its sibling group. Deleting first clears the sibling. Step 01 already moved every
// component alias off these roles, so by now nothing points at them.
//
// The keep-set is therefore expressed in TODAY's names — the renames have not happened yet.
const keepSurface = new Set([
  ...TARGET_ROLES.map((r) => VALUE_SOURCE[r] ?? r),
  ...DEPRECATED_KEPT,
]);
const keepThemes = new Set();
for (const r of keepSurface) {
  keepThemes.add(`color/${r}`);
  for (const m of MIRRORS) keepThemes.add(`color/${m}/${r}`);
}

write(
  '02a-cleanup.js',
  `Delete the folded roles — DRY RUN by default. ${keepSurface.size} Surfaces roles and ${keepThemes.size} Themes rows survive. Runs BEFORE the renames.`,
  `const DRY_RUN = true; // flip to false only after reading the dry run's report

const KEEP_SURFACE = new Set(${JSON.stringify([...keepSurface])});
const KEEP_THEMES = new Set(${JSON.stringify([...keepThemes])});

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const themes = cols.find((c) => c.name === 'Themes');
const surf = cols.find((c) => c.name === 'Surfaces');

const load = async (c) => {
  const out = [];
  for (const id of c.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (v) out.push(v);
  }
  return out;
};
const themeVars = await load(themes);
const surfVars = await load(surf);

const doomedSurface = surfVars.filter((v) => v.name.startsWith('color/') && !KEEP_SURFACE.has(v.name.slice(6)));
const doomedThemes = themeVars.filter((v) => v.name.startsWith('color/') && !KEEP_THEMES.has(v.name));
const doomedIds = new Set([...doomedSurface, ...doomedThemes].map((v) => v.id));

// A survivor that still aliases something on the way out would dangle. This is the check
// that matters: deleting is silent, and a dangling alias only shows up as a broken colour.
const dangling = [];
for (const v of [...themeVars, ...surfVars]) {
  if (doomedIds.has(v.id)) continue;
  for (const [mode, val] of Object.entries(v.valuesByMode || {})) {
    if (val && val.type === 'VARIABLE_ALIAS' && doomedIds.has(val.id)) {
      const t = await figma.variables.getVariableByIdAsync(val.id);
      dangling.push([v.name, mode, t ? t.name : val.id]);
    }
  }
}

if (DRY_RUN || dangling.length) {
  return {
    dryRun: true,
    blocked: dangling.length > 0,
    wouldDeleteSurfaces: doomedSurface.length,
    wouldDeleteThemes: doomedThemes.length,
    survivingSurfaces: surfVars.length - doomedSurface.length,
    survivingThemes: themeVars.length - doomedThemes.length,
    dangling: dangling.slice(0, 60),
    danglingTotal: dangling.length,
    sample: doomedSurface.slice(0, 20).map((v) => v.name),
  };
}

let removed = 0;
for (const v of [...doomedSurface, ...doomedThemes]) { v.remove(); removed += 1; }
return { removed, expected: doomedSurface.length + doomedThemes.length };`,
);

console.log(`Wygenerowano do ${OUT}:`);
for (const f of readdirSync(OUT).sort()) console.log(`  ${f}`);
console.log(`\n  re-pointów:      ${repoints.length}`);
console.log(`  renameów:        ${renames.length}`);
console.log(`  nowych ról:      ${Object.keys(NEW_ROLES).length} + ${PROMOTE_TO_SURFACES.length} promowane`);
console.log(`  zmian wartości:  ${valueEdits.length}`);
console.log(`  zostaje:         ${keepSurface.size} Surfaces / ${keepThemes.size} Themes`);
