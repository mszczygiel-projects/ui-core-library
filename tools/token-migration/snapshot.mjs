// Records the resolved value of every component-facing token in all 8 theme × surface
// combinations — the regression oracle for the token restructure.
//
// The restructure moves ~2400 mirror variables out of Figma and re-points component
// tokens at semantic roles. It is correct if and only if every token still resolves to
// the same colour in every combination. Nothing else proves that: the CSS diff is huge
// by design, and Chromatic only covers what a story happens to render.
//
//   node tools/token-migration/snapshot.mjs                    # write the baseline
//   node tools/token-migration/snapshot.mjs --check <file>     # diff current exports against it
//   node tools/token-migration/snapshot.mjs --input <dir> --out <file>

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  SIZE_MODES,
  SURFACE_MODES,
  THEME_MODES,
  componentFacingTokens,
  loadTokens,
  resolve,
  sizeFacingTokens,
} from './lib/tokens.mjs';

const ROOT = join(import.meta.dirname, '..', '..');
const DEFAULT_INPUT = join(ROOT, 'packages', 'foundations', 'src', 'figma-exports');

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

// Colour and dimension tokens vary along different axes, so they get separate baselines
// rather than one file with a ragged shape: colour over theme × surface, size over the
// responsive modes alone (Sizes is not surface-aware).
const KIND = arg('--kind', 'colors');
if (KIND !== 'colors' && KIND !== 'sizes') {
  console.error(`✗ --kind must be "colors" or "sizes" (got "${KIND}")`);
  process.exit(1);
}

const combinations =
  KIND === 'colors'
    ? THEME_MODES.flatMap((theme) => SURFACE_MODES.map((surface) => `${theme}/${surface}`))
    : SIZE_MODES.slice();

const DEFAULT_OUT = join(
  import.meta.dirname,
  'snapshots',
  KIND === 'colors' ? 'baseline.json' : 'sizes-baseline.json',
);

export function capture(inputDir) {
  const { all, byKey } = loadTokens(inputDir);
  const tokens = KIND === 'colors' ? componentFacingTokens(all) : sizeFacingTokens(all);
  const values = {};
  for (const t of tokens) {
    values[t.path] =
      KIND === 'colors'
        ? THEME_MODES.flatMap((theme) =>
            SURFACE_MODES.map((surface) =>
              resolve(byKey, t.key, { Themes: theme, Surfaces: surface }),
            ),
          )
        : SIZE_MODES.map((mode) => resolve(byKey, t.key, { Sizes: mode }));
  }
  return { kind: KIND, combinations, tokenCount: tokens.length, values };
}

/**
 * Guards against a resolver that looks like it works but has collapsed the mode
 * dimension — the failure mode where every surface returns the Default value and the
 * snapshot compares equal no matter what the migration does.
 */
function selfCheck(snapshot) {
  const problems = [];
  const broken = Object.entries(snapshot.values).filter(([, tuple]) =>
    tuple.some((v) => typeof v === 'string' && v.startsWith('<')),
  );
  if (broken.length > 0) {
    problems.push(
      `${broken.length} token(s) resolve to a missing/cyclic reference, e.g. ${broken[0][0]} → ${broken[0][1].find((v) => String(v).startsWith('<'))}`,
    );
  }

  if (KIND === 'sizes') {
    const responsive = Object.values(snapshot.values).filter((t) => t[0] !== t[1]).length;
    if (responsive === 0) {
      problems.push('no token differs between Mobile and Desktop — the Sizes dimension collapsed');
    }
    return { problems, varyBySurface: 0, varyByTheme: responsive };
  }

  const surfaceCount = SURFACE_MODES.length;
  const varyBySurface = Object.values(snapshot.values).filter(
    (tuple) => new Set(tuple.slice(0, surfaceCount)).size > 1,
  ).length;
  if (varyBySurface === 0) {
    problems.push(
      'no token varies across surface modes — the Surfaces dimension collapsed, snapshot is worthless',
    );
  }

  const varyByTheme = Object.values(snapshot.values).filter(
    (tuple) => tuple[0] !== tuple[surfaceCount],
  ).length;
  if (varyByTheme === 0) {
    problems.push('no token varies between Default and Dark — the Themes dimension collapsed');
  }

  return { problems, varyBySurface, varyByTheme };
}

function compare(baseline, current) {
  const drift = [];
  const keys = new Set([...Object.keys(baseline.values), ...Object.keys(current.values)]);
  for (const key of [...keys].sort()) {
    const before = baseline.values[key];
    const after = current.values[key];
    if (!before) {
      drift.push({ token: key, kind: 'added' });
      continue;
    }
    if (!after) {
      drift.push({ token: key, kind: 'removed' });
      continue;
    }
    for (let i = 0; i < combinations.length; i++) {
      if (before[i] !== after[i]) {
        drift.push({
          token: key,
          kind: 'changed',
          combination: combinations[i],
          before: before[i],
          after: after[i],
        });
      }
    }
  }
  return drift;
}

const inputDir = arg('--input', DEFAULT_INPUT);
const current = capture(inputDir);
const check = selfCheck(current);

console.log(`Component-facing tokens: ${current.tokenCount}`);
console.log(`Combinations per token:  ${combinations.length} (${combinations.join(', ')})`);
console.log(`Vary across surfaces:    ${check.varyBySurface}`);
console.log(`Vary across themes:      ${check.varyByTheme}`);
console.log(
  `Distinct behaviours:     ${new Set(Object.values(current.values).map((t) => t.join('~'))).size}`,
);

if (check.problems.length > 0) {
  console.error('\n✗ Self-check failed:');
  for (const p of check.problems) console.error(`  — ${p}`);
  process.exit(1);
}

const checkAgainst = arg('--check', null);
if (checkAgainst) {
  const baseline = JSON.parse(readFileSync(checkAgainst, 'utf8'));
  const drift = compare(baseline, current);

  // A token that did not exist before cannot have regressed — the restructure deliberately
  // adds ~67 roles. Only a value that moved, or a token that vanished, is a failure.
  const added = drift.filter((d) => d.kind === 'added');
  const breaking = drift.filter((d) => d.kind !== 'added');

  if (added.length > 0) {
    console.log(`\nℹ ${added.length} new token(s) since the baseline (not a regression):`);
    for (const d of added.slice(0, 8)) console.log(`  + ${d.token}`);
    if (added.length > 8) console.log(`  … and ${added.length - 8} more`);
  }

  if (breaking.length === 0) {
    console.log(
      `\n✓ No drift against ${checkAgainst} — every token in the baseline still resolves` +
        ` identically in all ${combinations.length} combinations.`,
    );
    process.exit(0);
  }

  console.error(`\n✗ ${breaking.length} regression(s) against ${checkAgainst}:\n`);
  for (const d of breaking.slice(0, 40)) {
    if (d.kind === 'changed') {
      console.error(`  ${d.token} [${d.combination}]  ${d.before} → ${d.after}`);
    } else {
      console.error(`  ${d.token}  (${d.kind})`);
    }
  }
  if (breaking.length > 40) console.error(`  … and ${breaking.length - 40} more`);
  process.exit(1);
}

const outPath = arg('--out', DEFAULT_OUT);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(current, null, 2) + '\n');
console.log(`\n✓ Wrote ${outPath}`);
