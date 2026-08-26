// Applies the surface-aware repair to the exports: the feedback family and the border ramp
// get explicit per-theme values in every mirror instead of aliasing the base row, and the
// brand outline chip's ink moves to the one brand role that already flips.
//
// Run once, after the same edits have been made in Figma. `verify` then proves both sides agree.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONTEXT, FEEDBACK_RAMP, FEEDBACK_STEPS, BORDER_STEPS, EXTRA_VALUE_EDITS } from './target.mjs';

const DIR = join(import.meta.dirname, '..', '..', '..', 'packages', 'foundations', 'src', 'figma-exports');
const read = (f) => JSON.parse(readFileSync(join(DIR, f), 'utf8'));

const at = (root, path) => path.split('/').reduce((o, k) => (o ? o[k] : undefined), root);

const themes = read('themes.json');
const comps = read('components.json');

let applied = 0;
const missing = [];
const set = (path, theme, primitive) => {
  const leaf = at(themes, path);
  if (!leaf || !leaf.$value) { missing.push(path); return; }
  leaf.$value[theme] = `{Primitives Colors.${primitive}}`;
  applied += 1;
};

for (const [mirror, byTheme] of Object.entries(CONTEXT)) {
  const pre = 'color/' + (mirror ? mirror + '/' : '');
  for (const [theme, ctx] of Object.entries(byTheme)) {
    const s = FEEDBACK_STEPS[ctx];
    for (const [name, hue] of Object.entries(FEEDBACK_RAMP)) {
      const base = ctx === 'light' ? s.base[name] : s.base;
      set(`${pre}feedback/${name}/base`, theme, `${hue}.${base}`);
      set(`${pre}feedback/${name}/subtle`, theme, `${hue}.${s.subtle}`);
      set(`${pre}feedback/${name}/on-base`, theme, ctx === 'light' ? 'white.1000' : `${hue}.${s.onBase}`);
    }
    for (const [role, primitive] of Object.entries(BORDER_STEPS[ctx])) set(pre + role, theme, primitive);
  }
}

for (const [path, theme, primitive] of EXTRA_VALUE_EDITS) set(path, theme, primitive);

// Only the states whose fill is transparent, so the ink sits on the page. `hover` and
// `active` gain the constant pale brand/primary/light and belong to repair-inks.mjs, which
// runs after this and would otherwise be undone by it.
let repointed = 0;
for (const state of ['default', 'focus']) {
  const leaf = at(comps, `color/chip/brand/outline/text/${state}`);
  if (!leaf) { missing.push(`chip/brand/outline/text/${state}`); continue; }
  leaf.$value = '{Surfaces.color.text.brand}';
  repointed += 1;
}

writeFileSync(join(DIR, 'themes.json'), JSON.stringify(themes, null, 2) + '\n');
writeFileSync(join(DIR, 'components.json'), JSON.stringify(comps, null, 2) + '\n');
console.log(`wartości ustawionych: ${applied} (oczekiwane ${112 + EXTRA_VALUE_EDITS.length})`);
console.log(`tokenów przepiętych:  ${repointed} (oczekiwane 2)`);
if (missing.length) console.log(`BRAK: ${missing.join(', ')}`);
