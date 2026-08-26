// Audits the CURRENT exports: every foreground component token against the fill it actually
// sits on, in all eight theme × surface combinations, with the pre-refactor baseline beside it.
//
//   node tools/token-migration/color-roles/audit.mjs            # regressions only
//   node tools/token-migration/color-roles/audit.mjs --all      # everything under 3:1
//
// Why this exists next to contrast.mjs: that one compared a mapping against a baseline and
// SKIPPED any pair whose fill was transparent, because a static resolver has no idea what is
// underneath. The outline variants are exactly those — a transparent pill whose text lands on
// the page — so the check that was meant to catch surface regressions was blind to the
// component where they actually happen. Here a transparent fill is composited over
// `background/default` for the combination, which is what the browser does.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SURFACE_MODES, THEME_MODES, loadTokens, resolve } from '../lib/tokens.mjs';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const { all, byKey } = loadTokens(join(ROOT, 'packages', 'foundations', 'src', 'figma-exports'));
const baseline = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'snapshots', 'color-roles-baseline.json'), 'utf8'));

const combos = THEME_MODES.flatMap((t) => SURFACE_MODES.map((s) => [t, s]));
const comps = all.filter((t) => t.collection === 'Components' && t.path.startsWith('color.'));
const byPath = new Map(comps.map((t) => [t.path, t]));

const parse = (v) => {
  const s = String(v ?? '');
  let m = /^#([0-9a-f]{6})$/i.exec(s);
  if (m) return { rgb: m[1].match(/../g).map((h) => parseInt(h, 16)), a: 1 };
  m = /^rgba?\(([^)]+)\)$/i.exec(s);
  if (m) {
    const p = m[1].split(',').map((x) => parseFloat(x));
    return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 };
  }
  return null;
};
const over = (fg, bg) => (fg.a >= 1 ? fg.rgb : fg.rgb.map((v, i) => v * fg.a + bg[i] * (1 - fg.a)));
const lum = (rgb) => {
  const c = rgb.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const cr = (a, b) => {
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const val = (path, th, su) => {
  const t = byPath.get(path);
  return t ? resolve(byKey, t.key, { Themes: th, Surfaces: su }) : null;
};
const pageBg = (th, su) => parse(resolve(byKey, 'Surfaces.color.background.default', { Themes: th, Surfaces: su }));

const FOREGROUND = ['text', 'label', 'placeholder', 'icon', 'mark', 'foreground', 'dot', 'thumb'];
function fillFor(path) {
  const seg = path.split('.');
  for (let i = seg.length - 1; i >= 0; i--) {
    if (!FOREGROUND.includes(seg[i])) continue;
    for (const f of ['background', 'base', 'track', 'surface']) {
      for (const tail of [seg.slice(i + 1), [], ['default']]) {
        const cand = [...seg.slice(0, i), f, ...tail].join('.');
        if (byPath.has(cand)) return cand;
      }
    }
    return null;
  }
  return null;
}

const isDisabled = (p) => /\.disabled$/.test(p) || /\.disabled\./.test(p);

const rows = [];
for (const fg of comps) {
  if (isDisabled(fg.path)) continue;
  const bgPath = fillFor(fg.path);
  if (!bgPath) continue;
  for (const [th, su] of combos) {
    const page = pageBg(th, su);
    if (!page) continue;
    const fillRaw = parse(val(bgPath, th, su));
    const inkRaw = parse(val(fg.path, th, su));
    if (!fillRaw || !inkRaw) continue;
    // A transparent fill is not a colour, it is the page showing through.
    const fill = over(fillRaw, page.rgb);
    const ink = over(inkRaw, fill);
    const now = cr(ink, fill);

    const bFg = baseline.values[fg.path];
    const bBg = baseline.values[bgPath];
    let before = null;
    if (bFg && bBg) {
      const i = combos.findIndex(([a, b]) => a === th && b === su);
      const bf = parse(bBg[i]), bi = parse(bFg[i]);
      if (bf && bi) {
        const bfill = over(bf, page.rgb);
        before = cr(over(bi, bfill), bfill);
      }
    }
    rows.push({ fg: fg.path.replace(/^color\./, ''), bg: bgPath.replace(/^color\./, ''), combo: `${th}/${su}`, now, before });
  }
}

const failing = rows.filter((r) => r.now < 3);
const regressed = failing.filter((r) => r.before !== null && r.before >= 3);
const show = process.argv.includes('--all') ? failing : regressed;

console.log(`Par sprawdzonych:        ${rows.length}`);
console.log(`Poniżej 3:1 teraz:       ${failing.length}`);
console.log(`  z tego REGRESJE:       ${regressed.length} (było ≥3:1, jest <3:1)`);
console.log(`  zastane (było <3:1):   ${failing.length - regressed.length}`);

const byCause = new Map();
for (const r of show) {
  const k = `${r.combo}  ${r.fg.replace(/\.[^.]+$/, '')}`;
  if (!byCause.has(k)) byCause.set(k, { n: 0, now: r.now, before: r.before });
  byCause.get(k).n += 1;
}
console.log(`\n=== ${process.argv.includes('--all') ? 'WSZYSTKIE' : 'REGRESJE'} po grupie (${byCause.size}) ===`);
for (const [k, v] of [...byCause].sort((a, b) => b[1].n - a[1].n)) {
  console.log(`  ${String(v.n).padStart(3)}  ${k}   ${v.before === null ? '  ?  ' : v.before.toFixed(2)} → ${v.now.toFixed(2)}`);
}
process.exit(regressed.length ? 1 : 0);
