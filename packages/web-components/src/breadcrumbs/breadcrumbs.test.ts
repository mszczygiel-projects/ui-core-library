import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import type { UiBreadcrumbs, BreadcrumbsItem, BreadcrumbsSelectDetail } from './breadcrumbs.js';
import './breadcrumbs.js';

const TRAIL: BreadcrumbsItem[] = [
  { label: 'Home', href: '#/', icon: 'icon-home' },
  { label: 'Products', href: '#/products' },
  { label: 'Category', href: '#/products/category' },
  { label: 'Widget' },
];

async function fixtureTrail(items: BreadcrumbsItem[] = TRAIL) {
  const el = await fixture<UiBreadcrumbs>(html`<ui-breadcrumbs></ui-breadcrumbs>`);
  el.items = items;
  await el.updateComplete;
  return el;
}

const query = <T extends Element>(el: UiBreadcrumbs, selector: string) =>
  Array.from(el.shadowRoot!.querySelectorAll<T>(selector));

describe('UiBreadcrumbs', () => {
  it('has expected defaults', async () => {
    const el = await fixture<UiBreadcrumbs>(html`<ui-breadcrumbs></ui-breadcrumbs>`);
    expect(el.size).to.equal('medium');
    expect(el.separator).to.equal('chevron');
    expect(el.items).to.deep.equal([]);
    // The nav label is unset by default; the text comes from the foundations config.
    expect(el.label).to.equal(undefined);
  });

  it('renders nothing for an empty trail', async () => {
    const el = await fixture<UiBreadcrumbs>(html`<ui-breadcrumbs></ui-breadcrumbs>`);
    expect(el.shadowRoot!.querySelector('nav')).to.equal(null);
  });

  it('reflects size and separator to attributes', async () => {
    const el = await fixtureTrail();
    el.size = 'small';
    el.separator = 'slash';
    await el.updateComplete;
    expect(el.getAttribute('data-size')).to.equal('small');
    expect(el.getAttribute('separator')).to.equal('slash');
  });

  it('names the nav from the foundations config by default', async () => {
    const el = await fixtureTrail();
    expect(el.shadowRoot!.querySelector('nav')!.getAttribute('aria-label')).to.equal('Breadcrumb');
  });

  it('lets the label property override the nav name', async () => {
    const el = await fixtureTrail();
    el.label = 'You are here';
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('nav')!.getAttribute('aria-label')).to.equal(
      'You are here',
    );
  });

  it('renders one list item per crumb', async () => {
    const el = await fixtureTrail();
    expect(query(el, 'li.item')).to.have.lengthOf(4);
  });

  it('links every crumb with an href except the last one', async () => {
    const el = await fixtureTrail();
    const links = query<HTMLAnchorElement>(el, 'a.link');
    expect(links).to.have.lengthOf(3);
    expect(links.map((a) => a.getAttribute('href'))).to.deep.equal([
      '#/',
      '#/products',
      '#/products/category',
    ]);
  });

  it('marks the last crumb as the current page', async () => {
    const el = await fixtureTrail();
    const current = query(el, '.crumb--current');
    expect(current).to.have.lengthOf(1);
    expect(current[0].getAttribute('aria-current')).to.equal('page');
    expect(current[0].textContent!.trim()).to.equal('Widget');
  });

  it('never links the last crumb even when it carries an href', async () => {
    const el = await fixtureTrail([
      { label: 'Home', href: '#/' },
      { label: 'Widget', href: '#/widget' },
    ]);
    expect(query(el, 'a.link')).to.have.lengthOf(1);
    expect(query(el, '.crumb--current')).to.have.lengthOf(1);
  });

  it('renders a crumb without href as plain text, not as the current page', async () => {
    const el = await fixtureTrail([
      { label: 'Home', href: '#/' },
      { label: 'Archive' },
      { label: 'Widget' },
    ]);
    const crumbs = query(el, '.crumb');
    expect(crumbs).to.have.lengthOf(2);
    expect(crumbs[0].classList.contains('crumb--current')).to.equal(false);
    expect(crumbs[0].hasAttribute('aria-current')).to.equal(false);
  });

  it('draws a separator after every crumb but the last', async () => {
    const el = await fixtureTrail();
    // 3 in-trail separators + the one that follows the collapsed-trail ellipsis
    const separators = query(el, '.separator');
    expect(separators).to.have.lengthOf(4);
    for (const separator of separators) {
      expect(separator.getAttribute('aria-hidden')).to.equal('true');
    }
  });

  it('swaps the chevron for a slash', async () => {
    const el = await fixtureTrail();
    expect(el.shadowRoot!.querySelector('.separator svg')).to.not.equal(null);
    el.separator = 'slash';
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.separator svg')).to.equal(null);
    expect(el.shadowRoot!.querySelector('.separator')!.textContent!.trim()).to.equal('/');
  });

  it('renders the decorative ellipsis only when a crumb can be collapsed', async () => {
    const el = await fixtureTrail();
    const ellipsis = el.shadowRoot!.querySelector('li.ellipsis')!;
    expect(ellipsis.getAttribute('aria-hidden')).to.equal('true');

    el.items = [{ label: 'Home', href: '#/' }, { label: 'Widget' }];
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('li.ellipsis')).to.equal(null);
  });

  it('renders a leading icon only for items that declare one', async () => {
    const el = await fixtureTrail();
    expect(query(el, '.icon')).to.have.lengthOf(1);
  });

  it('ignores an icon name the icon set does not contain', async () => {
    const el = await fixtureTrail([
      { label: 'Home', href: '#/', icon: 'icon-does-not-exist' },
      { label: 'Widget' },
    ]);
    expect(query(el, '.icon')).to.have.lengthOf(0);
  });

  it('fires ui-select with the clicked item and index', async () => {
    const el = await fixtureTrail();
    const link = query<HTMLAnchorElement>(el, 'a.link')[1];
    setTimeout(() => link.click());
    const event = (await oneEvent(el, 'ui-select')) as CustomEvent<BreadcrumbsSelectDetail>;
    expect(event.detail.index).to.equal(1);
    expect(event.detail.item.label).to.equal('Products');
  });

  it('suppresses navigation when ui-select is cancelled', async () => {
    const el = await fixtureTrail();
    el.addEventListener('ui-select', (event) => event.preventDefault());
    const link = query<HTMLAnchorElement>(el, 'a.link')[0];
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).to.equal(true);
  });

  it('leaves navigation alone when ui-select is not cancelled', async () => {
    const el = await fixtureTrail();
    const link = query<HTMLAnchorElement>(el, 'a.link')[0];
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).to.equal(false);
  });
});
