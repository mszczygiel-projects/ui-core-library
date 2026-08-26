// Re-value 5 rows: the success base, and the three mirrors that are broken today

const EDITS = [["color/feedback/success/base","Default","Primitives Colors.green.950"],["color/feedback/success/base","Dark","Primitives Colors.green.950"],["color/on-inverse/background/sunken","Dark","Primitives Colors.gray.100"],["color/on-inverse/background/subtle","Dark","Primitives Colors.gray.200"],["color/on-brand-primary/background/inverse","Default","Primitives Colors.white.1000"]];

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
    if (v) prims[c.name + '.' + v.name.replace(/\//g, '.')] = v;
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
return { applied: applied.length, expected: EDITS.length, missing };
