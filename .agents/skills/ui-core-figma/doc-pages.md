# The Foundations pages in Figma

The documentation pages of [Core] Foundations are built and checked by two scripts that run through `use_figma`, and a third one compares their order with Storybook. Decision 10 says what the pages are. The pages follow the map of the pages, `apps/storybook/src/foundations/pages.json`, which Storybook reads too.

## When to run them

- A step that changes variables, styles or the map rebuilds the Figma pages it affects, then runs the check, before its pull request.
- The scripts write only the generated frames, one per page, `<page> · generated`. They are locked; never edit them by hand, change the map or the variables and rebuild.
- The pages the map lists under `handMade`, such as the cover, are designed by hand. The builder keeps their place in the order of the pages and leaves them alone, and the check skips them.
- Writing pages follows the protocol of the skill: the step names the pages it rebuilds, the owner approves the step, and the check is the control snapshot.
- A page renamed in the map keeps its Figma page: rename the page at the start of the call that rebuilds it, and the builder removes the frame of its old name. Without the rename, the builder adds a new page and leaves the old one. A section the map no longer lists is removed when its page is rebuilt, even with `ONLY`.

## How to run them

1. Write the assembler below and the scripts to the session's scratchpad, never to the repository.
2. Assemble a call with the pages it builds, three to five per call, under 50,000 characters. `ONLY` rebuilds some sections of a page and keeps the rest: `'{"Colors":["Brand ramps"]}'`. Colors is too large for one call: build `Roles` first, then `Brand ramps`.
3. Send the printed code to `use_figma`. Its result gives, per page, the tokens of each section, which must equal the counts of the Storybook specimens, the texts without a style and without bound typography (`unstyled`), which must be 0, and the paints without a variable (`rawPaints`), which must be 0.
4. Look at each page once, with `node.screenshot()` on its sections.
5. Assemble the check with `check` instead of the page names, and send it. `mismatches` must be empty: every section shows exactly the variables the map selects, in the order of the export, with their current descriptions.
6. Run the order script below on the `tokens.json` built from the current export. Each section prints its count and the hash of its order as Storybook shows it, and both must equal what the check prints for the section.

What Figma does with the bindings:

- A variable bound to a range of a text detaches the text style and binds the style's other properties instead; the audit counts such a text as styled when its font family and size are bound.
- A text binds a string variable to its characters, but not a number: the easings show their value, the durations carry it in their names.
- `visible` binds a boolean, which shows the underline of links and the brand flags of Themes.

## The assembler

```js
import fs from 'node:fs';

// node assemble.mjs <pages.json> <builder.js | check.js> <figma pages, comma-separated | check> '<ONLY as JSON>'
const [mapPath, scriptPath, wanted, only = '{}'] = process.argv.slice(2);
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
// The defaults of pages.ts: a specimen shows tokens without a preview, a page keeps its title in Figma.
const norm = (page) => ({
  title: page.title,
  figma: page.figma ?? page.title,
  only: page.only,
  lead: page.lead,
  specimens: page.specimens.map((s) => ({
    title: s.title,
    shows: s.shows ?? 'tokens',
    preview: s.preview ?? 'none',
    axis: s.axis,
    note: s.note,
    rows: s.rows ?? [],
    only: s.only,
    groups: (s.groups ?? []).map((g) => ({
      caption: g.caption,
      collections: g.collections,
      prefix: g.prefix,
      exclude: g.exclude ?? [],
    })),
  })),
});
let header;
if (wanted === 'check') {
  const specs = map.pages
    .filter((p) => p.only !== 'storybook')
    .flatMap((p) =>
      norm(p)
        .specimens.filter((s) => s.only !== 'storybook' && s.shows === 'tokens')
        .map((s) => [p.figma ?? p.title, s.title, s.preview, s.groups]),
    );
  header = `const SPECS = ${JSON.stringify(specs)};\nconst ORDER = ${JSON.stringify(map.figmaOrder)};\nconst HAND_MADE = ${JSON.stringify(map.handMade ?? [])};\n`;
} else {
  const pages = wanted
    .split(',')
    .map((name) => norm(map.pages.find((p) => (p.figma ?? p.title) === name)));
  header = `const PAGES = ${JSON.stringify(pages)};\nconst ORDER = ${JSON.stringify(map.figmaOrder)};\nconst ONLY = ${only};\n`;
}
const code = header + fs.readFileSync(scriptPath, 'utf8');
new (Object.getPrototypeOf(async function () {}).constructor)(code); // throws on a syntax error
process.stdout.write(code);
```

## The builder

```js
// Builds Foundations pages of [Core] Foundations from the map of the pages (apps/storybook/src/foundations/pages.json).
// Inputs, defined above this code: PAGES (map entries to build), ORDER (figmaOrder of the map), ONLY (page name -> section titles to rebuild).
// Every page gets one frame, `<page> · generated`, which a re-run replaces. Every colour, padding, gap,
// radius and stroke binds a role; every text takes one of the typography styles.
const out = { pages: [], warnings: [] };
await Promise.all(
  ['Regular', 'Medium', 'Semi Bold'].map((style) =>
    figma.loadFontAsync({ family: 'Inter', style }),
  ),
);

const collections = await figma.variables.getLocalVariableCollectionsAsync();
const colByName = Object.fromEntries(collections.map((c) => [c.name, c]));
const colById = Object.fromEntries(collections.map((c) => [c.id, c]));
const allVars = await figma.variables.getLocalVariablesAsync();
const varById = new Map(allVars.map((v) => [v.id, v]));
const varByKey = new Map(
  allVars.map((v) => [`${colById[v.variableCollectionId].name}|${v.name}`, v]),
);
function V(collection, name) {
  const v = varByKey.get(`${collection}|${name}`);
  if (!v) throw new Error(`variable ${collection}/${name} not found`);
  return v;
}
const S = (name) => V('Surfaces', name);
const Z = (name) => V('Sizes', name);
const T = (name) => V('Themes', name);
const cssName = (v) =>
  v.codeSyntax && v.codeSyntax.WEB ? v.codeSyntax.WEB.replace(/^var\((.*)\)$/, '$1') : '';
const TS = Object.fromEntries((await figma.getLocalTextStylesAsync()).map((s) => [s.name, s]));
const FX = Object.fromEntries((await figma.getLocalEffectStylesAsync()).map((s) => [s.name, s]));

// ---------- binding helpers
const solid = (variable) =>
  figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0, g: 0, b: 0 } },
    'color',
    variable,
  );
function fill(node, variable) {
  node.fills = [solid(variable)];
  return node;
}
function stroke(node, variable, weight) {
  node.strokes = [solid(variable)];
  node.setBoundVariable('strokeWeight', weight || T('stroke/border'));
  return node;
}
function pad(node, inline, stack) {
  if (inline) for (const f of ['paddingLeft', 'paddingRight']) node.setBoundVariable(f, inline);
  if (stack) for (const f of ['paddingTop', 'paddingBottom']) node.setBoundVariable(f, stack);
  return node;
}
function gap(node, variable, counter) {
  node.setBoundVariable('itemSpacing', variable);
  if (counter) node.setBoundVariable('counterAxisSpacing', counter);
  return node;
}
function corners(node, variable) {
  for (const f of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'])
    node.setBoundVariable(f, variable);
  return node;
}
function box(name, direction) {
  const f = figma.createAutoLayout(direction || 'VERTICAL');
  f.name = name;
  f.fills = [];
  return f;
}
function fixedWidth(frame, width) {
  frame.resize(width, Math.max(frame.height, 1));
  if (frame.layoutMode === 'VERTICAL') {
    frame.counterAxisSizingMode = 'FIXED';
    frame.primaryAxisSizingMode = 'AUTO';
  } else {
    frame.primaryAxisSizingMode = 'FIXED';
    frame.counterAxisSizingMode = 'AUTO';
  }
  return frame;
}
function add(parent, child, fillWidth) {
  parent.appendChild(child);
  if (fillWidth) child.layoutSizingHorizontal = 'FILL';
  return child;
}
async function txt(content, style, color) {
  const t = figma.createText();
  await t.setTextStyleIdAsync(TS[style].id);
  t.characters = content;
  fill(t, S(color || 'color/text/primary'));
  return t;
}
async function para(parent, content, style, color, width) {
  for (const line of content.split('\n')) {
    const t = await txt(line, style, color);
    parent.appendChild(t);
    if (width) {
      t.resize(width, t.height);
      t.textAutoResize = 'HEIGHT';
    } else {
      t.layoutSizingHorizontal = 'FILL';
      t.textAutoResize = 'HEIGHT';
    }
  }
}
function modes(node, pairs) {
  for (const [colName, modeName] of pairs) {
    const c = colByName[colName];
    const m = c.modes.find((x) => x.name === modeName);
    if (!m) throw new Error(`mode ${colName}/${modeName} not found`);
    node.setExplicitVariableModeForCollection(c, m.modeId);
  }
  return node;
}
// The modes an axis compares: Sizes holds both the screen and the density, and the
// frames stand on Desktop, so a density compares Desktop with Desktop Compact.
const AXIS = {
  theme: { col: 'Themes' },
  surface: { col: 'Surfaces' },
  size: { col: 'Sizes', names: ['Mobile', 'Desktop'] },
  density: { col: 'Sizes', names: ['Desktop', 'Desktop Compact'] },
};
const axisModes = (axis) =>
  axis
    ? colByName[AXIS[axis].col].modes
        .filter((m) => !AXIS[axis].names || AXIS[axis].names.includes(m.name))
        .map((m) => ({ col: AXIS[axis].col, name: m.name }))
    : [null];

// The variables of a collection in the order of the export and of Storybook: the tree of their
// names, each group where its first variable stands. Figma lists variables in the order they were
// created, so a variable added later would land at the end of its collection instead of its group.
// Plain objects order the keys as the export's JSON does, numbers first.
function treeOrder(colName) {
  const root = { children: {} };
  for (const id of colByName[colName].variableIds) {
    const v = varById.get(id);
    if (!v) continue;
    let node = root;
    for (const segment of v.name.split('/'))
      node = node.children[segment] || (node.children[segment] = { children: {} });
    node.variable = v;
  }
  const ordered = [];
  const walk = (node) => {
    if (node.variable) ordered.push(node.variable);
    for (const key of Object.keys(node.children)) walk(node.children[key]);
  };
  walk(root);
  return ordered;
}

// The tokens of a group as Storybook picks them: collection, prefix of the custom property, not
// hidden; a name that Themes and Surfaces share takes the Surfaces variable.
const RANK = { Components: 3, Surfaces: 2, Themes: 1 };
function tokensOf(group) {
  const picked = new Map();
  for (const colName of group.collections) {
    for (const v of treeOrder(colName)) {
      if (v.hiddenFromPublishing) continue;
      const css = cssName(v);
      if (!css.startsWith(group.prefix) || (group.exclude || []).some((p) => css.startsWith(p)))
        continue;
      const prev = picked.get(css);
      if (!prev || (RANK[colName] || 0) > (RANK[colById[prev.variableCollectionId].name] || 0))
        picked.set(css, v);
    }
  }
  return [...picked.values()];
}

// ---------- previews
const W = { preview: 176, name: 320, sample: 440 };
let unboundValues = 0;
async function valueText(v) {
  const t = await txt(' ', 'Body/Small', 'color/text/secondary');
  try {
    t.setBoundVariable('characters', v);
  } catch (e) {
    unboundValues++;
    t.remove();
    return null;
  }
  if (!t.boundVariables || !t.boundVariables.characters) {
    unboundValues++;
    t.remove();
    return null;
  }
  return t;
}
function shadowStyleFor(css) {
  const m = /^--shadow-(elevation|interactive|inset)-(.+)$/.exec(css);
  if (!m) return null;
  if (m[1] === 'elevation') return `Shadow/Elevation/${m[2]}`;
  if (m[1] === 'interactive') return `Shadow/Interactive/${m[2][0].toUpperCase()}${m[2].slice(1)}`;
  return m[2] === 'subtle' ? 'Shadow/Inset/xs' : null;
}
async function preview(kind, v) {
  const css = cssName(v);
  if (kind === 'swatch') {
    const r = figma.createRectangle();
    r.resize(64, 32);
    fill(r, v);
    stroke(r, S('color/border/subtle'));
    corners(r, T('radius/sm'));
    return r;
  }
  if (kind === 'length') {
    if (/max-width/.test(css)) return null;
    const r = figma.createRectangle();
    r.resize(8, 8);
    r.setBoundVariable('width', v);
    fill(r, S('color/brand/primary/default'));
    return r;
  }
  if (kind === 'radius') {
    const f = box('Radius', 'VERTICAL');
    f.resize(56, 56);
    f.primaryAxisSizingMode = 'FIXED';
    f.counterAxisSizingMode = 'FIXED';
    fill(f, S('color/background/subtle'));
    stroke(f, S('color/border/default'));
    corners(f, v);
    return f;
  }
  if (kind === 'stroke') {
    const f = box('Stroke', 'VERTICAL');
    f.resize(64, 32);
    f.primaryAxisSizingMode = 'FIXED';
    f.counterAxisSizingMode = 'FIXED';
    stroke(f, css.includes('ring') ? S('color/ring/default') : S('color/border/strong'), v);
    return f;
  }
  if (kind === 'shadow') {
    const name = shadowStyleFor(css);
    const f = box('Shadow', 'VERTICAL');
    f.resize(72, 40);
    f.primaryAxisSizingMode = 'FIXED';
    f.counterAxisSizingMode = 'FIXED';
    fill(f, S('color/background/default'));
    stroke(f, S('color/border/subtle'));
    corners(f, T('radius/md'));
    if (name && FX[name]) await f.setEffectStyleIdAsync(FX[name].id);
    return f;
  }
  if (kind === 'icon') {
    const f = box('Icon', 'VERTICAL');
    f.resize(16, 16);
    f.primaryAxisSizingMode = 'FIXED';
    f.counterAxisSizingMode = 'FIXED';
    f.setBoundVariable('width', v);
    f.setBoundVariable('height', v);
    stroke(f, S('color/icon/default'));
    corners(f, T('radius/sm'));
    return f;
  }
  if (kind === 'font') {
    const t = await txt('Ag', 'Heading/H3');
    if (v.resolvedType === 'STRING') {
      // Binding a family needs the font loaded; a family missing from this machine shows its name.
      const family = await v.resolveForConsumer(t);
      try {
        await figma.loadFontAsync({ family: String(family.value), style: 'Regular' });
      } catch (e) {
        t.remove();
        return valueText(v);
      }
    }
    t.setRangeBoundVariable(0, 2, v.resolvedType === 'STRING' ? 'fontFamily' : 'fontWeight', v);
    return t;
  }
  if (kind === 'link') {
    const f = box('Link', 'VERTICAL');
    const t = await txt('Read the guide', 'Body', 'color/link/default');
    // The underline flag sits in the same group as the weight; only the weight binds to the text.
    if (v.resolvedType === 'FLOAT')
      t.setRangeBoundVariable(0, t.characters.length, 'fontWeight', v);
    f.appendChild(t);
    const line = figma.createRectangle();
    line.resize(t.width, 1);
    line.setBoundVariable('height', T('stroke/border'));
    fill(line, S('color/link/default'));
    line.setBoundVariable('visible', T('typography/link/text-underline'));
    add(f, line, true);
    return f;
  }
  if (kind === 'value') return valueText(v);
  if (kind === 'brand') {
    const name = v.name;
    if (name.startsWith('font/') || name.startsWith('font-weight/')) return preview('font', v);
    if (name.startsWith('radius/')) return preview('radius', v);
    if (name === 'ring/width') return preview('stroke', v);
    if (name === 'ring/offset') return preview('length', v);
    if (v.resolvedType === 'BOOLEAN') {
      const dot = figma.createEllipse();
      dot.resize(12, 12);
      fill(dot, S('color/feedback/success/base'));
      dot.setBoundVariable('visible', v);
      return dot;
    }
    return valueText(v);
  }
  return null;
}

// ---------- blocks
async function tokenTable(parent, spec, tokens) {
  const ms = axisModes(spec.axis);
  const withPreview = spec.preview !== 'none';
  const table = add(parent, box('Table', 'VERTICAL'), true);
  const head = add(table, gap(box('Header', 'HORIZONTAL'), Z('layout/gap/inline/lg')), true);
  pad(head, null, Z('layout/padding/stack/sm'));
  if (withPreview) {
    for (const m of ms) {
      const c = add(head, fixedWidth(box('Cell', 'VERTICAL'), W.preview));
      await para(
        c,
        m ? m.name : spec.preview === 'value' ? 'Value' : 'Preview',
        'Body/Small',
        'color/text/secondary',
      );
    }
  }
  const hn = add(head, fixedWidth(box('Cell', 'VERTICAL'), W.name));
  await para(hn, 'Token', 'Body/Small', 'color/text/secondary');
  const hd = add(head, box('Cell', 'VERTICAL'), true);
  await para(hd, 'Description', 'Body/Small', 'color/text/secondary');
  for (const v of tokens) {
    const sep = figma.createRectangle();
    sep.resize(10, 1);
    sep.setBoundVariable('height', T('stroke/border'));
    fill(sep, S('color/border/subtle'));
    add(table, sep, true);
    const row = add(table, gap(box(cssName(v), 'HORIZONTAL'), Z('layout/gap/inline/lg')), true);
    pad(row, null, Z('layout/padding/stack/md'));
    row.counterAxisAlignItems = 'CENTER';
    if (withPreview) {
      for (const m of ms) {
        const c = add(row, fixedWidth(box('Preview', 'VERTICAL'), W.preview));
        pad(c, Z('layout/padding/inline/sm'), Z('layout/padding/stack/sm'));
        corners(c, T('radius/sm'));
        if (m) {
          modes(
            c,
            m.col === 'Themes'
              ? [
                  ['Themes', m.name],
                  ['Surfaces', 'Default'],
                ]
              : [[m.col, m.name]],
          );
          if (m.col === 'Themes') fill(c, S('color/background/default'));
        }
        const p = await preview(spec.preview, v);
        if (p) c.appendChild(p);
      }
    }
    const n = add(row, gap(fixedWidth(box('Name', 'VERTICAL'), W.name), Z('layout/gap/stack/sm')));
    await para(n, v.name, 'Body/Small', 'color/text/primary');
    await para(n, cssName(v), 'Body/Small', 'color/text/secondary');
    const d = add(row, box('Description', 'VERTICAL'), true);
    await para(d, v.description || ' ', 'Body/Small', 'color/text/secondary');
  }
  return table;
}
async function palette(parent, group) {
  const block = add(parent, gap(box(group.caption, 'VERTICAL'), Z('layout/gap/stack/md')), true);
  await para(block, group.caption, 'Heading/H5');
  const row = add(
    block,
    gap(box('Swatches', 'HORIZONTAL'), Z('layout/gap/inline/sm'), Z('layout/gap/stack/md')),
    true,
  );
  row.layoutWrap = 'WRAP';
  const tokens = tokensOf(group);
  for (const v of tokens) {
    const cell = add(row, gap(fixedWidth(box(v.name, 'VERTICAL'), 72), Z('layout/gap/stack/sm')));
    const r = figma.createRectangle();
    r.resize(72, 48);
    fill(r, v);
    stroke(r, S('color/border/subtle'));
    corners(r, T('radius/sm'));
    cell.appendChild(r);
    await para(cell, v.name.split('/').pop(), 'Body/Small', 'color/text/secondary');
  }
  return tokens.length;
}
const TYPE_ORDER = [
  'Heading/Display/Large',
  'Heading/Display',
  'Heading/Title',
  'Heading/Subtitle',
  'Heading/H1',
  'Heading/H2',
  'Heading/H3',
  'Heading/H4',
  'Heading/H5',
  'Heading/H6',
  'Body/Large',
  'Body',
  'Body/Small',
  'Caption',
  'Eyebrow',
];
async function textStyles(parent) {
  const table = add(parent, box('Styles', 'VERTICAL'), true);
  for (const name of TYPE_ORDER) {
    if (!TS[name]) {
      out.warnings.push(`text style ${name} missing`);
      continue;
    }
    const sep = figma.createRectangle();
    sep.resize(10, 1);
    sep.setBoundVariable('height', T('stroke/border'));
    fill(sep, S('color/border/subtle'));
    add(table, sep, true);
    const row = add(table, gap(box(name, 'HORIZONTAL'), Z('layout/gap/inline/lg')), true);
    pad(row, null, Z('layout/padding/stack/lg'));
    const n = add(row, gap(fixedWidth(box('Name', 'VERTICAL'), W.name), Z('layout/gap/stack/sm')));
    await para(n, name, 'Body/Small', 'color/text/primary');
    await para(
      n,
      `ui-text-${name.toLowerCase().replace(/\//g, '-')}`,
      'Body/Small',
      'color/text/secondary',
    );
    for (const size of ['Mobile', 'Desktop']) {
      const c = add(
        row,
        gap(
          fixedWidth(modes(box(size, 'VERTICAL'), [['Sizes', size]]), W.sample),
          Z('layout/gap/stack/sm'),
        ),
      );
      await para(c, size, 'Body/Small', 'color/text/secondary');
      await para(c, 'The quick brown fox jumps over the lazy dog', name);
    }
  }
}
async function compositeShadows(parent) {
  const row = add(
    parent,
    gap(
      box('Composite shadows', 'HORIZONTAL'),
      Z('layout/gap/inline/lg'),
      Z('layout/gap/stack/xl'),
    ),
    true,
  );
  row.layoutWrap = 'WRAP';
  pad(row, Z('layout/padding/inline/lg'), Z('layout/padding/stack/xl'));
  fill(row, S('color/background/subtle'));
  corners(row, T('radius/lg'));
  const names = [
    'Shadow/2xs',
    'Shadow/xs',
    'Shadow/sm',
    'Shadow/md',
    'Shadow/lg',
    'Shadow/xl',
    'Shadow/2xl',
    'Shadow/Inset/2xs',
    'Shadow/Inset/xs',
    'Shadow/Inset/sm',
  ];
  for (const name of names) {
    const cell = add(row, gap(fixedWidth(box(name, 'VERTICAL'), 160), Z('layout/gap/stack/md')));
    const card = box('Card', 'VERTICAL');
    card.resize(160, 96);
    card.primaryAxisSizingMode = 'FIXED';
    card.counterAxisSizingMode = 'FIXED';
    fill(card, S('color/background/default'));
    corners(card, T('radius/md'));
    await card.setEffectStyleIdAsync(FX[name].id);
    cell.appendChild(card);
    await para(cell, name, 'Body/Small');
    await para(
      cell,
      name.startsWith('Shadow/Inset/')
        ? `--inset-shadow-${name.split('/').pop()}`
        : `--shadow-${name.split('/').pop()}`,
      'Body/Small',
      'color/text/secondary',
    );
  }
}
async function surfaceMatrix(parent) {
  const grid = add(parent, gap(box('Matrix', 'VERTICAL'), Z('layout/gap/stack/xl')), true);
  for (const theme of colByName.Themes.modes.map((m) => m.name)) {
    const row = add(grid, gap(box(theme, 'HORIZONTAL'), Z('layout/gap/inline/lg')), true);
    for (const surface of colByName.Surfaces.modes.map((m) => m.name)) {
      const cell = add(
        row,
        gap(
          fixedWidth(
            modes(box(`${theme} · ${surface}`, 'VERTICAL'), [
              ['Themes', theme],
              ['Surfaces', surface],
            ]),
            320,
          ),
          Z('layout/gap/stack/md'),
        ),
      );
      pad(cell, Z('layout/padding/inline/2xl'), Z('layout/padding/stack/2xl'));
      fill(cell, S('color/background/default'));
      stroke(cell, S('color/border/subtle'));
      corners(cell, T('radius/lg'));
      await para(cell, `${theme} · ${surface}`, 'Eyebrow', 'color/text/secondary');
      await para(cell, 'Quarterly report', 'Heading/H4');
      await para(
        cell,
        'Body text in the secondary colour, on the same markup.',
        'Body/Small',
        'color/text/secondary',
      );
      await para(cell, 'Read the guide', 'Body/Small', 'color/link/default');
      const action = add(
        cell,
        pad(
          gap(box('Action', 'HORIZONTAL'), Z('layout/gap/inline/sm')),
          Z('layout/padding/inline/lg'),
          Z('layout/padding/stack/md'),
        ),
      );
      fill(action, S('color/action/primary/base/default'));
      corners(action, T('radius/md'));
      action.appendChild(
        await txt('Continue', 'Body/Small', 'color/action/primary/on-base/default'),
      );
      const line = figma.createRectangle();
      line.resize(10, 1);
      line.setBoundVariable('height', T('stroke/border'));
      fill(line, S('color/border/default'));
      add(cell, line, true);
    }
  }
}
async function simpleTable(parent, header, rows, widths) {
  const table = add(parent, box('Table', 'VERTICAL'), true);
  const lines = [header, ...rows];
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) {
      const sep = figma.createRectangle();
      sep.resize(10, 1);
      sep.setBoundVariable('height', T('stroke/border'));
      fill(sep, S('color/border/subtle'));
      add(table, sep, true);
    }
    const row = add(table, gap(box(`Row ${i}`, 'HORIZONTAL'), Z('layout/gap/inline/lg')), true);
    pad(row, null, Z('layout/padding/stack/md'));
    for (let j = 0; j < lines[i].length; j++) {
      const last = j === lines[i].length - 1;
      const c = add(
        row,
        last ? box('Cell', 'VERTICAL') : fixedWidth(box('Cell', 'VERTICAL'), widths[j]),
        last,
      );
      await para(
        c,
        lines[i][j],
        'Body/Small',
        i === 0 || j > 0 ? 'color/text/secondary' : 'color/text/primary',
      );
    }
  }
}
const modeList = (name) => {
  const c = colByName[name];
  if (!c) return '';
  return c.modes.length === 1 ? 'One mode' : c.modes.map((m) => m.name).join(', ');
};
async function brandPreview(parent) {
  const card = add(
    parent,
    gap(fixedWidth(box('Brand preview', 'VERTICAL'), 640), Z('layout/gap/stack/lg')),
  );
  pad(card, Z('layout/padding/inline/2xl'), Z('layout/padding/stack/2xl'));
  fill(card, S('color/background/default'));
  stroke(card, S('color/border/subtle'));
  corners(card, T('radius/lg'));
  await para(card, 'Preview', 'Eyebrow', 'color/text/secondary');
  await para(card, 'A heading in the brand', 'Heading/H2');
  await para(
    card,
    'Body text in the font of the brand, with the colours of the roles.',
    'Body',
    'color/text/secondary',
  );
  card.appendChild(await preview('link', T('typography/link/font-weight')));
  const actions = add(card, gap(box('Actions', 'HORIZONTAL'), Z('layout/gap/inline/lg')));
  actions.counterAxisAlignItems = 'CENTER';
  const button = add(
    actions,
    pad(box('Action', 'HORIZONTAL'), Z('layout/padding/inline/lg'), Z('layout/padding/stack/md')),
  );
  fill(button, S('color/action/primary/base/default'));
  corners(button, T('radius/md'));
  const label = await txt('Continue', 'Body/Small', 'color/action/primary/on-base/default');
  label.setRangeBoundVariable(
    0,
    label.characters.length,
    'fontWeight',
    T('typography/body/font-weight-strong'),
  );
  button.appendChild(label);
  const ring = add(actions, box('Focus ring', 'HORIZONTAL'));
  stroke(ring, S('color/ring/default'), T('stroke/ring'));
  corners(ring, T('radius/lg'));
  pad(ring, T('ring/offset'), T('ring/offset'));
  const focused = add(
    ring,
    pad(box('Focused', 'HORIZONTAL'), Z('layout/padding/inline/lg'), Z('layout/padding/stack/md')),
  );
  fill(focused, S('color/action/secondary/base/default'));
  corners(focused, T('radius/md'));
  focused.appendChild(await txt('Focused', 'Body/Small', 'color/action/secondary/on-base/default'));
}
async function boldWords(parent) {
  const sentence = 'Bold words keep the style of their text and take its strong weight.';
  const t = await txt(sentence, 'Body');
  const start = sentence.indexOf('strong weight');
  t.setRangeBoundVariable(
    start,
    start + 'strong weight'.length,
    'fontWeight',
    T('typography/body/font-weight-strong'),
  );
  add(parent, t, true);
  t.textAutoResize = 'HEIGHT';
  const font = t.getRangeFontName(start, start + 1);
  if (!font || font.style !== 'Semi Bold')
    out.warnings.push(`bold words read back ${JSON.stringify(font)}`);
}

// ---------- page scaffold
function audit(root) {
  let nodes = 0,
    texts = 0,
    unstyled = 0,
    rawPaints = 0;
  for (const n of [root, ...root.findAll(() => true)]) {
    nodes++;
    if (n.type === 'TEXT') {
      texts++;
      // A preview of a typography token binds the token itself, which detaches the style.
      if (
        !n.textStyleId &&
        !(n.boundVariables && n.boundVariables.fontFamily && n.boundVariables.fontSize)
      )
        unstyled++;
    }
    for (const key of ['fills', 'strokes']) {
      if (key in n && Array.isArray(n[key]))
        for (const p of n[key])
          if (p.type === 'SOLID' && !(p.boundVariables && p.boundVariables.color)) rawPaints++;
    }
  }
  return { nodes, texts, unstyled, rawPaints };
}
async function header(frame, page) {
  const head = add(frame, gap(box('Header', 'VERTICAL'), Z('layout/gap/stack/md')), true);
  await para(head, '[Core] Foundations', 'Eyebrow', 'color/text/secondary');
  await para(head, page.figma, 'Heading/Display');
  if (page.lead) await para(head, page.lead, 'Body/Large', 'color/text/secondary', 880);
  if (page.only !== 'figma')
    await para(head, `Storybook: Foundations/${page.title}`, 'Body/Small', 'color/text/secondary');
}
async function section(frame, spec) {
  const sec = add(frame, gap(box(spec.title, 'VERTICAL'), Z('layout/gap/stack/lg')), true);
  pad(sec, null, Z('layout/padding/stack/3xl'));
  const sep = figma.createRectangle();
  sep.resize(10, 1);
  sep.setBoundVariable('height', T('stroke/border'));
  fill(sep, S('color/border/default'));
  add(sec, sep, true);
  await para(sec, spec.title, 'Heading/H2');
  if (spec.note) await para(sec, spec.note, 'Body', 'color/text/secondary', 880);
  let count = 0;
  if (spec.shows === 'tokens') {
    if (spec.preview === 'ramp') {
      for (const g of spec.groups) count += await palette(sec, g);
    } else if (spec.groups.some((g) => g.caption)) {
      for (const g of spec.groups) {
        const tokens = tokensOf(g);
        count += tokens.length;
        await para(sec, g.caption, 'Heading/H5');
        await tokenTable(sec, spec, tokens);
      }
    } else {
      const tokens = spec.groups.flatMap((g) => tokensOf(g));
      count = tokens.length;
      await tokenTable(sec, spec, tokens);
    }
  } else if (spec.shows === 'text-styles') await textStyles(sec);
  else if (spec.shows === 'composite-shadows') await compositeShadows(sec);
  else if (spec.shows === 'surface-matrix') await surfaceMatrix(sec);
  else if (spec.shows === 'collections')
    await simpleTable(
      sec,
      ['Collection', 'Layer', 'Modes', 'Use'],
      spec.rows.map((r) => [r[0], r[1], modeList(r[0]), r[2]]),
      [200, 120, 280],
    );
  else if (spec.shows === 'modes')
    await simpleTable(
      sec,
      ['Collection', 'Modes', 'In code'],
      spec.rows.map((r) => [r[0], modeList(r[0]), r[1]]),
      [200, 360],
    );
  else if (spec.shows === 'brand-preview') await brandPreview(sec);
  else if (spec.shows === 'bold-words') await boldWords(sec);
  return count;
}
// ---------- run
for (let i = 0; i < ORDER.length; i++) {
  let p = figma.root.children.find((x) => x.name === ORDER[i]);
  if (!p) {
    p = figma.createPage();
    p.name = ORDER[i];
  }
  if (figma.root.children.indexOf(p) !== i) figma.root.insertChild(i, p);
}
for (const page of PAGES) {
  const target = figma.root.children.find((x) => x.name === page.figma);
  await figma.setCurrentPageAsync(target);
  const name = `${page.figma} · generated`;
  // The frame of an earlier name of the page goes, so a renamed page keeps one frame.
  for (const stale of target.children.filter(
    (x) => x.name.endsWith(' · generated') && x.name !== name,
  )) {
    stale.locked = false;
    stale.remove();
  }
  let frame = target.children.find((x) => x.name === name);
  const only = ONLY[page.figma] || null;
  const fresh = !frame || !only;
  if (frame && fresh) {
    frame.locked = false;
    frame.remove();
  }
  if (fresh) {
    frame = box(name, 'VERTICAL');
    target.appendChild(frame);
    frame.x = 0;
    frame.y = 0;
    fixedWidth(frame, 1440);
    modes(frame, [
      ['Themes', 'Light'],
      ['Surfaces', 'Default'],
      ['Sizes', 'Desktop'],
    ]);
    pad(frame, Z('layout/padding/inline/3xl'), Z('layout/padding/stack/3xl'));
    gap(frame, Z('layout/gap/stack/xl'));
    fill(frame, S('color/background/default'));
    await header(frame, page);
  }
  frame.locked = false;
  // A section the map no longer lists goes first, so a removed or renamed specimen leaves nothing.
  const titles = page.specimens.filter((s) => s.only !== 'storybook').map((s) => s.title);
  for (const child of [...frame.children])
    if (child.type === 'FRAME' && child.name !== 'Header' && !titles.includes(child.name))
      child.remove();
  const counts = {};
  for (const spec of page.specimens) {
    if (spec.only === 'storybook') continue;
    if (only && !only.includes(spec.title)) continue;
    const existing = frame.children.find((x) => x.name === spec.title && x.type === 'FRAME');
    if (existing) existing.remove();
    counts[spec.title] = await section(frame, spec);
    // A section rebuilt alone goes back to its place, after the header and the sections before it.
    const placed = frame.children.find((x) => x.name === spec.title && x.type === 'FRAME');
    const index = page.specimens.filter((s) => s.only !== 'storybook').indexOf(spec);
    if (only && placed) frame.insertChild(index + 1, placed);
  }
  frame.locked = true;
  out.pages.push({
    page: page.figma,
    frame: frame.id,
    counts,
    ...audit(frame),
    height: Math.round(frame.height),
  });
}
out.unboundValues = unboundValues;
out.pageOrder = figma.root.children.map((p) => p.name);
return out;
```

## The check

```js
// Check mode: compares the generated Foundations pages with the variables the map selects.
// Input, defined above this code: SPECS ([figma page, section title, preview, groups] of every token section), ORDER,
// HAND_MADE (the pages designed by hand, which the check leaves alone).
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const colByName = Object.fromEntries(collections.map((c) => [c.name, c]));
const colById = Object.fromEntries(collections.map((c) => [c.id, c]));
const allVars = await figma.variables.getLocalVariablesAsync();
const varById = new Map(allVars.map((v) => [v.id, v]));
const cssName = (v) =>
  v.codeSyntax && v.codeSyntax.WEB ? v.codeSyntax.WEB.replace(/^var\((.*)\)$/, '$1') : '';
// The variables of a collection in the order of the export and of Storybook: the tree of their
// names, each group where its first variable stands. Figma lists variables in the order they were
// created, so a variable added later would land at the end of its collection instead of its group.
// Plain objects order the keys as the export's JSON does, numbers first.
function treeOrder(colName) {
  const root = { children: {} };
  for (const id of colByName[colName].variableIds) {
    const v = varById.get(id);
    if (!v) continue;
    let node = root;
    for (const segment of v.name.split('/'))
      node = node.children[segment] || (node.children[segment] = { children: {} });
    node.variable = v;
  }
  const ordered = [];
  const walk = (node) => {
    if (node.variable) ordered.push(node.variable);
    for (const key of Object.keys(node.children)) walk(node.children[key]);
  };
  walk(root);
  return ordered;
}

const RANK = { Components: 3, Surfaces: 2, Themes: 1 };
function tokensOf(group) {
  const picked = new Map();
  for (const colName of group.collections) {
    for (const v of treeOrder(colName)) {
      if (v.hiddenFromPublishing) continue;
      const css = cssName(v);
      if (!css.startsWith(group.prefix) || (group.exclude || []).some((p) => css.startsWith(p)))
        continue;
      const prev = picked.get(css);
      if (!prev || (RANK[colName] || 0) > (RANK[colById[prev.variableCollectionId].name] || 0))
        picked.set(css, v);
    }
  }
  return [...picked.values()];
}
function fnv(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
const report = { pages: [], mismatches: [], styles: {} };
const pageNames = figma.root.children.map((p) => p.name);
report.order = JSON.stringify(pageNames) === JSON.stringify(ORDER) ? 'ok' : pageNames;
for (const name of ORDER) {
  if (HAND_MADE.includes(name)) {
    report.pages.push(`${name}: designed by hand, left alone`);
    continue;
  }
  const page = figma.root.children.find((p) => p.name === name);
  await figma.setCurrentPageAsync(page);
  const frames = page.children.map((c) => c.name);
  const frame = page.children.find((c) => c.name === `${name} · generated`);
  let nodes = 0,
    unstyled = 0,
    rawPaints = 0;
  for (const n of frame ? [frame, ...frame.findAll(() => true)] : []) {
    nodes++;
    if (
      n.type === 'TEXT' &&
      !n.textStyleId &&
      !(n.boundVariables && n.boundVariables.fontFamily && n.boundVariables.fontSize)
    )
      unstyled++;
    for (const key of ['fills', 'strokes'])
      if (key in n && Array.isArray(n[key]))
        for (const p of n[key])
          if (p.type === 'SOLID' && !(p.boundVariables && p.boundVariables.color)) rawPaints++;
  }
  const sections = [];
  for (const [pageName, title, preview, groups] of SPECS.filter((s) => s[0] === name)) {
    const sec = frame && frame.children.find((c) => c.name === title && c.type === 'FRAME');
    if (!sec) {
      report.mismatches.push(`${name} / ${title}: section missing`);
      continue;
    }
    const expected = groups.flatMap((g) => tokensOf(g));
    let shown;
    if (preview === 'ramp')
      shown = sec
        .findAll((n) => n.type === 'FRAME' && n.parent && n.parent.name === 'Swatches')
        .map((n) => n.name);
    else
      shown = sec
        .findAll(
          (n) =>
            n.type === 'FRAME' && n.parent && n.parent.name === 'Table' && n.name.startsWith('--'),
        )
        .map((n) => n.name);
    const want = expected.map((v) => (preview === 'ramp' ? v.name : cssName(v)));
    const missing = want.filter((x) => !shown.includes(x));
    const extra = shown.filter((x) => !want.includes(x));
    const outOfOrder = !missing.length && !extra.length && shown.join() !== want.join();
    let staleDescriptions = 0;
    if (preview !== 'ramp') {
      for (const v of expected) {
        const row = sec.findOne((n) => n.type === 'FRAME' && n.name === cssName(v));
        const d = row && row.children.find((c) => c.name === 'Description');
        const text = d && d.children[0] && d.children[0].characters;
        if (text !== (v.description || ' ')) staleDescriptions++;
      }
    }
    if (missing.length || extra.length || staleDescriptions || outOfOrder)
      report.mismatches.push(
        `${name} / ${title}: missing ${missing.join(' ')} extra ${extra.join(' ')} stale descriptions ${staleDescriptions}${outOfOrder ? ' out of order' : ''}`,
      );
    // The custom properties in the order shown, hashed, to compare with the order of Storybook.
    const css = shown.map((x) => {
      const v = preview === 'ramp' ? expected.find((e) => e.name === x) : null;
      return v ? cssName(v) : x;
    });
    sections.push(`${title} ${shown.length}/${want.length} ${fnv(css.join('\n'))}`);
  }
  report.pages.push(
    `${name}: frames ${frames.length} [${frames.join(', ')}], nodes ${nodes}, unstyled ${unstyled}, raw paints ${rawPaints}, locked ${frame ? frame.locked : '-'}${sections.length ? ', ' + sections.join(', ') : ''}`,
  );
}
report.styles = {
  text: (await figma.getLocalTextStylesAsync()).length,
  effect: (await figma.getLocalEffectStylesAsync()).length,
  paint: (await figma.getLocalPaintStylesAsync()).length,
};
return report;
```

## The order against Storybook

```js
import fs from 'node:fs';

// node order.mjs <pages.json> <tokens.json>: the count and the hash of the order of every token
// section of the Figma pages, as Storybook shows it. The check prints the same for the pages.
const [mapPath, manifestPath] = process.argv.slice(2);
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
const { tokens } = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
function fnv(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
for (const page of map.pages.filter((p) => p.only !== 'storybook')) {
  for (const s of page.specimens) {
    if (s.only === 'storybook' || (s.shows ?? 'tokens') !== 'tokens') continue;
    const names = s.groups.flatMap((g) =>
      tokens
        .filter((t) => g.collections.includes(t.collection) && t.name.startsWith(g.prefix))
        .filter((t) => t.hidden !== true && !(g.exclude ?? []).some((x) => t.name.startsWith(x)))
        .map((t) => t.name),
    );
    console.log(
      `${page.figma ?? page.title} / ${s.title} ${names.length} ${fnv(names.join('\n'))}`,
    );
  }
}
```
