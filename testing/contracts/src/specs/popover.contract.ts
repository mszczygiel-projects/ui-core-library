import type {
  PopoverOpenChangeDetails,
  PopoverProps,
} from '@mszczygiel-projects/ui-core-shared/popover';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { tokenNumber } from '../tokens.ts';

/**
 * The props of the specification, plus what each harness translates: the kind of trigger, the
 * content of the panel and the callback, which the web component receives as an event. A callback
 * that returns false refuses the request: the web component cancels the event, and the parent of
 * the React component keeps its state.
 */
export interface PopoverContractProps extends PopoverProps {
  /** A Button of the library, or a native button of the page. */
  readonly trigger?: 'button' | 'native';
  /** A paragraph, or two fields of which the second carries `data-autofocus`. */
  readonly content?: 'text' | 'fields';
  readonly onOpenChange?: (
    open: boolean,
    details: PopoverOpenChangeDetails<Event>,
  ) => boolean | undefined;
}

/** The behaviour of Popover, applied unchanged to the web component and the React component. */
export function popoverContract(adapter: Mount<PopoverContractProps>): void {
  const mounted: Mounted<PopoverContractProps>[] = [];
  const parents: HTMLElement[] = [];
  async function mount(props: PopoverContractProps = {}, mountOptions?: MountOptions) {
    const component = await adapter({ label: 'Filters', ...props }, mountOptions);
    mounted.push(component);
    return component;
  }
  /** A parent placed somewhere in the window, with a button after the popover. */
  function spot(style: Partial<CSSStyleDeclaration> = {}): HTMLElement {
    const parent = document.createElement('div');
    Object.assign(
      parent.style,
      { position: 'fixed', insetBlockStart: '200px', insetInlineStart: '300px' },
      style,
    );
    document.body.append(parent);
    parents.push(parent);
    return parent;
  }
  function after(parent: HTMLElement): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = 'After';
    parent.append(button);
    return button;
  }
  /** The element of the trigger, and the native button that carries its state. */
  const triggerOf = (component: Mounted<PopoverContractProps>) => {
    const trigger = component.element.querySelector<HTMLElement>('[slot="trigger"], button');
    if (trigger === null) {
      throw new Error('Missing trigger');
    }
    return trigger;
  };
  const controlOf = (component: Mounted<PopoverContractProps>) => {
    const trigger = triggerOf(component);
    return trigger.shadowRoot?.querySelector('button') ?? trigger;
  };
  const isOpen = (component: Mounted<PopoverContractProps>) =>
    component.part('panel').matches(':popover-open');
  const press = (component: Mounted<PopoverContractProps>) => userEvent.click(controlOf(component));
  /** The focused element, inside the shadow roots too. */
  const focused = () => {
    let element = document.activeElement;
    while (element?.shadowRoot?.activeElement) {
      element = element.shadowRoot.activeElement;
    }
    return element;
  };
  const middle = (rect: DOMRect) => ({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  });

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

  it('opens from its trigger, which announces the panel, and reports each request', async () => {
    const onOpenChange = vi.fn<NonNullable<PopoverContractProps['onOpenChange']>>();
    const component = await mount({ onOpenChange }, { parent: spot() });
    const control = controlOf(component);
    expect(control.getAttribute('aria-haspopup')).toBe('dialog');
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(isOpen(component)).toBe(false);
    await press(component);
    await expect.poll(() => isOpen(component)).toBe(true);
    await expect.poll(() => control.getAttribute('aria-expanded')).toBe('true');
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true);
    expect(onOpenChange.mock.calls[0]?.[1]).toMatchObject({ reason: 'trigger' });
    await press(component);
    await expect.poll(() => isOpen(component)).toBe(false);
    expect(onOpenChange.mock.calls[1]?.[1]).toMatchObject({ reason: 'trigger' });
  });

  it('gives a native button of the page the same relationship', async () => {
    const component = await mount({ trigger: 'native' }, { parent: spot() });
    const control = controlOf(component);
    expect(control.tagName).toBe('BUTTON');
    expect(control.getAttribute('aria-haspopup')).toBe('dialog');
    await press(component);
    await expect.poll(() => control.getAttribute('aria-expanded')).toBe('true');
  });

  it('is a dialog named by its label, which takes the focus when a press opens it', async () => {
    const component = await mount({}, { parent: spot() });
    await press(component);
    await expect.poll(() => isOpen(component)).toBe(true);
    const tree = await component.accessibleTree();
    expect(tree).toContainEqual({ role: 'dialog', name: 'Filters' });
    await expect.poll(focused).toBe(component.part('panel'));
  });

  it('moves the focus to the element marked with data-autofocus', async () => {
    const component = await mount({ content: 'fields' }, { parent: spot() });
    await press(component);
    await expect.poll(() => focused()?.getAttribute('aria-label')).toBe('Second');
  });

  it('closes on Escape and returns the focus to its trigger', async () => {
    const onOpenChange = vi.fn<NonNullable<PopoverContractProps['onOpenChange']>>();
    const component = await mount({ content: 'fields', onOpenChange }, { parent: spot() });
    await press(component);
    await expect.poll(() => isOpen(component)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen(component)).toBe(false);
    expect(onOpenChange.mock.calls.at(-1)?.[1]).toMatchObject({ reason: 'escape' });
    await expect.poll(focused).toBe(controlOf(component));
  });

  it('closes on a press outside and when the focus leaves, without taking the focus back', async () => {
    const onOpenChange = vi.fn<NonNullable<PopoverContractProps['onOpenChange']>>();
    const parent = spot();
    const component = await mount({ content: 'fields', onOpenChange }, { parent });
    const outside = after(parent);
    await press(component);
    await expect.poll(() => isOpen(component)).toBe(true);
    await userEvent.click(document.body, { position: { x: 5, y: 5 } });
    await expect.poll(() => isOpen(component)).toBe(false);
    expect(onOpenChange.mock.calls.at(-1)?.[1]).toMatchObject({ reason: 'outside' });
    await press(component);
    await expect.poll(() => isOpen(component)).toBe(true);
    outside.focus();
    await expect.poll(() => isOpen(component)).toBe(false);
    expect(onOpenChange.mock.calls.at(-1)?.[1]).toMatchObject({ reason: 'focus-out' });
    expect(focused()).toBe(outside);
  });

  it('keeps its state when a request is refused', async () => {
    const component = await mount({ onOpenChange: () => false }, { parent: spot() });
    await press(component);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(isOpen(component)).toBe(false);
    expect(controlOf(component).getAttribute('aria-expanded')).toBe('false');
  });

  it('opens on the side it asks for, centred on the trigger, and flips when the window has no room', async () => {
    const box = async (
      props: PopoverContractProps,
      mountOptions: MountOptions = {},
      style = {},
    ) => {
      const component = await mount(
        { open: true, ...props },
        { parent: spot(style), ...mountOptions },
      );
      await expect.poll(() => isOpen(component)).toBe(true);
      // The script places the panel once the browser has laid it out.
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return {
        panel: component.part('panel').getBoundingClientRect(),
        trigger: triggerOf(component).getBoundingClientRect(),
      };
    };
    const bottom = await box({});
    expect(bottom.panel.top).toBeGreaterThan(bottom.trigger.bottom);
    expect(Math.abs(middle(bottom.panel).x - middle(bottom.trigger).x)).toBeLessThanOrEqual(1);
    const top = await box({ placement: 'top' });
    expect(top.panel.bottom).toBeLessThan(top.trigger.top);
    const start = await box({ placement: 'start' });
    expect(start.panel.right).toBeLessThan(start.trigger.left);
    const rtl = await box({ placement: 'start' }, { dir: 'rtl' });
    expect(rtl.panel.left).toBeGreaterThan(rtl.trigger.right);
    const end = await box({ placement: 'end' });
    expect(end.panel.left).toBeGreaterThan(end.trigger.right);
    const low = await box({}, {}, { insetBlockStart: 'auto', insetBlockEnd: '0px' });
    expect(low.panel.bottom).toBeLessThan(low.trigger.top);
  });

  it('points its arrow at the middle of the trigger, across the edge that faces it', async () => {
    const component = await mount({ open: true, showArrow: true }, { parent: spot() });
    await expect.poll(() => isOpen(component)).toBe(true);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const arrow = component.part('arrow').getBoundingClientRect();
    const panel = component.part('panel').getBoundingClientRect();
    const trigger = triggerOf(component).getBoundingClientRect();
    expect(Math.abs(middle(arrow).x - middle(trigger).x)).toBeLessThanOrEqual(1);
    // The turned square stands half out of the top edge of the panel.
    expect(Math.abs(middle(arrow).y - panel.top)).toBeLessThanOrEqual(1);
    expect(arrow.bottom).toBeLessThan(panel.top + arrow.height);
  });

  it('draws its panel from the tokens of popover', async () => {
    const component = await mount({ open: true }, { parent: spot() });
    await expect.poll(() => isOpen(component)).toBe(true);
    const style = getComputedStyle(component.part('panel'));
    expect(parseFloat(style.paddingTop)).toBe(tokenNumber('--popover-padding'));
    expect(parseFloat(style.borderTopLeftRadius)).toBe(tokenNumber('--popover-radius'));
    expect(parseFloat(style.borderTopWidth)).toBe(tokenNumber('--popover-border-width'));
    expect(style.boxShadow).not.toBe('none');
    const trigger = triggerOf(component).getBoundingClientRect();
    const panel = component.part('panel').getBoundingClientRect();
    expect(Math.round(panel.top - trigger.bottom)).toBe(tokenNumber('--popover-offset'));
  });
}
