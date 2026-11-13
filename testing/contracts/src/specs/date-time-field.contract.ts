import {
  configureUiCore,
  resetUiCoreConfig,
} from '@mszczygiel-projects/ui-core-foundations/config';
import type { DateFieldOpenChangeDetails } from '@mszczygiel-projects/ui-core-shared/date-field';
import type {
  DateTimeFieldProps,
  DateTimeFieldValueChangeDetails,
} from '@mszczygiel-projects/ui-core-shared/date-time-field';
import { afterEach, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import type { Mount, Mounted } from '../harness/types.ts';
import { pseudoLabels } from '../pseudo.ts';
import { parsedFieldAppearanceContract } from './parsed-field-appearance.contract.ts';

/** The shared props and the framework-specific event adapters. */
export interface DateTimeFieldContractProps extends DateTimeFieldProps {
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string, details: DateTimeFieldValueChangeDetails<Event>) => void;
  readonly onOpenChange?: (open: boolean, details: DateFieldOpenChangeDetails<Event>) => void;
}
function inputOf(field: Mounted<DateTimeFieldContractProps>): HTMLInputElement {
  const input = field.part('input');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Missing date-time input');
  }
  return input;
}
function nativeInside(part: HTMLElement, selector: string): HTMLElement {
  const element = (part.shadowRoot ?? part).querySelector<HTMLElement>(selector);
  if (element === null) {
    throw new Error(`Missing ${selector}`);
  }
  return element;
}
function deepActiveElement(): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  return active;
}

/** The same behaviour contract for React and the web component. */
export function dateTimeFieldContract(adapter: Mount<DateTimeFieldContractProps>): void {
  const active = new Set<Mounted<DateTimeFieldContractProps>>();
  const mount: Mount<DateTimeFieldContractProps> = async (props, options) => {
    const mounted = await adapter(props, options);
    active.add(mounted);
    return {
      ...mounted,
      unmount: async () => {
        active.delete(mounted);
        await mounted.unmount();
      },
    };
  };
  afterEach(async () => {
    for (const mounted of active) {
      await mounted.unmount();
    }
    active.clear();
    resetUiCoreConfig();
  });
  parsedFieldAppearanceContract(mount, {});
  it('renders one named input and submits the complete local date and time', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const field = await mount(
      { name: 'entry', label: 'Appointment', locale: 'pl-PL', defaultValue: '2026-12-31T09:30' },
      { parent: form },
    );
    const input = inputOf(field);
    expect(input.value).toBe('31.12.2026 09:30');
    const root = field.element.shadowRoot ?? field.element;
    expect(root.querySelectorAll('input:not([type="hidden"])')).toHaveLength(1);
    expect(new FormData(form).getAll('entry')).toEqual(['2026-12-31T09:30']);
    expect(await field.accessibleTree()).toContainEqual(
      expect.objectContaining({ role: 'textbox', name: 'APPOINTMENT' }),
    );
    await field.unmount();
    form.remove();
  });

  it('preserves incomplete text and blocks form submission', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const changed = vi.fn();
    const field = await mount(
      { name: 'entry', label: 'Appointment', locale: 'pl-PL', onValueChange: changed },
      { parent: form },
    );
    await page.elementLocator(inputOf(field)).fill('31.12.2026 09:3');
    expect(inputOf(field).value).toBe('31.12.2026 09:3');
    expect(new FormData(form).get('entry')).toBe('');
    expect(form.checkValidity()).toBe(false);
    expect(changed).toHaveBeenLastCalledWith(
      '',
      expect.objectContaining({ inputState: 'incomplete', validationError: 'incomplete' }),
    );
    await field.unmount();
    form.remove();
  });

  it('edits a date and time in one dialog and closes with the done button', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const changed = vi.fn();
    const field = await mount(
      {
        name: 'entry',
        label: 'Appointment',
        timeLabel: 'Time',
        locale: 'pl-PL',
        today: '2026-07-08',
        defaultValue: '2026-07-08T09:30',
        onValueChange: changed,
      },
      { parent: form },
    );
    await page.elementLocator(field.part('picker-button')).click();
    await field.update({});
    const calendar = field.part('calendar');
    const day = nativeInside(calendar, '[data-date="2026-07-09"]');
    await page.elementLocator(day).click();
    await field.update({});
    const time = nativeInside(field.part('time'), 'input');
    await page.elementLocator(time).fill('10:45');
    await field.update({});
    expect(inputOf(field).value).toBe('09.07.2026 10:45');
    expect(new FormData(form).get('entry')).toBe('2026-07-09T10:45');
    expect(changed).toHaveBeenLastCalledWith(
      '2026-07-09T10:45',
      expect.objectContaining({ inputState: 'valid' }),
    );
    const donePart = field.part('done-button');
    const done =
      donePart instanceof HTMLButtonElement ? donePart : nativeInside(donePart, 'button');
    await page.elementLocator(done).click();
    await field.update({});
    expect(field.part('picker-button').getAttribute('aria-expanded')).toBe('false');
    await field.unmount();
    form.remove();
  });

  it('separates the done button from the time control', async () => {
    const field = await mount({ label: 'Appointment', today: '2026-07-08' });
    try {
      await page.elementLocator(field.part('picker-button')).click();
      await field.update({});
      const panel = field.part('panel');
      const done = field.part('done-button');
      expect(getComputedStyle(done).marginBlockStart).toBe(
        getComputedStyle(panel).paddingBlockStart,
      );
      expect(Number.parseFloat(getComputedStyle(done).marginBlockStart)).toBeGreaterThan(0);
    } finally {
      await field.unmount();
    }
  });

  it('separates the time control from the calendar', async () => {
    const field = await mount({ label: 'Appointment', today: '2026-07-08' });
    try {
      await page.elementLocator(field.part('picker-button')).click();
      await field.update({});
      const panel = field.part('panel');
      const time = field.part('time');
      expect(getComputedStyle(time).marginBlockStart).toBe(
        getComputedStyle(panel).paddingBlockStart,
      );
      expect(Number.parseFloat(getComputedStyle(time).marginBlockStart)).toBeGreaterThan(0);
    } finally {
      await field.unmount();
    }
  });

  it('checks inclusive date-time bounds and excluded dates', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const field = await mount(
      {
        name: 'entry',
        locale: 'pl-PL',
        min: '2026-12-31T09:00',
        max: '2026-12-31T17:00',
        disabledDates: ['2026-12-30'],
      },
      { parent: form },
    );
    await page.elementLocator(inputOf(field)).fill('31.12.2026 08:59');
    expect(form.checkValidity()).toBe(false);
    await page.elementLocator(inputOf(field)).fill('31.12.2026 09:00');
    expect(form.checkValidity()).toBe(true);
    await page.elementLocator(inputOf(field)).fill('31.12.2026 17:01');
    expect(form.checkValidity()).toBe(false);
    await field.update({ min: undefined, max: undefined });
    await page.elementLocator(inputOf(field)).fill('30.12.2026 09:00');
    expect(form.checkValidity()).toBe(false);
    await field.unmount();
    form.remove();
  });

  it('applies the selected date’s time bounds inside the picker', async () => {
    const field = await mount({
      label: 'Appointment',
      today: '2026-04-01',
      defaultValue: '2026-04-01T10:00',
      min: '2026-04-01T09:00',
      max: '2026-04-03T17:00',
    });
    await page.elementLocator(field.part('picker-button')).click();
    await field.update({});
    const time = nativeInside(field.part('time'), 'input');
    if (!(time instanceof HTMLInputElement)) {
      throw new Error('Missing native time input');
    }
    expect(time.min).toBe('09:00');
    expect(time.max).toBe('');
    await page
      .elementLocator(nativeInside(field.part('calendar'), '[data-date="2026-04-02"]'))
      .click();
    await field.update({});
    expect(time.min).toBe('');
    expect(time.max).toBe('');
    await page
      .elementLocator(nativeInside(field.part('calendar'), '[data-date="2026-04-03"]'))
      .click();
    await field.update({});
    expect(time.min).toBe('');
    expect(time.max).toBe('17:00');
    await field.unmount();
  });

  it('keeps a time chosen before a date when the picker is reopened', async () => {
    const field = await mount({ label: 'Appointment', locale: 'pl-PL', today: '2026-04-01' });
    await page.elementLocator(field.part('picker-button')).click();
    await field.update({});
    await page.elementLocator(nativeInside(field.part('time'), 'input')).fill('10:45');
    const donePart = field.part('done-button');
    await page
      .elementLocator(
        donePart instanceof HTMLButtonElement ? donePart : nativeInside(donePart, 'button'),
      )
      .click();
    await field.update({});
    await page.elementLocator(field.part('picker-button')).click();
    await field.update({});
    const time = nativeInside(field.part('time'), 'input');
    if (!(time instanceof HTMLInputElement)) {
      throw new Error('Missing native time input');
    }
    expect(time.value).toBe('10:45');
    await page
      .elementLocator(nativeInside(field.part('calendar'), '[data-date="2026-04-01"]'))
      .click();
    await field.update({});
    expect(inputOf(field).value).toBe('01.04.2026 10:45');
    await field.unmount();
  });

  it('clears a pending time on form reset', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const field = await mount({ label: 'Appointment', today: '2026-04-01' }, { parent: form });
    await page.elementLocator(field.part('picker-button')).click();
    await field.update({});
    await page.elementLocator(nativeInside(field.part('time'), 'input')).fill('10:45');
    form.reset();
    await expect
      .poll(() => field.part('picker-button').getAttribute('aria-expanded'))
      .toBe('false');
    await page.elementLocator(field.part('picker-button')).click();
    await field.update({});
    const time = nativeInside(field.part('time'), 'input');
    if (!(time instanceof HTMLInputElement)) {
      throw new Error('Missing native time input');
    }
    expect(time.value).toBe('');
    await field.unmount();
    form.remove();
  });

  it('restores the default after reset without emitting an edit', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const changed = vi.fn();
    const field = await mount(
      { name: 'entry', locale: 'pl-PL', defaultValue: '2026-12-31T09:30', onValueChange: changed },
      { parent: form },
    );
    await page.elementLocator(inputOf(field)).fill('31.12.2026 10:45');
    expect(new FormData(form).get('entry')).toBe('2026-12-31T10:45');
    changed.mockClear();
    form.reset();
    await expect.poll(() => new FormData(form).get('entry')).toBe('2026-12-31T09:30');
    await expect.poll(() => inputOf(field).value).toBe('31.12.2026 09:30');
    expect(changed).not.toHaveBeenCalled();
    await field.unmount();
    form.remove();
  });

  it('closes the picker on Escape and returns focus to its button', async () => {
    const field = await mount({
      label: 'Appointment',
      locale: 'pl-PL',
      defaultValue: '2026-07-08T09:30',
      today: '2026-07-08',
    });
    const button = field.part('picker-button');
    await page.elementLocator(button).click();
    await field.update({});
    await expect
      .poll(() => (deepActiveElement() as HTMLElement | null)?.dataset['date'])
      .toBe('2026-07-08');
    await userEvent.keyboard('{Escape}');
    await field.update({});
    await expect.poll(() => button.getAttribute('aria-expanded')).toBe('false');
    await expect.poll(() => deepActiveElement()).toBe(button);
    expect(inputOf(field).value).toBe('08.07.2026 09:30');
    await field.unmount();
  });

  it('keeps keyboard focus inside the combined picker', async () => {
    const field = await mount({
      label: 'Appointment',
      locale: 'pl-PL',
      defaultValue: '2026-07-08T09:30',
      today: '2026-07-08',
    });
    try {
      await page.elementLocator(field.part('picker-button')).click();
      await field.update({});
      const time = nativeInside(field.part('time'), 'input');
      const donePart = field.part('done-button');
      const done =
        donePart instanceof HTMLButtonElement ? donePart : nativeInside(donePart, 'button');
      done.focus();
      await userEvent.keyboard('{Tab}');
      await field.update({});
      expect(deepActiveElement()?.getAttribute('aria-label')).toBe('Previous month');
      await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
      await field.update({});
      expect(deepActiveElement()).toBe(done);
      time.focus();
      expect(deepActiveElement()).toBe(time);
    } finally {
      await field.unmount();
    }
  });

  it('initializes a programmatically opened picker from the latest value', async () => {
    const field = await mount({
      label: 'Appointment',
      locale: 'pl-PL',
      value: '2026-07-08T09:30',
      open: false,
    });
    try {
      await field.update({ value: '2026-08-09T11:15' });
      await field.update({ open: true });
      const time = nativeInside(field.part('time'), 'input');
      if (!(time instanceof HTMLInputElement)) {
        throw new Error('Missing native time input');
      }
      await expect.poll(() => time.value).toBe('11:15');
      await expect
        .poll(() => (deepActiveElement() as HTMLElement | null)?.dataset['date'])
        .toBe('2026-08-09');
      await field.update({ value: '2026-09-10T12:45' });
      await expect.poll(() => time.value).toBe('12:45');
      const calendar = field.part('calendar');
      await expect
        .poll(
          () =>
            (calendar.shadowRoot ?? calendar).querySelector('[data-date="2026-09-10"]') !== null,
        )
        .toBe(true);
    } finally {
      await field.unmount();
    }
  });

  it('uses configured labels for the picker, time and done button', async () => {
    configureUiCore({ labels: pseudoLabels });
    const field = await mount({ label: 'Appointment', today: '2026-07-08' });
    try {
      expect(field.part('picker-button').getAttribute('aria-label')).toBe(
        pseudoLabels.dateTimeField.openPicker,
      );
      await page.elementLocator(field.part('picker-button')).click();
      await field.update({});
      const timePart = field.part('time');
      const time = nativeInside(timePart, 'input');
      if (!(time instanceof HTMLInputElement)) {
        throw new Error('Missing native time input');
      }
      expect(time.labels?.[0]?.textContent).toBe(pseudoLabels.dateTimeField.timeLabel);
      expect(field.part('done-button').textContent).toContain(pseudoLabels.dateTimeField.done);
    } finally {
      await field.unmount();
      resetUiCoreConfig();
    }
  });

  it('shows an invalid ISO paste without correcting its date or time', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const field = await mount({ label: 'Appointment', locale: 'pl-PL' }, { parent: form });
    await page.elementLocator(inputOf(field)).fill('2026-02-31T24:00');
    expect(inputOf(field).value).toBe('31.02.2026 24:00');
    expect(form.checkValidity()).toBe(false);
    await field.unmount();
    form.remove();
  });

  it('follows disabled fieldsets', async () => {
    const fieldset = document.createElement('fieldset');
    document.body.append(fieldset);
    const field = await mount({ label: 'Appointment' }, { parent: fieldset });
    fieldset.disabled = true;
    await expect.poll(() => inputOf(field).matches(':disabled')).toBe(true);
    await field.unmount();
    fieldset.remove();
  });
}
