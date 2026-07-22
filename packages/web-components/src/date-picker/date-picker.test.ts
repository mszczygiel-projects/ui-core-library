import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import type { UiDatePicker, DatePickerRangeChangeDetail } from './date-picker.js';
import type { UiCalendar } from '../calendar/calendar.js';
import './date-picker.js';

const calendar = (el: UiDatePicker) => el.shadowRoot!.querySelector<UiCalendar>('ui-calendar')!;
const day = (el: UiDatePicker, iso: string) =>
  calendar(el).shadowRoot!.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);
const footerButtons = (el: UiDatePicker) => el.shadowRoot!.querySelectorAll('.footer ui-button');

describe('UiDatePicker', () => {
  it('renders popover with manual trigger, focus trap, and projected trigger slot', async () => {
    const el = await fixture<UiDatePicker>(html`
      <ui-date-picker open today="2026-07-19">
        <button slot="trigger">Pick</button>
      </ui-date-picker>
    `);
    const popover = el.shadowRoot!.querySelector('ui-popover')!;
    expect(popover.getAttribute('trigger')).to.equal('manual');
    expect(popover.hasAttribute('trap-focus')).to.equal(true);
    expect(popover.getAttribute('placement')).to.equal('bottom-start');
    expect(el.querySelector('[slot="trigger"]')!.textContent).to.equal('Pick');
    expect(calendar(el)).to.not.equal(null);
  });

  it('single mode: no footer, day click commits date-change and requests close', async () => {
    const el = await fixture<UiDatePicker>(html`
      <ui-date-picker open today="2026-07-19" start-date="2026-07-08"></ui-date-picker>
    `);
    expect(footerButtons(el).length).to.equal(0);

    const events: string[] = [];
    el.addEventListener('open-change', (e) => {
      events.push('open-change:' + JSON.stringify((e as CustomEvent).detail.open));
    });
    setTimeout(() => day(el, '2026-07-10')!.click());
    const e = (await oneEvent(el, 'date-change')) as CustomEvent;
    expect(e.detail).to.deep.equal({ date: '2026-07-10' });
    expect(events).to.deep.equal(['open-change:false']);
    // Controlled: committed property untouched.
    expect(el.startDate).to.equal('2026-07-08');
  });

  it('range mode: renders Clear/Apply footer with custom labels', async () => {
    const el = await fixture<UiDatePicker>(html`
      <ui-date-picker
        selection-mode="range"
        open
        today="2026-07-19"
        clear-label="Wyczyść"
        apply-label="Zastosuj"
      ></ui-date-picker>
    `);
    const buttons = footerButtons(el);
    expect(buttons.length).to.equal(2);
    expect(buttons[0].textContent!.trim()).to.equal('Wyczyść');
    expect(buttons[1].textContent!.trim()).to.equal('Zastosuj');
    expect(buttons[0].getAttribute('variant')).to.equal('ghost');
    expect(buttons[1].getAttribute('variant')).to.equal('primary');
  });

  it('range mode: clicks build a pending selection without committing', async () => {
    const el = await fixture<UiDatePicker>(html`
      <ui-date-picker selection-mode="range" open today="2026-07-19"></ui-date-picker>
    `);
    let committed = 0;
    el.addEventListener('range-change', () => {
      committed++;
    });

    day(el, '2026-07-08')!.click();
    await el.updateComplete;
    await calendar(el).updateComplete;
    expect(calendar(el).startDate).to.equal('2026-07-08');

    day(el, '2026-07-14')!.click();
    await el.updateComplete;
    await calendar(el).updateComplete;
    expect(calendar(el).startDate).to.equal('2026-07-08');
    expect(calendar(el).endDate).to.equal('2026-07-14');
    expect(committed).to.equal(0);
  });

  it('range mode: Apply commits the pending range and requests close', async () => {
    const el = await fixture<UiDatePicker>(html`
      <ui-date-picker selection-mode="range" open today="2026-07-19"></ui-date-picker>
    `);
    day(el, '2026-07-08')!.click();
    await el.updateComplete;
    day(el, '2026-07-14')!.click();
    await el.updateComplete;

    setTimeout(() => (footerButtons(el)[1] as HTMLElement).click());
    const e = (await oneEvent(el, 'range-change')) as CustomEvent<DatePickerRangeChangeDetail>;
    expect(e.detail).to.deep.equal({ startDate: '2026-07-08', endDate: '2026-07-14' });
  });

  it('range mode: Clear resets pending without committing; Apply then commits nulls', async () => {
    const el = await fixture<UiDatePicker>(html`
      <ui-date-picker
        selection-mode="range"
        open
        today="2026-07-19"
        start-date="2026-07-08"
        end-date="2026-07-14"
      ></ui-date-picker>
    `);
    // Opening seeded pending from the committed values.
    expect(calendar(el).startDate).to.equal('2026-07-08');

    let committed = 0;
    el.addEventListener('range-change', () => {
      committed++;
    });
    (footerButtons(el)[0] as HTMLElement).click();
    await el.updateComplete;
    await calendar(el).updateComplete;
    expect(calendar(el).startDate ?? null).to.equal(null);
    expect(committed).to.equal(0);

    setTimeout(() => (footerButtons(el)[1] as HTMLElement).click());
    const e = (await oneEvent(el, 'range-change')) as CustomEvent<DatePickerRangeChangeDetail>;
    expect(e.detail).to.deep.equal({ startDate: null, endDate: null });
  });

  it('forwards calendar constraints and popover dismissals', async () => {
    const el = await fixture<UiDatePicker>(html`
      <ui-date-picker open today="2026-07-19" min-date="2026-07-05" locale="pl-PL"></ui-date-picker>
    `);
    expect(day(el, '2026-07-02')!.className).to.contain('day--disabled');

    setTimeout(() => {
      const popover = el.shadowRoot!.querySelector('ui-popover')!;
      popover.dispatchEvent(
        new CustomEvent('open-change', {
          detail: { open: false, reason: 'escape' },
          bubbles: true,
          composed: true,
        }),
      );
    });
    const e = (await oneEvent(el, 'open-change')) as CustomEvent;
    expect(e.detail).to.deep.equal({ open: false, reason: 'escape' });
  });
});
