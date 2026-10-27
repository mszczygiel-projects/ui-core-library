import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import componentGenerator from './generator.ts';
import { namesOf } from './names.ts';
import { componentFiles, TODO } from './templates.ts';
import { addStatement, addTableRow } from './updates.ts';

const root = join(import.meta.dirname, '..', '..', '..', '..');

/** The files that list every component, as the repository has them. */
const registries = [
  'packages/shared/src/components/index.ts',
  'packages/shared/package.json',
  'packages/web-components/package.json',
  'packages/web-components/README.md',
  'packages/react/README.md',
  'packages/react/src/index.ts',
  'testing/contracts/src/runners/web-components.test.ts',
  'testing/contracts/src/runners/react.test.tsx',
  'apps/storybook/src/components/web-components.d.ts',
];

const read = (tree: Tree, path: string) => tree.read(path, 'utf-8') ?? '';

describe('component generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    for (const path of registries) {
      tree.write(path, readFileSync(join(root, path), 'utf-8'));
    }
  });

  it('writes every file of the component, each with a place to fill', async () => {
    await componentGenerator(tree, { name: 'IconButton', category: 'Actions', figma: '12:34' });

    const paths = Object.keys(
      componentFiles(namesOf({ name: 'IconButton', category: 'Actions', figma: '12:34' })),
    );
    expect(paths).toContain('packages/web-components/src/icon-button/icon-button.figma.ts');
    for (const path of paths) {
      expect(tree.exists(path), path).toBe(true);
    }
    expect(read(tree, 'packages/shared/src/components/icon-button.ts')).toContain(
      "status: 'in-progress'",
    );
    expect(read(tree, 'packages/shared/src/components/icon-button.ts')).toContain(TODO);
    expect(read(tree, 'packages/react/src/icon-button/IconButton.figma.ts')).toContain(
      'node-id=12-34',
    );
  });

  it('appends to a list of specifications that the formatter wrapped', async () => {
    const path = 'packages/shared/src/components/index.ts';
    tree.write(path, read(tree, path).replace(/= \[[^\]]*\]/, '= [\n  button,\n  textField,\n]'));
    await componentGenerator(tree, { name: 'IconButton', category: 'Actions' });

    expect(read(tree, path)).not.toMatch(/,\s*,/);
    expect(read(tree, path)).toMatch(/, iconButton\]/);
  });

  it('registers the component in every list', async () => {
    await componentGenerator(tree, { name: 'IconButton', category: 'Actions' });

    const index = read(tree, 'packages/shared/src/components/index.ts');
    expect(index).toContain("import { iconButton } from './icon-button.ts';");
    expect(index).toMatch(/specs: readonly ComponentSpec\[\] = \[[^\]]*, iconButton\]/);

    const wc = JSON.parse(read(tree, 'packages/web-components/package.json')) as {
      exports: Record<string, unknown>;
    };
    const keys = Object.keys(wc.exports);
    expect(keys[0]).toBe('.');
    expect(keys.at(-1)).toBe('./package.json');
    expect(wc.exports['./icon-button']).toEqual({
      types: './dist/components/ui-icon-button.d.ts',
      default: './dist/components/ui-icon-button.js',
    });

    const shared = JSON.parse(read(tree, 'packages/shared/package.json')) as {
      exports: Record<string, unknown>;
    };
    expect(Object.keys(shared.exports).at(-1)).toBe('./package.json');
    expect(shared.exports['./icon-button']).toBeDefined();

    expect(read(tree, 'packages/web-components/README.md')).toContain(
      '| IconButton | `ui-icon-button` | `./icon-button` |',
    );
    expect(read(tree, 'packages/react/README.md')).toContain('| IconButton | `IconButton` |');
    expect(read(tree, 'packages/react/src/index.ts')).toContain(
      "export { IconButton, type IconButtonProps } from './icon-button/IconButton.tsx';",
    );
    expect(read(tree, 'testing/contracts/src/runners/web-components.test.ts')).toContain(
      'iconButtonContract(mountWebComponentIconButton);',
    );
    expect(read(tree, 'testing/contracts/src/runners/react.test.tsx')).toContain(
      'iconButtonContract(mountReactIconButton);',
    );
    expect(read(tree, 'apps/storybook/src/components/web-components.d.ts')).toContain(
      "'ui-icon-button': CustomElement<IconButtonProps>;",
    );
  });

  it('leaves out Code Connect without a component set', async () => {
    await componentGenerator(tree, { name: 'IconButton', category: 'Actions' });

    expect(tree.exists('packages/react/src/icon-button/IconButton.figma.ts')).toBe(false);
    expect(read(tree, 'packages/shared/src/components/icon-button.ts')).toContain('figma: null');
  });

  it('makes a form control associated with its form', async () => {
    await componentGenerator(tree, { name: 'ExampleField', category: 'Inputs', form: true });

    expect(read(tree, 'packages/web-components/src/example-field/example-field.tsx')).toContain(
      'formAssociated: true',
    );
    expect(read(tree, 'apps/storybook/src/components/inputs/ExampleField.mdx')).toContain(
      'Components/Inputs/ExampleField/Docs',
    );
  });

  it('refuses a component that exists', async () => {
    await componentGenerator(tree, { name: 'IconButton', category: 'Actions' });

    await expect(
      componentGenerator(tree, { name: 'IconButton', category: 'Actions' }),
    ).rejects.toThrow('IconButton exists already');
  });
});

describe('addStatement', () => {
  it('keeps a group in the order of its modules', () => {
    const text = "import { a } from './a.ts';\nimport { c } from './c.ts';\n\nexport {};\n";

    expect(addStatement(text, "import { b } from './b.ts';")).toBe(
      "import { a } from './a.ts';\nimport { b } from './b.ts';\nimport { c } from './c.ts';\n\nexport {};\n",
    );
  });

  it('sorts a module before the modules whose names extend it', () => {
    const text = "import { a } from './a.ts';\nimport { c } from './c.ts';\n";

    expect(
      addStatement(
        addStatement(text, "import { bc } from './b-c.ts';"),
        "import { b } from './b.ts';",
      ),
    ).toBe(
      "import { a } from './a.ts';\nimport { b } from './b.ts';\nimport { bc } from './b-c.ts';\nimport { c } from './c.ts';\n",
    );
  });

  it('keeps a statement of several lines whole', () => {
    const text =
      "export {\n  A,\n  type AProps,\n} from './a/A.tsx';\nexport { C } from './c/C.tsx';\n";

    expect(addStatement(text, "export { B } from './b/B.tsx';")).toBe(
      "export {\n  A,\n  type AProps,\n} from './a/A.tsx';\nexport { B } from './b/B.tsx';\nexport { C } from './c/C.tsx';\n",
    );
  });

  it('adds a side-effect import to its own group', () => {
    const text = "import 'x/a';\n\nimport { a } from 'x/b';\n";

    expect(addStatement(text, "import 'x/c';")).toBe(
      "import 'x/a';\nimport 'x/c';\n\nimport { a } from 'x/b';\n",
    );
  });

  it('fails without a group of the kind', () => {
    expect(() => addStatement("import { a } from 'x';\n", "import { b } from './b.ts';")).toThrow(
      'No group of named:relative statements',
    );
  });
});

describe('addTableRow', () => {
  it('keeps the rows in order', () => {
    const text = 'Intro\n\n| A | B |\n| - | - |\n| a | 1 |\n| c | 3 |\n\nAfter\n';

    expect(addTableRow(text, '| b | 2 |')).toBe(
      'Intro\n\n| A | B |\n| - | - |\n| a | 1 |\n| b | 2 |\n| c | 3 |\n\nAfter\n',
    );
  });
});
