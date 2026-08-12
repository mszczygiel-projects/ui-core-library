// Derives the semantic role set that replaces the per-component colour tokens.
//
// Two tokens with the same 8-way tuple are interchangeable for every consumer, so the
// component layer can collapse onto a much smaller set of roles without any consumer
// noticing. This tool finds that set: it reuses an existing generic role wherever one
// already carries the right behaviour, and proposes a new role for each leftover cluster.
//
// Generated names are CANDIDATES. Naming is a design decision — review out/roles.md and
// settle a name in role-names.overrides.json, never in out/ (which this script rewrites).
//
//   node tools/token-migration/derive-roles.mjs

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SURFACE_MODES,
  THEME_MODES,
  componentFacingTokens,
  isGeneric,
  loadTokens,
  resolveToPrimitiveKey,
  tupleKey,
  tupleOf,
} from './lib/tokens.mjs';

const ROOT = join(import.meta.dirname, '..', '..');
const INPUT = join(ROOT, 'packages', 'foundations', 'src', 'figma-exports');
const OUT_DIR = join(import.meta.dirname, 'out');
const OVERRIDES_FILE = join(import.meta.dirname, 'role-names.overrides.json');

// Component token paths are `color.<component>.<qualifier…>.<property>.<state>`, with the
// state and sometimes the property omitted. Parsing them positionally beats matching
// against a vocabulary: `error` is a state in `control.filled.text.error` but a family in
// `chip.error.solid.background.hover`, and only its position tells the two apart.
const PROPERTIES = [
  'background',
  'text',
  'border',
  'icon',
  'placeholder',
  'label',
  'mark',
  'track',
  'thumb',
  'separator',
  'foreground',
  'hint',
  'ring',
  'shadow',
];
const STATES = [
  'default',
  'hover',
  'focus',
  'active',
  'selected',
  'disabled',
  'checked',
  'on',
  'off',
  'error',
  'success',
  'warning',
  'info',
  'pressed',
  'visited',
  'current',
];

/** Most frequent value in a list, ties broken by first appearance. */
function majority(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = null;
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

/** Splits one token path into `{ qualifier, property, state }` by position, not vocabulary. */
function parsePath(path) {
  const segs = path.split('.').slice(2); // drop `color` and the component name
  let state = null;
  let rest = segs;
  if (segs.length > 1 && STATES.includes(segs[segs.length - 1])) {
    state = segs[segs.length - 1];
    rest = segs.slice(0, -1);
  }
  let property = null;
  if (rest.length > 0 && PROPERTIES.includes(rest[rest.length - 1])) {
    property = rest[rest.length - 1];
    rest = rest.slice(0, -1);
  }
  return { qualifier: rest.join('/'), property, state };
}

/**
 * Builds a candidate role name from the paths that share a behaviour, by majority vote on
 * each part. A cluster of `color.chip.success.{solid.background.hover, …}` votes
 * qualifier=success/solid, property=background, state=hover → `success/solid/background/hover`.
 */
function proposeName(consumerPaths, tuple) {
  const constant = new Set(tuple).size === 1;
  if (constant && /^rgba\(.*,\s*0\)$/.test(String(tuple[0]))) return 'transparent';

  const parsed = consumerPaths.map(parsePath);
  const parts = [
    majority(parsed.map((p) => p.qualifier).filter(Boolean)),
    majority(parsed.map((p) => p.property).filter(Boolean)),
    majority(parsed.map((p) => p.state).filter(Boolean)),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join('/') : consumerPaths[0].split('.').slice(2).join('/');
}

const { all, byKey } = loadTokens(INPUT);
const tokens = componentFacingTokens(all);
const generic = tokens.filter((t) => isGeneric(t.path));
const component = tokens.filter((t) => !isGeneric(t.path));

// Existing generic roles, indexed by behaviour. Several roles can share a behaviour
// (`border/default` and `background/subtle` happen to be the same grey today) — keep the
// first as the reuse target but record the rest, because they are NOT interchangeable
// going forward: a client must be able to move one without the other.
const roleByTuple = new Map();
const roles = [];
for (const t of generic) {
  const tuple = tupleOf(byKey, t.key);
  // Slash, not dot: role names are Figma variable names, where `/` is the group separator.
  // Leaving the export's dotted path here would make every downstream script look for
  // `color/brand.primary` — a variable that does not exist — and the cleanup step would
  // then treat all 71 existing generic roles as component tokens and delete them.
  const name = t.path
    .replace(/^color\./, '')
    .split('.')
    .join('/');
  roles.push({ name, kind: 'existing', tuple, consumers: [] });
  const tk = tupleKey(tuple);
  if (!roleByTuple.has(tk)) roleByTuple.set(tk, name);
}
const roleByName = new Map(roles.map((r) => [r.name, r]));

// Component tokens that already match an existing role, and the leftovers grouped by behaviour.
const mapping = {};
const orphanClusters = new Map();
for (const t of component) {
  const tuple = tupleOf(byKey, t.key);
  const tk = tupleKey(tuple);
  const existing = roleByTuple.get(tk);
  if (existing) {
    mapping[t.path] = existing;
    roleByName.get(existing).consumers.push(t.path);
    continue;
  }
  if (!orphanClusters.has(tk)) orphanClusters.set(tk, { tuple, consumers: [] });
  orphanClusters.get(tk).consumers.push(t.path);
}

// Human-approved names, keyed by any one token in the cluster they rename.
//
// Keyed by consumer rather than by generated name on purpose: the generated name is an
// output and shifts if the clustering changes, whereas a token path is stable. If a keyed
// token ever stops existing — or lands in a cluster that another override already claimed —
// the run reports it instead of quietly falling back to the heuristic.
const overrides = existsSync(OVERRIDES_FILE)
  ? (JSON.parse(readFileSync(OVERRIDES_FILE, 'utf8')).names ?? {})
  : {};
const overrideUsed = new Set();

function approvedName(consumers) {
  const hits = consumers.filter((c) => overrides[c] !== undefined);
  const names = new Set(hits.map((c) => overrides[c]));
  if (names.size === 0) return null;
  if (names.size > 1) {
    throw new Error(
      `conflicting overrides in one cluster: ${hits.map((c) => `${c} → ${overrides[c]}`).join(', ')}`,
    );
  }
  for (const c of hits) overrideUsed.add(c);
  return [...names][0];
}

// Name the leftover clusters, largest first so the most reused behaviour gets the
// cleanest name and the long tail takes the numeric suffixes.
const used = new Set(roles.map((r) => r.name));
const collisions = [];
const ordered = [...orphanClusters.values()].sort(
  (a, b) => b.consumers.length - a.consumers.length,
);
for (const cluster of ordered) {
  const approved = approvedName(cluster.consumers);
  const preferred = approved ?? proposeName(cluster.consumers, cluster.tuple);
  let name = preferred;
  if (used.has(name)) {
    // An approved name that collides is a mistake in the overrides file, not something to
    // paper over with a suffix — the point of approving a name is that it is the final one.
    if (approved) {
      throw new Error(
        `override "${approved}" (for ${cluster.consumers[0]}) collides with an existing role`,
      );
    }
    // Two behaviours want the same generated name: they are genuinely different (the tuples
    // differ) but the token vocabulary cannot tell them apart. A suffix keeps the run
    // deterministic; the reviewer supplies the real distinction via the overrides file.
    let n = 2;
    while (used.has(`${name}-${n}`)) n++;
    name = `${name}-${n}`;
    collisions.push({ name, preferred, consumers: cluster.consumers, tuple: cluster.tuple });
  }
  used.add(name);

  // What the new role must alias, per combination — taken from the chain of a representative
  // consumer so the migration reproduces the existing values exactly rather than guessing a
  // primitive back from a hex.
  const sample = `Surfaces.${cluster.consumers[0]}`;
  const aliases = {};
  for (const theme of THEME_MODES) {
    for (const surface of SURFACE_MODES) {
      aliases[`${theme}/${surface}`] = resolveToPrimitiveKey(byKey, sample, {
        Themes: theme,
        Surfaces: surface,
      });
    }
  }

  roles.push({
    name,
    kind: 'new',
    approved: approved !== null,
    tuple: cluster.tuple,
    aliases,
    consumers: cluster.consumers,
  });
  for (const path of cluster.consumers) mapping[path] = name;
}

const staleOverrides = Object.keys(overrides).filter((k) => !overrideUsed.has(k));

const newRoles = roles.filter((r) => r.kind === 'new');
const combos = THEME_MODES.flatMap((t) => SURFACE_MODES.map((s) => `${t}/${s}`));

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(
  join(OUT_DIR, 'role-map.json'),
  JSON.stringify({ combinations: combos, roles, mapping }, null, 2) + '\n',
);

const lines = [
  '# Proposed role set',
  '',
  '<!-- Generated by tools/token-migration/derive-roles.mjs — names are CANDIDATES, review before migrating. -->',
  '',
  `- Component-facing tokens today: **${tokens.length}** (${generic.length} generic, ${component.length} component-scoped)`,
  `- Distinct behaviours across ${combos.length} theme × surface combinations: **${new Set(tokens.map((t) => tupleKey(tupleOf(byKey, t.key)))).size}**`,
  `- Component tokens reusing an existing generic role: **${component.length - ordered.reduce((n, c) => n + c.consumers.length, 0)}**`,
  `- New roles required: **${newRoles.length}** (${newRoles.filter((r) => r.approved).length} with a human-approved name, ${newRoles.filter((r) => !r.approved).length} still heuristic)`,
  `- Total role set: **${roles.length}**`,
  '',
  '## New roles',
  '',
  'Names marked ✎ come from `role-names.overrides.json` and are final. The rest are',
  'heuristic proposals — add an override keyed by any one of the role’s consumers to fix one.',
  '',
  '| Name | | Consumers | Default/Default | Dark/Default | Sample consumer |',
  '| --- | --- | --- | --- | --- | --- |',
];
for (const r of newRoles) {
  lines.push(
    `| \`${r.name}\` | ${r.approved ? '✎' : ''} | ${r.consumers.length} | \`${r.tuple[0]}\` | \`${r.tuple[4]}\` | \`${r.consumers[0]}\` |`,
  );
}
// Roles that render identically but hold different value strings. `rgba(0,0,0,0)` and
// `rgba(255,255,255,0)` are the same pixel; keeping both is redundancy, not flexibility.
// Merging them is a real cleanup but it is NOT value-preserving, so it cannot ride along
// with the migration — the snapshot oracle compares strings and would report it as drift.
const VISUAL = (v) => (/^rgba\(.*,\s*0\)$/.test(String(v)) ? 'transparent' : String(v));
const byVisual = new Map();
for (const r of roles) {
  const k = r.tuple.map(VISUAL).join('~');
  if (!byVisual.has(k)) byVisual.set(k, []);
  byVisual.get(k).push(r);
}
const mergeCandidates = [...byVisual.values()].filter(
  (group) => group.length > 1 && new Set(group.map((r) => r.tuple.join('~'))).size > 1,
);

if (mergeCandidates.length > 0) {
  lines.push(
    '',
    '## Merge candidates (render identically, different value strings)',
    '',
    'These roles produce the same pixels but hold different values. Merging them is a',
    'separate, explicitly approved change — the snapshot oracle compares value strings, so',
    'it will report a merge as drift even though nothing renders differently.',
    '',
    '| Roles | Consumers | Values |',
    '| --- | --- | --- |',
  );
  for (const group of mergeCandidates) {
    lines.push(
      `| ${group.map((r) => `\`${r.name}\``).join(' + ')} | ${group.reduce((n, r) => n + r.consumers.length, 0)} | ${[...new Set(group.map((r) => r.tuple[0]))].map((v) => `\`${v}\``).join(' vs ')} |`,
    );
  }
}

if (collisions.length > 0) {
  lines.push(
    '',
    '## ⚠ Needs a human name',
    '',
    `${collisions.length} cluster(s) wanted a name that was already taken. The behaviours really are`,
    'different — the columns below show where — but the token vocabulary cannot express the',
    'difference. Rename these before migrating.',
    '',
    '| Placeholder | Wanted | Differs from its namesake in | Consumers |',
    '| --- | --- | --- | --- |',
  );
  for (const c of collisions) {
    const twin = roles.find((r) => r.name === c.preferred);
    const differing = twin
      ? combos.filter((_, i) => twin.tuple[i] !== c.tuple[i]).join(', ')
      : '(unknown)';
    lines.push(
      `| \`${c.name}\` | \`${c.preferred}\` | ${differing || '—'} | ${c.consumers.map((x) => `\`${x}\``).join('<br>')} |`,
    );
  }
}

lines.push('', '## Existing roles and what now points at them', '');
lines.push('| Role | Component tokens mapped |', '| --- | --- |');
for (const r of roles.filter((x) => x.kind === 'existing')) {
  lines.push(`| \`${r.name}\` | ${r.consumers.length} |`);
}
writeFileSync(join(OUT_DIR, 'roles.md'), lines.join('\n') + '\n');

console.log(`Component-facing tokens : ${tokens.length}`);
console.log(`  generic roles         : ${generic.length}`);
console.log(`  component-scoped      : ${component.length}`);
console.log(
  `Reused existing roles   : ${component.length - ordered.reduce((n, c) => n + c.consumers.length, 0)}`,
);
console.log(`New roles required      : ${newRoles.length}`);
console.log(`  name approved by hand : ${newRoles.filter((r) => r.approved).length}`);
console.log(`  still heuristic       : ${newRoles.filter((r) => !r.approved).length}`);
console.log(`TOTAL ROLE SET          : ${roles.length}`);
console.log(`\n✓ Wrote ${join(OUT_DIR, 'role-map.json')} and ${join(OUT_DIR, 'roles.md')}`);

// A stale override is a silent failure: the name it was supposed to fix quietly reverts to
// the heuristic. Fail the run so it gets noticed while the file is still being edited.
if (staleOverrides.length > 0) {
  console.error(
    `\n✗ ${staleOverrides.length} override(s) in role-names.overrides.json match no token in any cluster:`,
  );
  for (const k of staleOverrides) console.error(`  — ${k} → "${overrides[k]}"`);
  process.exit(1);
}
