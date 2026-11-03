import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import type { BrowserCommand } from 'vitest/node';

import type { AccessibleNode, MediaFeatures } from './src/browser.ts';

/** Emulates the preferences of the user, such as reduced motion or forced colours. */
const emulateMedia: BrowserCommand<[MediaFeatures]> = async ({ page }, features) => {
  await page.emulateMedia(features);
};

const ELEMENT_NODE = 1;

interface DomNode {
  readonly nodeType: number;
  readonly nodeName?: string;
  readonly backendNodeId: number;
  readonly attributes?: readonly string[];
  readonly children?: readonly DomNode[];
  readonly shadowRoots?: readonly DomNode[];
  readonly contentDocument?: DomNode;
}

function findFrame(node: DomNode, id: string): DomNode | undefined {
  const attributes = node.attributes ?? [];
  for (let i = 0; i < attributes.length; i += 2) {
    if (attributes[i] === 'data-contract-frame' && attributes[i + 1] === id) {
      return node;
    }
  }
  const nested = [
    ...(node.children ?? []),
    ...(node.shadowRoots ?? []),
    ...(node.contentDocument === undefined ? [] : [node.contentDocument]),
  ];
  for (const child of nested) {
    const found = findFrame(child, id);
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}

/**
 * The role and the accessible name of the component in a frame, from the accessibility tree of
 * Chromium: what a screen reader gets. Locators and axe compute roles from attributes, so they
 * miss the roles that a web component sets through ElementInternals.
 */
const accessibleNode: BrowserCommand<[string]> = async ({ page }, frameId) => {
  const session = await page.context().newCDPSession(page);
  try {
    const { root } = await session.send('DOM.getDocument', { depth: -1, pierce: true });
    const frame = findFrame(root, frameId);
    const component = frame?.children?.find((child) => child.nodeType === ELEMENT_NODE);
    if (component === undefined) {
      throw new Error(`No component in the frame ${frameId}`);
    }
    const { nodes } = await session.send('Accessibility.getPartialAXTree', {
      backendNodeId: component.backendNodeId,
      fetchRelatives: false,
    });
    const node = nodes[0];
    const result: AccessibleNode = {
      role: typeof node?.role?.value === 'string' ? node.role.value : '',
      name: typeof node?.name?.value === 'string' ? node.name.value : '',
    };
    return result;
  } finally {
    await session.detach();
  }
};

/** The first native dialog below a node, shadow roots included. */
function findDialog(node: DomNode): DomNode | undefined {
  for (const child of [...(node.children ?? []), ...(node.shadowRoots ?? [])]) {
    const found = child.nodeName === 'DIALOG' ? child : findDialog(child);
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}

/**
 * Reads descendants, including native controls inside shadow roots and excluding ignored nodes.
 * A modal dialog leaves the rest of the page out of the tree, its frame included, so the tree of
 * a frame with a dialog starts at the dialog.
 */
const accessibleTree: BrowserCommand<[string]> = async ({ page }, frameId) => {
  const session = await page.context().newCDPSession(page);
  try {
    const { root } = await session.send('DOM.getDocument', { depth: -1, pierce: true });
    const frame = findFrame(root, frameId);
    if (frame === undefined) {
      throw new Error(`No accessibility frame ${frameId}`);
    }
    const { nodes } = await session.send('Accessibility.queryAXTree', {
      backendNodeId: (findDialog(frame) ?? frame).backendNodeId,
    });
    const result: AccessibleNode[] = nodes
      .filter((node) => !node.ignored)
      .map((node) => ({
        role: typeof node.role?.value === 'string' ? node.role.value : '',
        name: typeof node.name?.value === 'string' ? node.name.value : '',
        ...(typeof node.description?.value === 'string'
          ? { description: node.description.value }
          : {}),
      }));
    return result;
  } finally {
    await session.detach();
  }
};

// One behaviour contract per component, run against both implementations through the exports of
// the built packages.
export default defineConfig({
  test: {
    name: 'contracts',
    include: ['src/runners/**/*.test.ts', 'src/runners/**/*.test.tsx'],
    // Reported with --coverage, never enforced: the share of the built components that
    // the contracts run.
    coverage: {
      provider: 'v8',
      allowExternal: true,
      include: ['../../packages/web-components/dist/**/*.js', '../../packages/react/dist/**/*.js'],
      reporter: ['text'],
    },
    setupFiles: ['./src/setup.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
      commands: { emulateMedia, accessibleNode, accessibleTree },
    },
  },
});
