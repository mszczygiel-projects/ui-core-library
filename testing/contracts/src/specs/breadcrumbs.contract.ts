import { configureUiCore } from '@mszczygiel-projects/ui-core-foundations/config';
import type {
  BreadcrumbsNavigateDetails,
  BreadcrumbsProps,
} from '@mszczygiel-projects/ui-core-shared/breadcrumbs';
import { afterEach, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';

import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { tokenNumber } from '../tokens.ts';

/** One item of a contract: the icon is a flag that each harness turns into its own icon. */
export interface BreadcrumbsContractItem {
  readonly label: string;
  readonly href?: string;
  readonly icon?: boolean;
  readonly iconOnly?: boolean;
}

/**
 * The props of the specification, plus what each harness translates: the items with their icon
 * flag, and the callback, which the web component receives as an event. `cancelNavigation`
 * cancels each press, through the event in the web component and the native event in React.
 */
export interface BreadcrumbsContractProps extends Omit<BreadcrumbsProps, 'items'> {
  readonly items?: readonly BreadcrumbsContractItem[];
  readonly onNavigate?: (details: BreadcrumbsNavigateDetails<Event, unknown>) => void;
  readonly cancelNavigation?: boolean;
}

const TRAIL: readonly BreadcrumbsContractItem[] = [
  { label: 'Home', href: '#home', icon: true },
  { label: 'Products', href: '#products' },
  { label: 'Category', href: '#category' },
  { label: 'Widget', href: '#widget' },
];

/** The behaviour of Breadcrumbs, applied unchanged to the web component and the React component. */
export function breadcrumbsContract(adapter: Mount<BreadcrumbsContractProps>): void {
  const mounted: Mounted<BreadcrumbsContractProps>[] = [];
  const parents: HTMLElement[] = [];
  async function mount(props: BreadcrumbsContractProps = {}, mountOptions?: MountOptions) {
    const component = await adapter({ items: TRAIL, ...props }, mountOptions);
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
  const items = (component: Mounted<BreadcrumbsContractProps>) => [
    ...component.part('list').querySelectorAll<HTMLElement>(':scope > li'),
  ];
  const visible = (element: Element) => {
    const { width, height } = element.getBoundingClientRect();
    const clip = getComputedStyle(element).clipPath;
    return width > 0 && height > 0 && (clip === 'none' || clip === '');
  };

  afterEach(async () => {
    configureUiCore({ labels: {} });
    for (const component of mounted.splice(0)) {
      await component.unmount();
    }
    for (const parent of parents.splice(0)) {
      parent.remove();
    }
  });

  /** The name of the navigation landmark, which the web component draws inside its host. */
  async function landmark(component: Mounted<BreadcrumbsContractProps>) {
    const node = (await component.accessibleTree()).find((entry) => entry.role === 'navigation');
    return node?.name;
  }

  it('is a navigation landmark named by the default label, a prop or the author', async () => {
    const component = await mount({}, { parent: column('800px') });
    expect(await landmark(component)).toBe('Breadcrumb');
    configureUiCore({ labels: { breadcrumbs: { label: 'Ścieżka' } } });
    await component.update({});
    await vi.waitFor(async () => {
      expect(await landmark(component)).toBe('Ścieżka');
    });
    await component.update({ label: 'You are here' });
    expect(await landmark(component)).toBe('You are here');
    const authored = await mount({}, { attributes: { 'aria-label': 'Location' } });
    expect(await landmark(authored)).toBe('Location');
  });

  it('lists the items in order, links those with an address and marks the last as current', async () => {
    const component = await mount(
      { items: [...TRAIL.slice(0, 2), { label: 'Archive' }, TRAIL[3] ?? { label: 'Widget' }] },
      { parent: column('800px') },
    );
    expect(component.part('list').tagName).toBe('OL');
    const tree = await component.accessibleTree();
    expect(tree.filter((node) => node.role === 'link').map((node) => node.name)).toEqual([
      'Home',
      'Products',
    ]);
    expect(tree.filter((node) => node.role === 'listitem')).toHaveLength(4);
    const current = component.part('current');
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.closest('a')).toBeNull();
    expect(current.textContent).toBe('Widget');
    expect(component.part('text').textContent).toBe('Archive');
  });

  it('keeps the separators, the ellipsis and the icons out of the accessibility tree', async () => {
    const component = await mount({}, { parent: column('300px') });
    const tree = await component.accessibleTree();
    const names = tree.map((node) => node.name).join('|');
    expect(names).not.toMatch(/[/…›]/);
    expect(tree.filter((node) => node.role === 'listitem')).toHaveLength(TRAIL.length);
    expect(component.part('separator').getAttribute('aria-hidden')).toBe('true');
    expect(component.part('item-icon').getAttribute('aria-hidden')).toBe('true');
  });

  it('collapses the items before the last two in a narrow container, and keeps them readable', async () => {
    const wide = await mount({}, { parent: column('800px') });
    const narrow = await mount({}, { parent: column('300px') });
    const [wideEllipsis, ...wideItems] = items(wide);
    expect(wideEllipsis && visible(wideEllipsis)).toBe(false);
    expect(wideItems.every(visible)).toBe(true);
    const [ellipsis, ...rest] = items(narrow);
    expect(ellipsis && visible(ellipsis)).toBe(true);
    expect(rest.map(visible)).toEqual([false, false, true, true]);
    const links = (await narrow.accessibleTree()).filter((node) => node.role === 'link');
    expect(links.map((node) => node.name)).toEqual(['Home', 'Products', 'Category']);
  });

  it('shows the whole trail while keyboard focus is inside a narrow one', async () => {
    const narrow = await mount({}, { parent: column('300px') });
    await userEvent.tab();
    const [ellipsis, ...rest] = items(narrow);
    expect(ellipsis && visible(ellipsis)).toBe(false);
    expect(rest.every(visible)).toBe(true);
    const focused = narrow.part('link');
    expect(focused.getBoundingClientRect().width).toBeGreaterThan(1);
  });

  it('never collapses a trail of two items', async () => {
    const component = await mount({ items: TRAIL.slice(2) }, { parent: column('200px') });
    expect(items(component).every(visible)).toBe(true);
    expect(items(component)).toHaveLength(2);
  });

  it('reports a press on a link, and a canceled press keeps the page', async () => {
    const onNavigate = vi.fn<NonNullable<BreadcrumbsContractProps['onNavigate']>>();
    const component = await mount(
      { onNavigate, cancelNavigation: true },
      { parent: column('800px') },
    );
    const before = window.location.hash;
    await userEvent.click(component.screen.getByRole('link', { name: 'Products' }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate.mock.calls[0]?.[0]).toMatchObject({ index: 1, item: { label: 'Products' } });
    expect(window.location.hash).toBe(before);
    await component.update({ cancelNavigation: false });
    await userEvent.click(component.screen.getByRole('link', { name: 'Category' }));
    expect(window.location.hash).toBe('#category');
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  });

  it('follows the density in its sizes, and sizes the icon from its tokens', async () => {
    const medium = await mount({}, { parent: column('800px') });
    const small = await mount({ size: 'small' }, { parent: column('800px') });
    expect(parseFloat(getComputedStyle(medium.part('item-label')).fontSize)).toBe(
      tokenNumber('--breadcrumbs-medium-font-size'),
    );
    expect(parseFloat(getComputedStyle(small.part('item-label')).fontSize)).toBe(
      tokenNumber('--breadcrumbs-small-font-size'),
    );
    expect(medium.part('item-icon').getBoundingClientRect().width).toBe(
      tokenNumber('--breadcrumbs-medium-icon-size'),
    );
    // The drawing itself fills the box and sits on the middle of the label, not on its baseline.
    const drawing = medium.part('item-icon').querySelector('svg')?.getBoundingClientRect();
    const label = medium.part('item-label').getBoundingClientRect();
    expect(drawing?.height).toBe(tokenNumber('--breadcrumbs-medium-icon-size'));
    const middle = (rect: DOMRect) => rect.top + rect.height / 2;
    expect(Math.abs((drawing ? middle(drawing) : 0) - middle(label))).toBeLessThanOrEqual(0.5);
  });

  it('shows an icon alone with its label as the name, and no gap after the icon', async () => {
    const component = await mount(
      { items: [{ label: 'Home', href: '#home', icon: true, iconOnly: true }, ...TRAIL.slice(1)] },
      { parent: column('800px') },
    );
    expect(component.screen.getByRole('link', { name: 'Home' }).element()).toBeTruthy();
    expect(visible(component.part('item-label'))).toBe(false);
    // The link ends with the icon: a label in the flow would add the gap and its own width.
    const link = component.part('link').getBoundingClientRect();
    const icon = component.part('item-icon').getBoundingClientRect();
    expect(link.width).toBe(icon.width);
  });

  it('draws the slash or the chevron, and turns the chevron around in right-to-left text', async () => {
    const slash = await mount({ separator: 'slash' }, { parent: column('800px') });
    expect(getComputedStyle(slash.part('separator'), '::before').content).toBe('"/"');
    expect(slash.part('separator').querySelector('svg')).toBeNull();
    const ltr = await mount({}, { parent: column('800px') });
    const rtl = await mount({}, { parent: column('800px'), dir: 'rtl' });
    // The separator of the first item: the one of the ellipsis has no box in a wide container.
    const transform = (component: Mounted<BreadcrumbsContractProps>) =>
      getComputedStyle(
        items(component)[1]?.querySelector('svg:not([data-contract-icon])') ?? document.body,
      ).transform;
    expect(transform(ltr)).toBe('none');
    await expect.poll(() => transform(rtl)).toBe('matrix(-1, 0, 0, 1, 0, 0)');
  });

  it('shows keyboard focus on a link with the focus ring', async () => {
    const component = await mount({}, { parent: column('800px') });
    await userEvent.tab();
    const link = component.part('link');
    expect(getComputedStyle(link).outlineStyle).not.toBe('none');
    expect(parseFloat(getComputedStyle(link).outlineWidth)).toBe(tokenNumber('--ring-width'));
  });
}
