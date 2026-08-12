// Generates the Plugin API scripts that perform the restructure in Figma.
//
// They are generated rather than hand-written for two reasons: the `use_figma` `code`
// parameter is capped at 50 000 characters, and the payloads (726 component tokens, 67 new
// roles) have to be embedded as literals. The generator chunks anything that would not fit.
//
// Nothing here runs against Figma. It writes files to out/figma/ for review; each one is
// then pasted into a `use_figma` call in the order given by out/figma/README.md.
//
//   node tools/token-migration/generate-figma-scripts.mjs

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadTokens } from './lib/tokens.mjs';

const OUT = join(import.meta.dirname, 'out');
const FIGMA_OUT = join(OUT, 'figma');
const MAX_CHARS = 45000; // headroom under the 50 000 limit

const { roles, mapping } = JSON.parse(readFileSync(join(OUT, 'role-map.json'), 'utf8'));
const newRoles = roles.filter((r) => r.kind === 'new');
const roleNames = roles.map((r) => r.name);

// Themes holds a few colour tokens that never had a Surfaces counterpart, so they are
// neither roles nor component tokens — `selection/background` and `selection/text`, which
// reset.css uses for ::selection. "Delete every Themes colour that is not a role" would take
// them out. Derived rather than hardcoded so a future orphan is caught the same way.
const MIRROR_PREFIXES = ['on-subtle/', 'on-inverse/', 'on-brand-primary/'];
const bareName = (name) => {
  let n = name.replace(/^color\//, '');
  for (const p of MIRROR_PREFIXES) if (n.startsWith(p)) n = n.slice(p.length);
  return n;
};
const roleSet = new Set(roleNames);
const componentTokenSet = new Set(
  Object.keys(mapping).map((p) =>
    p
      .replace(/^color\./, '')
      .split('.')
      .join('/'),
  ),
);
const { all: allTokens } = loadTokens(
  join(import.meta.dirname, '..', '..', 'packages', 'foundations', 'src', 'figma-exports'),
);
const keepThemesOnly = [
  ...new Set(
    allTokens
      .filter((t) => t.collection === 'Themes' && t.type === 'color')
      // Only tokens the cleanup would actually consider: its first test skips anything whose
      // Figma name does not start with `color/`, which is where shadow/color/* falls out.
      .filter((t) => t.path.startsWith('color.'))
      .map((t) => bareName(t.path.split('.').join('/')))
      .filter((n) => !roleSet.has(n) && !componentTokenSet.has(n)),
  ),
].sort();

const FOUNDATIONS = 'Xxn0guDvAfyIqEKB6kADE9';
const UI_LIBRARY = 'BzqkruN7r8mwWfFReznc83';

// Scopes are not guessed from the name: every new variable copies them from the existing
// token it is derived from, which is both more accurate and one less thing to embed.

/** Shared helpers injected at the top of every generated script. */
const PREAMBLE = `
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
`.trim();

const RETURN = `
return {
  created: report.created.length,
  updated: report.updated.length,
  skipped: report.skipped.length,
  errors: report.errors.slice(0, 20),
  errorCount: report.errors.length,
  createdNodeIds: report.created.slice(0, 50),
};
`.trim();

function chunk(items, render, perChunkOverhead) {
  const out = [];
  let current = [];
  let size = perChunkOverhead;
  for (const item of items) {
    const text = render(item);
    if (current.length > 0 && size + text.length > MAX_CHARS) {
      out.push(current);
      current = [];
      size = perChunkOverhead;
    }
    current.push(item);
    size += text.length;
  }
  if (current.length > 0) out.push(current);
  return out;
}

/**
 * `use_figma` wraps the payload in an async context, so top-level `await` is valid there
 * and `node --check` (which parses as a CommonJS script) would reject a perfectly good
 * script. Compiling it as an async function body is exactly the shape the tool runs.
 */
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
function assertParses(name, source) {
  try {
    new AsyncFunction(source);
    return null;
  } catch (e) {
    return `${name}: ${e.message}`;
  }
}

/** Roughly what a chunk costs before any payload rows — preamble, helpers, loop, return. */
const CHUNK_OVERHEAD = 6500;

mkdirSync(FIGMA_OUT, { recursive: true });
const written = [];
const syntaxErrors = [];
const write = (name, body, note) => {
  writeFileSync(join(FIGMA_OUT, name), body);
  if (name.endsWith('.js')) {
    const err = assertParses(name, body);
    if (err) syntaxErrors.push(err);
  }
  written.push({ name, chars: body.length, note });
};

// ─── 01 — new roles in Themes, with their on-* mirrors ──────────────────────

const MIRRORS = [
  ['Default', ''],
  ['Subtle', 'on-subtle/'],
  ['Inverse', 'on-inverse/'],
  ['Primary', 'on-brand-primary/'],
];

// A role is defined by a behaviour that some existing token already has, so the script does
// not need the values embedded — it can copy them out of that token in the live file. Two
// wins: the payload drops from ~42 KB to ~5 KB, and the values are provably the ones Figma
// holds right now rather than colours reconstructed from hex strings in a stale export.
const roleEntry = (r) =>
  `  ${JSON.stringify([
    r.name,
    r.consumers[0]
      .replace(/^color\./, '')
      .split('.')
      .join('/'),
  ])},\n`;

const roleChunks = chunk(newRoles, roleEntry, CHUNK_OVERHEAD);
roleChunks.forEach((group, i) => {
  const body = `// [Core] Foundations — step 01.${i + 1}/${roleChunks.length}: create the new semantic roles.
//
// Each role is created in Themes as \`color/<name>\` plus three mirrors
// (\`color/on-subtle/<name>\`, \`color/on-inverse/<name>\`, \`color/on-brand-primary/<name>\`),
// which is the same mirror convention the existing generic roles already use — only now it
// carries 138 roles instead of 797 component tokens.
//
// Each entry is [roleName, sampleToken] — a token that already has exactly the behaviour the
// role is meant to carry. The script copies that token's values instead of embedding them, so
// the result is value-preserving by construction: no hex round-trip, nothing to drift.
// Idempotent: safe to re-run.

const ROLES = [
${group.map(roleEntry).join('')}];

${PREAMBLE}

const themes = collByName.get('Themes');
const surfaces = collByName.get('Surfaces');
if (!themes || !surfaces) throw new Error('missing Themes or Surfaces collection');
const THEME_MODES = ['Default', 'Dark'];
const byId = new Map(vars.map((v) => [v.id, v]));

for (const [roleName, sample] of ROLES) {
  // The sample lives in Surfaces; each of its surface modes aliases one Themes mirror.
  const src = findVar('Surfaces', 'color/' + sample);
  if (!src) { report.errors.push(roleName + ' → missing sample token color/' + sample); continue; }

  for (const [surface, prefix] of ${JSON.stringify(MIRRORS)}) {
    const name = 'color/' + prefix + roleName;
    try {
      const srcAlias = src.valuesByMode[modeId(surfaces, surface)];
      if (!srcAlias || srcAlias.type !== 'VARIABLE_ALIAS') {
        report.errors.push(name + ' → sample has no alias in surface mode ' + surface);
        continue;
      }
      const mirror = byId.get(srcAlias.id);
      if (!mirror) { report.errors.push(name + ' → sample mirror not found for ' + surface); continue; }

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

${RETURN}
`;
  write(
    `01-${String(i + 1).padStart(2, '0')}-roles.js`,
    body,
    `${group.length} roles × 4 mirrors = ${group.length * 4} variables`,
  );
});

// ─── 02 — the new roles in Surfaces ─────────────────────────────────────────

write(
  '02-surfaces.js',
  `// [Core] Foundations — step 02: expose the new roles in the Surfaces collection.
//
// One variable per role, four modes, each aliasing the matching Themes mirror. This is the
// existing Surfaces convention unchanged — it just operates on 138 roles now.
// Idempotent: safe to re-run.

const ROLE_NAMES = ${JSON.stringify(newRoles.map((r) => r.name))};

${PREAMBLE}

const themes = collByName.get('Themes');
const surfaces = collByName.get('Surfaces');
if (!themes || !surfaces) throw new Error('missing Themes or Surfaces collection');

for (const name of ROLE_NAMES) {
  const varName = 'color/' + name;
  try {
    const { v, created } = ensureVar(surfaces, varName, 'COLOR');
    const src = findVar('Themes', varName);
    if (src) v.scopes = src.scopes;
    for (const [surfaceMode, prefix] of ${JSON.stringify(MIRRORS)}) {
      const target = findVar('Themes', 'color/' + prefix + name);
      if (!target) { report.errors.push(varName + ' → missing Themes mirror for ' + surfaceMode); continue; }
      v.setValueForMode(modeId(surfaces, surfaceMode), alias(target));
    }
    (created ? report.created : report.updated).push(varName);
  } catch (e) {
    report.errors.push(varName + ' → ' + e.message);
  }
}

${RETURN}
`,
  `${newRoles.length} role variables × 4 surface modes`,
);

// ─── 03 — the Components collection ─────────────────────────────────────────

// Grouped by role, with the shared `color/` prefix stripped and re-added in the script. One
// role name instead of 726 repetitions of it is what keeps this inside the payload budget.
const byRole = new Map();
for (const [path, role] of Object.entries(mapping)) {
  if (!byRole.has(role)) byRole.set(role, []);
  byRole.get(role).push(
    path
      .replace(/^color\./, '')
      .split('.')
      .join('/'),
  );
}
const mapEntries = [...byRole.entries()];
const mapEntry = ([role, paths]) => `  ${JSON.stringify([role, paths])},\n`;
const mapChunks = chunk(mapEntries, mapEntry, CHUNK_OVERHEAD);

mapChunks.forEach((group, i) => {
  const body = `// [Core] Foundations — step 03.${i + 1}/${mapChunks.length}: build the Components collection.
//
// One single-mode variable per component token, each a single alias to a Surfaces role. The
// names are byte-identical to today's Surfaces names, so the generated CSS variables — and
// therefore all 708 references in Lit and React — do not move.
//
// A component token needs no modes of its own: in Figma an alias resolves in the mode
// context of the consuming node, so it follows both the theme and the surface through the
// role it points at.
// Idempotent: safe to re-run.

// [roleName, [componentTokenName, …]] — all names relative to the shared \`color/\` prefix.
const BY_ROLE = [
${group.map(mapEntry).join('')}];

${PREAMBLE}

let components = collByName.get('Components');
if (!components) {
  components = figma.variables.createVariableCollection('Components');
  collByName.set('Components', components);
}
// Deliberately NOT hiddenFromPublishing. Hiding the collection would keep its 726 tokens out
// of the picker in client files — tempting — but [Core] UI Library binds these variables
// ACROSS files (measured: 331 of its Chip bindings resolve to remote Surfaces variables), and
// a collection hidden from publishing never reaches the published library. Step 04 would then
// have nothing to rebind to.
const surfaces = collByName.get('Surfaces');
if (!surfaces) throw new Error('no Surfaces collection');
const soleMode = components.modes[0].modeId;

for (const [roleName, tokenNames] of BY_ROLE) {
  const role = findVar('Surfaces', 'color/' + roleName);
  if (!role) {
    report.errors.push('missing role color/' + roleName + ' (' + tokenNames.length + ' tokens skipped)');
    continue;
  }
  for (const short of tokenNames) {
    const tokenName = 'color/' + short;
    try {
      const { v, created } = ensureVar(components, tokenName, 'COLOR');
      v.scopes = role.scopes;
      v.setValueForMode(soleMode, alias(role));
      (created ? report.created : report.updated).push(tokenName);
    } catch (e) {
      report.errors.push(tokenName + ' → ' + e.message);
    }
  }
}

${RETURN}
`;
  write(
    `03-${String(i + 1).padStart(2, '0')}-components.js`,
    body,
    `${group.reduce((n, [, paths]) => n + paths.length, 0)} component tokens across ${group.length} roles`,
  );
});

// ─── 04 — rebind [Core] UI Library ──────────────────────────────────────────
// No embedded data: a binding moves if and only if a variable of the same name exists in
// the Components collection, which is exactly the set step 03 created.

write(
  '04-rebind-page.js',
  `// [Core] UI Library — step 04: move component bindings from Surfaces to Components.
//
// Run ONCE PER PAGE. Replace PAGE_ID below; the page ids are listed in out/figma/README.md.
// Emit the calls for several pages in parallel — one \`setCurrentPageAsync\` per call.
//
// Needs no mapping data: a binding is moved exactly when a variable of the same name exists
// in the Components collection, which is the set step 03 created.
//
// Counts painted vs expected rather than trusting the absence of an exception —
// \`setBoundVariableForPaint\` binds silently when handed null, and hidden subtrees do not
// hand over instance children.

const PAGE_ID = 'REPLACE_ME';

const page = await figma.getNodeByIdAsync(PAGE_ID);
if (!page || page.type !== 'PAGE') throw new Error('not a page: ' + PAGE_ID);
await figma.setCurrentPageAsync(page);

// Foundations variables are REMOTE here — this file consumes them as a published library, so
// getLocalVariablesAsync() does not see them at all. Everything goes through teamLibrary, and
// a replacement has to be imported by key before it can be bound. Imports are scoped to this
// one use_figma call, so the cache below cannot be carried across calls.
const libColls = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
const compLib = libColls.find((c) => c.name === 'Components');
if (!compLib) {
  throw new Error('no Components library collection — publish [Core] Foundations after step 03');
}
const componentKeyByName = new Map(
  (await figma.teamLibrary.getVariablesInLibraryCollectionAsync(compLib.key)).map((v) => [v.name, v.key]),
);

const resolved = new Map();
const lookup = async (id) => {
  if (!resolved.has(id)) resolved.set(id, await figma.variables.getVariableByIdAsync(id));
  return resolved.get(id);
};
const collOf = new Map();
const collNameOf = async (collectionId) => {
  if (!collOf.has(collectionId)) {
    const c = await figma.variables.getVariableCollectionByIdAsync(collectionId);
    collOf.set(collectionId, c ? c.name : null);
  }
  return collOf.get(collectionId);
};
const imported = new Map();
const importByName = async (name) => {
  if (!imported.has(name)) {
    const key = componentKeyByName.get(name);
    imported.set(name, key ? await figma.variables.importVariableByKeyAsync(key) : null);
  }
  return imported.get(name);
};

// Move a binding when it points at a component token in EITHER Surfaces or Themes.
//
// Themes has to be included: before the restructure both collections carried the same
// variable names, so the picker showed color/button/primary/text/active twice and some
// nodes ended up bound to the Themes copy. Those bypass Surfaces entirely and step 05 would
// orphan them. Found on 3 pages (Button, Checkbox, Radio) — 4 variables, 9 occurrences.
const replacementFor = async (id) => {
  const v = await lookup(id);
  if (!v) return null;
  const collection = await collNameOf(v.variableCollectionId);
  if (collection !== 'Surfaces' && collection !== 'Themes') return null;
  if (!componentKeyByName.has(v.name)) return null;
  return await importByName(v.name);
};

const stats = { expected: 0, rebound: 0, paints: 0, fields: 0, unchanged: 0, errors: [] };
const nodes = page.findAll(() => true);

for (const node of nodes) {
  // Paint bindings: setBoundVariableForPaint returns a NEW paint that must be reassigned.
  for (const prop of ['fills', 'strokes']) {
    const paints = node[prop];
    if (!Array.isArray(paints) || paints.length === 0) continue;
    let changed = false;
    const next = [];
    for (const paint of paints) {
      const bound = paint.boundVariables && paint.boundVariables.color;
      if (!bound) { next.push(paint); continue; }
      stats.expected++;
      const replacement = await replacementFor(bound.id);
      if (!replacement) { next.push(paint); stats.unchanged++; continue; }
      try {
        next.push(figma.variables.setBoundVariableForPaint(paint, 'color', replacement));
        changed = true;
        stats.paints++;
        stats.rebound++;
      } catch (e) {
        next.push(paint);
        stats.errors.push(node.id + '.' + prop + ' → ' + e.message);
      }
    }
    if (changed) node[prop] = next;
  }

  // Non-paint bindings (itemSpacing, cornerRadius, characters, …).
  const bv = node.boundVariables;
  if (!bv) continue;
  for (const [field, value] of Object.entries(bv)) {
    if (field === 'fills' || field === 'strokes' || Array.isArray(value)) continue;
    if (!value || value.type !== 'VARIABLE_ALIAS') continue;
    stats.expected++;
    const replacement = await replacementFor(value.id);
    if (!replacement) { stats.unchanged++; continue; }
    try {
      node.setBoundVariable(field, replacement);
      stats.fields++;
      stats.rebound++;
    } catch (e) {
      stats.errors.push(node.id + '.' + field + ' → ' + e.message);
    }
  }
}

return {
  page: page.name,
  nodesScanned: nodes.length,
  bindingsSeen: stats.expected,
  rebound: stats.rebound,
  viaPaints: stats.paints,
  viaFields: stats.fields,
  leftOnSurfaces: stats.unchanged,
  errorCount: stats.errors.length,
  errors: stats.errors.slice(0, 20),
};
`,
  'run once per page — 22 component pages',
);

// ─── 05 — repair aliases that step 01 inherited ─────────────────────────────

write(
  '05-repair-aliases.js',
  `// [Core] Foundations — step 05: re-point surviving aliases away from doomed tokens.
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

const ROLE_NAMES = new Set(${JSON.stringify(roleNames)});
const KEEP_THEMES_ONLY = new Set(${JSON.stringify(keepThemesOnly)});
const MIRROR_PREFIXES = ['on-subtle/', 'on-inverse/', 'on-brand-primary/'];
const splitName = (name) => {
  const n = name.replace(/^color\\//, '');
  for (const p of MIRROR_PREFIXES) if (n.indexOf(p) === 0) return { prefix: p, bare: n.slice(p.length) };
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
const themesByName = new Map(vars.filter((v) => v.variableCollectionId === themes.id).map((v) => [v.name, v]));
const compByName = new Map(vars.filter((v) => v.variableCollectionId === components.id).map((v) => [v.name, v]));
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
  return surfVar ? surfVar.name.replace(/^color\\//, '') : null;
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
    const h = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
    const a = val.a === undefined ? 1 : val.a;
    return h(val.r) + h(val.g) + h(val.b) + (a === 1 ? '' : ':' + a.toFixed(2));
  }
  return String(val);
};
const COMBOS = [];
for (const t of themes.modes) for (const s of surfaces.modes) COMBOS.push([t.modeId, s.modeId]);
const snapshot = (v) => COMBOS.map(([t, s]) => resolveVar(v, t, s)).join('~');

const fixes = [], failures = [], drift = [];
for (const v of vars) {
  if (doomedIds.has(v.id)) continue;
  for (const [mId, val] of Object.entries(v.valuesByMode)) {
    if (!val || val.type !== 'VARIABLE_ALIAS' || !doomedIds.has(val.id)) continue;
    const doomedVar = byId.get(val.id);
    const role = roleFor(doomedVar.name);
    if (!role) { failures.push(v.name + ' → ' + doomedVar.name + ' (no role)'); continue; }
    const { prefix } = splitName(doomedVar.name);
    const replacement = themesByName.get('color/' + prefix + role);
    if (!replacement) { failures.push(v.name + ' → missing color/' + prefix + role); continue; }
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
  verdict: drift.length === 0 && failures.length === 0 ? 'REPAIRED, NO VALUE CHANGED' : 'NEEDS REVIEW',
};
`,
  'repairs 131 aliases that would dangle after cleanup',
);

// ─── 06 — remove the old machinery ──────────────────────────────────────────

write(
  '06-cleanup.js',
  `// [Core] Foundations — step 06: delete the superseded variables. RUN LAST.
//
// Only after step 04 reports every page rebound and step 05 reports zero dangling aliases and the snapshot oracle is green on a fresh
// export. Deleting first would strand the bindings in [Core] UI Library.
//
// Removes:
//   • Themes  — every colour variable that is not a role (the per-component rows)
//   • Themes  — every on-*/ mirror of a non-role
//   • Surfaces— every colour variable that is not a role
//
// DRY_RUN = true only reports what would go. Flip it once the list looks right.

const DRY_RUN = true;
const ROLE_NAMES = new Set(${JSON.stringify(roleNames)});

// Themes-only colour tokens: no Surfaces counterpart, so they are neither roles nor
// component tokens, but they are live (reset.css styles ::selection from them).
const KEEP_THEMES_ONLY = new Set(${JSON.stringify(keepThemesOnly)});

${PREAMBLE}

const themes = collByName.get('Themes');
const surfaces = collByName.get('Surfaces');
if (!themes || !surfaces) throw new Error('missing Themes or Surfaces collection');

const MIRROR_PREFIXES = ['on-subtle/', 'on-inverse/', 'on-brand-primary/'];

/** Strips \`color/\` and any mirror prefix, leaving the bare role-or-component name. */
const bareName = (name) => {
  let n = name.replace(/^color\\//, '');
  for (const p of MIRROR_PREFIXES) if (n.indexOf(p) === 0) n = n.slice(p.length);
  return n;
};

const doomed = [];
for (const v of vars) {
  const inThemes = v.variableCollectionId === themes.id;
  const inSurfaces = v.variableCollectionId === surfaces.id;
  if (!inThemes && !inSurfaces) continue;
  if (v.name.indexOf('color/') !== 0) continue; // typography/radius/ring stay
  const bare = bareName(v.name);
  if (ROLE_NAMES.has(bare)) continue; // roles stay
  if (KEEP_THEMES_ONLY.has(bare)) continue; // Themes-only live tokens stay
  doomed.push(v);
}

if (!DRY_RUN) {
  for (const v of doomed) {
    try { v.remove(); report.created.push(v.name); }
    catch (e) { report.errors.push(v.name + ' → ' + e.message); }
  }
}

return {
  dryRun: DRY_RUN,
  wouldRemove: doomed.length,
  removed: DRY_RUN ? 0 : report.created.length,
  sample: doomed.slice(0, 30).map((v) => v.name),
  errorCount: report.errors.length,
  errors: report.errors.slice(0, 20),
};
`,
  'destructive — dry run by default',
);

// ─── README ─────────────────────────────────────────────────────────────────

const readme = `# Figma migration scripts

Generated by \`tools/token-migration/generate-figma-scripts.mjs\`. **Nothing here has been
run.** Each file is the \`code\` payload for one \`use_figma\` call.

Foundations file key: \`${FOUNDATIONS}\`
UI Library file key: \`${UI_LIBRARY}\`

## Order

| Step | File(s) | File | What |
| --- | --- | --- | --- |
${written
  .map(
    (w) =>
      `| ${w.name.slice(0, 2)} | \`${w.name}\` | ${w.name.startsWith('04') ? 'UI Library' : 'Foundations'} | ${w.note} (${(w.chars / 1000).toFixed(1)} KB) |`,
  )
  .join('\n')}

Steps 01 and 03 are split into chunks purely to stay under the 50 000-character \`code\`
limit; run the chunks of a step in order, then move on. Every script is idempotent, so a
re-run after a failure is safe.

## Before you start

1. **Duplicate \`[Core] Foundations\`.** Version history is not a practical undo for an
   operation touching thousands of variables.
2. \`node tools/token-migration/snapshot.mjs\` — the baseline must exist and be committed.

## After step 04, before step 05

Step 05 is destructive and irreversible in practice. Only run it once every page reports
\`leftOnSurfaces: 0\` for component tokens, and it defaults to \`DRY_RUN = true\` — read the
list it returns before flipping the flag.

## Finally

1. Export the five collections from Luckino into
   \`packages/foundations/src/figma-exports/\` (now including \`components.json\`).
2. \`pnpm foundations:build\`
3. \`node tools/token-migration/snapshot.mjs --check tools/token-migration/snapshots/baseline.json\`

That last command must report **no drift**. It is the only check that proves the
restructure preserved every value in every theme × surface combination.

## Page ids for step 04

Replace \`PAGE_ID\` in \`04-rebind-page.js\` with each of these in turn. Emit several calls in
one message so they run in parallel — one \`setCurrentPageAsync\` per call.

\`\`\`
2025:2434  Badge          2330:3587  Breadcrumbs    101:6      Button
2060:98    Chip           2399:620   FileInput      2097:2739  Calendar
1145:317   Checkbox       2273:475   Combobox       2117:2855  DatePicker
2203:5549  Dialog         2374:2367  Drawer         99:183     Input
2184:4180  NumberInput    1725:1014  Notification   102:766    Loader
2148:3941  Pagination     2082:2686  Popover        1217:1338  Radio
1342:2142  Select         2234:6041  Switch         100:40     Utilities
\`\`\`

Reference counts measured before migration: Chip 348 bindings (328 \`color/chip/*\`),
Button 137 (98 \`color/button/*\`). After step 04 those must match exactly.
`;
write('README.md', readme, '');

console.log(`Generated ${written.length} file(s) in ${FIGMA_OUT}:\n`);
for (const w of written) {
  const flag = w.chars > MAX_CHARS ? '  ✗ OVER LIMIT' : '';
  console.log(`  ${w.name.padEnd(26)} ${String(w.chars).padStart(7)} chars${flag}`);
}
const over = written.filter((w) => w.chars > MAX_CHARS);
if (over.length > 0) {
  console.error(`\n✗ ${over.length} file(s) exceed the ${MAX_CHARS}-character budget`);
}
if (syntaxErrors.length > 0) {
  console.error(`\n✗ ${syntaxErrors.length} file(s) do not parse as an async function body:`);
  for (const e of syntaxErrors) console.error(`  — ${e}`);
}
if (over.length > 0 || syntaxErrors.length > 0) process.exit(1);
console.log(`\n✓ All within the ${MAX_CHARS}-character use_figma budget`);
console.log(`✓ All ${written.filter((w) => w.name.endsWith('.js')).length} scripts parse`);
