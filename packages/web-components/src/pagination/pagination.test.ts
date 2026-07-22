import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import type { UiPagination, PaginationChangeDetail } from './pagination.js';
import './pagination.js';
import { paginate } from './paginate.js';

describe('paginate', () => {
  it('returns all pages when the range fits', () => {
    expect(paginate(1, 5, 1)).to.deep.equal([1, 2, 3, 4, 5]);
    expect(paginate(4, 7, 1)).to.deep.equal([1, 2, 3, 4, 5, 6, 7]);
  });

  it('truncates both sides around a middle page', () => {
    expect(paginate(5, 10, 1)).to.deep.equal([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
  });

  it('keeps a constant entry count near the boundaries', () => {
    expect(paginate(2, 10, 1)).to.deep.equal([1, 2, 3, 4, 5, 'ellipsis', 10]);
    expect(paginate(9, 10, 1)).to.deep.equal([1, 'ellipsis', 6, 7, 8, 9, 10]);
  });

  it('respects siblingCount', () => {
    expect(paginate(5, 10, 0)).to.deep.equal([1, 'ellipsis', 5, 'ellipsis', 10]);
    expect(paginate(10, 20, 2)).to.deep.equal([1, 'ellipsis', 8, 9, 10, 11, 12, 'ellipsis', 20]);
  });

  it('clamps out-of-range input', () => {
    expect(paginate(99, 5, 1)).to.deep.equal([1, 2, 3, 4, 5]);
    expect(paginate(0, 3, 1)).to.deep.equal([1, 2, 3]);
  });
});

describe('UiPagination', () => {
  const fixturePagination = () =>
    fixture<UiPagination>(html`<ui-pagination current-page="5" total-pages="10"></ui-pagination>`);

  it('has expected defaults', async () => {
    const el = await fixture<UiPagination>(html`<ui-pagination></ui-pagination>`);
    expect(el.currentPage).to.equal(1);
    expect(el.totalPages).to.equal(1);
    expect(el.siblingCount).to.equal(1);
    expect(el.hideJumpToPage).to.equal(false);
    expect(el.jumpLabel).to.equal('Go to page');
    expect(el.prevLabel).to.equal('Previous page');
    expect(el.nextLabel).to.equal('Next page');
    expect(el.label).to.equal('Pagination');
  });

  it('reflects current-page, total-pages and sibling-count attributes', async () => {
    const el = await fixturePagination();
    expect(el.getAttribute('current-page')).to.equal('5');
    el.currentPage = 6;
    await el.updateComplete;
    expect(el.getAttribute('current-page')).to.equal('6');
    expect(el.getAttribute('total-pages')).to.equal('10');
    expect(el.getAttribute('sibling-count')).to.equal('1');
  });

  it('renders a nav with the accessible name from `label`', async () => {
    const el = await fixturePagination();
    const nav = el.shadowRoot!.querySelector('nav')!;
    expect(nav.getAttribute('aria-label')).to.equal('Pagination');
    el.label = 'Results pages';
    await el.updateComplete;
    expect(nav.getAttribute('aria-label')).to.equal('Results pages');
  });

  it('renders truncated page items with two ellipses', async () => {
    const el = await fixturePagination();
    const items = [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('button.item')];
    expect(items.map((b) => b.textContent!.trim())).to.deep.equal(['1', '4', '5', '6', '10']);
    expect(items[1].getAttribute('aria-label')).to.equal('Page 4');
    expect(el.shadowRoot!.querySelectorAll('.ellipsis').length).to.equal(2);
  });

  it('marks the current page with aria-current', async () => {
    const el = await fixturePagination();
    const current = el.shadowRoot!.querySelector('button.item--current')!;
    expect(current.textContent!.trim()).to.equal('5');
    expect(current.getAttribute('aria-current')).to.equal('page');
  });

  it('disables prev on the first page and next on the last', async () => {
    const first = await fixture<UiPagination>(
      html`<ui-pagination current-page="1" total-pages="10"></ui-pagination>`,
    );
    expect(
      first.shadowRoot!.querySelector<HTMLElement & { disabled: boolean }>('.prev')!.disabled,
    ).to.equal(true);
    expect(
      first.shadowRoot!.querySelector<HTMLElement & { disabled: boolean }>('.next')!.disabled,
    ).to.equal(false);

    const last = await fixture<UiPagination>(
      html`<ui-pagination current-page="10" total-pages="10"></ui-pagination>`,
    );
    expect(
      last.shadowRoot!.querySelector<HTMLElement & { disabled: boolean }>('.next')!.disabled,
    ).to.equal(true);
  });

  it('fires ui-change with source "item" on page click, and stays controlled', async () => {
    const el = await fixturePagination();
    const target = [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('button.item')].find(
      (b) => b.textContent!.trim() === '4',
    )!;
    const listener = oneEvent(el, 'ui-change');
    target.click();
    const event = (await listener) as CustomEvent<PaginationChangeDetail>;
    expect(event.detail).to.deep.equal({ page: 4, source: 'item' });
    expect(el.currentPage).to.equal(5);
  });

  it('does not fire ui-change when the current page is clicked', async () => {
    const el = await fixturePagination();
    let count = 0;
    el.addEventListener('ui-change', () => (count += 1));
    el.shadowRoot!.querySelector<HTMLButtonElement>('button.item--current')!.click();
    await el.updateComplete;
    expect(count).to.equal(0);
  });

  it('fires ui-change with sources "prev" and "next"', async () => {
    const el = await fixturePagination();
    let listener = oneEvent(el, 'ui-change');
    el.shadowRoot!.querySelector<HTMLElement>('.prev')!.click();
    let event = (await listener) as CustomEvent<PaginationChangeDetail>;
    expect(event.detail).to.deep.equal({ page: 4, source: 'prev' });

    listener = oneEvent(el, 'ui-change');
    el.shadowRoot!.querySelector<HTMLElement>('.next')!.click();
    event = (await listener) as CustomEvent<PaginationChangeDetail>;
    expect(event.detail).to.deep.equal({ page: 6, source: 'next' });
  });

  it('commits the jump field on Enter, clamped, with source "jump"', async () => {
    const el = await fixturePagination();
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('.jump-input')!;
    expect(input.value).to.equal('5');

    input.value = '999';
    input.dispatchEvent(new Event('input'));
    const listener = oneEvent(el, 'ui-change');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    const event = (await listener) as CustomEvent<PaginationChangeDetail>;
    expect(event.detail).to.deep.equal({ page: 10, source: 'jump' });
  });

  it('commits the jump field on blur', async () => {
    const el = await fixturePagination();
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('.jump-input')!;
    input.value = '7';
    input.dispatchEvent(new Event('input'));
    const listener = oneEvent(el, 'ui-change');
    input.dispatchEvent(new Event('blur'));
    const event = (await listener) as CustomEvent<PaginationChangeDetail>;
    expect(event.detail).to.deep.equal({ page: 7, source: 'jump' });
  });

  it('silently resets invalid jump input without firing ui-change', async () => {
    const el = await fixturePagination();
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('.jump-input')!;
    let count = 0;
    el.addEventListener('ui-change', () => (count += 1));
    input.value = 'abc';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await el.updateComplete;
    expect(count).to.equal(0);
    expect(input.value).to.equal('5');
  });

  it('hides the jump field with hide-jump-to-page', async () => {
    const el = await fixture<UiPagination>(
      html`<ui-pagination current-page="5" total-pages="10" hide-jump-to-page></ui-pagination>`,
    );
    expect(el.shadowRoot!.querySelector('.jump-input')).to.equal(null);
  });

  it('projects the page-label slot and hides the wrapper when empty', async () => {
    const withLabel = await fixture<UiPagination>(html`
      <ui-pagination current-page="5" total-pages="10">
        <span slot="page-label">Page 5 of 10</span>
      </ui-pagination>
    `);
    await withLabel.updateComplete;
    expect(withLabel.textContent).to.contain('Page 5 of 10');
    expect(withLabel.shadowRoot!.querySelector('.page-label.empty')).to.equal(null);

    const withoutLabel = await fixturePagination();
    await withoutLabel.updateComplete;
    expect(withoutLabel.shadowRoot!.querySelector('.page-label.empty')).to.not.equal(null);
  });

  it('uses itemAriaLabel to name page items', async () => {
    const el = await fixturePagination();
    el.itemAriaLabel = (page) => `Strona ${page}`;
    await el.updateComplete;
    const items = el.shadowRoot!.querySelectorAll('button.item');
    expect(items[0].getAttribute('aria-label')).to.equal('Strona 1');
  });
});
