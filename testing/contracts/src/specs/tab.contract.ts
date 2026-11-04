import type { TabProps } from '@mszczygiel-projects/ui-core-shared/tab';
import { expect, it } from 'vitest';

import type { Mount } from '../harness/types.ts';

/** The props of the specification, without the icon that each package types, plus the content. */
export interface TabContractProps extends Omit<TabProps, 'icon'> {
  readonly children?: string;
}

/** The behaviour of Tab, applied unchanged to the web component and the React component. */
export function tabContract(mount: Mount<TabContractProps>): void {
  it('shows its content outside a Tabs, as a plain block with no role', async () => {
    const component = await mount({ value: 'one', label: 'One', children: 'Content' });
    expect(component.element.textContent).toContain('Content');
    expect(component.element.hasAttribute('role')).toBe(false);
    const tree = await component.accessibleTree();
    expect(tree.some((node) => node.role === 'tabpanel')).toBe(false);
    await component.unmount();
  });
}
