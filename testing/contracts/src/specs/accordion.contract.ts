import type { AccordionProps } from '@mszczygiel-projects/ui-core-shared/accordion';
import type {
  AccordionItemOpenChangeDetails,
  AccordionItemProps,
} from '@mszczygiel-projects/ui-core-shared/accordion-item';
import { expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';

import type { Mount, Mounted } from '../harness/types.ts';
import { tokenNumber } from '../tokens.ts';

/** A section of the contract: the props of AccordionItem and its text. */
export interface AccordionContractSection extends AccordionItemProps {
  readonly content: string;
}

/** The props of the specification, plus what each harness translates. */
export interface AccordionContractProps extends AccordionProps {
  readonly sections?: readonly AccordionContractSection[];
  /** A request of the section with the label; returning false refuses it. */
  readonly onOpenChange?: (
    label: string,
    open: boolean,
    details: AccordionItemOpenChangeDetails<Event>,
  ) => boolean | undefined;
}

const SECTIONS: readonly AccordionContractSection[] = [
  { label: 'Shipping', content: 'Orders ship within two days.' },
  { label: 'Returns', content: 'Return any order within a month.' },
  { label: 'Warranty', content: 'Every product has two years.' },
];

function triggers(component: Mounted<AccordionContractProps>): HTMLButtonElement[] {
  // The parts of each section: its shadow root in the web component, its classes in React.
  return Array.from(component.element.children).flatMap((section) => {
    const button =
      section.shadowRoot?.querySelector<HTMLButtonElement>('[part="trigger"]') ??
      section.querySelector<HTMLButtonElement>('.ui-accordion-item__trigger');
    return button === null ? [] : [button];
  });
}

function expanded(component: Mounted<AccordionContractProps>): boolean[] {
  return triggers(component).map((button) => button.getAttribute('aria-expanded') === 'true');
}

function focused(component: Mounted<AccordionContractProps>): number {
  return triggers(component).findIndex((button) => button.matches(':focus'));
}

/** The behaviour of Accordion, applied unchanged to the web component and the React component. */
export function accordionContract(mount: Mount<AccordionContractProps>): void {
  it('is a list of headings with buttons named by their labels, in order', async () => {
    const component = await mount({ sections: SECTIONS });
    const tree = await component.accessibleTree();
    expect(tree.filter((node) => node.role === 'heading').map((node) => node.name)).toEqual([
      'Shipping',
      'Returns',
      'Warranty',
    ]);
    expect(tree.filter((node) => node.role === 'button').map((node) => node.name)).toEqual([
      'Shipping',
      'Returns',
      'Warranty',
    ]);
    // Every text is in the page, closed or open, for a crawler and for find in page.
    for (const section of SECTIONS) {
      expect(component.element.textContent).toContain(section.content);
    }
    await component.unmount();
  });

  it('keeps one section open: opening one closes the others', async () => {
    const changed = vi.fn<NonNullable<AccordionContractProps['onOpenChange']>>();
    const component = await mount({
      sections: SECTIONS.map((section, index) => ({ ...section, open: index === 0 })),
      onOpenChange: changed,
    });
    await expect.poll(() => expanded(component)).toEqual([true, false, false]);
    await userEvent.click(triggers(component)[1] ?? component.element);
    await expect.poll(() => expanded(component)).toEqual([false, true, false]);
    // The press is the one request; the group closes the other section without one in the web
    // component, and with the reason group in React.
    const requests = changed.mock.calls.filter(([, , details]) => details.reason !== 'group');
    expect(requests.map(([label, open]) => [label, open])).toEqual([['Returns', true]]);
    await userEvent.click(triggers(component)[1] ?? component.element);
    await expect.poll(() => expanded(component)).toEqual([false, false, false]);
    await component.unmount();
  });

  it('keeps every section that the user opens with multiple', async () => {
    const component = await mount({ sections: SECTIONS, multiple: true });
    await userEvent.click(triggers(component)[0] ?? component.element);
    await userEvent.click(triggers(component)[2] ?? component.element);
    await expect.poll(() => expanded(component)).toEqual([true, false, true]);
    await component.unmount();
  });

  it('leaves the others open when the page refuses a press', async () => {
    const component = await mount({
      sections: SECTIONS.map((section, index) => ({ ...section, open: index === 0 })),
      onOpenChange: (label) => label !== 'Returns',
    });
    await userEvent.click(triggers(component)[1] ?? component.element);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(expanded(component)).toEqual([true, false, false]);
    await component.unmount();
  });

  it('moves the focus between headings with the arrows, Home and End, past disabled ones', async () => {
    const component = await mount({
      sections: [
        ...SECTIONS.slice(0, 2),
        { ...SECTIONS[2], label: 'Gone', disabled: true } as AccordionContractSection,
        { label: 'Contact', content: 'Write to us.' },
      ],
    });
    triggers(component)[0]?.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(focused(component)).toBe(1);
    await userEvent.keyboard('{ArrowDown}');
    expect(focused(component)).toBe(3);
    await userEvent.keyboard('{ArrowDown}');
    expect(focused(component)).toBe(0);
    await userEvent.keyboard('{ArrowUp}');
    expect(focused(component)).toBe(3);
    await userEvent.keyboard('{Home}');
    expect(focused(component)).toBe(0);
    await userEvent.keyboard('{End}');
    expect(focused(component)).toBe(3);
    // The keys move the focus only, and open nothing.
    expect(expanded(component)).toEqual([false, false, false, false]);
    await component.unmount();
  });

  it('moves with the same arrows in right-to-left text, since the headings stack vertically', async () => {
    const component = await mount({ sections: SECTIONS }, { dir: 'rtl' });
    triggers(component)[0]?.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(focused(component)).toBe(1);
    await userEvent.keyboard('{ArrowLeft}');
    expect(focused(component)).toBe(1);
    await component.unmount();
  });

  it('draws a line between sections, none above the first', async () => {
    const component = await mount({ sections: SECTIONS });
    const sections = Array.from(component.element.children) as HTMLElement[];
    const widths = sections.map((section) =>
      parseFloat(getComputedStyle(section).borderBlockStartWidth),
    );
    expect(widths).toEqual([
      0,
      tokenNumber('--accordion-border-width'),
      tokenNumber('--accordion-border-width'),
    ]);
    // The colour of the token, resolved by the browser as for any element of the page.
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-accordion-border)';
    document.body.append(probe);
    expect(getComputedStyle(sections[1] ?? component.element).borderBlockStartColor).toBe(
      getComputedStyle(probe).color,
    );
    probe.remove();
    await component.unmount();
  });
}
