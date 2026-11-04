import type { TabProps } from '@mszczygiel-projects/ui-core-shared/tab';
import type { TabsProps, TabsValueChangeDetails } from '@mszczygiel-projects/ui-core-shared/tabs';
import { expect, it, vi } from 'vitest';
import { commands, userEvent } from 'vitest/browser';

import type { Mount, Mounted } from '../harness/types.ts';
import { tokenNumber, tokenValue } from '../tokens.ts';
import { resolvedColor } from './action.contract.ts';

/** A tab of the contract: the props of Tab, without its icon, and the text of its panel. */
export interface TabsContractTab extends Omit<TabProps, 'icon'> {
  readonly content: string;
}

/** The props of the specification, plus what each harness translates. */
export interface TabsContractProps extends TabsProps {
  readonly tabs?: readonly TabsContractTab[];
  /** Gives every tab a decorative icon. */
  readonly withIcons?: boolean;
  readonly onValueChange?: (value: string, details: TabsValueChangeDetails<Event>) => void;
}

const TABS: readonly TabsContractTab[] = [
  { value: 'overview', label: 'Overview', content: 'A short overview.' },
  { value: 'details', label: 'Details', content: 'Every detail.' },
  { value: 'reviews', label: 'Reviews', content: 'What buyers say.' },
];

/** Every element of a part: in the shadow root of the web component, by class in React. */
function parts(component: Mounted<TabsContractProps>, name: string): HTMLElement[] {
  const root = component.element.shadowRoot ?? component.element;
  const selector =
    component.element.shadowRoot === null ? `.ui-tabs__${name}` : `[part~="${name}"]`;
  return Array.from(root.querySelectorAll<HTMLElement>(selector));
}

function selected(component: Mounted<TabsContractProps>): string[] {
  return parts(component, 'tab')
    .filter((tab) => tab.getAttribute('aria-selected') === 'true')
    .map((tab) => tab.textContent);
}

function focused(component: Mounted<TabsContractProps>): string | undefined {
  return parts(component, 'tab').find((tab) => tab.matches(':focus'))?.textContent;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

/** The behaviour of Tabs, applied unchanged to the web component and the React component. */
export function tabsContract(mount: Mount<TabsContractProps>): void {
  it('is a list of tabs named by their labels, and a panel named by the selected tab', async () => {
    const component = await mount({ tabs: TABS, label: 'Product' });
    const tree = await component.accessibleTree();
    expect(tree.find((node) => node.role === 'tablist')?.name).toBe('Product');
    expect(tree.filter((node) => node.role === 'tab').map((node) => node.name)).toEqual([
      'Overview',
      'Details',
      'Reviews',
    ]);
    // Chromium exposes the panels hidden until found too, each named by its tab.
    expect(tree.filter((node) => node.role === 'tabpanel').map((node) => node.name)).toEqual([
      'Overview',
      'Details',
      'Reviews',
    ]);
    const [tab] = parts(component, 'tab');
    const panel = parts(component, 'panel')[0];
    expect(tab?.getAttribute('aria-controls')).toBe(panel?.id);
    expect(panel?.getAttribute('aria-labelledby')).toBe(tab?.id);
    await component.unmount();
  });

  it('keeps every panel in the page, the others hidden until find in page reaches them', async () => {
    const component = await mount({ tabs: TABS });
    expect(selected(component)).toEqual(['Overview']);
    const panels = parts(component, 'panel');
    for (const tab of TABS) {
      expect(component.element.textContent).toContain(tab.content);
    }
    await expect.poll(() => panels[1]?.getAttribute('hidden')).toBe('until-found');
    expect(panels[0]?.hasAttribute('hidden')).toBe(false);
    await component.unmount();
  });

  it('selects the first enabled tab when no tab has the value', async () => {
    const component = await mount({
      tabs: [{ ...TABS[0], disabled: true } as TabsContractTab, ...TABS.slice(1)],
      value: 'missing',
    });
    expect(selected(component)).toEqual(['Details']);
    await component.unmount();
  });

  it('selects a tab on a press and reports it with the reason trigger', async () => {
    const changed = vi.fn<NonNullable<TabsContractProps['onValueChange']>>();
    const component = await mount({ tabs: TABS, onValueChange: changed });
    const reviews = parts(component, 'tab')[2];
    if (reviews === undefined) {
      throw new Error('Missing the third tab');
    }
    await userEvent.click(reviews);
    await expect.poll(() => selected(component)).toEqual(['Reviews']);
    expect(parts(component, 'panel')[2]?.hasAttribute('hidden')).toBe(false);
    expect(changed.mock.calls.map(([value, details]) => [value, details.reason])).toEqual([
      ['reviews', 'trigger'],
    ]);
    expect(changed.mock.calls[0]?.[1].originalEvent).toBeInstanceOf(Event);
    await component.unmount();
  });

  it('moves the focus and the selection along a horizontal list, wrapping, with Home and End', async () => {
    const changed = vi.fn<NonNullable<TabsContractProps['onValueChange']>>();
    const component = await mount({ tabs: TABS, onValueChange: changed });
    parts(component, 'tab')[0]?.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.poll(() => selected(component)).toEqual(['Details']);
    expect(focused(component)).toBe('Details');
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    await expect.poll(() => selected(component)).toEqual(['Reviews']);
    await userEvent.keyboard('{Home}');
    await expect.poll(() => focused(component)).toBe('Overview');
    await userEvent.keyboard('{End}');
    await expect.poll(() => selected(component)).toEqual(['Reviews']);
    await userEvent.keyboard('{ArrowDown}');
    await nextFrame();
    expect(selected(component)).toEqual(['Reviews']);
    expect(changed.mock.calls.map(([value]) => value)).toEqual([
      'details',
      'overview',
      'reviews',
      'overview',
      'reviews',
    ]);
    await component.unmount();
  });

  it('moves with the vertical arrows in a vertical list', async () => {
    const component = await mount({ tabs: TABS, orientation: 'vertical' });
    expect(parts(component, 'list')[0]?.getAttribute('aria-orientation')).toBe('vertical');
    parts(component, 'tab')[0]?.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect.poll(() => selected(component)).toEqual(['Details']);
    await userEvent.keyboard('{ArrowRight}');
    await nextFrame();
    expect(selected(component)).toEqual(['Details']);
    await userEvent.keyboard('{ArrowUp}');
    await expect.poll(() => selected(component)).toEqual(['Overview']);
    await component.unmount();
  });

  it('turns the horizontal arrows in right-to-left text', async () => {
    const component = await mount({ tabs: TABS }, { dir: 'rtl' });
    parts(component, 'tab')[0]?.focus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect.poll(() => selected(component)).toEqual(['Details']);
    await component.unmount();
  });

  it('skips a disabled tab, which a press cannot select', async () => {
    const changed = vi.fn<NonNullable<TabsContractProps['onValueChange']>>();
    const component = await mount({
      tabs: TABS.map((tab) => (tab.value === 'details' ? { ...tab, disabled: true } : tab)),
      onValueChange: changed,
    });
    const tabs = parts(component, 'tab');
    expect(tabs[1]?.matches(':disabled')).toBe(true);
    tabs[1]?.click();
    await nextFrame();
    expect(selected(component)).toEqual(['Overview']);
    tabs[0]?.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.poll(() => selected(component)).toEqual(['Reviews']);
    expect(changed.mock.calls.map(([value]) => value)).toEqual(['reviews']);
    await component.unmount();
  });

  it('enters the list at the selected tab and leaves it for the panel with Tab', async () => {
    const component = await mount({ tabs: TABS, value: 'details' });
    const tabs = parts(component, 'tab');
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([-1, 0, -1]);
    await userEvent.tab();
    expect(focused(component)).toBe('Details');
    await userEvent.tab();
    expect(parts(component, 'panel')[1]?.matches(':focus')).toBe(true);
    await component.unmount();
  });

  it('selects the tab of a match that find in page reveals, with the reason find', async () => {
    const changed = vi.fn<NonNullable<TabsContractProps['onValueChange']>>();
    const component = await mount({ tabs: TABS, onValueChange: changed });
    const panel = parts(component, 'panel')[2];
    await expect.poll(() => panel?.getAttribute('hidden')).toBe('until-found');
    panel?.dispatchEvent(new Event('beforematch'));
    await expect.poll(() => selected(component)).toEqual(['Reviews']);
    expect(changed.mock.calls[0]?.[1].reason).toBe('find');
    await component.unmount();
  });

  it('selects the tab of a new value from the page without reporting it', async () => {
    const changed = vi.fn<NonNullable<TabsContractProps['onValueChange']>>();
    const component = await mount({ tabs: TABS, value: 'overview', onValueChange: changed });
    await component.update({ value: 'reviews' });
    await expect.poll(() => selected(component)).toEqual(['Reviews']);
    expect(changed).not.toHaveBeenCalled();
    await component.unmount();
  });

  it('shows an icon before the label, hidden from assistive technology', async () => {
    const component = await mount({ tabs: TABS, withIcons: true });
    const [icon] = parts(component, 'tab-icon');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(icon?.querySelector('svg')).not.toBeNull();
    expect(icon?.getBoundingClientRect().width).toBe(tokenNumber('--tabs-icon-size'));
    // React wraps the SVG in an element of its own, which must not change its size.
    const svg = icon?.querySelector('svg')?.getBoundingClientRect();
    expect([svg?.width, svg?.height]).toEqual([
      tokenNumber('--tabs-icon-size'),
      tokenNumber('--tabs-icon-size'),
    ]);
    const tree = await component.accessibleTree();
    expect(tree.find((node) => node.role === 'tab')?.name).toBe('Overview');
    await component.unmount();
  });

  it('sizes its tabs from their tokens and marks the selected one with the indicator', async () => {
    const component = await mount({ tabs: TABS });
    const [first, second] = parts(component, 'tab');
    if (first === undefined || second === undefined) {
      throw new Error('Missing the tabs');
    }
    const style = getComputedStyle(first);
    expect(parseFloat(style.fontSize)).toBe(tokenNumber('--tabs-font-size'));
    expect(Number(style.fontWeight)).toBe(tokenNumber('--tabs-font-weight'));
    expect(parseFloat(style.paddingInlineStart)).toBe(tokenNumber('--tabs-tab-padding-inline'));
    expect(parseFloat(style.paddingBlockStart)).toBe(tokenNumber('--tabs-tab-padding-stack'));
    expect(style.color).toBe(resolvedColor(tokenValue('--color-tabs-tab-text-selected')));
    expect(getComputedStyle(second).color).toBe(
      resolvedColor(tokenValue('--color-tabs-tab-text-default')),
    );
    const indicator = getComputedStyle(first, '::after');
    expect(parseFloat(indicator.height)).toBe(tokenNumber('--tabs-indicator-width'));
    expect(indicator.backgroundColor).toBe(
      resolvedColor(tokenValue('--color-tabs-indicator-default')),
    );
    expect(getComputedStyle(second, '::after').content).toBe('none');
    await component.unmount();
  });

  it('fills the selected tab of the segmented variant', async () => {
    const component = await mount({ tabs: TABS, variant: 'segmented' });
    const [first, second] = parts(component, 'tab');
    if (first === undefined || second === undefined) {
      throw new Error('Missing the tabs');
    }
    expect(getComputedStyle(first).backgroundColor).toBe(
      resolvedColor(tokenValue('--color-tabs-segmented-tab-background-selected')),
    );
    expect(getComputedStyle(first).color).toBe(
      resolvedColor(tokenValue('--color-tabs-segmented-tab-text-selected')),
    );
    const list = getComputedStyle(parts(component, 'list')[0] ?? first);
    expect(list.backgroundColor).toBe(
      resolvedColor(tokenValue('--color-tabs-segmented-background')),
    );
    expect(getComputedStyle(first, '::after').content).toBe('none');
    await component.unmount();
  });

  for (const variant of ['underline', 'segmented'] as const) {
    it(`shows keyboard focus on a ${variant} tab with the whole focus ring`, async () => {
      const component = await mount({ tabs: TABS, variant });
      await userEvent.tab();
      const [tab] = parts(component, 'tab');
      if (tab === undefined) {
        throw new Error('Missing the tab');
      }
      expect(tab.matches(':focus-visible')).toBe(true);
      const style = getComputedStyle(tab);
      expect(parseFloat(style.outlineWidth)).toBe(tokenNumber('--ring-width'));
      expect(parseFloat(style.outlineOffset)).toBe(tokenNumber('--ring-offset'));
      // The scroller around the list clips, so it must hold the ring of every tab.
      const room = tokenNumber('--ring-width') + tokenNumber('--ring-offset');
      const scroller = tab.closest<HTMLElement>('.scroller, .ui-tabs__scroller');
      const box = tab.getBoundingClientRect();
      const clip = scroller?.getBoundingClientRect();
      expect(clip?.top).toBeLessThanOrEqual(box.top - room);
      expect(clip?.bottom).toBeGreaterThanOrEqual(box.bottom + room);
      expect(clip?.left).toBeLessThanOrEqual(box.left - room);
      await component.unmount();
    });
  }

  for (const variant of ['underline', 'segmented'] as const) {
    it(`scrolls a horizontal ${variant} list that does not fit, inside its own box`, async () => {
      const parent = document.createElement('div');
      parent.style.inlineSize = '160px';
      document.body.append(parent);
      const component = await mount({ tabs: TABS, variant }, { parent });
      const [list] = parts(component, 'list');
      // The list keeps the width of its tabs, and the scroller around it scrolls.
      const scroller = list?.closest<HTMLElement>('.scroller, .ui-tabs__scroller');
      expect(scroller?.scrollWidth).toBeGreaterThan(scroller?.clientWidth ?? 0);
      // The scroller reaches past its box by the room of the focus ring, and no further.
      const room = tokenNumber('--ring-width') + tokenNumber('--ring-offset');
      expect(scroller?.getBoundingClientRect().right).toBeLessThanOrEqual(
        parent.getBoundingClientRect().right + room,
      );
      expect(component.element.getBoundingClientRect().width).toBeLessThanOrEqual(160);
      await component.unmount();
      parent.remove();
    });
  }

  for (const orientation of ['horizontal', 'vertical'] as const) {
    it(`shows every ${orientation} panel in the same place`, async () => {
      const component = await mount({ tabs: TABS, orientation });
      const shown = () => {
        const panel = parts(component, 'panel').find((candidate) => !candidate.hidden);
        const box = panel?.getBoundingClientRect();
        return [box?.left, box?.top];
      };
      const first = shown();
      for (const tab of parts(component, 'tab').slice(1)) {
        tab.click();
        await expect.poll(() => tab.getAttribute('aria-selected')).toBe('true');
        expect(shown()).toEqual(first);
      }
      await component.unmount();
    });
  }

  for (const variant of ['underline', 'segmented'] as const) {
    it(`marks the selected ${variant} tab in forced colours`, async () => {
      await commands.emulateMedia({ forcedColors: 'active' });
      const component = await mount({ tabs: TABS, variant });
      const [first, second] = parts(component, 'tab');
      const mark = getComputedStyle(first ?? document.body, '::after');
      if (variant === 'underline') {
        expect(mark.backgroundColor).toBe(resolvedColor('Highlight'));
        expect(parseFloat(mark.height)).toBe(tokenNumber('--tabs-indicator-width'));
      } else {
        expect(mark.borderTopStyle).toBe('solid');
        expect(mark.borderTopColor).toBe(resolvedColor('Highlight'));
        expect(parseFloat(mark.borderTopWidth)).toBe(tokenNumber('--tabs-indicator-width'));
      }
      expect(getComputedStyle(second ?? document.body, '::after').content).toBe('none');
      await commands.emulateMedia({ forcedColors: null });
      await component.unmount();
    });
  }
}
