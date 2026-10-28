import { configureUiCore } from '@mszczygiel-projects/ui-core-foundations/config';
import type {
  SearchFieldClearDetails,
  SearchFieldProps,
} from '@mszczygiel-projects/ui-core-shared/search-field';
import { afterEach, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { pseudoLabels } from '../pseudo.ts';
import { pixels, tokenValue } from '../tokens.ts';
import {
  controlOf,
  formFixture,
  textControlContract,
  type TextControlContractProps,
} from './text-control.contract.ts';

/** The props of the specification, plus what each harness translates. */
export interface SearchFieldContractProps extends SearchFieldProps, TextControlContractProps {
  readonly onClear?: (details: SearchFieldClearDetails<Event>) => void;
}

/** The behaviour of SearchField, applied unchanged to the web component and the React component. */
export function searchFieldContract(adapter: Mount<SearchFieldContractProps>): void {
  textControlContract(adapter, {
    role: 'searchbox',
    graphic: 'clear',
    graphicProps: { defaultValue: 'Query' },
  });

  const mounted: Mounted<SearchFieldContractProps>[] = [];
  const fixtures: HTMLElement[] = [];
  async function mount(props: SearchFieldContractProps = {}, options?: MountOptions) {
    const field = await adapter({ label: 'Search products', ...props }, options);
    mounted.push(field);
    return field;
  }
  afterEach(async () => {
    for (const field of mounted.splice(0)) {
      await field.unmount();
    }
    for (const fixture of fixtures.splice(0)) {
      fixture.remove();
    }
  });

  const buttons = async (field: Mounted<SearchFieldContractProps>) =>
    (await field.accessibleTree()).filter((node) => node.role === 'button');

  it('shows a decorative search icon and no placeholder of its own', async () => {
    const field = await mount();
    expect(field.part('leading-icon').getAttribute('aria-hidden')).toBe('true');
    expect(controlOf(field).placeholder.trim()).toBe('');
    expect(controlOf(field).type).toBe('search');
  });

  it('shows the clear button only for a query the user may change', async () => {
    const field = await mount();
    expect(await buttons(field)).toEqual([]);
    await page.elementLocator(controlOf(field)).fill('shoes');
    await expect
      .poll(async () => (await buttons(field)).map((node) => node.name))
      .toEqual(['Clear search']);
    await field.update({ readOnly: true });
    await expect.poll(async () => (await buttons(field)).length).toBe(0);
    await field.update({ readOnly: false, disabled: true });
    await expect.poll(async () => (await buttons(field)).length).toBe(0);
    const { fieldset } = formFixture(fixtures);
    const inFieldset = await mount({ defaultValue: 'shoes' }, { parent: fieldset });
    expect(await buttons(inFieldset)).toHaveLength(1);
    fieldset.disabled = true;
    await expect.poll(async () => (await buttons(inFieldset)).length).toBe(0);
  });

  it('clears the query with its button, keeps the focus and reports both changes', async () => {
    const changed = vi.fn<NonNullable<SearchFieldContractProps['onValueChange']>>();
    const cleared = vi.fn<NonNullable<SearchFieldContractProps['onClear']>>();
    const field = await mount({ onValueChange: changed, onClear: cleared });
    await page.elementLocator(controlOf(field)).fill('shoes');
    changed.mockClear();
    await page.elementLocator(field.part('clear')).click();
    expect(controlOf(field).value).toBe('');
    expect(controlOf(field).matches(':focus')).toBe(true);
    expect(changed).toHaveBeenCalledExactlyOnceWith('', expect.anything());
    expect(cleared).toHaveBeenCalledOnce();
    expect(cleared.mock.calls[0]?.[0].originalEvent).toBeInstanceOf(MouseEvent);
    await expect.poll(async () => (await buttons(field)).length).toBe(0);
  });

  it('clears a query with Escape, and lets Escape reach the page in an empty field', async () => {
    const cleared = vi.fn<NonNullable<SearchFieldContractProps['onClear']>>();
    const pageKeys = vi.fn();
    document.addEventListener('keydown', pageKeys);
    try {
      const field = await mount({ defaultValue: 'shoes', onClear: cleared });
      await page.elementLocator(controlOf(field)).click();
      await userEvent.keyboard('{Escape}');
      expect(controlOf(field).value).toBe('');
      expect(cleared).toHaveBeenCalledOnce();
      expect(pageKeys).not.toHaveBeenCalled();
      await userEvent.keyboard('{Escape}');
      expect(pageKeys).toHaveBeenCalledOnce();
      expect(cleared).toHaveBeenCalledOnce();
    } finally {
      document.removeEventListener('keydown', pageKeys);
    }
  });

  it('keeps the query when the page cancels Escape before the field', async () => {
    const cleared = vi.fn<NonNullable<SearchFieldContractProps['onClear']>>();
    const cancel = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
      }
    };
    document.addEventListener('keydown', cancel, { capture: true });
    try {
      const field = await mount({ defaultValue: 'shoes', onClear: cleared });
      await page.elementLocator(controlOf(field)).click();
      await userEvent.keyboard('{Escape}');
      expect(controlOf(field).value).toBe('shoes');
      expect(cleared).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', cancel, { capture: true });
    }
  });

  it('does not clear a read-only query with Escape', async () => {
    const cleared = vi.fn<NonNullable<SearchFieldContractProps['onClear']>>();
    const field = await mount({ defaultValue: 'kept', readOnly: true, onClear: cleared });
    await page.elementLocator(controlOf(field)).click();
    await userEvent.keyboard('{Escape}');
    expect(controlOf(field).value).toBe('kept');
    expect(cleared).not.toHaveBeenCalled();
  });

  it('submits the form on Enter, and the cleared query after a clear', async () => {
    const { fieldset, submitted } = formFixture(fixtures);
    const field = await mount({ name: 'q', defaultValue: 'shoes' }, { parent: fieldset });
    await page.elementLocator(controlOf(field)).click();
    await userEvent.keyboard('{Enter}');
    expect(submitted).toHaveBeenCalledExactlyOnceWith(null, [['q', 'shoes']]);
    await page.elementLocator(field.part('clear')).click();
    await userEvent.keyboard('{Enter}');
    expect(submitted).toHaveBeenLastCalledWith(null, [['q', '']]);
  });

  it('takes the name of the clear button from the configured labels, then from its prop', async () => {
    const field = await mount({ defaultValue: 'shoes' });
    const named = async () => (await buttons(field))[0]?.name;
    configureUiCore({ labels: pseudoLabels });
    await expect.poll(named).toBe(pseudoLabels.searchField.clear);
    await field.update({ clearLabel: 'Suche löschen' });
    expect(await named()).toBe('Suche löschen');
  });

  it('gives the clear button a pointer target of the minimum size', async () => {
    for (const density of ['comfortable', 'compact'] as const) {
      const field = await mount({ size: 'small', defaultValue: 'shoes' }, { density });
      const target = getComputedStyle(field.part('clear'), '::after');
      const minimum = pixels(tokenValue('--control-action-target-min-size', { density }));
      const box = field.part('clear').getBoundingClientRect();
      const inset = Number.parseFloat(target.insetBlockStart);
      expect(box.height - 2 * inset).toBeGreaterThanOrEqual(minimum);
      expect(box.width - 2 * inset).toBeGreaterThanOrEqual(minimum);
    }
  });
}
