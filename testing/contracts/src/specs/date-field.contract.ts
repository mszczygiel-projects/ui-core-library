import {
  configureUiCore,
  resetUiCoreConfig,
} from '@mszczygiel-projects/ui-core-foundations/config';
import type {
  DateFieldOpenChangeDetails,
  DateFieldProps,
  DateFieldValueChangeDetails,
} from '@mszczygiel-projects/ui-core-shared/date-field';
import { afterEach, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { pseudoLabels } from '../pseudo.ts';
import { parsedFieldAppearanceContract } from './parsed-field-appearance.contract.ts';

/** Shared props with event and default-value adapters only. */
export interface DateFieldContractProps extends DateFieldProps {
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string, details: DateFieldValueChangeDetails<Event>) => void;
  readonly onOpenChange?: OpenChange;
}

/** A callback of an opened or closed calendar. */
type OpenChange = (open: boolean, details: DateFieldOpenChangeDetails<Event>) => void;

/** The element that has the focus, inside every shadow root on the way. */
function deepActiveElement(): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  return active;
}

/** The date of the calendar cell that has the focus. */
function focusedDate(): string | undefined {
  const active = deepActiveElement();
  return active instanceof HTMLElement ? active.dataset['date'] : undefined;
}

/** Runs unchanged against each native implementation. */
export function dateFieldContract(adapter: Mount<DateFieldContractProps>): void {
  parsedFieldAppearanceContract(adapter, {});
  const mounted: Mounted<DateFieldContractProps>[] = [];
  const fixtures: HTMLElement[] = [];
  async function mount(props: DateFieldContractProps = {}, options?: MountOptions) {
    const field = await adapter({ label: 'Entry', locale: 'pl-PL', ...props }, options);
    mounted.push(field);
    return field;
  }
  function input(field: Mounted<DateFieldContractProps>): HTMLInputElement {
    const node = field.part('input');
    if (!(node instanceof HTMLInputElement)) {
      throw new Error('Missing native input');
    }
    return node;
  }
  function form() {
    const node = document.createElement('form');
    const submit = vi.fn((event: SubmitEvent) => {
      event.preventDefault();
    });
    node.addEventListener('submit', submit);
    document.body.append(node);
    fixtures.push(node);
    return { node, submit };
  }
  afterEach(async () => {
    for (const field of mounted.splice(0)) {
      await field.unmount();
    }
    for (const fixture of fixtures.splice(0)) {
      fixture.remove();
    }
    resetUiCoreConfig();
  });

  it('submits one canonical entry and restores the default without notifying', async () => {
    const { node } = form();
    const changed = vi.fn();
    const field = await mount(
      { name: 'entry', defaultValue: '2026-01-05', onValueChange: changed },
      { parent: node },
    );
    expect(input(field).value).toBe('05.01.2026');
    expect([...new FormData(node)]).toEqual([['entry', '2026-01-05']]);
    await page.elementLocator(input(field)).fill('06.01.2026');
    expect(changed).toHaveBeenCalledOnce();
    changed.mockClear();
    node.reset();
    await expect.poll(() => input(field).value).toBe('05.01.2026');
    expect([...new FormData(node)]).toEqual([['entry', '2026-01-05']]);
    expect(changed).not.toHaveBeenCalled();
  });

  it('blocks required submission and distinguishes visual error from validity', async () => {
    const { node, submit } = form();
    const field = await mount({ required: true }, { parent: node });
    expect(input(field).validity.valueMissing).toBe(true);
    node.requestSubmit();
    expect(submit).not.toHaveBeenCalled();
    await field.update({ required: false, state: 'error' });
    expect(input(field).getAttribute('aria-invalid')).toBe('true');
    node.requestSubmit();
    expect(submit).toHaveBeenCalledOnce();
  });

  it('keeps partial text, reports its state and never submits a stale value', async () => {
    const { node, submit } = form();
    const changed = vi.fn();
    const field = await mount(
      { name: 'entry', defaultValue: '2026-01-05', onValueChange: changed },
      { parent: node },
    );
    await page.elementLocator(input(field)).fill('05.01.20');
    expect(input(field).value).toBe('05.01.20');
    expect(changed).toHaveBeenCalledExactlyOnceWith(
      '',
      expect.objectContaining({
        text: '05.01.20',
        inputState: 'incomplete',
        validationError: 'incomplete',
      }),
    );
    expect(new FormData(node).get('entry')).toBe('');
    expect(input(field).validity.customError).toBe(true);
    node.requestSubmit();
    expect(submit).not.toHaveBeenCalled();
  });

  it('validates constraints without correcting editable text', async () => {
    const { node, submit } = form();
    const field = await mount({ name: 'entry', max: '2026-01-01' }, { parent: node });
    await page.elementLocator(input(field)).fill('05.01.2026');
    expect(input(field).value).toBe('05.01.2026');
    expect(input(field).validity.customError).toBe(true);
    expect(new FormData(node).get('entry')).toBe('2026-01-05');
    node.requestSubmit();
    expect(submit).not.toHaveBeenCalled();
  });

  it('submits optional empty text and excludes nameless or disabled controls', async () => {
    const { node } = form();
    const field = await mount({ name: 'entry' }, { parent: node });
    expect([...new FormData(node)]).toEqual([['entry', '']]);
    await field.update({ name: undefined });
    expect([...new FormData(node)]).toEqual([]);
    await field.update({ name: 'entry', disabled: true });
    expect(input(field).matches(':disabled')).toBe(true);
    expect([...new FormData(node)]).toEqual([]);
  });

  it('honours fieldset disabling and the first legend exception', async () => {
    const { node } = form();
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    fieldset.append(legend);
    node.append(fieldset);
    const field = await mount({ name: 'outside' }, { parent: fieldset });
    const exception = await mount({ name: 'inside' }, { parent: legend });
    fieldset.disabled = true;
    await expect.poll(() => input(field).matches(':disabled')).toBe(true);
    expect(input(exception).matches(':disabled')).toBe(false);
    expect([...new FormData(node)]).toEqual([['inside', '']]);
  });

  it('keeps readonly data while barring constraint validation', async () => {
    const { node, submit } = form();
    const field = await mount({ name: 'entry', required: true, readOnly: true }, { parent: node });
    expect(input(field).readOnly).toBe(true);
    expect(input(field).willValidate).toBe(false);
    node.requestSubmit();
    expect(submit).toHaveBeenCalledOnce();
    expect([...new FormData(node)]).toEqual([['entry', '']]);
  });

  it('keeps an edit when reset is canceled', async () => {
    const { node } = form();
    const field = await mount({ defaultValue: '2026-01-05' }, { parent: node });
    await page.elementLocator(input(field)).fill('06.01.2026');
    node.addEventListener(
      'reset',
      (event) => {
        event.preventDefault();
      },
      { once: true },
    );
    node.reset();
    await new Promise<void>((resolve) => {
      queueMicrotask(resolve);
    });
    expect(input(field).value).toBe('06.01.2026');
  });

  it('uses prop locale before configuration and does not notify on a format change', async () => {
    configureUiCore({ locale: 'en-US' });
    const changed = vi.fn();
    const field = await mount({ defaultValue: '2026-12-31', onValueChange: changed });
    expect(input(field).value).toBe('31.12.2026');
    await field.update({ locale: undefined });
    await expect.poll(() => input(field).value).toBe('12/31/2026');
    expect(changed).not.toHaveBeenCalled();
  });

  it('exposes a named textbox and its description', async () => {
    const field = await mount({ hint: 'Enter the value' });
    expect(await field.accessibleTree()).toContainEqual(
      expect.objectContaining({
        role: 'textbox',
        name: 'ENTRY',
        description: 'Enter the value',
      }),
    );
  });

  it('masks eight digits and validates impossible calendar dates', async () => {
    const field = await mount();
    await page.elementLocator(input(field)).fill('31122026');
    expect(input(field).value).toBe('31.12.2026');
    expect(input(field).validity.valid).toBe(true);
    await page.elementLocator(input(field)).fill('31.02.2026');
    expect(input(field).value).toBe('31.02.2026');
    expect(input(field).validity.customError).toBe(true);
  });

  it('completes a typed date in a locale whose format ends with a literal', async () => {
    const field = await mount({ locale: 'hu-HU' });
    await page.elementLocator(input(field)).fill('20261231');
    expect(input(field).value).toBe('2026. 12. 31');
    expect(input(field).validity.valid).toBe(true);
  });

  it('accepts ISO paste and enforces excluded dates', async () => {
    const field = await mount({ disabledDates: ['2026-12-31'] });
    await page.elementLocator(input(field)).fill('2026-12-31');
    expect(input(field).value).toBe('31.12.2026');
    expect(input(field).validity.customError).toBe(true);
    await field.update({ disabledDates: [] });
    expect(input(field).validity.valid).toBe(true);
  });
  it('keeps the editing grammar stable through configuration changes and preserves partial input', async () => {
    const changed = vi.fn();
    configureUiCore({ locale: 'pl-PL' });
    const field = await mount({
      locale: undefined,
      defaultValue: '2026-12-31',
      onValueChange: changed,
    });
    await page.elementLocator(input(field)).click();
    configureUiCore({ locale: 'en-US' });
    await field.update({ hint: 'Updated' });
    expect(input(field).value).toBe('31.12.2026');
    input(field).blur();
    await expect.poll(() => input(field).value).toBe('12/31/2026');
    expect(changed).not.toHaveBeenCalled();
    await field.update({ locale: 'pl-PL' });
    await page.elementLocator(input(field)).fill('31.12.20');
    await field.update({ locale: 'en-US' });
    input(field).blur();
    await expect.poll(() => input(field).value).toBe('31.12.20');
    expect(input(field).validity.customError).toBe(true);
    expect(changed).toHaveBeenCalledOnce();
  });

  it('submits the current edit with Enter and leaves IME confirmation to the input', async () => {
    const { node, submit } = form();
    const submitter = document.createElement('button');
    submitter.type = 'submit';
    node.append(submitter);
    const field = await mount({ name: 'entry' }, { parent: node });
    await page.elementLocator(input(field)).fill('31.12.2026');
    input(field).dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        isComposing: true,
        bubbles: true,
        composed: true,
      }),
    );
    expect(submit).not.toHaveBeenCalled();
    await userEvent.keyboard('{Enter}');
    expect(submit).toHaveBeenCalledOnce();
    expect(new FormData(node).get('entry')).toBe('2026-12-31');
  });

  it('uses complete configured labels and allows per-instance overrides', async () => {
    configureUiCore({ labels: pseudoLabels });
    const field = await mount();
    expect(field.part('hint').textContent).toBe(pseudoLabels.dateField.formatHint('31.12.2026'));
    await page.elementLocator(input(field)).fill('31.02.2026');
    expect(input(field).validationMessage).toBe(
      pseudoLabels.dateField.validationMessage({ reason: 'invalid', locale: 'pl-PL' }),
    );
    await field.update({ hint: 'Custom format', getValidationMessageLabel: () => 'Invalid date.' });
    expect(field.part('hint').textContent).toBe('Custom format');
    expect(input(field).validationMessage).toBe('Invalid date.');
  });

  it('preserves impossible ISO parts and supports selection replacement and deletion', async () => {
    const field = await mount();
    await page.elementLocator(input(field)).fill('2026-02-31');
    expect(input(field).value).toBe('31.02.2026');
    expect(input(field).validity.customError).toBe(true);
    input(field).setSelectionRange(0, 2);
    await userEvent.keyboard('28');
    expect(input(field).value).toBe('28.02.2026');
    expect(input(field).validity.valid).toBe(true);
    input(field).setSelectionRange(8, 10);
    await userEvent.keyboard('{Backspace}');
    expect(input(field).value).toBe('28.02.20');
    expect(input(field).validity.customError).toBe(true);
  });
  it('synchronizes undo and redo from the mask with canonical form data', async () => {
    const { node } = form();
    const changed = vi.fn();
    const field = await mount({ name: 'entry', onValueChange: changed }, { parent: node });
    await page.elementLocator(input(field)).fill('31.12.2026');
    await page.elementLocator(input(field)).fill('30.11.2026');
    changed.mockClear();
    await userEvent.keyboard('{Control>}z{/Control}');
    expect(input(field).value).toBe('31.12.2026');
    expect(new FormData(node).get('entry')).toBe('2026-12-31');
    expect(changed).toHaveBeenCalledOnce();
    await userEvent.keyboard('{Control>}y{/Control}');
    expect(input(field).value).toBe('30.11.2026');
    expect(new FormData(node).get('entry')).toBe('2026-11-30');
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it.each([false, true])(
    'waits for IME composition and notifies once (final input: %s)',
    async (finalInput) => {
      const { node } = form();
      const changed = vi.fn();
      const field = await mount({ name: 'entry', onValueChange: changed }, { parent: node });
      const control = input(field);
      await page.elementLocator(control).click();
      control.dispatchEvent(
        new CompositionEvent('compositionstart', { bubbles: true, composed: true }),
      );
      control.value = '31122026';
      control.dispatchEvent(
        new InputEvent('input', { bubbles: true, composed: true, isComposing: true }),
      );
      expect(changed).not.toHaveBeenCalled();
      control.dispatchEvent(
        new CompositionEvent('compositionend', { bubbles: true, composed: true, data: '31122026' }),
      );
      if (finalInput) {
        control.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
      }
      await expect.poll(() => new FormData(node).get('entry')).toBe('2026-12-31');
      expect(control.value).toBe('31.12.2026');
      expect(changed).toHaveBeenCalledOnce();
    },
  );
  it('does not let mask history change a field switched to readonly', async () => {
    const field = await mount();
    await page.elementLocator(input(field)).fill('31.12.2026');
    await page.elementLocator(input(field)).fill('30.11.2026');
    await field.update({ readOnly: true });
    await userEvent.keyboard('{Control>}z{/Control}');
    expect(input(field).value).toBe('30.11.2026');
  });

  function calendarButton(field: Mounted<DateFieldContractProps>): HTMLButtonElement {
    const node = field.part('calendar-button');
    if (!(node instanceof HTMLButtonElement)) {
      throw new Error('Missing calendar button');
    }
    return node;
  }
  /** The calendar inside the dialog, or null while the dialog is closed. */
  function calendarCell(field: Mounted<DateFieldContractProps>, date: string): HTMLElement {
    const root = field.element.shadowRoot ?? field.element;
    const calendar = root.querySelector('ui-calendar, .ui-calendar');
    const cell = (calendar?.shadowRoot ?? calendar)?.querySelector<HTMLElement>(
      `[data-date="${date}"]`,
    );
    if (cell === null || cell === undefined) {
      throw new Error(`Missing the cell of ${date}`);
    }
    return cell;
  }
  const dialog = (field: Mounted<DateFieldContractProps>) =>
    field.screen.getByRole('dialog', { name: 'Choose date' });
  async function openCalendar(field: Mounted<DateFieldContractProps>) {
    await page.elementLocator(calendarButton(field)).click();
    await field.update({});
    await expect.poll(focusedDate).toBeDefined();
  }

  it('opens a named calendar dialog with the focus on the date of the value', async () => {
    const opened = vi.fn<OpenChange>();
    const field = await mount({
      defaultValue: '2026-07-08',
      today: '2026-07-19',
      onOpenChange: opened,
    });
    const button = calendarButton(field);
    expect(button.getAttribute('aria-label')).toBe('Choose date');
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    await openCalendar(field);
    await expect.element(dialog(field)).toBeVisible();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(focusedDate()).toBe('2026-07-08');
    expect(opened).toHaveBeenCalledOnce();
    expect(opened.mock.calls[0]?.[0]).toBe(true);
    expect(opened.mock.calls[0]?.[1].originalEvent).toBeInstanceOf(Event);
  });

  it('focuses today without a value, and the month of a date typed before opening', async () => {
    const field = await mount({ today: '2026-07-19' });
    await openCalendar(field);
    expect(focusedDate()).toBe('2026-07-19');
    await userEvent.keyboard('{Escape}');
    await field.update({});
    await page.elementLocator(input(field)).fill('15.03.2027');
    await openCalendar(field);
    expect(focusedDate()).toBe('2027-03-15');
  });

  it('writes a picked date as one edit, closes and returns the focus to the button', async () => {
    const { node } = form();
    const changed = vi.fn<NonNullable<DateFieldContractProps['onValueChange']>>();
    const opened = vi.fn<OpenChange>();
    const field = await mount(
      {
        name: 'entry',
        defaultValue: '2026-07-08',
        today: '2026-07-19',
        onValueChange: changed,
        onOpenChange: opened,
      },
      { parent: node },
    );
    await openCalendar(field);
    // Moving to the next month is not an edit of the field.
    await userEvent.keyboard('{PageDown}');
    await field.update({});
    expect(focusedDate()).toBe('2026-08-08');
    await userEvent.keyboard('{ArrowRight}{Enter}');
    await field.update({});
    expect(input(field).value).toBe('09.08.2026');
    expect(new FormData(node).get('entry')).toBe('2026-08-09');
    expect(changed).toHaveBeenCalledOnce();
    expect(changed.mock.calls[0]?.[0]).toBe('2026-08-09');
    expect(changed.mock.calls[0]?.[1]).toMatchObject({ inputState: 'valid', text: '09.08.2026' });
    await expect.element(dialog(field)).not.toBeInTheDocument();
    expect(deepActiveElement()).toBe(calendarButton(field));
    expect(opened.mock.calls.map(([open]) => open)).toEqual([true, false]);
  });

  it('closes with Escape without a change, after Escape has left the grid of months', async () => {
    const changed = vi.fn<NonNullable<DateFieldContractProps['onValueChange']>>();
    const field = await mount({ defaultValue: '2026-07-08', onValueChange: changed });
    await openCalendar(field);
    await page
      .elementLocator(field.part('calendar'))
      .getByRole('button', { name: /choose a month/ })
      .click();
    await field.update({});
    await userEvent.keyboard('{Escape}');
    await field.update({});
    await expect.element(dialog(field)).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await field.update({});
    await expect.element(dialog(field)).not.toBeInTheDocument();
    expect(deepActiveElement()).toBe(calendarButton(field));
    expect(input(field).value).toBe('08.07.2026');
    expect(changed).not.toHaveBeenCalled();
  });

  it('keeps Tab and Shift+Tab inside the dialog', async () => {
    const field = await mount({ defaultValue: '2026-07-08' });
    await openCalendar(field);
    const cell = calendarCell(field, '2026-07-08');
    await userEvent.keyboard('{Tab}');
    await field.update({});
    expect(deepActiveElement()?.getAttribute('aria-label')).toBe('Previous month');
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    await field.update({});
    expect(deepActiveElement()).toBe(cell);
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    await field.update({});
    expect(deepActiveElement()?.getAttribute('aria-label')).toBe('Next month');
    await expect.element(dialog(field)).toBeVisible();
  });

  it('keeps the page inert while open, and closes on a press outside without reaching it', async () => {
    const opened = vi.fn<OpenChange>();
    const field = await mount({ onOpenChange: opened });
    const outside = document.createElement('button');
    outside.textContent = 'Outside';
    outside.style.cssText = 'position: fixed; inset-block-end: 0; inset-inline-end: 0; margin: 0;';
    const pressed = vi.fn();
    outside.addEventListener('click', pressed);
    document.body.append(outside);
    fixtures.push(outside);
    await openCalendar(field);
    expect(outside.matches(':modal, :modal *')).toBe(false);
    outside.focus();
    expect(deepActiveElement()).not.toBe(outside);
    await userEvent.click(outside, { force: true });
    await field.update({});
    await expect.element(dialog(field)).not.toBeInTheDocument();
    expect(pressed).not.toHaveBeenCalled();
    expect(opened.mock.calls.map(([open]) => open)).toEqual([true, false]);
  });

  it('moves the focus into a calendar that is open from the start', async () => {
    const field = await mount({ defaultValue: '2026-07-08', today: '2026-07-19', open: true });
    await expect.element(dialog(field)).toBeVisible();
    await expect.poll(focusedDate).toBe('2026-07-08');
  });

  it('closes the calendar when a fieldset disables the field', async () => {
    const changed = vi.fn<NonNullable<DateFieldContractProps['onValueChange']>>();
    const fieldset = document.createElement('fieldset');
    document.body.append(fieldset);
    fixtures.push(fieldset);
    const field = await mount(
      { defaultValue: '2026-07-08', onValueChange: changed },
      { parent: fieldset },
    );
    await openCalendar(field);
    fieldset.disabled = true;
    await field.update({});
    await expect.element(dialog(field)).not.toBeInTheDocument();
    expect(calendarButton(field).matches(':disabled')).toBe(true);
    expect(changed).not.toHaveBeenCalled();
  });

  it('keeps the calendar of a read-only or disabled field closed, and hides the button on request', async () => {
    const field = await mount({ readOnly: true, open: true });
    expect(calendarButton(field).disabled).toBe(true);
    await expect.element(dialog(field)).not.toBeInTheDocument();
    await field.update({ readOnly: false, disabled: true });
    expect(calendarButton(field).disabled).toBe(true);
    await field.update({ disabled: false, hideCalendarButton: true });
    expect(calendarButton(field).hidden).toBe(true);
  });

  it('names the button and the dialog with the configured label or its override', async () => {
    configureUiCore({ labels: pseudoLabels });
    const field = await mount();
    expect(calendarButton(field).getAttribute('aria-label')).toBe(
      pseudoLabels.dateField.openCalendar,
    );
    await field.update({ openCalendarLabel: 'Pick a day' });
    expect(calendarButton(field).getAttribute('aria-label')).toBe('Pick a day');
  });
}
