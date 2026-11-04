import { configureUiCore } from '@mszczygiel-projects/ui-core-foundations/config';
import type { MenuItems } from '@mszczygiel-projects/ui-core-shared/menu';
import type {
  SplitButtonActionDetails,
  SplitButtonOpenChangeDetails,
  SplitButtonProps,
} from '@mszczygiel-projects/ui-core-shared/split-button';
import { afterEach, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { pseudoLabels } from '../pseudo.ts';
import { tokenValue } from '../tokens.ts';
import {
  actionFormContract,
  actionSurfaceContract,
  formFixtures,
  resolvedColor,
} from './action.contract.ts';

/**
 * The props of the specification without icons, plus content as text, icons as flags and the
 * callbacks, which the web component receives as events. `onPress` is the main action: the native
 * click of the web component, `onClick` in React. A callback that returns false refuses the
 * request to open or close the menu.
 */
export interface SplitButtonContractProps extends Omit<SplitButtonProps<never>, 'options'> {
  readonly children?: string;
  readonly leadingIcon?: boolean;
  readonly trailingIcon?: boolean;
  readonly options?: MenuItems;
  readonly onPress?: (event: Event) => void;
  readonly onOpenChange?: (
    open: boolean,
    details: SplitButtonOpenChangeDetails<Event>,
  ) => boolean | undefined;
  readonly onAction?: (value: string, details: SplitButtonActionDetails<Event>) => void;
}

const SAVE_ACTIONS: MenuItems = [
  { value: 'draft', label: 'Save as draft' },
  { value: 'template', label: 'Save as template' },
];

/** The first element that matches, inside the shadow roots too. */
function deepQuery(root: Element | ShadowRoot, selector: string): HTMLElement | null {
  const found = root.querySelector<HTMLElement>(selector);
  if (found !== null) {
    return found;
  }
  const own =
    root instanceof Element && root.shadowRoot !== null
      ? deepQuery(root.shadowRoot, selector)
      : null;
  if (own !== null) {
    return own;
  }
  for (const element of root.querySelectorAll('*')) {
    const inner = element.shadowRoot === null ? null : deepQuery(element.shadowRoot, selector);
    if (inner !== null) {
      return inner;
    }
  }
  return null;
}

/** The focused element, inside the shadow roots too. */
function focused(): Element | null {
  let element = document.activeElement;
  while (element?.shadowRoot?.activeElement) {
    element = element.shadowRoot.activeElement;
  }
  return element;
}

/**
 * A view of a split button in which the base part is its main action, so that the contracts that
 * every action shares apply to that half.
 */
function mainAction(adapter: Mount<SplitButtonContractProps>): Mount<SplitButtonContractProps> {
  return async (props, options) => {
    const component = await adapter(props, options);
    return new Proxy(component, {
      get(target, key, receiver): unknown {
        if (key === 'part') {
          return (name: string) => target.part(name === 'base' ? 'action' : name);
        }
        return Reflect.get(target, key, receiver) as unknown;
      },
    });
  };
}

/** The behaviour of SplitButton, applied unchanged to the web component and the React component. */
export function splitButtonContract(adapter: Mount<SplitButtonContractProps>): void {
  const named = { children: 'Save', options: SAVE_ACTIONS };
  actionFormContract(mainAction(adapter), named);
  actionSurfaceContract(mainAction(adapter), named);
  const { formFixture } = formFixtures();

  const mounted: Mounted<SplitButtonContractProps>[] = [];
  async function mount(props: SplitButtonContractProps = {}, options?: MountOptions) {
    const component = await adapter({ ...named, ...props }, options);
    mounted.push(component);
    return component;
  }
  afterEach(async () => {
    for (const component of mounted.splice(0)) {
      await component.unmount();
    }
  });
  const menuOf = (component: Mounted<SplitButtonContractProps>) => {
    const menu = deepQuery(component.element, '[role="menu"]');
    if (menu === null) {
      throw new Error('Missing menu');
    }
    return menu;
  };
  const isOpen = (component: Mounted<SplitButtonContractProps>) =>
    menuOf(component).matches(':popover-open');
  const actionName = tokenValue('--button-text-uppercase') === 'uppercase' ? 'SAVE' : 'Save';

  it('groups two sibling buttons: the main action and the menu button', async () => {
    const component = await mount();
    const tree = await component.accessibleTree();
    expect(tree.filter((node) => node.role === 'group')).toHaveLength(1);
    expect(tree.filter((node) => node.role === 'button')).toEqual([
      { role: 'button', name: actionName },
      { role: 'button', name: 'More actions' },
    ]);
    const toggle = component.part('toggle');
    expect(component.part('action').contains(toggle)).toBe(false);
    expect(toggle.getAttribute('aria-haspopup')).toBe('menu');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('names its menu button by its prop, falling back to configurable text', async () => {
    configureUiCore({ labels: pseudoLabels });
    const component = await mount();
    const toggleName = async () =>
      (await component.accessibleTree()).filter((node) => node.role === 'button')[1]?.name;
    expect(await toggleName()).toBe(pseudoLabels.splitButton.menu);
    configureUiCore({ labels: { splitButton: { menu: 'Więcej akcji' } } });
    await expect.poll(toggleName).toBe('Więcej akcji');
    await component.update({ menuLabel: 'More save options' });
    expect(await toggleName()).toBe('More save options');
    await userEvent.click(component.part('toggle'));
    await expect.poll(() => isOpen(component)).toBe(true);
    expect((await component.accessibleTree()).find((node) => node.role === 'menu')?.name).toBe(
      'More save options',
    );
  });

  it('opens its menu from the menu button without running the main action', async () => {
    const onPress = vi.fn();
    const onOpenChange = vi.fn<NonNullable<SplitButtonContractProps['onOpenChange']>>();
    const component = await mount({ onPress, onOpenChange });
    const toggle = component.part('toggle');
    await userEvent.click(toggle);
    await expect.poll(() => isOpen(component)).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(onOpenChange.mock.calls[0]).toMatchObject([true, { reason: 'trigger' }]);
    await expect.poll(() => focused()).toBe(menuOf(component));
    await userEvent.click(toggle);
    await expect.poll(() => isOpen(component)).toBe(false);
    toggle.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect.poll(() => isOpen(component)).toBe(true);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('reports a picked action, closes and returns the focus, without running the main action', async () => {
    const onPress = vi.fn();
    const onAction = vi.fn<NonNullable<SplitButtonContractProps['onAction']>>();
    const component = await mount({ onPress, onAction });
    await userEvent.click(component.part('toggle'));
    await expect.poll(() => isOpen(component)).toBe(true);
    await page
      .elementLocator(menuOf(component))
      .getByRole('menuitem', { name: 'Save as template' })
      .click();
    expect(onAction.mock.calls.map((call) => call[0])).toEqual(['template']);
    await expect.poll(() => isOpen(component)).toBe(false);
    await expect.poll(() => focused()).toBe(component.part('toggle'));
    await userEvent.click(component.part('toggle'));
    await expect.poll(() => isOpen(component)).toBe(true);
    await userEvent.keyboard('{Enter}');
    expect(onAction.mock.calls.map((call) => call[0])).toEqual(['template', 'draft']);
    expect(onPress).not.toHaveBeenCalled();
    await page.elementLocator(component.part('action')).click();
    expect(onPress).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledTimes(2);
  });

  it('keeps its menu as it is when the page refuses a request', async () => {
    const component = await mount({ onOpenChange: () => false });
    await userEvent.click(component.part('toggle'));
    expect(isOpen(component)).toBe(false);
    expect(component.part('toggle').getAttribute('aria-expanded')).toBe('false');
  });

  it('blocks both halves when disabled, by its prop or its fieldset, and closes its menu', async () => {
    const { fieldset } = formFixture();
    const component = await mount({ open: true }, { parent: fieldset });
    await expect.poll(() => isOpen(component)).toBe(true);
    await component.update({ disabled: true });
    await expect.poll(() => isOpen(component)).toBe(false);
    expect(component.part('action').matches(':disabled')).toBe(true);
    expect(component.part('toggle').matches(':disabled')).toBe(true);
    await component.update({ disabled: false });
    fieldset.disabled = true;
    await expect.poll(() => component.part('toggle').matches(':disabled')).toBe(true);
    expect(component.part('action').matches(':disabled')).toBe(true);
    fieldset.disabled = false;
    await expect.poll(() => component.part('toggle').matches(':disabled')).toBe(false);
  });

  it('closes its menu, and keeps it closed, inside a disabled fieldset', async () => {
    const { fieldset } = formFixture();
    const component = await mount({ open: true }, { parent: fieldset });
    await expect.poll(() => isOpen(component)).toBe(true);
    fieldset.disabled = true;
    await expect.poll(() => isOpen(component)).toBe(false);
    expect(component.part('toggle').getAttribute('aria-expanded')).toBe('false');
    const closed = await mount({ open: true }, { parent: fieldset });
    await expect.poll(() => closed.part('toggle').matches(':disabled')).toBe(true);
    await expect.poll(() => isOpen(closed)).toBe(false);
    fieldset.disabled = false;
    await expect.poll(() => closed.part('toggle').matches(':disabled')).toBe(false);
    expect(isOpen(closed)).toBe(false);
  });

  it('lets Tab leave its loading menu button', async () => {
    const before = document.createElement('button');
    before.textContent = 'Before';
    const after = document.createElement('button');
    after.textContent = 'After';
    const component = await mount({ loading: true });
    component.element.before(before);
    component.element.after(after);
    try {
      component.part('toggle').focus();
      await userEvent.keyboard('{Tab}');
      expect(focused()).toBe(after);
      component.part('toggle').focus();
      await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
      expect(focused()).not.toBe(component.part('toggle'));
    } finally {
      before.remove();
      after.remove();
    }
  });

  it('keeps presses on its menu button and its actions from the page, but not the main action', async () => {
    const onAction = vi.fn();
    const component = await mount({ onAction });
    const heard: EventTarget[] = [];
    const listen = (event: Event) => {
      heard.push(event.target ?? document);
    };
    // A listener of the page around the component.
    document.addEventListener('click', listen);
    try {
      await userEvent.click(component.part('toggle'));
      await expect.poll(() => isOpen(component)).toBe(true);
      await page
        .elementLocator(menuOf(component))
        .getByRole('menuitem', { name: 'Save as template' })
        .click();
      expect(onAction).toHaveBeenCalledOnce();
      expect(heard).toHaveLength(0);
      await page.elementLocator(component.part('action')).click();
      expect(heard).toHaveLength(1);
    } finally {
      document.removeEventListener('click', listen);
    }
  });

  it('keeps the focus and the name of its menu button while loading, and opens nothing', async () => {
    const onOpenChange = vi.fn();
    const component = await mount({ loading: true, onOpenChange });
    const toggle = component.part('toggle');
    toggle.focus();
    expect(toggle.matches(':focus')).toBe(true);
    expect(toggle.matches(':disabled')).toBe(false);
    expect(toggle.getAttribute('aria-disabled')).toBe('true');
    // Browser automation treats aria-disabled as disabled, so use the native click method here.
    toggle.click();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    expect(isOpen(component)).toBe(false);
    expect(onOpenChange).not.toHaveBeenCalled();
    const description = (await component.accessibleTree()).find(
      (node) => node.role === 'button',
    )?.description;
    expect(description).toBe('Loading');
  });

  it('disables its menu button, and only it, without an enabled action', async () => {
    const component = await mount({
      options: [{ value: 'draft', label: 'Draft', disabled: true }],
    });
    expect(component.part('toggle').matches(':disabled')).toBe(true);
    expect(component.part('action').matches(':disabled')).toBe(false);
    await component.update({ options: [] });
    expect(component.part('toggle').matches(':disabled')).toBe(true);
    await component.update({ options: SAVE_ACTIONS });
    await expect.poll(() => component.part('toggle').matches(':disabled')).toBe(false);
  });

  it('draws its divider from the divider tokens of its variant and state', async () => {
    for (const variant of ['primary', 'secondary', 'outline', 'ghost', 'danger'] as const) {
      const component = await mount({ variant });
      const divider = component.part('divider');
      expect(getComputedStyle(divider).backgroundColor).toBe(
        resolvedColor(tokenValue(`--color-button-${variant}-divider-default`)),
      );
      expect(divider.getBoundingClientRect().width).toBeGreaterThan(0);
      await component.update({ disabled: true });
      expect(getComputedStyle(divider).backgroundColor).toBe(
        resolvedColor(tokenValue(`--color-button-${variant}-divider-disabled`)),
      );
    }
  });

  it('joins the halves with square inner corners and gives the menu button its own colours', async () => {
    const component = await mount({ variant: 'secondary' });
    // A preceding case can leave the pointer over the newly mounted halves.
    await page.elementLocator(component.part('toggle')).unhover();
    const action = getComputedStyle(component.part('action'));
    const toggle = getComputedStyle(component.part('toggle'));
    expect(action.borderStartEndRadius).toBe('0px');
    expect(action.borderEndEndRadius).toBe('0px');
    expect(toggle.borderStartStartRadius).toBe('0px');
    expect(toggle.borderEndStartRadius).toBe('0px');
    expect(toggle.backgroundColor).toBe(
      resolvedColor(tokenValue('--color-button-secondary-background-default')),
    );
  });

  for (const dir of ['ltr', 'rtl'] as const) {
    it(`puts its menu button at the end and opens its menu along that edge, in ${dir}`, async () => {
      await page.viewport(1000, 700);
      // A parent away from the edges, so that the menu has room on both sides of its edge.
      const parent = document.createElement('div');
      Object.assign(parent.style, {
        position: 'fixed',
        insetBlockStart: '200px',
        insetInlineStart: '400px',
      });
      document.body.append(parent);
      const component = await mount({}, { dir, parent });
      const action = component.part('action').getBoundingClientRect();
      const toggle = component.part('toggle').getBoundingClientRect();
      expect(toggle.x > action.x).toBe(dir === 'ltr');
      await userEvent.click(component.part('toggle'));
      await expect.poll(() => isOpen(component)).toBe(true);
      await expect
        .poll(() => {
          const menu = menuOf(component).getBoundingClientRect();
          return Math.round(dir === 'ltr' ? menu.right : menu.left);
        })
        .toBe(Math.round(dir === 'ltr' ? toggle.right : toggle.left));
      await component.unmount();
      mounted.splice(mounted.indexOf(component), 1);
      parent.remove();
    });
  }
}
