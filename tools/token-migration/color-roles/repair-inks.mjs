// Derives every ink token's role from the fill it sits on, instead of trusting what it points
// at today.
//
// Making the feedback family surface-aware exposed that `feedback/success/on-base` was doing
// duty as a generic white for sixteen tokens that have nothing to do with success — a brand
// chip's label, the danger button's text, an error checkbox's mark. While it was a constant
// white that read as merely untidy; once it flips, every one of them breaks.
//
// The pairing is a rule, not a table:
//   fill feedback/X/base    → ink feedback/X/on-base
//   fill feedback/X/subtle  → ink feedback/X/base
//   fill action/Y/base/Z    → ink action/Y/on-base/Z
//   fill background/inverse → ink background/default   (complements by construction)
//   fill brand/primary/*    → both move to the action/primary pair, which is the only brand
//                             fill/ink pair that is correctly paired AND surface-aware
//
//   node tools/token-migration/color-roles/repair-inks.mjs          # report
//   node tools/token-migration/color-roles/repair-inks.mjs --write  # patch the exports

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadTokens } from '../lib/tokens.mjs';

const DIR = join(import.meta.dirname, '..', '..', '..', 'packages', 'foundations', 'src', 'figma-exports');
const { all } = loadTokens(DIR);
const comps = all.filter((t) => t.collection === 'Components' && t.path.startsWith('color.'));
const roleOf = (t) => {
  const m = /^\{Surfaces\.color\.(.+)\}$/.exec(String(t.value ?? ''));
  return m ? m[1].replace(/\./g, '/') : null;
};
const byPath = new Map(comps.map((t) => [t.path, t]));

const INK = ['text', 'label', 'placeholder', 'icon', 'mark', 'foreground', 'dot', 'thumb', 'separator'];
const FILL = ['background', 'base', 'track', 'border', 'surface'];
function fillFor(path) {
  const seg = path.split('.');
  for (let i = seg.length - 1; i >= 0; i--) {
    if (!INK.includes(seg[i])) continue;
    for (const f of FILL) {
      for (const tail of [seg.slice(i + 1), [], ['default']]) {
        const cand = [...seg.slice(0, i), f, ...tail].join('.');
        if (byPath.has(cand)) return cand;
      }
    }
    return null;
  }
  return null;
}

// A brand fill and its ink both move; the fill is rewritten first so the ink can follow it.
const SWAP_STATES = new Set(['hover', 'active', 'selected']);
const BRAND_FILL = { 'brand/primary/default': 'action/primary/base/default', 'brand/primary/dark': 'action/primary/base/hover' };

const inkFor = (fillRole) => {
  if (!fillRole) return null;
  let m = /^feedback\/([a-z]+)\/base$/.exec(fillRole);
  if (m) return `feedback/${m[1]}/on-base`;
  m = /^feedback\/([a-z]+)\/subtle$/.exec(fillRole);
  if (m) return `feedback/${m[1]}/base`;
  m = /^action\/([a-z]+)\/base\/([a-z]+)$/.exec(fillRole);
  if (m) return `action/${m[1]}/on-base/${m[2]}`;
  if (fillRole === 'background/inverse') return 'background/default';
  if (BRAND_FILL[fillRole]) return BRAND_FILL[fillRole].replace('/base/', '/on-base/');
  return null;
};

const fillEdits = [];
for (const t of comps) {
  const role = roleOf(t);
  // Ink tokens are listed explicitly below; sweeping them in here repaints a label with a
  // fill role, which is how chip/brand/subtle/text/default briefly became 1.09:1.
  if (t.path.split('.').some((seg) => INK.includes(seg))) continue;
  if (role && BRAND_FILL[role] && /^color\.(chip|badge)\.brand\.(solid|subtle|outline)\./.test(t.path)) {
    fillEdits.push([t.path.replace(/^color\./, '').replace(/\./g, '/'), BRAND_FILL[role]]);
  }
}

// Deriving the ink from its fill found the right answers but also several wrong ones — the
// switch's checked icon sits on the THUMB, not the track, and the danger button's hover ink
// sits on a pale tint, so "invert it" makes both worse. The fills above follow a rule
// cleanly; the inks are listed, each one read off the resolved value table.
const INK_EDITS = [
  // Borrowing another feedback family's ink. Harmless while every on-base was a constant
  // white; wrong the moment they flip.
  ['checkbox/checked/mark/error', 'feedback/error/on-base'],
  ['radio/checked/background/error', 'feedback/error/on-base'],
  ['switch/checked/thumb/error', 'feedback/error/on-base'],

  // error is the only feedback colour whose subtle text pointed at action/danger instead of
  // its own base — a leftover from it being the one colour with no `subtle/text` role of its
  // own. success, warning and info were already on feedback/{x}/base.
  ['badge/error/subtle/text', 'feedback/error/base'],
  ['chip/error/subtle/text/default', 'feedback/error/base'],
  ['chip/error/subtle/text/focus', 'feedback/error/base'],

  // Brand solid surfaces move onto the action/primary pair (see BRAND_FILL), so their ink
  // has to move with them or it stops matching the fill on inverted surfaces.
  ['badge/brand/solid/text', 'action/primary/on-base/default'],
  ['chip/brand/solid/text/default', 'action/primary/on-base/default'],
  ['chip/brand/solid/text/focus', 'action/primary/on-base/default'],
  ['chip/brand/solid/text/hover', 'action/primary/on-base/hover'],
  ['chip/brand/solid/text/active', 'action/primary/on-base/hover'],
  ['chip/brand/solid/text/selected', 'action/primary/on-base/hover'],
  ['chip/brand/subtle/text/selected', 'action/primary/on-base/default'],
  ['chip/brand/outline/text/selected', 'action/primary/on-base/default'],

  // The danger button's resting ink was the generic white too.
  ['button/danger/text/default', 'action/danger/on-base/default'],
  ['button/danger/separator/default', 'action/danger/on-base/default'],

  // Every other danger state sits on feedback/error/subtle, not on a pale action tint — so
  // the ink has to flip with it. (I rejected this pairing once on the assumption that the
  // fill was action/danger/base/hover; the resolved values say otherwise.)
  ...['hover', 'focus', 'active', 'disabled'].flatMap((s) => [
    [`button/danger/text/${s}`, 'feedback/error/base'],
    [`button/danger/separator/${s}`, 'feedback/error/base'],
  ]),

  // The outline chip is transparent at rest, so its ink follows the page (text/brand); on
  // hover it gains the constant pale brand/primary/light, where a surface-aware ink drops to
  // 2.76:1 and the constant dark one is correct — the same pairing the subtle variant uses.
  ['chip/brand/outline/text/hover', 'brand/primary/dark'],
  ['chip/brand/outline/text/active', 'brand/primary/dark'],
];
const inkEdits = INK_EDITS.map(([p, want]) => {
  const t = byPath.get('color.' + p.replace(/\//g, '.'));
  return [p, want, t ? roleOf(t) : 'BRAK TOKENU'];
});

console.log(`tła do przeniesienia: ${fillEdits.length}`);
for (const [p, r] of fillEdits) console.log(`   ${p.padEnd(44)} → ${r}`);
console.log(`\ninki do poprawy: ${inkEdits.length}`);
for (const [p, want, was] of inkEdits) console.log(`   ${p.padEnd(44)} ${was} → ${want}`);

if (process.argv.includes('--write')) {
  const comps2 = JSON.parse(readFileSync(join(DIR, 'components.json'), 'utf8'));
  const at = (root, path) => path.split('/').reduce((o, k) => (o ? o[k] : undefined), root);
  let n = 0;
  for (const [p, r] of [...fillEdits, ...inkEdits.map(([p, w]) => [p, w])]) {
    const leaf = at(comps2, 'color/' + p);
    if (!leaf) { console.log('BRAK ' + p); continue; }
    leaf.$value = `{Surfaces.color.${r.replace(/\//g, '.')}}`;
    n += 1;
  }
  writeFileSync(join(DIR, 'components.json'), JSON.stringify(comps2, null, 2) + '\n');
  console.log(`\nzapisano ${n} zmian do components.json`);
}
