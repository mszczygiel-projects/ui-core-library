// Create the roles that have no source variable, and give selection/* a Surfaces counterpart

const NEW = {"brand/secondary/light":"Primitives Colors.brand.secondary.200","brand/secondary/dark":"Primitives Colors.brand.secondary.600","brand/tertiary/light":"Primitives Colors.gray.100","brand/tertiary/dark":"Primitives Colors.gray.600"};
const PROMOTE = ["selection/background","selection/text"];
const MIRRORS = ["on-subtle","on-inverse","on-brand-primary"];

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const themes = cols.find((c) => c.name === 'Themes');
const surf = cols.find((c) => c.name === 'Surfaces');
const modeId = (c, n) => (c.modes.find((m) => m.name === n) || c.modes[0]).modeId;

const prims = {};
for (const c of cols) {
  for (const id of c.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (v) prims[c.name + '.' + v.name.replace(/\//g, '.')] = v;
  }
}
const themeByName = {};
for (const id of themes.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v) themeByName[v.name] = v;
}
const surfByName = {};
for (const id of surf.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v) surfByName[v.name] = v;
}

const created = [];
// A new role needs its base row plus all three mirrors, or a surface switch would drop it.
for (const [role, primitive] of Object.entries(NEW)) {
  const p = prims[primitive];
  if (!p) { created.push(['MISSING PRIMITIVE', primitive]); continue; }
  for (const name of ['color/' + role, ...MIRRORS.map((m) => 'color/' + m + '/' + role)]) {
    if (themeByName[name]) continue;
    const v = figma.variables.createVariable(name, themes, 'COLOR');
    v.scopes = ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL', 'STROKE_COLOR'];
    for (const m of themes.modes) v.setValueForMode(m.modeId, { type: 'VARIABLE_ALIAS', id: p.id });
    themeByName[name] = v;
    created.push(['themes', name]);
  }
}
// The Surfaces row is what makes a role surface-aware: one alias per mode, each pointing at
// the matching Themes mirror.
const surfaceFor = (role) => {
  if (surfByName['color/' + role]) return null;
  const v = figma.variables.createVariable('color/' + role, surf, 'COLOR');
  v.scopes = ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL', 'STROKE_COLOR'];
  const map = { Default: 'color/' + role, Subtle: 'color/on-subtle/' + role, Inverse: 'color/on-inverse/' + role, Primary: 'color/on-brand-primary/' + role };
  for (const m of surf.modes) {
    const t = themeByName[map[m.name] || map.Default];
    if (t) v.setValueForMode(m.modeId, { type: 'VARIABLE_ALIAS', id: t.id });
  }
  surfByName['color/' + role] = v;
  return v;
};
for (const role of Object.keys(NEW)) if (surfaceFor(role)) created.push(['surfaces', role]);

// selection/* exists in Themes today with no Surfaces counterpart, so it is invisible to the
// surface system. Give it the mirrors it never had, then the Surfaces row.
for (const role of PROMOTE) {
  const base = themeByName['color/' + role];
  if (!base) { created.push(['MISSING THEMES', role]); continue; }
  for (const m of MIRRORS) {
    const name = 'color/' + m + '/' + role;
    if (themeByName[name]) continue;
    const v = figma.variables.createVariable(name, themes, 'COLOR');
    v.scopes = base.scopes;
    for (const mode of themes.modes) v.setValueForMode(mode.modeId, { type: 'VARIABLE_ALIAS', id: base.id });
    themeByName[name] = v;
    created.push(['themes', name]);
  }
  if (surfaceFor(role)) created.push(['surfaces', role]);
}
return { created: created.length, detail: created };
