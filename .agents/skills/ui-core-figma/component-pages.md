# The component pages in Figma

Every component has one page in [Core] UI Library, named like the component in code, in the order of the categories of the library, with a page `---` between categories. The page holds no documentation: Storybook documents the component.

- **On the left, the legend** `Legend · generated`: the eyebrow "Component", the name of the component set, its description, which is the summary sentence of the JSDoc, a divider, and one instance of each value of the first variant property of the set, under a label with the value.
- **On the right, the card** that holds the component set, the implementation that designers use. The builder never touches the set; it places the legend to its left.

The legend is a page, not a component, and its look is the owner's. Its card, gaps and divider bind roles of the Foundations; its texts and labels carry the fonts, sizes and colours of the owner's design as raw values, since the Foundations have no styles for them, so a fork does not restyle them. It uses no component apart from the instances of the set. It is locked; rebuild it, never edit it. When the owner changes the look, read the edited legend, change the builder to match, and prove it with a test build compared node by node before the legend is rebuilt. A component step runs the builder after the last change to the set, and before a page is rebuilt from it, the old hand-made legend of the page goes.

## How to run it

Set `PAGE_ID` and `SET_ID` at the top and send the script with `use_figma`. The keys name published variables of [Core] Foundations; if one is renamed, take its new key from the Foundations file. The fonts must be available in Figma. The script returns the id of the legend, its size and the number of examples, and a screenshot of the page is the control read.

## The builder

```js
const PAGE_ID = '<page id>';
const SET_ID = '<component set id>';
// Builds the legend of one component page in [Core] UI Library to the left of the card
// that holds the component set. A re-run replaces the legend and never touches the set.
const KEYS = {
  background: '235dab07f2cc064fe07ed6426b97227fefd9a0bd', // Surfaces color/background/default
  border: 'ab54bcdd0647e00e68b9e610d689558335e7cfb6', // Surfaces color/border/subtle
  radius: '223e23d64c85fdda716993c082125f6ca93fe7c1', // Themes radius/lg
  stroke: '418bd2c3bcbf7e9f9fa60f2362f984807a7b3f0d', // Themes stroke/border
  padInline: '492631eb3692caef717331a26d01b6017c330a93', // layout/padding/inline/3xl
  padStack: '3d7f9a35ee31b780b3cee3fa5efd2fc1c2b5e191', // layout/padding/stack/3xl
  gapSection: 'ef87618e558668aa77e43cfdb09a6eaf7f858a08', // layout/gap/stack/xl, between parts
  gapGroup: '3cddab90a0670530b80fb0956cf868d8055efb6b', // layout/gap/stack/md, inside a part
};
// The texts of the owner's design, with no style of the Foundations behind them.
const rgb = (r, g, b) => ({ r: r / 255, g: g / 255, b: b / 255 });
const TEXT = {
  eyebrow: {
    font: { family: 'Poppins', style: 'SemiBold' },
    size: 14,
    lineHeight: 160,
    letterSpacing: 10,
    upper: true,
    color: rgb(0, 0, 0),
  },
  title: {
    font: { family: 'Aboreto', style: 'Regular' },
    size: 48,
    lineHeight: 130,
    letterSpacing: -1.5,
    color: rgb(0, 0, 0),
  },
  description: {
    font: { family: 'Abhaya Libre', style: 'Regular' },
    size: 20,
    lineHeight: 140,
    letterSpacing: 0,
    color: rgb(89, 96, 128),
  },
  label: {
    font: { family: 'Poppins', style: 'SemiBold' },
    size: 14,
    lineHeight: 160,
    letterSpacing: 10,
    upper: true,
    color: rgb(61, 97, 199),
  },
};
const LABEL_BACKGROUND = rgb(237, 242, 255);

const page = await figma.getNodeByIdAsync(PAGE_ID);
await figma.setCurrentPageAsync(page);
const set = await figma.getNodeByIdAsync(SET_ID);
const V = {};
for (const [k, key] of Object.entries(KEYS))
  V[k] = await figma.variables.importVariableByKeyAsync(key);
for (const t of Object.values(TEXT)) await figma.loadFontAsync(t.font);
const bound = (v) => [
  figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0, g: 0, b: 0 } },
    'color',
    v,
  ),
];
function text(parent, chars, spec, fill) {
  const t = figma.createText();
  t.fontName = spec.font;
  t.characters = chars;
  t.fontSize = spec.size;
  t.lineHeight = { unit: 'PERCENT', value: spec.lineHeight };
  t.letterSpacing = { unit: 'PERCENT', value: spec.letterSpacing };
  if (spec.upper) t.textCase = 'UPPER';
  t.fills = [{ type: 'SOLID', color: spec.color }];
  parent.appendChild(t);
  if (fill) {
    t.layoutSizingHorizontal = 'FILL';
    t.textAutoResize = 'HEIGHT';
  }
  return t;
}
function stack(parent, name, gap) {
  const f = figma.createAutoLayout('VERTICAL');
  f.name = name;
  f.fills = [];
  f.setBoundVariable('itemSpacing', gap);
  parent.appendChild(f);
  return f;
}
// The legend of an earlier build, or of the older hand-made template, goes; the set stays.
for (const node of [...page.children]) {
  if (node.name === 'Legend · generated' || (node.type === 'FRAME' && node.name === 'Legend'))
    node.remove();
}
const legend = figma.createAutoLayout('VERTICAL');
legend.name = 'Legend · generated';
legend.fills = bound(V.background);
for (const f of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'])
  legend.setBoundVariable(f, V.radius);
for (const f of ['paddingLeft', 'paddingRight']) legend.setBoundVariable(f, V.padInline);
for (const f of ['paddingTop', 'paddingBottom']) legend.setBoundVariable(f, V.padStack);
legend.setBoundVariable('itemSpacing', V.gapSection);
page.appendChild(legend);
legend.resize(448, legend.height);
legend.counterAxisSizingMode = 'FIXED';
const head = stack(legend, 'Header', V.gapGroup);
head.layoutSizingHorizontal = 'FILL';
text(head, 'Component', TEXT.eyebrow, true);
text(head, set.name, TEXT.title);
text(head, set.description || ' ', TEXT.description, true);
const rule = figma.createRectangle();
rule.name = 'Divider';
rule.fills = bound(V.border);
legend.appendChild(rule);
rule.layoutSizingHorizontal = 'FILL';
rule.setBoundVariable('height', V.stroke);
const variantProp = Object.entries(set.componentPropertyDefinitions).find(
  ([, d]) => d.type === 'VARIANT',
);
const examples = stack(legend, 'Examples', V.gapSection);
examples.layoutSizingHorizontal = 'FILL';
const made = [];
if (variantProp) {
  const [propName, def] = variantProp;
  for (const value of def.variantOptions) {
    const variant = set.children.find(
      (c) => c.variantProperties && c.variantProperties[propName] === value,
    );
    if (!variant) continue;
    const item = stack(examples, value, V.gapGroup);
    const label = figma.createAutoLayout('HORIZONTAL');
    label.name = 'Variant';
    label.fills = [{ type: 'SOLID', color: LABEL_BACKGROUND }];
    label.primaryAxisAlignItems = 'CENTER';
    label.counterAxisAlignItems = 'CENTER';
    label.itemSpacing = 8;
    label.clipsContent = false;
    item.appendChild(label);
    text(label, value.charAt(0).toUpperCase() + value.slice(1), TEXT.label).name = 'Label';
    const instance = variant.createInstance();
    item.appendChild(instance);
    made.push(instance.id);
  }
}
// The set card stays where it is; the legend goes to its left, top-aligned.
const card = set.parent && set.parent.type === 'FRAME' ? set.parent : set;
legend.x = card.x - legend.width - 80;
legend.y = card.y;
legend.locked = true;
return {
  legend: legend.id,
  size: [legend.width, legend.height],
  examples: made.length,
  card: card.id,
};
```
