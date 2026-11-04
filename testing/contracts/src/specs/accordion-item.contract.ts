import {
  type AccordionItemOpenChangeDetails,
  type AccordionItemProps,
  defaultAccordionHeadingLevel,
} from '@mszczygiel-projects/ui-core-shared/accordion-item';
import { expect, it, vi } from 'vitest';
import { commands, userEvent } from 'vitest/browser';

import type { Mount } from '../harness/types.ts';
import { tokenNumber } from '../tokens.ts';

/** The props of the specification, plus what each harness translates. */
export interface AccordionItemContractProps extends AccordionItemProps {
  readonly children?: string;
  /** Returning false refuses the request: the web component cancels it, React keeps its state. */
  readonly onOpenChange?: (
    open: boolean,
    details: AccordionItemOpenChangeDetails<Event>,
  ) => boolean | undefined;
}

const SECTION = { label: 'Shipping', children: 'Orders ship within two days.' } as const;

/** The behaviour of AccordionItem, applied unchanged to the web component and the React component. */
export function accordionItemContract(mount: Mount<AccordionItemContractProps>): void {
  it('is a heading of level 3 that holds a button named by the label', async () => {
    const component = await mount(SECTION);
    const heading = component.part('heading');
    expect(heading.localName).toBe(`h${String(defaultAccordionHeadingLevel)}`);
    const tree = await component.accessibleTree();
    expect(tree.find((node) => node.role === 'heading')?.name).toBe('Shipping');
    expect(tree.find((node) => node.role === 'button')?.name).toBe('Shipping');
    await component.unmount();
  });

  it('follows the heading level, and falls back to 3 for a level that is not one of a section', async () => {
    const component = await mount({ ...SECTION, headingLevel: 5 });
    expect(component.part('heading').localName).toBe('h5');
    await component.update({ headingLevel: 1 as AccordionItemProps['headingLevel'] });
    await expect.poll(() => component.part('heading').localName).toBe('h3');
    await component.unmount();
  });

  it('keeps closed content in the page, hidden until find in page reaches it', async () => {
    const component = await mount(SECTION);
    const trigger = component.part('trigger');
    const panel = component.part('panel');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(component.element.textContent).toContain('Orders ship within two days.');
    await expect.poll(() => panel.getAttribute('hidden')).toBe('until-found');
    // A panel hidden until found keeps its box, which holds nothing while it is closed.
    expect(panel.getBoundingClientRect().height).toBe(0);
    await component.unmount();
  });

  it('opens on a press as a region named by its heading, and closes on the next', async () => {
    const changed = vi.fn<NonNullable<AccordionItemContractProps['onOpenChange']>>();
    const component = await mount({ ...SECTION, onOpenChange: changed });
    const trigger = component.part('trigger');
    await userEvent.click(trigger);
    await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('true');
    expect(component.part('panel').hasAttribute('hidden')).toBe(false);
    const tree = await component.accessibleTree();
    expect(tree.find((node) => node.role === 'region')?.name).toBe('Shipping');
    await userEvent.click(trigger);
    await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('false');
    expect(changed.mock.calls.map(([open, details]) => [open, details.reason])).toEqual([
      [true, 'trigger'],
      [false, 'trigger'],
    ]);
    expect(changed.mock.calls[0]?.[1].originalEvent).toBeInstanceOf(Event);
    await component.unmount();
  });

  it('opens with Enter and Space on its button', async () => {
    const component = await mount(SECTION);
    const trigger = component.part('trigger');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('true');
    await userEvent.keyboard(' ');
    await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('false');
    await component.unmount();
  });

  it('stays as it is when the page refuses a press', async () => {
    const component = await mount({ ...SECTION, onOpenChange: () => false });
    const trigger = component.part('trigger');
    await userEvent.click(trigger);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    await component.unmount();
  });

  it('opens when find in page reveals its content, with the reason find', async () => {
    const changed = vi.fn<NonNullable<AccordionItemContractProps['onOpenChange']>>();
    const component = await mount({ ...SECTION, onOpenChange: changed });
    await expect.poll(() => component.part('panel').getAttribute('hidden')).toBe('until-found');
    component.part('panel').dispatchEvent(new Event('beforematch'));
    await expect.poll(() => component.part('trigger').getAttribute('aria-expanded')).toBe('true');
    expect(changed.mock.calls[0]?.[1].reason).toBe('find');
    await component.unmount();
  });

  it('cannot be opened when disabled, and leaves the order of the Tab key', async () => {
    const changed = vi.fn();
    const component = await mount({ ...SECTION, disabled: true, onOpenChange: changed });
    const trigger = component.part('trigger');
    expect(trigger.matches(':disabled')).toBe(true);
    trigger.click();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(changed).not.toHaveBeenCalled();
    await component.unmount();
  });

  it('sizes the heading and its icon from its tokens, and turns the icon over when open', async () => {
    const component = await mount(SECTION);
    const trigger = getComputedStyle(component.part('trigger'));
    expect(parseFloat(trigger.fontSize)).toBe(tokenNumber('--accordion-font-size'));
    expect(parseFloat(trigger.paddingBlockStart)).toBe(
      tokenNumber('--accordion-trigger-padding-stack'),
    );
    expect(parseFloat(trigger.paddingInlineStart)).toBe(
      tokenNumber('--accordion-trigger-padding-inline'),
    );
    expect(Number(trigger.fontWeight)).toBe(tokenNumber('--accordion-font-weight'));
    const icon = component.part('icon');
    expect(icon.getBoundingClientRect().width).toBe(tokenNumber('--accordion-icon-size'));
    expect(getComputedStyle(icon).rotate).toBe('none');
    await component.update({ open: true });
    await expect.poll(() => getComputedStyle(component.part('icon')).rotate).toBe('180deg');
    await component.unmount();
  });

  it('shows keyboard focus on its button with the focus ring', async () => {
    const component = await mount(SECTION);
    await userEvent.tab();
    const trigger = component.part('trigger');
    expect(trigger.matches(':focus-visible')).toBe(true);
    expect(getComputedStyle(trigger).outlineStyle).not.toBe('none');
    expect(parseFloat(getComputedStyle(trigger).outlineWidth)).toBe(tokenNumber('--ring-width'));
    await component.unmount();
  });

  it('turns the icon over at once when the user asks for reduced motion', async () => {
    await commands.emulateMedia({ reducedMotion: 'reduce' });
    const component = await mount(SECTION);
    expect(getComputedStyle(component.part('icon')).transitionDuration).toBe('0s');
    await commands.emulateMedia({ reducedMotion: null });
    await component.unmount();
  });

  it('starts its label at the start edge in right-to-left text', async () => {
    const component = await mount(SECTION, { dir: 'rtl' });
    const trigger = component.part('trigger').getBoundingClientRect();
    const label = component.part('label').getBoundingClientRect();
    const icon = component.part('icon').getBoundingClientRect();
    expect(label.right).toBeCloseTo(
      trigger.right - tokenNumber('--accordion-trigger-padding-inline'),
    );
    expect(icon.left).toBeLessThan(label.left);
    await component.unmount();
  });
}
