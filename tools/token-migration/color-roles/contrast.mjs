// Pairs every foreground component token with the background it sits on and reports the
// contrast in all eight theme × surface combinations, before and after the role refactor.
//
//   node tools/token-migration/color-roles/contrast.mjs           # only pairs that get worse
//   node tools/token-migration/color-roles/contrast.mjs --all     # every failing pair
//
// Why this and not the value diff: folding 138 roles into 63 moves values, and a moved
// value is only a bug when it lands on top of its own background. Checking a foreground
// against the page instead of against its co-located fill is what let the on-inverse
// control tokens ship broken once already.

import { join } from 'node:path';
import { SURFACE_MODES, THEME_MODES, loadTokens, resolve } from '../lib/tokens.mjs';
import { ROLE_MAP, TOKEN_OVERRIDES } from './role-map.mjs';
import { VALUE_OVERRIDES, MIRROR_VALUE_OVERRIDES, VALUE_SOURCE } from './target.mjs';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const { all, byKey } = loadTokens(join(ROOT, 'packages', 'foundations', 'src', 'figma-exports'));


const combos = THEME_MODES.flatMap((t) => SURFACE_MODES.map((s) => [t, s]));

const comps = all.filter((t) => t.collection === 'Components' && t.path.startsWith('color.'));
const byPath = new Map(comps.map((t) => [t.path, t]));

const roleOf = (t) => {
  const raw = typeof t.value === 'string' ? t.value : Object.values(t.value)[0];
  const m = /^\{Surfaces\.color\.(.+)\}$/.exec(String(raw ?? ''));
  return m ? m[1].replace(/\./g, '/') : null;
};

const newRoleOf = (t) => {
  const short = t.path.replace(/^color\./, '').replace(/\./g, '/');
  const old = roleOf(t);
  return TOKEN_OVERRIDES[short] ?? (old ? ROLE_MAP[old] : null);
};

const valueOfRole = (role, theme, surface) => {
  if (!role) return null;
  const ov = VALUE_OVERRIDES[role];
  if (ov) return resolve(byKey, ov[theme] ?? ov.Default, { Themes: theme, Surfaces: surface });
  // A non-Default surface reads the role through its mirror, so a mirror repair has to be
  // applied here rather than on the base role.
  const mirror = { Subtle: 'on-subtle', Inverse: 'on-inverse', Primary: 'on-brand-primary' }[surface];
  const mv = mirror && MIRROR_VALUE_OVERRIDES[`${mirror}/${VALUE_SOURCE[role] ?? role}`];
  if (mv && mv[theme]) return resolve(byKey, mv[theme], { Themes: theme, Surfaces: surface });
  const dotted = (VALUE_SOURCE[role] ?? role).replace(/\//g, '.');
  const key = byKey.has(`Surfaces.color.${dotted}`)
    ? `Surfaces.color.${dotted}`
    : `Themes.color.${dotted}`;
  return byKey.has(key) ? resolve(byKey, key, { Themes: theme, Surfaces: surface }) : null;
};

// A foreground token's background is the sibling with the fill segment swapped in. Chip
// carries a state suffix (`text/hover` ↔ `background/hover`), Badge does not (`text` ↔
// `background`), so both shapes are tried.
const FOREGROUND = ['text', 'label', 'placeholder', 'icon', 'mark', 'foreground', 'separator'];
function backgroundFor(path) {
  const seg = path.split('.');
  for (let i = seg.length - 1; i >= 0; i--) {
    if (!FOREGROUND.includes(seg[i])) continue;
    for (const fill of ['background', 'base', 'surface']) {
      const candidate = [...seg.slice(0, i), fill, ...seg.slice(i + 1)].join('.');
      if (byPath.has(candidate)) return candidate;
      const noState = [...seg.slice(0, i), fill].join('.');
      if (byPath.has(noState)) return noState;
      const dflt = [...seg.slice(0, i), fill, 'default'].join('.');
      if (byPath.has(dflt)) return dflt;
    }
    return null;
  }
  return null;
}

const rgb = (hex) => {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex ?? ''));
  if (!m) return null;
  return m[1].match(/../g).map((h) => parseInt(h, 16) / 255);
};
const lum = (c) => {
  const l = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
};
const contrast = (a, b) => {
  const ra = rgb(a);
  const rb = rgb(b);
  if (!ra || !rb) return null; // alpha / transparent — the fill underneath is unknown
  const la = lum(ra);
  const lb = lum(rb);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const THRESHOLD = 3.0;

// WCAG exempts disabled controls from contrast requirements, and this token set leans on
// that: the whole `disabled/*` family sits around 2.3:1 by design. Including it would bury
// the real findings under ~150 rows that were never meant to pass.
const isDisabled = (path) => /\.disabled$/.test(path) || /\.disabled\./.test(path);

const rows = [];
for (const fg of comps) {
  if (isDisabled(fg.path)) continue;
  const bgPath = backgroundFor(fg.path);
  if (!bgPath) continue;
  const bg = byPath.get(bgPath);
  const oldFgRole = roleOf(fg);
  const oldBgRole = roleOf(bg);
  if (!oldFgRole || !oldBgRole) continue;

  for (const [th, su] of combos) {
    const before = contrast(
      valueOfRole(oldFgRole, th, su),
      valueOfRole(oldBgRole, th, su),
    );
    const after = contrast(
      valueOfRole(newRoleOf(fg), th, su),
      valueOfRole(newRoleOf(bg), th, su),
    );
    if (before === null || after === null) continue;
    rows.push({
      fg: fg.path, bg: bgPath, combo: `${th}/${su}`, before, after,
      newFg: newRoleOf(fg), newBg: newRoleOf(bg),
    });
  }
}

const worse = rows.filter((r) => r.after < THRESHOLD && r.after < r.before - 0.05);
const failing = rows.filter((r) => r.after < THRESHOLD);

const fmt = (n) => n.toFixed(2).padStart(5);
const show = process.argv.includes('--all') ? failing : worse;

console.log(`Par foreground/background:  ${new Set(rows.map((r) => r.fg)).size}`);
console.log(`Sprawdzonych kombinacji:    ${rows.length}`);
console.log(`Poniżej ${THRESHOLD}:1 po refaktorze:  ${failing.length}`);
console.log(`  w tym POGORSZONYCH:       ${worse.length}`);

// Grouping by the *role pair* rather than the token pair is what turns 262 rows into a
// handful of root causes: a mirror value that is wrong once shows up in every component
// token that reaches it.
if (process.argv.includes('--causes')) {
  const causes = new Map();
  for (const r of worse) {
    const k = `${r.combo}  ${r.newFg} on ${r.newBg}`;
    if (!causes.has(k)) causes.set(k, { n: 0, before: r.before, after: r.after, ex: r.fg });
    causes.get(k).n += 1;
  }
  console.log(`\n=== PRZYCZYNY ŹRÓDŁOWE (${causes.size}) ===`);
  for (const [k, v] of [...causes].sort((a, b) => b[1].n - a[1].n)) {
    console.log(`  ${String(v.n).padStart(4)}  ${k}`);
    console.log(`        ${fmt(v.before)} → ${fmt(v.after)}   np. ${v.ex.replace(/^color\./, '')}`);
  }
  process.exit(worse.length ? 1 : 0);
}

const grouped = new Map();
for (const r of show) {
  const k = r.fg.replace(/^color\./, '');
  if (!grouped.has(k)) grouped.set(k, []);
  grouped.get(k).push(r);
}
console.log(
  `\n=== ${process.argv.includes('--all') ? 'WSZYSTKIE PONIŻEJ PROGU' : 'POGORSZONE'} (${grouped.size} tokenów) ===`,
);
for (const [k, list] of grouped) {
  console.log(`\n  ${k}`);
  console.log(`    na tle ${list[0].bg.replace(/^color\./, '')}`);
  for (const r of list) console.log(`      ${r.combo.padEnd(16)} ${fmt(r.before)} → ${fmt(r.after)}`);
}

process.exit(worse.length ? 1 : 0);
