// Rename 56 variables in place — two phases, so colliding names cannot clash

const PAIRS = [["color/brand/primary","color/brand/primary/default"],["color/on-subtle/brand/primary","color/on-subtle/brand/primary/default"],["color/on-inverse/brand/primary","color/on-inverse/brand/primary/default"],["color/on-brand-primary/brand/primary","color/on-brand-primary/brand/primary/default"],["color/action/primary/base/disabled","color/brand/primary/light"],["color/on-subtle/action/primary/base/disabled","color/on-subtle/brand/primary/light"],["color/on-inverse/action/primary/base/disabled","color/on-inverse/brand/primary/light"],["color/on-brand-primary/action/primary/base/disabled","color/on-brand-primary/brand/primary/light"],["color/brand/solid/background/hover","color/brand/primary/dark"],["color/on-subtle/brand/solid/background/hover","color/on-subtle/brand/primary/dark"],["color/on-inverse/brand/solid/background/hover","color/on-inverse/brand/primary/dark"],["color/on-brand-primary/brand/solid/background/hover","color/on-brand-primary/brand/primary/dark"],["color/brand/secondary","color/brand/secondary/default"],["color/on-subtle/brand/secondary","color/on-subtle/brand/secondary/default"],["color/on-inverse/brand/secondary","color/on-inverse/brand/secondary/default"],["color/on-brand-primary/brand/secondary","color/on-brand-primary/brand/secondary/default"],["color/brand/tertiary","color/brand/tertiary/default"],["color/on-subtle/brand/tertiary","color/on-subtle/brand/tertiary/default"],["color/on-inverse/brand/tertiary","color/on-inverse/brand/tertiary/default"],["color/on-brand-primary/brand/tertiary","color/on-brand-primary/brand/tertiary/default"],["color/transparent","color/background/transparent"],["color/on-subtle/transparent","color/on-subtle/background/transparent"],["color/on-inverse/transparent","color/on-inverse/background/transparent"],["color/on-brand-primary/transparent","color/on-brand-primary/background/transparent"],["color/transparent-black","color/background/scrim"],["color/on-subtle/transparent-black","color/on-subtle/background/scrim"],["color/on-inverse/transparent-black","color/on-inverse/background/scrim"],["color/on-brand-primary/transparent-black","color/on-brand-primary/background/scrim"],["color/outline/placeholder/default","color/text/placeholder"],["color/on-subtle/outline/placeholder/default","color/on-subtle/text/placeholder"],["color/on-inverse/outline/placeholder/default","color/on-inverse/text/placeholder"],["color/on-brand-primary/outline/placeholder/default","color/on-brand-primary/text/placeholder"],["color/disabled/surface","color/disabled/background"],["color/on-subtle/disabled/surface","color/on-subtle/disabled/background"],["color/on-inverse/disabled/surface","color/on-inverse/disabled/background"],["color/on-brand-primary/disabled/surface","color/on-brand-primary/disabled/background"],["color/filled/text/disabled","color/disabled/text"],["color/on-subtle/filled/text/disabled","color/on-subtle/disabled/text"],["color/on-inverse/filled/text/disabled","color/on-inverse/disabled/text"],["color/on-brand-primary/filled/text/disabled","color/on-brand-primary/disabled/text"],["color/border/default","color/border/subtle"],["color/on-subtle/border/default","color/on-subtle/border/subtle"],["color/on-inverse/border/default","color/on-inverse/border/subtle"],["color/on-brand-primary/border/default","color/on-brand-primary/border/subtle"],["color/separator/foreground","color/border/default"],["color/on-subtle/separator/foreground","color/on-subtle/border/default"],["color/on-inverse/separator/foreground","color/on-inverse/border/default"],["color/on-brand-primary/separator/foreground","color/on-brand-primary/border/default"],["color/border/strong/default","color/border/strong"],["color/on-subtle/border/strong/default","color/on-subtle/border/strong"],["color/on-inverse/border/strong/default","color/on-inverse/border/strong"],["color/on-brand-primary/border/strong/default","color/on-brand-primary/border/strong"],["color/border/strong/hover","color/border/stronger"],["color/on-subtle/border/strong/hover","color/on-subtle/border/stronger"],["color/on-inverse/border/strong/hover","color/on-inverse/border/stronger"],["color/on-brand-primary/border/strong/hover","color/on-brand-primary/border/stronger"]];

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const targets = cols.filter((c) => c.name === 'Themes' || c.name === 'Surfaces');
const byName = {};
for (const c of targets) {
  for (const id of c.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (v) (byName[v.name] = byName[v.name] || []).push(v);
  }
}
// Phase 1 — park under a unique name so no rename can collide with a name still in use.
const parked = [];
const missing = [];
PAIRS.forEach(([from], i) => {
  const vs = byName[from];
  if (!vs || !vs.length) { missing.push(from); return; }
  for (const v of vs) { v.name = '_migrating/' + i; parked.push([i, v.id]); }
});
// Phase 2 — settle on the final names.
let renamed = 0;
for (const [i, id] of parked) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (!v) continue;
  v.name = PAIRS[i][1];
  renamed += 1;
}
return { renamed, expectedPairs: PAIRS.length, missing };
