import type { TooltipProps } from '@mszczygiel-projects/ui-core-shared/tooltip';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { tokenNumber } from '../tokens.ts';

/** The props of the specification, plus the kind of trigger that each harness renders. */
export interface TooltipContractProps extends TooltipProps {
  /** A Button of the library, or a native button of the page. */
  readonly trigger?: 'button' | 'native';
}

/** The behaviour of Tooltip, applied unchanged to the web component and the React component. */
export function tooltipContract(adapter: Mount<TooltipContractProps>): void {
  const mounted: Mounted<TooltipContractProps>[] = [];
  const parents: HTMLElement[] = [];
  async function mount(props: TooltipContractProps = {}, mountOptions?: MountOptions) {
    const component = await adapter({ content: 'Copy link', ...props }, mountOptions);
    mounted.push(component);
    return component;
  }
  /** A parent placed somewhere in the window. */
  function spot(style: Partial<CSSStyleDeclaration> = {}, tag = 'div'): HTMLElement {
    const parent = document.createElement(tag);
    // The keyboard reaches the trigger from this button.
    const before = document.createElement('button');
    before.textContent = 'Before';
    parent.append(before);
    Object.assign(
      parent.style,
      { position: 'fixed', insetBlockStart: '200px', insetInlineStart: '300px', margin: '0' },
      style,
    );
    document.body.append(parent);
    parents.push(parent);
    return parent;
  }
  const triggerOf = (component: Mounted<TooltipContractProps>) => {
    const trigger = component.element.querySelector<HTMLElement>('ui-button, button');
    if (trigger === null) {
      throw new Error('Missing trigger');
    }
    return trigger;
  };
  const controlOf = (component: Mounted<TooltipContractProps>) => {
    const trigger = triggerOf(component);
    return trigger.shadowRoot?.querySelector('button') ?? trigger;
  };
  const isShown = (component: Mounted<TooltipContractProps>) =>
    component.part('bubble').matches(':popover-open');
  const wait = (milliseconds: number) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));
  const showDelay = () => tokenNumber('--duration-500');
  const middle = (rect: DOMRect) => ({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  });
  /** Moves the mouse away from every component. */
  const leave = () => userEvent.hover(document.body, { position: { x: 2, y: 2 } });

  beforeEach(async () => {
    await page.viewport(1000, 700);
    await leave();
  });

  afterEach(async () => {
    await leave();
    for (const component of mounted.splice(0)) {
      await component.unmount();
    }
    for (const parent of parents.splice(0)) {
      parent.remove();
    }
    // The group opens the next tooltip at once only for a moment after one hides.
    await wait(showDelay());
  });

  it('describes its trigger by its text, in the accessibility tree', async () => {
    for (const trigger of ['button', 'native'] as const) {
      const component = await mount({ trigger }, { parent: spot() });
      await expect
        .poll(async () => (await component.accessibleTree()).find((node) => node.role === 'button'))
        .toMatchObject({ description: 'Copy link' });
    }
  });

  it('shows after the delay while the mouse rests on its trigger, and hides when it leaves', async () => {
    const component = await mount({}, { parent: spot() });
    await userEvent.hover(controlOf(component));
    await wait(showDelay() / 2);
    expect(isShown(component)).toBe(false);
    await expect.poll(() => isShown(component), { timeout: showDelay() * 2 }).toBe(true);
    expect(component.element.textContent).toContain('Copy link');
    await leave();
    await expect.poll(() => isShown(component)).toBe(false);
  });

  it('stays while the pointer moves onto it', async () => {
    const component = await mount({}, { parent: spot() });
    await userEvent.hover(controlOf(component));
    await expect.poll(() => isShown(component), { timeout: showDelay() * 2 }).toBe(true);
    await userEvent.hover(component.part('bubble'));
    await wait(tokenNumber('--duration-100') * 3);
    expect(isShown(component)).toBe(true);
  });

  it('shows at once on keyboard focus, and hides when the focus leaves', async () => {
    const parent = spot();
    const component = await mount({}, { parent });
    const after = document.createElement('button');
    after.textContent = 'After';
    parent.append(after);
    parent.querySelector('button')?.focus();
    await userEvent.tab();
    await expect.poll(() => isShown(component), { timeout: showDelay() / 2 }).toBe(true);
    await userEvent.tab();
    await expect.poll(() => isShown(component)).toBe(false);
  });

  it('shows nothing when a press focuses its trigger, and hides on a press', async () => {
    const component = await mount({}, { parent: spot() });
    await userEvent.click(controlOf(component));
    await wait(showDelay() * 1.5);
    expect(isShown(component)).toBe(false);
  });

  it('opens the next tooltip at once while another one shows, and shows one at a time', async () => {
    const first = await mount({}, { parent: spot() });
    const second = await mount(
      { content: 'Share' },
      { parent: spot({ insetInlineStart: '500px' }) },
    );
    await userEvent.hover(controlOf(first));
    await expect.poll(() => isShown(first), { timeout: showDelay() * 2 }).toBe(true);
    await userEvent.hover(controlOf(second));
    await expect.poll(() => isShown(second), { timeout: showDelay() / 2 }).toBe(true);
    expect(isShown(first)).toBe(false);
  });

  it('closes on Escape before a modal dialog around it', async () => {
    const dialog = spot({}, 'dialog') as HTMLDialogElement;
    dialog.showModal();
    const component = await mount({}, { parent: dialog });
    dialog.querySelector('button')?.focus();
    await userEvent.tab();
    await expect.poll(() => isShown(component)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isShown(component)).toBe(false);
    expect(dialog.open).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => dialog.open).toBe(false);
  });

  it('opens on the side it asks for, centred on the trigger, and flips when the window has no room', async () => {
    const box = async (props: TooltipContractProps, style = {}) => {
      const component = await mount(props, { parent: spot(style) });
      await userEvent.hover(controlOf(component));
      await expect.poll(() => isShown(component), { timeout: showDelay() * 2 }).toBe(true);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const result = {
        bubble: component.part('bubble').getBoundingClientRect(),
        trigger: triggerOf(component).getBoundingClientRect(),
      };
      await leave();
      await expect.poll(() => isShown(component)).toBe(false);
      return result;
    };
    const top = await box({});
    expect(top.bubble.bottom).toBeLessThan(top.trigger.top);
    expect(Math.abs(middle(top.bubble).x - middle(top.trigger).x)).toBeLessThanOrEqual(1);
    const bottom = await box({ placement: 'bottom' });
    expect(bottom.bubble.top).toBeGreaterThan(bottom.trigger.bottom);
    const high = await box({}, { insetBlockStart: '0px' });
    expect(high.bubble.top).toBeGreaterThan(high.trigger.bottom);
  });

  it('wraps a long text at its maximum width', async () => {
    const component = await mount({ content: 'Copy '.repeat(60) }, { parent: spot() });
    await userEvent.hover(controlOf(component));
    await expect.poll(() => isShown(component), { timeout: showDelay() * 2 }).toBe(true);
    const bubble = component.part('bubble').getBoundingClientRect();
    expect(Math.round(bubble.width)).toBe(tokenNumber('--tooltip-max-width'));
    expect(bubble.height).toBeGreaterThan(tokenNumber('--tooltip-line-height') * 2);
  });

  it('shows nothing and describes nothing without content', async () => {
    const component = await mount({ content: '' }, { parent: spot() });
    await userEvent.hover(controlOf(component));
    await wait(showDelay() * 1.5);
    expect(isShown(component)).toBe(false);
    const button = (await component.accessibleTree()).find((node) => node.role === 'button');
    expect(button?.description ?? '').toBe('');
  });

  it('draws its bubble from the tokens of tooltip', async () => {
    const component = await mount({ showArrow: true }, { parent: spot() });
    await userEvent.hover(controlOf(component));
    await expect.poll(() => isShown(component), { timeout: showDelay() * 2 }).toBe(true);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const style = getComputedStyle(component.part('bubble'));
    expect(parseFloat(style.paddingTop)).toBe(tokenNumber('--tooltip-padding-stack'));
    expect(parseFloat(style.paddingLeft)).toBe(tokenNumber('--tooltip-padding-inline'));
    expect(parseFloat(style.borderTopLeftRadius)).toBe(tokenNumber('--tooltip-radius'));
    expect(parseFloat(style.fontSize)).toBe(tokenNumber('--tooltip-font-size'));
    const trigger = triggerOf(component).getBoundingClientRect();
    const bubble = component.part('bubble').getBoundingClientRect();
    const arrow = component.part('arrow').getBoundingClientRect();
    expect(Math.abs(middle(arrow).x - middle(trigger).x)).toBeLessThanOrEqual(1);
    expect(Math.abs(middle(arrow).y - bubble.bottom)).toBeLessThanOrEqual(1);
    // The offset leaves room for the half of the arrow that stands out of the bubble.
    expect(trigger.top - bubble.bottom).toBeGreaterThanOrEqual(tokenNumber('--tooltip-offset'));
  });
}
