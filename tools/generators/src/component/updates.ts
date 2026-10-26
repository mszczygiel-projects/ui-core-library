import { type Tree, updateJson } from '@nx/devkit';

import type { ComponentNames } from './names.ts';

const sourceOf = (statement: string) =>
  /from\s+'([^']+)'|^import\s+'([^']+)'/m.exec(statement)?.slice(1).find(Boolean) ?? '';

const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

/**
 * The order of the import-sorting lint rule: `.` and `/` sort before other punctuation, so a
 * module sorts before the modules whose names extend it.
 */
const bySource = (a: string, b: string) => {
  const key = (source: string) =>
    source.replace(/[./_-]/g, (char) => ({ '.': '_', '/': '-', _: '.', '-': '/' })[char] ?? char);
  return collator.compare(key(a), key(b)) || byText(a, b);
};

/** Splits the lines of a module into statements, each of one or more lines. */
function statementsOf(lines: readonly string[]): { start: number; end: number; text: string }[] {
  const statements: { start: number; end: number; text: string }[] = [];
  for (let start = 0; start < lines.length; start += 1) {
    if (!/^(import|export) /.test(lines[start] ?? '')) {
      continue;
    }
    let end = start;
    while (end < lines.length - 1 && !/'[^']*';$/.test(lines[end] ?? '')) {
      end += 1;
    }
    const text = lines.slice(start, end + 1).join('\n');
    if (sourceOf(text) !== '') {
      statements.push({ start, end, text });
    }
    start = end;
  }
  return statements;
}

/**
 * Adds an import or export-from statement to the group of its kind, kept in the order of the
 * import-sorting lint rule. A group is a run of statements without a blank line; the kind is
 * whether the module is relative and whether the statement only loads it.
 */
export function addStatement(text: string, statement: string): string {
  if (text.includes(statement)) {
    return text;
  }
  const kind = (line: string) =>
    `${line.startsWith("import '") ? 'side-effect' : 'named'}:${sourceOf(line).startsWith('.') ? 'relative' : 'package'}`;
  const lines = text.split('\n');
  const wanted = kind(statement);
  const statements = statementsOf(lines);
  const first = statements.findIndex((candidate) => kind(candidate.text) === wanted);
  if (first === -1) {
    throw new Error(`No group of ${wanted} statements to add ${statement} to`);
  }
  let last = first;
  while (statements[last + 1]?.start === (statements[last]?.end ?? 0) + 1) {
    last += 1;
  }
  const group = statements.slice(first, last + 1);
  const sorted = [...group.map((member) => member.text), statement].sort((a, b) =>
    bySource(sourceOf(a), sourceOf(b)),
  );
  const from = group[0]?.start ?? 0;
  const to = group.at(-1)?.end ?? 0;
  return [...lines.slice(0, from), ...sorted, ...lines.slice(to + 1)].join('\n');
}

/** Adds a row to the first Markdown table of a README and keeps its rows in order. */
export function addTableRow(text: string, row: string): string {
  if (text.includes(row)) {
    return text;
  }
  const lines = text.split('\n');
  const head = lines.findIndex(
    (line) => line.startsWith('| ') && lines[lines.indexOf(line) + 1]?.startsWith('| -'),
  );
  if (head === -1) {
    throw new Error('No table to add a row to');
  }
  let end = head + 2;
  while (lines[end]?.startsWith('|') === true) {
    end += 1;
  }
  const rows = [...lines.slice(head + 2, end), row].sort(byText);
  return [...lines.slice(0, head + 2), ...rows, ...lines.slice(end)].join('\n');
}

function update(tree: Tree, path: string, change: (text: string) => string): void {
  const text = tree.read(path, 'utf-8');
  if (text === null) {
    throw new Error(`${path} does not exist`);
  }
  tree.write(path, change(text));
}

/** Registers a new component in the files that list every component. */
export function registerComponent(tree: Tree, n: ComponentNames): void {
  update(tree, 'packages/shared/src/components/index.ts', (text) =>
    addStatement(text, `import { ${n.camel} } from './${n.kebab}.ts';`).replace(
      /(export const specs: readonly ComponentSpec\[\] = \[)([^\]]*)\]/,
      (_match, start: string, list: string) => `${start}${list.trim()}, ${n.camel}]`,
    ),
  );
  updateJson(
    tree,
    'packages/shared/package.json',
    (manifest: { exports: Record<string, unknown> }) => {
      const { './package.json': self, ...exports } = manifest.exports;
      exports[`./${n.kebab}`] = {
        types: `./dist/components/${n.kebab}.d.ts`,
        default: `./dist/components/${n.kebab}.js`,
      };
      manifest.exports = {
        ...Object.fromEntries(Object.entries(exports).sort(([a], [b]) => byText(a, b))),
        './package.json': self,
      };
      return manifest;
    },
  );
  updateJson(
    tree,
    'packages/web-components/package.json',
    (manifest: { exports: Record<string, unknown> }) => {
      const {
        '.': root,
        './custom-elements.json': cem,
        './package.json': self,
        ...subpaths
      } = manifest.exports;
      subpaths[`./${n.kebab}`] = {
        types: `./dist/components/${n.tag}.d.ts`,
        default: `./dist/components/${n.tag}.js`,
      };
      manifest.exports = {
        '.': root,
        ...Object.fromEntries(Object.entries(subpaths).sort(([a], [b]) => byText(a, b))),
        './custom-elements.json': cem,
        './package.json': self,
      };
      return manifest;
    },
  );
  update(tree, 'packages/web-components/README.md', (text) =>
    addTableRow(text, `| ${n.name} | \`${n.tag}\` | \`./${n.kebab}\` |`),
  );
  update(tree, 'packages/react/README.md', (text) =>
    addTableRow(text, `| ${n.name} | \`${n.name}\` |`),
  );
  update(tree, 'packages/react/src/index.ts', (text) =>
    addStatement(
      text,
      `export { ${n.name}, type ${n.name}Props } from './${n.kebab}/${n.name}.tsx';`,
    ),
  );
  update(tree, 'testing/contracts/src/runners/web-components.test.ts', (text) => {
    let next = addStatement(
      text,
      `import '@mszczygiel-projects/ui-core-web-components/${n.kebab}';`,
    );
    next = addStatement(
      next,
      `import { mountWebComponent${n.name} } from '../harness/${n.kebab}.tsx';`,
    );
    next = addStatement(
      next,
      `import { ${n.camel}Contract } from '../specs/${n.kebab}.contract.ts';`,
    );
    return `${next.trimEnd()}\n\ndescribe('${n.name}, web component', () => {\n  ${n.camel}Contract(mountWebComponent${n.name});\n});\n`;
  });
  update(tree, 'testing/contracts/src/runners/react.test.tsx', (text) => {
    let next = addStatement(
      text,
      `import { mountReact${n.name} } from '../harness/${n.kebab}.tsx';`,
    );
    next = addStatement(
      next,
      `import { ${n.camel}Contract } from '../specs/${n.kebab}.contract.ts';`,
    );
    return `${next.trimEnd()}\n\ndescribe('${n.name}, React', () => {\n  ${n.camel}Contract(mountReact${n.name});\n});\n`;
  });
  update(tree, 'apps/storybook/src/components/web-components.d.ts', (text) =>
    addStatement(
      text,
      `import type { ${n.name}Props } from '@mszczygiel-projects/ui-core-shared/${n.kebab}';`,
    ).replace(
      /(\n {4}interface IntrinsicElements \{\n)/,
      `$1      '${n.tag}': CustomElement<${n.name}Props>;\n`,
    ),
  );
}
