import type {
  MenuActionDetails,
  MenuItems,
  MenuOpenChangeDetails,
  MenuProps,
} from '@mszczygiel-projects/ui-core-shared/menu';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { tokenValue } from '../tokens.ts';
import { resolvedColor } from './action.contract.ts';

/**
 * The props of the specification without icons, plus the callbacks, which the web component
 * receives as events. A callback that returns false refuses the request: the web component cancels
 * the event, and the parent of the React component keeps its state. The trigger is a native
 * button named Actions.
 */
export interface MenuContractProps extends Omit<MenuProps<never>, 'options'> {
  readonly options?: MenuItems;
  readonly onOpenChange?: (
    open: boolean,
    details: MenuOpenChangeDetails<Event>,
  ) => boolean | undefined;
  readonly onAction?: (value: string, details: MenuActionDetails<Event>) => void;
}

/** Actions with a disabled one at each end, so that the highlight has to pass them. */
export const EDIT_ACTIONS: MenuItems = [
  { value: 'undo', label: 'Undo', disabled: true },
  { value: 'copy', label: 'Copy' },
  { value: 'paste', label: 'Paste' },
  { value: 'rename', label: 'Rename' },
  { value: 'delete', label: 'Delete', disabled: true },
];

export const GROUPED_ACTIONS: MenuItems = [
  { options: [{ value: 'copy', label: 'Copy' }] },
  { options: [{ value: 'rename', label: 'Rename' }] },
];

/** The behaviour of Menu, applied unchanged to the web component and the React component. */
export function menuContract(adapter: Mount<MenuContractProps>): void {
  const mounted: Mounted<MenuContractProps>[] = [];
  const parents: HTMLElement[] = [];
  async function mount(props: MenuContractProps = {}, mountOptions?: MountOptions) {
    const component = await adapter({ options: EDIT_ACTIONS, ...props }, mountOptions);
    mounted.push(component);
    return component;
  }
  function spot(): HTMLElement {
    const parent = document.createElement('div');
    Object.assign(parent.style, {
      position: 'fixed',
      insetBlockStart: '200px',
      insetInlineStart: '300px',
    });
    document.body.append(parent);
    parents.push(parent);
    return parent;
  }
  const triggerOf = (component: Mounted<MenuContractProps>) => {
    const trigger = component.element.querySelector<HTMLElement>('button');
    if (trigger === null) {
      throw new Error('Missing trigger');
    }
    return trigger;
  };
  const isOpen = (component: Mounted<MenuContractProps>) =>
    component.part('menu').matches(':popover-open');
  /** The text of the highlighted action, which the menu names with aria-activedescendant. */
  const highlighted = (component: Mounted<MenuContractProps>) => {
    const menu = component.part('menu');
    const id = menu.getAttribute('aria-activedescendant');
    const root = menu.getRootNode();
    const item =
      id === null || !(root instanceof Document || root instanceof ShadowRoot)
        ? null
        : root.getElementById(id);
    return item?.textContent ?? null;
  };
  /** The focused element, inside the shadow roots too. */
  const focused = () => {
    let element = document.activeElement;
    while (element?.shadowRoot?.activeElement) {
      element = element.shadowRoot.activeElement;
    }
    return element;
  };

  beforeEach(async () => {
    await page.viewport(1000, 700);
  });

  afterEach(async () => {
    for (const component of mounted.splice(0)) {
      await component.unmount();
    }
    for (const parent of parents.splice(0)) {
      parent.remove();
    }
  });

  it('opens from its trigger, which announces the menu that its name labels', async () => {
    const onOpenChange = vi.fn<NonNullable<MenuContractProps['onOpenChange']>>();
    const component = await mount({ onOpenChange }, { parent: spot() });
    const trigger = triggerOf(component);
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(trigger);
    await expect.poll(() => isOpen(component)).toBe(true);
    await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('true');
    expect(onOpenChange.mock.calls[0]?.[1]).toMatchObject({ reason: 'trigger' });
    await expect.poll(() => focused()).toBe(component.part('menu'));
    await expect.poll(() => highlighted(component)).toBe('Copy');
    const tree = await component.accessibleTree();
    expect(tree.find((node) => node.role === 'menu')?.name).toBe('Actions');
    expect(tree.filter((node) => node.role === 'menuitem').map((node) => node.name)).toEqual([
      'Undo',
      'Copy',
      'Paste',
      'Rename',
      'Delete',
    ]);
  });

  it('opens on the first or the last enabled action with the arrows on its trigger', async () => {
    const component = await mount({}, { parent: spot() });
    triggerOf(component).focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect.poll(() => isOpen(component)).toBe(true);
    await expect.poll(() => highlighted(component)).toBe('Copy');
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen(component)).toBe(false);
    await userEvent.keyboard('{ArrowUp}');
    await expect.poll(() => highlighted(component)).toBe('Rename');
  });

  it('moves the highlight past disabled actions, wrapping, with Home, End and typed letters', async () => {
    const component = await mount({}, { parent: spot() });
    await userEvent.click(triggerOf(component));
    await expect.poll(() => highlighted(component)).toBe('Copy');
    await userEvent.keyboard('{ArrowUp}');
    expect(highlighted(component)).toBe('Rename');
    await userEvent.keyboard('{ArrowDown}');
    expect(highlighted(component)).toBe('Copy');
    await userEvent.keyboard('{End}');
    expect(highlighted(component)).toBe('Rename');
    await userEvent.keyboard('{Home}');
    expect(highlighted(component)).toBe('Copy');
    await userEvent.keyboard('p');
    expect(highlighted(component)).toBe('Paste');
    await userEvent.keyboard('d');
    expect(highlighted(component)).toBe('Paste');
  });

  for (const key of ['{Enter}', ' ']) {
    it(`picks the highlighted action once with ${key === ' ' ? 'Space' : 'Enter'}, closes and returns the focus`, async () => {
      const onAction = vi.fn<NonNullable<MenuContractProps['onAction']>>();
      const onOpenChange = vi.fn<NonNullable<MenuContractProps['onOpenChange']>>();
      const component = await mount({ onAction, onOpenChange }, { parent: spot() });
      await userEvent.click(triggerOf(component));
      await expect.poll(() => highlighted(component)).toBe('Copy');
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard(key);
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(onAction.mock.calls[0]?.[0]).toBe('paste');
      await expect.poll(() => isOpen(component)).toBe(false);
      expect(onOpenChange.mock.calls.at(-1)).toMatchObject([false, { reason: 'action' }]);
      await expect.poll(() => focused()).toBe(triggerOf(component));
    });
  }

  it('picks an action with the pointer and ignores a disabled one', async () => {
    const onAction = vi.fn<NonNullable<MenuContractProps['onAction']>>();
    const component = await mount({ onAction }, { parent: spot() });
    await userEvent.click(triggerOf(component));
    await expect.poll(() => isOpen(component)).toBe(true);
    const undo = page
      .elementLocator(component.part('menu'))
      .getByRole('menuitem', { name: 'Undo' })
      .element();
    expect(undo.getAttribute('aria-disabled')).toBe('true');
    // Browser automation treats aria-disabled as disabled, so use the native click method here.
    if (!(undo instanceof HTMLElement)) {
      throw new Error('Missing disabled action');
    }
    undo.click();
    expect(onAction).not.toHaveBeenCalled();
    expect(isOpen(component)).toBe(true);
    await page
      .elementLocator(component.part('menu'))
      .getByRole('menuitem', { name: 'Rename' })
      .click();
    expect(onAction.mock.calls.map((call) => call[0])).toEqual(['rename']);
    await expect.poll(() => isOpen(component)).toBe(false);
  });

  it('closes on Escape with the focus on its trigger, on Tab and on a press outside', async () => {
    const onOpenChange = vi.fn<NonNullable<MenuContractProps['onOpenChange']>>();
    const parent = spot();
    const component = await mount({ onOpenChange }, { parent });
    const after = document.createElement('button');
    after.textContent = 'After';
    parent.append(after);
    const trigger = triggerOf(component);
    await userEvent.click(trigger);
    await expect.poll(() => isOpen(component)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen(component)).toBe(false);
    expect(onOpenChange.mock.calls.at(-1)).toMatchObject([false, { reason: 'escape' }]);
    expect(focused()).toBe(trigger);
    await userEvent.click(trigger);
    await expect.poll(() => focused()).toBe(component.part('menu'));
    await userEvent.keyboard('{Tab}');
    await expect.poll(() => isOpen(component)).toBe(false);
    expect(onOpenChange.mock.calls.at(-1)).toMatchObject([false, { reason: 'focus-out' }]);
    expect(focused()).toBe(after);
    await userEvent.click(trigger);
    await expect.poll(() => isOpen(component)).toBe(true);
    await userEvent.click(document.body, { position: { x: 5, y: 5 } });
    await expect.poll(() => isOpen(component)).toBe(false);
    expect(onOpenChange.mock.calls.at(-1)).toMatchObject([false, { reason: 'outside' }]);
  });

  it('keeps its state when the page refuses a request', async () => {
    const component = await mount({ onOpenChange: () => false }, { parent: spot() });
    await userEvent.click(triggerOf(component));
    expect(isOpen(component)).toBe(false);
    expect(triggerOf(component).getAttribute('aria-expanded')).toBe('false');
  });

  it('separates its groups with a rule that the highlight passes over', async () => {
    const component = await mount({ options: GROUPED_ACTIONS }, { parent: spot() });
    await userEvent.click(triggerOf(component));
    await expect.poll(() => highlighted(component)).toBe('Copy');
    const tree = await component.accessibleTree();
    const roles = tree
      .map((node) => node.role)
      .filter((role) => ['separator', 'menuitem', 'group'].includes(role));
    expect(roles.filter((role) => role === 'separator')).toHaveLength(1);
    expect(roles.indexOf('separator')).toBeGreaterThan(roles.indexOf('menuitem'));
    await userEvent.keyboard('{ArrowDown}');
    expect(highlighted(component)).toBe('Rename');
    const separator = component.part('separator');
    expect(getComputedStyle(separator).borderBlockStartColor).toBe(
      resolvedColor(tokenValue('--color-menu-separator')),
    );
  });

  it('draws its surface and highlight from the menu tokens', async () => {
    const component = await mount({}, { parent: spot() });
    await userEvent.click(triggerOf(component));
    await expect.poll(() => highlighted(component)).toBe('Copy');
    const menu = component.part('menu');
    expect(getComputedStyle(menu).backgroundColor).toBe(
      resolvedColor(tokenValue('--color-menu-background')),
    );
    const item = page.elementLocator(menu).getByRole('menuitem', { name: 'Copy' }).element();
    expect(getComputedStyle(item).backgroundColor).toBe(
      resolvedColor(tokenValue('--color-menu-item-background-highlighted')),
    );
  });

  for (const dir of ['ltr', 'rtl'] as const) {
    it(`lines up with the edge of its trigger that align names, in ${dir}`, async () => {
      for (const align of ['start', 'end'] as const) {
        const component = await mount({ align }, { parent: spot(), dir });
        await userEvent.click(triggerOf(component));
        await expect.poll(() => isOpen(component)).toBe(true);
        const trigger = triggerOf(component).getBoundingClientRect();
        const box = component.part('menu').getBoundingClientRect();
        const left = (align === 'start') === (dir === 'ltr');
        await expect
          .poll(() => {
            const now = component.part('menu').getBoundingClientRect();
            return Math.round(left ? now.left : now.right);
          })
          .toBe(Math.round(left ? trigger.left : trigger.right));
        expect(box.top).toBeGreaterThanOrEqual(trigger.bottom);
        await component.unmount();
        mounted.splice(mounted.indexOf(component), 1);
      }
    });
  }
}
