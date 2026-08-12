// [Core] UI Library — step 04: move component bindings from Surfaces to Components.
//
// Run ONCE PER PAGE. Replace PAGE_ID below; the page ids are listed in out/figma/README.md.
// Emit the calls for several pages in parallel — one `setCurrentPageAsync` per call.
//
// Needs no mapping data: a binding is moved exactly when a variable of the same name exists
// in the Components collection, which is the set step 03 created.
//
// Counts painted vs expected rather than trusting the absence of an exception —
// `setBoundVariableForPaint` binds silently when handed null, and hidden subtrees do not
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
  (await figma.teamLibrary.getVariablesInLibraryCollectionAsync(compLib.key)).map((v) => [
    v.name,
    v.key,
  ]),
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
      if (!bound) {
        next.push(paint);
        continue;
      }
      stats.expected++;
      const replacement = await replacementFor(bound.id);
      if (!replacement) {
        next.push(paint);
        stats.unchanged++;
        continue;
      }
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
    if (!replacement) {
      stats.unchanged++;
      continue;
    }
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
