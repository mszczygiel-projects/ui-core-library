import { formatFiles, type Tree } from '@nx/devkit';

import { type ComponentOptions, namesOf } from './names.ts';
import { componentFiles } from './templates.ts';
import { registerComponent } from './updates.ts';

/**
 * Creates the skeleton of a component in every project it spans: its specification, both
 * implementations with their tests, its contract, its stories and its page, and Code Connect
 * templates when the component set exists. The result passes the quality gate as it is, and
 * `TODO(component)` marks every place that needs the component's own decisions.
 */
export default async function componentGenerator(tree: Tree, options: ComponentOptions) {
  const names = namesOf(options);
  if (tree.exists(`packages/shared/src/components/${names.kebab}.ts`)) {
    throw new Error(`${names.name} exists already`);
  }
  for (const [path, content] of Object.entries(componentFiles(names))) {
    tree.write(path, content);
  }
  registerComponent(tree, names);
  await formatFiles(tree);
}
