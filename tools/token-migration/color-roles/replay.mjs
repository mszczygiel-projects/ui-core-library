// Replays the Figma migration onto the committed Luckino exports, so the JSON in the repo
// matches the file without a manual re-export. `verify.mjs` then checks the result against
// Figma's own resolution — structural equality is not the claim, equal colours are.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TARGET_ROLES, DEPRECATED_KEPT, VALUE_SOURCE, NEW_ROLES, VALUE_OVERRIDES, MIRROR_VALUE_OVERRIDES } from './target.mjs';
import { ROLE_MAP, TOKEN_OVERRIDES, PROMOTE_TO_SURFACES } from './role-map.mjs';

const DIR = join(import.meta.dirname, '..', '..', '..', 'packages', 'foundations', 'src', 'figma-exports');
const MIRRORS = ['on-subtle', 'on-inverse', 'on-brand-primary'];
const read = (f) => JSON.parse(readFileSync(join(DIR, f), 'utf8'));

// ── flat <-> nested ─────────────────────────────────────────────────────────────────────
function flatten(node, prefix, out) {
  for (const [k, v] of Object.entries(node)) {
    if (v && typeof v === 'object' && '$value' in v) out[[...prefix, k].join('/')] = v;
    else if (v && typeof v === 'object') flatten(v, [...prefix, k], out);
  }
  return out;
}
function nest(flat) {
  const root = {};
  for (const [path, leaf] of Object.entries(flat)) {
    const seg = path.split('/');
    let cur = root;
    for (const s of seg.slice(0, -1)) cur = cur[s] = cur[s] || {};
    cur[seg.at(-1)] = leaf;
  }
  return root;
}

const RENAMES = Object.fromEntries(
  TARGET_ROLES.filter((r) => VALUE_SOURCE[r] && VALUE_SOURCE[r] !== r).map((r) => [VALUE_SOURCE[r], r]),
);
const KEEP = new Set([...TARGET_ROLES.map((r) => VALUE_SOURCE[r] ?? r), ...DEPRECATED_KEPT]);

// role (today's name) -> the survivor that replaces it, in today's names
const REPAIR = {};
for (const [src, tgt] of Object.entries(ROLE_MAP)) {
  if (KEEP.has(src)) continue;
  REPAIR[src] = VALUE_SOURCE[tgt] ?? tgt;
}

const finalName = (todayRole) => RENAMES[todayRole] ?? todayRole;
const splitMirror = (role) => {
  for (const m of MIRRORS) if (role.startsWith(m + '/')) return [m, role.slice(m.length + 1)];
  return [null, role];
};

// ── Themes ──────────────────────────────────────────────────────────────────────────────
const themesFlat = flatten(read('themes.json'), [], {});
const outThemes = {};
for (const [path, leaf] of Object.entries(themesFlat)) {
  if (!path.startsWith('color/')) { outThemes[path] = leaf; continue; }
  const [mirror, role] = splitMirror(path.slice(6));
  if (!KEEP.has(role)) continue; // folded away
  outThemes['color/' + (mirror ? mirror + '/' : '') + finalName(role)] = structuredClone(leaf);
}

// Re-point aliases that named a folded role. The value lives in the folded row when the
// replacement IS this row, so in that case the row absorbs the folded row's value instead.
const aliasRe = /^\{Themes\.color\.(.+)\}$/;
for (const [path, leaf] of Object.entries(outThemes)) {
  if (typeof leaf.$value !== 'object') continue;
  for (const [mode, val] of Object.entries(leaf.$value)) {
    const m = aliasRe.exec(String(val ?? ''));
    if (!m) continue;
    const [tMirror, tRole] = splitMirror(m[1].replace(/\./g, '/'));
    if (KEEP.has(tRole)) {
      leaf.$value[mode] = `{Themes.color.${(tMirror ? tMirror + '.' : '') + finalName(tRole).replace(/\//g, '.')}}`;
      continue;
    }
    const replacement = REPAIR[tRole];
    const wantedPath = 'color/' + (tMirror ? tMirror + '/' : '') + finalName(replacement);
    if (wantedPath === path) {
      const donor = themesFlat['color/' + (tMirror ? tMirror + '/' : '') + tRole];
      leaf.$value[mode] = donor ? donor.$value[mode] : val;
    } else {
      leaf.$value[mode] = `{Themes.color.${(tMirror ? tMirror + '.' : '') + finalName(replacement).replace(/\//g, '.')}}`;
    }
  }
}

// New roles, then selection's missing mirrors.
const colorLeaf = (ref) => ({ $value: { Default: `{${ref}}`, Dark: `{${ref}}` }, $type: 'color' });
for (const [role, primitive] of Object.entries(NEW_ROLES)) {
  for (const name of ['color/' + role, ...MIRRORS.map((m) => `color/${m}/${role}`)]) {
    outThemes[name] = colorLeaf(primitive);
  }
}
for (const role of PROMOTE_TO_SURFACES) {
  for (const m of MIRRORS) {
    outThemes[`color/${m}/${role}`] = {
      $value: { Default: `{Themes.color.${role.replace(/\//g, '.')}}`, Dark: `{Themes.color.${role.replace(/\//g, '.')}}` },
      $type: 'color',
    };
  }
}

// Re-values.
for (const [role, byMode] of Object.entries(VALUE_OVERRIDES)) {
  for (const [mode, primitive] of Object.entries(byMode)) outThemes['color/' + role].$value[mode] = `{${primitive}}`;
}
for (const [path, byMode] of Object.entries(MIRROR_VALUE_OVERRIDES)) {
  const [mirror, ...rest] = path.split('/');
  const key = `color/${mirror}/${finalName(rest.join('/'))}`;
  for (const [mode, primitive] of Object.entries(byMode)) outThemes[key].$value[mode] = `{${primitive}}`;
}

// ── Surfaces ────────────────────────────────────────────────────────────────────────────
const surfFlat = flatten(read('surfaces.json'), [], {});
const outSurf = {};
for (const [path, leaf] of Object.entries(surfFlat)) {
  const role = path.slice(6);
  if (!KEEP.has(role)) continue;
  const clone = structuredClone(leaf);
  for (const [mode, val] of Object.entries(clone.$value)) {
    const m = aliasRe.exec(String(val ?? ''));
    if (!m) continue;
    const [tMirror, tRole] = splitMirror(m[1].replace(/\./g, '/'));
    const resolved = KEEP.has(tRole) ? finalName(tRole) : finalName(REPAIR[tRole]);
    clone.$value[mode] = `{Themes.color.${(tMirror ? tMirror + '.' : '') + resolved.replace(/\//g, '.')}}`;
  }
  outSurf['color/' + finalName(role)] = clone;
}
const MODE_MIRROR = { Default: null, Subtle: 'on-subtle', Inverse: 'on-inverse', Primary: 'on-brand-primary' };
for (const role of [...Object.keys(NEW_ROLES), ...PROMOTE_TO_SURFACES]) {
  outSurf['color/' + role] = {
    $value: Object.fromEntries(
      Object.entries(MODE_MIRROR).map(([mode, mir]) => [
        mode,
        `{Themes.color.${(mir ? mir + '.' : '') + role.replace(/\//g, '.')}}`,
      ]),
    ),
    $type: 'color',
  };
}

// ── Components ──────────────────────────────────────────────────────────────────────────
const compFlat = flatten(read('components.json'), [], {});
let repointed = 0;
for (const [path, leaf] of Object.entries(compFlat)) {
  if (!path.startsWith('color/')) continue;
  const m = /^\{Surfaces\.color\.(.+)\}$/.exec(String(leaf.$value ?? ''));
  if (!m) continue;
  const oldRole = m[1].replace(/\./g, '/');
  const short = path.slice(6);
  const newRole = TOKEN_OVERRIDES[short] ?? ROLE_MAP[oldRole];
  const target = newRole ? (VALUE_SOURCE[newRole] ?? newRole) : oldRole;
  const next = `{Surfaces.color.${finalName(target).replace(/\//g, '.')}}`;
  if (next !== leaf.$value) repointed += 1;
  leaf.$value = next;
}

writeFileSync(join(DIR, 'themes.json'), JSON.stringify(nest(outThemes), null, 2) + '\n');
writeFileSync(join(DIR, 'surfaces.json'), JSON.stringify(nest(outSurf), null, 2) + '\n');
writeFileSync(join(DIR, 'components.json'), JSON.stringify(nest(compFlat), null, 2) + '\n');

console.log(`themes.json     ${Object.keys(themesFlat).length} → ${Object.keys(outThemes).length}`);
console.log(`surfaces.json   ${Object.keys(surfFlat).length} → ${Object.keys(outSurf).length}`);
console.log(`components.json ${Object.keys(compFlat).length} rows, ${repointed} aliases moved`);
