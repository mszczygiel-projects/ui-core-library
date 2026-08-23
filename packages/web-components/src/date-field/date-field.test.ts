import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import type { UiDateField, DateFieldChangeDetail } from './date-field.js';
import type { UiDatePicker } from '../date-picker/date-picker.js';
import './date-field.js';

const input = (el: UiDateField) => el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
const toggle = (el: UiDateField) =>
  el.shadowRoot!.querySelector<HTMLButtonElement>('.calendar-toggle')!;
const picker = (el: UiDateField) => el.shadowRoot!.querySelector<UiDatePicker>('ui-date-picker')!;
const pickerDay = (el: UiDateField, iso: string) =>
  picker(el)
    .shadowRoot!.querySelector('ui-calendar')!
    .shadowRoot!.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);

const type = async (el: UiDateField, text: string) => {
  const i = input(el);
  i.value = text;
  i.dispatchEvent(new Event('input', { bubbles: true }));
  await el.updateComplete;
};

const pressEnter = async (el: UiDateField) => {
  input(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await el.updateComplete;
};

describe('UiDateField', () => {
  it('renders the TextField shell with a calendar toggle', async () => {
    const el = await fixture<UiDateField>(html`
      <ui-date-field label="Date" hint="Pick a day" today="2026-07-19"></ui-date-field>
    `);
    expect(el.shadowRoot!.querySelector('.label')!.textContent).to.equal('Date');
    expect(el.shadowRoot!.querySelector('.hint')!.textContent).to.equal('Pick a day');
    expect(input(el)).to.not.equal(null);
    expect(toggle(el).getAttribute('aria-haspopup')).to.equal('dialog');
    expect(toggle(el).getAttribute('aria-expanded')).to.equal('false');
  });

  it('formats the committed value with the locale medium style', async () => {
    const el = await fixture<UiDateField>(html`
      <ui-date-field locale="pl-PL" start-date="2026-07-05" today="2026-07-19"></ui-date-field>
    `);
    expect(input(el).value).to.contain('5 lip');
    expect(input(el).value).to.contain('2026');
  });

  it('range mode: displays the combined string with the en-dash separator', async () => {
    const el = await fixture<UiDateField>(html`
      <ui-date-field
        mode="range"
        locale="pl-PL"
        start-date="2026-07-05"
        end-date="2026-07-12"
        today="2026-07-19"
      ></ui-date-field>
    `);
    expect(input(el).value).to.contain(' – ');
    expect(input(el).value.split(' – ')).to.have.length(2);
  });

  it('parses typed ISO input on Enter and commits', async () => {
    const el = await fixture<UiDateField>(html`
      <ui-date-field locale="pl-PL" today="2026-07-19"></ui-date-field>
    `);
    await type(el, '2026-07-08');
    setTimeout(() => pressEnter(el));
    const e = (await oneEvent(el, 'ui-change')) as CustomEvent<DateFieldChangeDetail>;
    expect(e.detail).to.deep.equal({ startDate: '2026-07-08', endDate: null });
    expect(el.startDate).to.equal('2026-07-08');
    expect(input(el).value).to.contain('8 lip');
  });

  it('parses locale numeric and month-name forms', async () => {
    const el = await fixture<UiDateField>(html`
      <ui-date-field locale="pl-PL" today="2026-07-19"></ui-date-field>
    `);
    await type(el, '08.07.2026');
    await pressEnter(el);
    expect(el.startDate).to.equal('2026-07-08');

    await type(el, '9 lipca 2026');
    await pressEnter(el);
    expect(el.startDate).to.equal('2026-07-09');
  });

  it('range mode: parses a typed range, swapping reversed endpoints', async () => {
    const el = await fixture<UiDateField>(html`
      <ui-date-field mode="range" locale="pl-PL" today="2026-07-19"></ui-date-field>
    `);
    await type(el, '2026-07-14 - 2026-07-08');
    await pressEnter(el);
    expect(el.startDate).to.equal('2026-07-08');
    expect(el.endDate).to.equal('2026-07-14');
  });

  it('empty text commits a cleared value', async () => {
    const el = await fixture<UiDateField>(html`
      <ui-date-field locale="pl-PL" start-date="2026-07-05" today="2026-07-19"></ui-date-field>
    `);
    await type(el, '');
    setTimeout(() => pressEnter(el));
    const e = (await oneEvent(el, 'ui-change')) as CustomEvent<DateFieldChangeDetail>;
    expect(e.detail).to.deep.equal({ startDate: null, endDate: null });
    expect(el.startDate ?? null).to.equal(null);
  });

  it('invalid text marks data-invalid, dispatches ui-invalid, commits nothing', async () => {
    const el = await fixture<UiDateField>(html`
      <ui-date-field locale="pl-PL" start-date="2026-07-05" today="2026-07-19"></ui-date-field>
    `);
    let changed = 0;
    el.addEventListener('ui-change', () => {
      changed++;
    });
    await type(el, 'not a date');
    setTimeout(() => pressEnter(el));
    await oneEvent(el, 'ui-invalid');
    await el.updateComplete;
    expect(el.hasAttribute('data-invalid')).to.equal(true);
    expect(input(el).getAttribute('aria-invalid')).to.equal('true');
    expect(changed).to.equal(0);
    expect(el.startDate).to.equal('2026-07-05');

    // Typing again clears the invalid treatment.
    await type(el, '2026');
    expect(el.hasAttribute('data-invalid')).to.equal(false);
  });

  it('validates typed dates against min-date', async () => {
    const el = await fixture<UiDateField>(html`
      <ui-date-field locale="pl-PL" min-date="2026-07-05" today="2026-07-19"></ui-date-field>
    `);
    await type(el, '2026-07-02');
    setTimeout(() => pressEnter(el));
    await oneEvent(el, 'ui-invalid');
    expect(el.startDate ?? null).to.equal(null);
  });

  it('calendar toggle opens the picker and syncs aria-expanded', async () => {
    const el = await fixture<UiDateField>(html`
      <ui-date-field locale="pl-PL" today="2026-07-19"></ui-date-field>
    `);
    expect(picker(el).open).to.equal(false);
    toggle(el).click();
    await el.updateComplete;
    expect(picker(el).open).to.equal(true);
    expect(toggle(el).getAttribute('aria-expanded')).to.equal('true');
  });

  it('single mode: picking a day in the panel commits, reformats, and closes', async () => {
    const el = await fixture<UiDateField>(html`
      <ui-date-field locale="pl-PL" start-date="2026-07-05" today="2026-07-19"></ui-date-field>
    `);
    toggle(el).click();
    await el.updateComplete;
    await picker(el).updateComplete;

    setTimeout(() => pickerDay(el, '2026-07-10')!.click());
    const e = (await oneEvent(el, 'ui-change')) as CustomEvent<DateFieldChangeDetail>;
    expect(e.detail).to.deep.equal({ startDate: '2026-07-10', endDate: null });
    await el.updateComplete;
    expect(picker(el).open).to.equal(false);
    expect(input(el).value).to.contain('10 lip');
  });

  it('exposes a form value (single ISO, range interval)', async () => {
    const form = document.createElement('form');
    document.body.appendChild(form);
    try {
      const el = document.createElement('ui-date-field') as UiDateField;
      // Form association names come from the attribute, not the property.
      el.setAttribute('name', 'when');
      el.setAttribute('start-date', '2026-07-05');
      el.setAttribute('today', '2026-07-19');
      form.appendChild(el);
      await el.updateComplete;
      expect(new FormData(form).get('when')).to.equal('2026-07-05');

      el.mode = 'range';
      el.setAttribute('end-date', '2026-07-12');
      await el.updateComplete;
      expect(new FormData(form).get('when')).to.equal('2026-07-05/2026-07-12');
    } finally {
      form.remove();
    }
  });

  it('readonly blocks typing but the picker still opens', async () => {
    const el = await fixture<UiDateField>(html`
      <ui-date-field readonly locale="pl-PL" today="2026-07-19"></ui-date-field>
    `);
    expect(input(el).readOnly).to.equal(true);
    toggle(el).click();
    await el.updateComplete;
    expect(picker(el).open).to.equal(true);
  });

  it('disabled disables both the input and the toggle', async () => {
    const el = await fixture<UiDateField>(html`
      <ui-date-field disabled locale="pl-PL" today="2026-07-19"></ui-date-field>
    `);
    expect(input(el).disabled).to.equal(true);
    expect(toggle(el).disabled).to.equal(true);
    toggle(el).click();
    await el.updateComplete;
    expect(picker(el).open).to.equal(false);
  });

  it('stretches the field to the full host width', async () => {
    const holder = await fixture<HTMLDivElement>(html`
      <div style="width: 420px">
        <ui-date-field label="Date" today="2026-07-19"></ui-date-field>
      </div>
    `);
    const el = holder.querySelector<UiDateField>('ui-date-field')!;
    await el.updateComplete;
    const wrapper = el.shadowRoot!.querySelector('.field-wrapper')!;
    expect(el.getBoundingClientRect().width).to.equal(420);
    expect(wrapper.getBoundingClientRect().width).to.equal(420);
  });
});
