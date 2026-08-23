import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import type { UiCalendar, CalendarDateSelectDetail } from './calendar.js';
import './calendar.js';

const day = (el: UiCalendar, iso: string) =>
  el.shadowRoot!.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);

const zoom = (el: UiCalendar) => el.shadowRoot!.querySelector<HTMLButtonElement>('.zoom')!;

const heading = (el: UiCalendar) =>
  el.shadowRoot!.querySelector('.month-label')!.textContent!.trim();

/** Visible text of the month/year picker cells, in grid order. */
const pickerItems = (el: UiCalendar) =>
  Array.from(el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.picker-item'));

const pickerItem = (el: UiCalendar, text: string) =>
  pickerItems(el).find((b) => b.textContent!.trim() === text);

describe('UiCalendar', () => {
  it('renders a full July 2026 grid with adjacent-month padding', async () => {
    const el = await fixture<UiCalendar>(
      html`<ui-calendar today="2026-07-19" locale="pl-PL"></ui-calendar>`,
    );
    expect(day(el, '2026-07-01')).to.not.equal(null);
    expect(day(el, '2026-07-31')).to.not.equal(null);
    // pl-PL week starts on Monday → June 29-30 pad the first row.
    expect(day(el, '2026-06-29')).to.not.equal(null);
    expect(day(el, '2026-06-29')!.className).to.contain('day--outside');
    expect(el.shadowRoot!.querySelectorAll('[role="columnheader"]').length).to.equal(7);
  });

  it('marks today with aria-current and the today class', async () => {
    const el = await fixture<UiCalendar>(html`<ui-calendar today="2026-07-19"></ui-calendar>`);
    const btn = day(el, '2026-07-19')!;
    expect(btn.getAttribute('aria-current')).to.equal('date');
    expect(btn.className).to.contain('day--today');
  });

  it('renders the localized month label', async () => {
    const el = await fixture<UiCalendar>(
      html`<ui-calendar today="2026-07-19" locale="pl-PL"></ui-calendar>`,
    );
    const label = el.shadowRoot!.querySelector('.month-label')!;
    expect(label.textContent!.toLowerCase()).to.contain('lipiec');
    expect(label.textContent).to.contain('2026');
  });

  it('respects an explicit first-day-of-week over the locale default', async () => {
    const el = await fixture<UiCalendar>(
      html`<ui-calendar today="2026-07-19" locale="pl-PL" first-day-of-week="7"></ui-calendar>`,
    );
    // Sunday-first July 2026 grid starts on June 28.
    expect(day(el, '2026-06-28')).to.not.equal(null);
  });

  it('single mode: marks the selected date', async () => {
    const el = await fixture<UiCalendar>(
      html`<ui-calendar today="2026-07-19" start-date="2026-07-08"></ui-calendar>`,
    );
    const btn = day(el, '2026-07-08')!;
    expect(btn.className).to.contain('day--selected');
    expect(btn.closest('[role="gridcell"]')!.getAttribute('aria-selected')).to.equal('true');
  });

  it('range mode: endpoint and in-range classes plus tint bands', async () => {
    const el = await fixture<UiCalendar>(
      html`<ui-calendar
        selection-mode="range"
        today="2026-07-19"
        start-date="2026-07-08"
        end-date="2026-07-14"
      ></ui-calendar>`,
    );
    expect(day(el, '2026-07-08')!.className).to.contain('day--range-start');
    expect(day(el, '2026-07-14')!.className).to.contain('day--range-end');
    expect(day(el, '2026-07-10')!.className).to.contain('day--in-range');
    expect(el.shadowRoot!.querySelectorAll('.band--start').length).to.equal(1);
    expect(el.shadowRoot!.querySelectorAll('.band--end').length).to.equal(1);
    expect(el.shadowRoot!.querySelectorAll('.band--full').length).to.equal(5);
  });

  it('click dispatches a proposal and never mutates its own properties', async () => {
    const el = await fixture<UiCalendar>(
      html`<ui-calendar today="2026-07-19" start-date="2026-07-08"></ui-calendar>`,
    );
    setTimeout(() => day(el, '2026-07-10')!.click());
    const e = (await oneEvent(el, 'date-select')) as CustomEvent<CalendarDateSelectDetail>;
    expect(e.detail).to.deep.equal({ date: '2026-07-10', startDate: '2026-07-10', endDate: null });
    expect(el.startDate).to.equal('2026-07-08');
  });

  it('range mode: second click completes the range, swapping when needed', async () => {
    const el = await fixture<UiCalendar>(
      html`<ui-calendar
        selection-mode="range"
        today="2026-07-19"
        start-date="2026-07-08"
      ></ui-calendar>`,
    );
    setTimeout(() => day(el, '2026-07-14')!.click());
    const complete = (await oneEvent(el, 'date-select')) as CustomEvent<CalendarDateSelectDetail>;
    expect(complete.detail).to.deep.equal({
      date: '2026-07-14',
      startDate: '2026-07-08',
      endDate: '2026-07-14',
    });

    setTimeout(() => day(el, '2026-07-02')!.click());
    const swapped = (await oneEvent(el, 'date-select')) as CustomEvent<CalendarDateSelectDetail>;
    expect(swapped.detail).to.deep.equal({
      date: '2026-07-02',
      startDate: '2026-07-02',
      endDate: '2026-07-08',
    });
  });

  it('disabled dates block selection (min/max, array, predicate)', async () => {
    const el = await fixture<UiCalendar>(
      html`<ui-calendar
        today="2026-07-19"
        min-date="2026-07-05"
        max-date="2026-07-25"
      ></ui-calendar>`,
    );
    el.disabledDates = ['2026-07-15'];
    await el.updateComplete;
    expect(day(el, '2026-07-02')!.className).to.contain('day--disabled');
    expect(day(el, '2026-07-28')!.className).to.contain('day--disabled');
    expect(day(el, '2026-07-15')!.className).to.contain('day--disabled');

    let dispatched = false;
    el.addEventListener('date-select', () => {
      dispatched = true;
    });
    day(el, '2026-07-15')!.click();
    expect(dispatched).to.equal(false);

    el.disabledDates = (iso) => iso === '2026-07-20';
    await el.updateComplete;
    expect(day(el, '2026-07-20')!.className).to.contain('day--disabled');
  });

  it('roving tabindex: exactly one focusable day, arrow keys move it', async () => {
    const el = await fixture<UiCalendar>(
      html`<ui-calendar today="2026-07-19" start-date="2026-07-08"></ui-calendar>`,
    );
    const focusable = el.shadowRoot!.querySelectorAll('button.day[tabindex="0"]');
    expect(focusable.length).to.equal(1);
    expect((focusable[0] as HTMLElement).dataset.iso).to.equal('2026-07-08');

    const grid = el.shadowRoot!.querySelector('.grid')!;
    grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await el.updateComplete;
    expect(day(el, '2026-07-09')!.getAttribute('tabindex')).to.equal('0');
    expect(day(el, '2026-07-08')!.getAttribute('tabindex')).to.equal('-1');
  });

  it('keyboard navigation across a month boundary switches the view', async () => {
    const el = await fixture<UiCalendar>(
      html`<ui-calendar today="2026-07-19" start-date="2026-07-31"></ui-calendar>`,
    );
    setTimeout(() =>
      el
        .shadowRoot!.querySelector('.grid')!
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })),
    );
    const e = (await oneEvent(el, 'month-change')) as CustomEvent;
    expect(e.detail).to.deep.equal({ year: 2026, month: 8 });
    await el.updateComplete;
    expect(day(el, '2026-08-01')!.getAttribute('tabindex')).to.equal('0');
  });

  it('header navigation dispatches month-change and re-renders the label', async () => {
    const el = await fixture<UiCalendar>(
      html`<ui-calendar today="2026-07-19" locale="pl-PL"></ui-calendar>`,
    );
    const next = el.shadowRoot!.querySelector<HTMLButtonElement>('.header .nav:last-of-type')!;
    setTimeout(() => next.click());
    const e = (await oneEvent(el, 'month-change')) as CustomEvent;
    expect(e.detail).to.deep.equal({ year: 2026, month: 8 });
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.month-label')!.textContent!.toLowerCase()).to.contain(
      'sierpie',
    );
  });

  it('grid exposes the ARIA date-grid pattern', async () => {
    const el = await fixture<UiCalendar>(html`<ui-calendar today="2026-07-19"></ui-calendar>`);
    const grid = el.shadowRoot!.querySelector('[role="grid"]')!;
    expect(grid.getAttribute('aria-labelledby')).to.equal('month-label');
    expect(grid.querySelectorAll('[role="row"]').length).to.be.greaterThan(4);
    expect(grid.querySelectorAll('[role="gridcell"]').length % 7).to.equal(0);
    const anyDay = day(el, '2026-07-15')!;
    expect(anyDay.getAttribute('aria-label')).to.not.equal(null);
  });
  describe('month / year picker', () => {
    it('the heading opens the month grid, then the year grid', async () => {
      const el = await fixture<UiCalendar>(
        html`<ui-calendar today="2026-07-19" locale="en-US"></ui-calendar>`,
      );
      expect(heading(el)).to.contain('July');

      zoom(el).click();
      await el.updateComplete;
      expect(pickerItems(el).length).to.equal(12);
      expect(heading(el)).to.equal('2026');

      zoom(el).click();
      await el.updateComplete;
      expect(pickerItems(el).length).to.equal(24);
      // Pages are aligned to fixed 24-year blocks: 2016-2039 holds 2026.
      expect(pickerItems(el)[0].textContent!.trim()).to.equal('2016');
      expect(heading(el)).to.contain('2016');
      expect(heading(el)).to.contain('2039');
      // Top level — the heading is a plain label again.
      expect(el.shadowRoot!.querySelector('.zoom')).to.equal(null);
    });

    it('picking a year then a month lands on that month of the day grid', async () => {
      const el = await fixture<UiCalendar>(
        html`<ui-calendar today="2026-07-19" locale="en-US"></ui-calendar>`,
      );
      zoom(el).click();
      await el.updateComplete;
      zoom(el).click();
      await el.updateComplete;

      // Two pages back reaches 1968-1991.
      const prev = el.shadowRoot!.querySelector<HTMLButtonElement>('.header .nav')!;
      prev.click();
      await el.updateComplete;
      prev.click();
      await el.updateComplete;
      expect(pickerItem(el, '1987')).to.not.equal(undefined);

      pickerItem(el, '1987')!.click();
      await el.updateComplete;
      expect(heading(el)).to.equal('1987');

      setTimeout(() => pickerItem(el, 'Oct')!.click());
      const e = (await oneEvent(el, 'month-change')) as CustomEvent;
      expect(e.detail).to.deep.equal({ year: 1987, month: 10 });
      await el.updateComplete;
      expect(day(el, '1987-10-01')).to.not.equal(null);
      expect(heading(el)).to.contain('October');
      expect(heading(el)).to.contain('1987');
    });

    it('keeps the roving day focus inside the month picked', async () => {
      const el = await fixture<UiCalendar>(
        html`<ui-calendar today="2026-07-31" locale="en-US"></ui-calendar>`,
      );
      zoom(el).click();
      await el.updateComplete;
      pickerItem(el, 'Feb')!.click();
      await el.updateComplete;
      // Feb has no 31st — the focus clamps to the last day of the month.
      expect(day(el, '2026-02-28')!.getAttribute('tabindex')).to.equal('0');
    });

    it('marks the selected month and year, and disables what min/max exclude', async () => {
      const el = await fixture<UiCalendar>(
        html`<ui-calendar
          today="2026-07-19"
          locale="en-US"
          start-date="2026-07-08"
          min-date="2026-03-01"
          max-date="2026-09-30"
        ></ui-calendar>`,
      );
      zoom(el).click();
      await el.updateComplete;
      expect(pickerItem(el, 'Jul')!.className).to.contain('picker-item--selected');
      expect(pickerItem(el, 'Feb')!.className).to.contain('picker-item--disabled');
      expect(pickerItem(el, 'Oct')!.className).to.contain('picker-item--disabled');
      expect(pickerItem(el, 'Mar')!.className).to.not.contain('picker-item--disabled');

      pickerItem(el, 'Feb')!.click();
      await el.updateComplete;
      // Still on the month grid — a disabled month is not a selection.
      expect(pickerItems(el).length).to.equal(12);

      zoom(el).click();
      await el.updateComplete;
      expect(pickerItem(el, '2026')!.className).to.contain('picker-item--selected');
      expect(pickerItem(el, '2025')!.className).to.contain('picker-item--disabled');
    });

    it('arrow keys rove the month grid without leaving the year', async () => {
      const el = await fixture<UiCalendar>(
        html`<ui-calendar today="2026-07-19" locale="en-US"></ui-calendar>`,
      );
      zoom(el).click();
      await el.updateComplete;
      const grid = el.shadowRoot!.querySelector('.picker')!;
      const focused = () =>
        pickerItems(el)
          .find((b) => b.getAttribute('tabindex') === '0')!
          .textContent!.trim();
      expect(focused()).to.equal('Jul');

      grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      expect(focused()).to.equal('Oct');

      grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      await el.updateComplete;
      expect(focused()).to.equal('Dec');

      // December + 1 would be January of the next year — the roving focus stays put.
      grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      expect(focused()).to.equal('Dec');
    });

    it('arrow keys past a year-grid edge turn the page', async () => {
      const el = await fixture<UiCalendar>(
        html`<ui-calendar today="2026-07-19" locale="en-US"></ui-calendar>`,
      );
      zoom(el).click();
      await el.updateComplete;
      zoom(el).click();
      await el.updateComplete;

      const grid = el.shadowRoot!.querySelector('.picker')!;
      grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await el.updateComplete;
      grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await el.updateComplete;
      expect(pickerItems(el)[0].textContent!.trim()).to.equal('1992');
      expect(
        pickerItems(el)
          .find((b) => b.getAttribute('tabindex') === '0')!
          .textContent!.trim(),
      ).to.equal('2015');
    });

    it('the header chevrons step by year, then by page', async () => {
      const el = await fixture<UiCalendar>(
        html`<ui-calendar today="2026-07-19" locale="en-US"></ui-calendar>`,
      );
      zoom(el).click();
      await el.updateComplete;
      const next = el.shadowRoot!.querySelector<HTMLButtonElement>('.header .nav:last-of-type')!;
      setTimeout(() => next.click());
      const e = (await oneEvent(el, 'month-change')) as CustomEvent;
      expect(e.detail).to.deep.equal({ year: 2027, month: 7 });
      await el.updateComplete;
      expect(heading(el)).to.equal('2027');

      zoom(el).click();
      await el.updateComplete;
      el.shadowRoot!.querySelector<HTMLButtonElement>('.header .nav:last-of-type')!.click();
      await el.updateComplete;
      expect(pickerItems(el)[0].textContent!.trim()).to.equal('2040');
    });

    it('Escape steps one level back down', async () => {
      const el = await fixture<UiCalendar>(
        html`<ui-calendar today="2026-07-19" locale="en-US"></ui-calendar>`,
      );
      zoom(el).click();
      await el.updateComplete;
      zoom(el).click();
      await el.updateComplete;

      const root = el.shadowRoot!.querySelector('.calendar')!;
      root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      expect(pickerItems(el).length).to.equal(12);

      root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      expect(pickerItems(el).length).to.equal(0);
      expect(day(el, '2026-07-19')).to.not.equal(null);
    });

    it('the picker grids expose the same ARIA pattern as the day grid', async () => {
      const el = await fixture<UiCalendar>(
        html`<ui-calendar today="2026-07-19" locale="en-US" start-date="2026-07-08"></ui-calendar>`,
      );
      expect(zoom(el).getAttribute('aria-label')).to.equal('July 2026, choose month and year');

      zoom(el).click();
      await el.updateComplete;
      const grid = el.shadowRoot!.querySelector('.picker')!;
      expect(grid.getAttribute('role')).to.equal('grid');
      expect(grid.getAttribute('aria-labelledby')).to.equal('month-label');
      expect(grid.querySelectorAll('[role="row"]').length).to.equal(4);
      expect(pickerItem(el, 'Jul')!.getAttribute('aria-label')).to.equal('July 2026');
      expect(pickerItem(el, 'Jul')!.getAttribute('aria-current')).to.equal('date');
      expect(zoom(el).getAttribute('aria-label')).to.equal('2026, choose year');
    });
  });
});
