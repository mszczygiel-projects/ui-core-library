import { configureUiCore } from '@mszczygiel-projects/ui-core-foundations/config';
import type {
  PaginationPageChangeDetails,
  PaginationProps,
} from '@mszczygiel-projects/ui-core-shared/pagination';
import { afterEach, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { tokenNumber } from '../tokens.ts';

/**
 * The props of the specification, plus what each harness translates: the first page, which the
 * web component takes from its attribute, and the callback, which it receives as an event.
 * `cancelChange` cancels each move, through the event in the web component and the native event
 * in React.
 */
export interface PaginationContractProps extends PaginationProps {
  readonly defaultPage?: number;
  readonly onPageChange?: (page: number, details: PaginationPageChangeDetails<Event>) => void;
  readonly cancelChange?: boolean;
}

/** The behaviour of Pagination, applied unchanged to the web component and the React component. */
export function paginationContract(adapter: Mount<PaginationContractProps>): void {
  const mounted: Mounted<PaginationContractProps>[] = [];
  const parents: HTMLElement[] = [];
  async function mount(props: PaginationContractProps = {}, mountOptions?: MountOptions) {
    const component = await adapter(
      { pageCount: 10, defaultPage: 5, ...props },
      { parent: column('800px'), ...mountOptions },
    );
    mounted.push(component);
    return component;
  }
  /** A parent of a given width, as a sidebar or a page column would be. */
  function column(width: string): HTMLElement {
    const parent = document.createElement('div');
    parent.style.inlineSize = width;
    document.body.append(parent);
    parents.push(parent);
    return parent;
  }
  /** The text of each entry of the list, an ellipsis as `…`. */
  const entries = (component: Mounted<PaginationContractProps>) =>
    [...component.part('list').querySelectorAll(':scope > li')].map(
      (item) => item.querySelector('a, button')?.textContent ?? '…',
    );
  const current = (component: Mounted<PaginationContractProps>) =>
    component.part('list').querySelector('[aria-current="page"]')?.textContent;
  const shown = (element: Element | null) =>
    element !== null && element.getBoundingClientRect().width > 0;
  async function landmark(component: Mounted<PaginationContractProps>) {
    return (await component.accessibleTree()).find((node) => node.role === 'navigation')?.name;
  }
  /** The native input of the jump field, located by its element since the text around it changes. */
  function jumpInput(component: Mounted<PaginationContractProps>) {
    const field = component.part('jump-field');
    const input = (field.shadowRoot ?? field).querySelector('input:not([type="hidden"])');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Missing jump input');
    }
    return page.elementLocator(input);
  }

  afterEach(async () => {
    configureUiCore({ labels: {} });
    for (const component of mounted.splice(0)) {
      await component.unmount();
    }
    for (const parent of parents.splice(0)) {
      parent.remove();
    }
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  });

  it('is a navigation landmark named by the default label, a prop or the author', async () => {
    const component = await mount();
    expect(await landmark(component)).toBe('Pagination');
    configureUiCore({ labels: { pagination: { label: 'Strony' } } });
    await component.update({});
    await vi.waitFor(async () => {
      expect(await landmark(component)).toBe('Strony');
    });
    await component.update({ label: 'Results' });
    expect(await landmark(component)).toBe('Results');
    const authored = await mount({}, { attributes: { 'aria-label': 'Search results' } });
    expect(await landmark(authored)).toBe('Search results');
  });

  it('shows the pages around the current one with an ellipsis, and marks the current page', async () => {
    const component = await mount();
    expect(entries(component)).toEqual(['1', '…', '4', '5', '6', '…', '10']);
    expect(current(component)).toBe('5');
    const tree = await component.accessibleTree();
    const pages = tree.filter((node) => node.role === 'button' && node.name.startsWith('Page'));
    expect(pages.map((node) => node.name)).toEqual([
      'Page 1',
      'Page 4',
      'Page 5',
      'Page 6',
      'Page 10',
    ]);
    expect(tree.map((node) => node.name).join('|')).not.toContain('…');
    await component.update({ siblingCount: 0, boundaryCount: 2 });
    expect(entries(component)).toEqual(['1', '2', '…', '5', '…', '9', '10']);
  });

  it('names its buttons and disables previous and next at the ends', async () => {
    const first = await mount({ defaultPage: 1 });
    const previous = first.screen.getByRole('button', { name: 'Previous page' });
    const next = first.screen.getByRole('button', { name: 'Next page' });
    await expect.element(previous).toBeDisabled();
    await expect.element(next).toBeEnabled();
    const last = await mount({ defaultPage: 10 });
    await expect.element(last.screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    configureUiCore({ labels: { pagination: { page: (page) => `Strona ${String(page)}` } } });
    await first.update({ previousLabel: 'Back' });
    await expect.element(first.screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    await expect
      .element(first.screen.getByRole('button', { name: 'Strona 2' }))
      .toBeInTheDocument();
  });

  it('moves to a pressed page, and to the previous and next, with the reason', async () => {
    const onPageChange = vi.fn<NonNullable<PaginationContractProps['onPageChange']>>();
    const component = await mount({ onPageChange });
    await userEvent.click(component.screen.getByRole('button', { name: 'Page 6' }));
    expect(current(component)).toBe('6');
    await userEvent.click(component.screen.getByRole('button', { name: 'Next page' }));
    expect(current(component)).toBe('7');
    await userEvent.click(component.screen.getByRole('button', { name: 'Previous page' }));
    expect(current(component)).toBe('6');
    expect(onPageChange.mock.calls.map(([page, details]) => [page, details.reason])).toEqual([
      [6, 'page'],
      [7, 'next'],
      [6, 'previous'],
    ]);
  });

  it('keeps its page when the move is canceled', async () => {
    const onPageChange = vi.fn<NonNullable<PaginationContractProps['onPageChange']>>();
    const component = await mount({ onPageChange, cancelChange: true });
    await userEvent.click(component.screen.getByRole('button', { name: 'Page 6' }));
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(current(component)).toBe('5');
  });

  it('renders links with getPageHref, which the browser follows unless the move is canceled', async () => {
    const getPageHref = (page: number) => `#page-${String(page)}`;
    const onPageChange = vi.fn<NonNullable<PaginationContractProps['onPageChange']>>();
    const component = await mount({ getPageHref, onPageChange, cancelChange: true });
    const link = component.screen.getByRole('link', { name: 'Page 6' });
    await expect.element(link).toHaveAttribute('href', '#page-6');
    await userEvent.click(link);
    expect(window.location.hash).toBe('');
    expect(onPageChange.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ reason: 'page', href: '#page-6' }),
    );
    await component.update({ cancelChange: false });
    await userEvent.click(component.screen.getByRole('link', { name: 'Page 4' }));
    expect(window.location.hash).toBe('#page-4');
    // The next button has no address of its own, so it loads the address of its page.
    await userEvent.click(component.screen.getByRole('button', { name: 'Next page' }));
    await expect.poll(() => window.location.hash).toBe('#page-5');
  });

  it('shows the status when asked, in the words of the labels', async () => {
    const component = await mount({ showStatus: true });
    expect(component.part('status').textContent).toBe('Page 5 of 10');
    await component.update({ getStatusLabel: (page, count) => `${String(page)}/${String(count)}` });
    expect(component.part('status').textContent).toBe('5/10');
    expect(component.text()).not.toContain('Page 5 of 10');
  });

  it('jumps to a typed page on Enter, keeps the number within the pages and restores bad input', async () => {
    const onPageChange = vi.fn<NonNullable<PaginationContractProps['onPageChange']>>();
    const component = await mount({ showJump: true, onPageChange });
    const input = jumpInput(component);
    const tree = await component.accessibleTree();
    expect(tree.some((node) => node.role === 'spinbutton' && node.name === 'Go to page')).toBe(
      true,
    );
    await expect.element(input).toHaveValue('5');
    await userEvent.fill(input, '8');
    await userEvent.keyboard('{Enter}');
    expect(current(component)).toBe('8');
    expect(onPageChange.mock.calls.at(-1)?.[1]).toEqual(
      expect.objectContaining({ reason: 'jump' }),
    );
    await userEvent.fill(input, '99');
    await userEvent.keyboard('{Enter}');
    expect(current(component)).toBe('10');
    expect(onPageChange.mock.calls.at(-1)?.[0]).toBe(10);
    await expect.element(input).toHaveValue('10');
    await userEvent.fill(input, '');
    await userEvent.tab();
    await expect.element(input).toHaveValue('10');
    expect(onPageChange).toHaveBeenCalledTimes(2);
  });

  it('prevents every move while disabled', async () => {
    const onPageChange = vi.fn<NonNullable<PaginationContractProps['onPageChange']>>();
    const component = await mount({ disabled: true, onPageChange, showJump: true });
    for (const name of ['Page 6', 'Previous page', 'Next page']) {
      await expect.element(component.screen.getByRole('button', { name })).toBeDisabled();
    }
    await expect.element(jumpInput(component)).toBeDisabled();
    const links = await mount({ disabled: true, getPageHref: (page) => `#p${String(page)}` });
    const link = links.part('page');
    expect(link.hasAttribute('href')).toBe(false);
    expect(link.getAttribute('aria-disabled')).toBe('true');
    await userEvent.click(link, { force: true });
    expect(window.location.hash).toBe('');
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('gives its pages way to the status or the jump field in a narrow container', async () => {
    const narrow = await mount({ showStatus: true }, { parent: column('320px') });
    expect(shown(narrow.part('list'))).toBe(false);
    expect(shown(narrow.part('status'))).toBe(true);
    const status = narrow.part('status').getBoundingClientRect();
    const previous = narrow.part('previous').getBoundingClientRect();
    const next = narrow.part('next').getBoundingClientRect();
    expect(previous.right).toBeLessThanOrEqual(status.left);
    expect(status.right).toBeLessThanOrEqual(next.left);
    const withJump = await mount({ showStatus: true, showJump: true }, { parent: column('320px') });
    expect(shown(withJump.part('status'))).toBe(false);
    expect(shown(withJump.part('jump-total'))).toBe(true);
    expect(shown(withJump.part('jump-label'))).toBe(false);
    expect(withJump.part('jump-total').textContent).toBe('of 10');
    const wide = await mount({ showJump: true });
    expect(shown(wide.part('list'))).toBe(true);
    expect(shown(wide.part('jump-label'))).toBe(true);
    expect(shown(wide.part('jump-total'))).toBe(false);
  });

  it('sizes its pages from the tokens and shows keyboard focus with the focus ring', async () => {
    const component = await mount();
    const button = component.part('page');
    const side = tokenNumber('--pagination-item-size');
    expect(button.getBoundingClientRect().height).toBe(side);
    expect(button.getBoundingClientRect().width).toBeGreaterThanOrEqual(side);
    button.focus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    await userEvent.tab();
    expect(getComputedStyle(button).outlineStyle).not.toBe('none');
    expect(parseFloat(getComputedStyle(button).outlineWidth)).toBe(tokenNumber('--ring-width'));
  });

  it('turns the chevrons around in right-to-left text', async () => {
    const transform = (component: Mounted<PaginationContractProps>, part: string) =>
      getComputedStyle(component.part(part).querySelector('svg') ?? document.body).transform;
    const ltr = await mount();
    const rtl = await mount({}, { dir: 'rtl' });
    expect(transform(ltr, 'previous')).toBe('none');
    for (const part of ['previous', 'next']) {
      await expect.poll(() => transform(rtl, part)).toBe('matrix(-1, 0, 0, 1, 0, 0)');
    }
  });
}
