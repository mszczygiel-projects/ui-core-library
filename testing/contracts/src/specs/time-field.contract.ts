import {
  configureUiCore,
  resetUiCoreConfig,
} from '@mszczygiel-projects/ui-core-foundations/config';
import type {
  TimeFieldProps,
  TimeFieldValueChangeDetails,
} from '@mszczygiel-projects/ui-core-shared/time-field';
import { expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { appearance } from '../appearance.ts';
import type { Mount } from '../harness/types.ts';
import { pseudoLabels } from '../pseudo.ts';

/** The props of the specification, plus what each harness translates. */
export interface TimeFieldContractProps extends TimeFieldProps {
  /** The initial value: the value attribute of the web component, defaultValue in React. */
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string, details: TimeFieldValueChangeDetails<Event>) => void;
}

/** The behaviour of TimeField, applied unchanged to the web component and the React component. */
export function timeFieldContract(mount: Mount<TimeFieldContractProps>): void {
  it('renders the default appearance as the explicit field defaults', async () => {
    const implicit = await mount({ label: 'Time' });
    const explicit = await mount({
      label: 'Time',
      variant: 'outline',
      size: 'medium',
      labelPlacement: 'top',
      state: 'default',
    });
    try {
      expect(appearance(implicit.part('control'))).toEqual(appearance(explicit.part('control')));
      expect(appearance(implicit.part('input'))).toEqual(appearance(explicit.part('input')));
    } finally {
      await implicit.unmount();
      await explicit.unmount();
    }
  });
  it('does not accept a default value with seconds', async () => {
    const field = await mount({ label: 'Time', defaultValue: '09:30:30' });
    const input = field.part('input');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('TimeField must contain an input');
    }
    expect(input.value).toBe('');
    await field.unmount();
  });
  it('names the native control and follows right-to-left text', async () => {
    const field = await mount({ label: 'Meeting time' }, { dir: 'rtl' });
    expect(getComputedStyle(field.part('control')).direction).toBe('rtl');
    expect(await field.accessibleTree()).toContainEqual(
      expect.objectContaining({ role: 'InputTime', name: 'MEETING TIME' }),
    );
    await field.unmount();
  });
  it('uses a native time control with minute precision and inclusive bounds', async () => {
    const field = await mount({ label: 'Start time', min: '09:00', max: '17:00' });
    const input = field.part('input');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('TimeField must contain an input');
    }
    expect(input.type).toBe('time');
    expect(input.step).toBe('60');
    input.value = '08:59';
    expect(input.validity.rangeUnderflow).toBe(true);
    input.value = '09:00';
    expect(input.validity.valid).toBe(true);
    input.value = '17:00';
    expect(input.validity.valid).toBe(true);
    input.value = '17:01';
    expect(input.validity.rangeOverflow).toBe(true);
    await field.unmount();
  });

  it('rejects reversed time limits instead of accepting a range across midnight', async () => {
    const field = await mount({
      label: 'Start time',
      min: '17:00',
      max: '09:00',
      defaultValue: '20:00',
    });
    const input = field.part('input');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('TimeField must contain an input');
    }
    expect(input.validity.customError).toBe(true);
    expect(input.validationMessage).toBe('The time limits are inconsistent.');
    await field.unmount();
  });

  it('submits its value under its name, and resets to its initial value', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const control = await mount({ name: 'entry', defaultValue: '09:30' }, { parent: form });
    expect(new FormData(form).get('entry')).toBe('09:30');
    await page.elementLocator(control.part('input')).fill('10:45');
    await expect.poll(() => new FormData(form).get('entry')).toBe('10:45');
    form.reset();
    await expect.poll(() => new FormData(form).get('entry')).toBe('09:30');
    await control.unmount();
    form.remove();
  });

  it('follows a disabled fieldset', async () => {
    const fieldset = document.createElement('fieldset');
    document.body.append(fieldset);
    const control = await mount({ name: 'entry' }, { parent: fieldset });
    fieldset.disabled = true;
    await expect.poll(() => control.part('input').matches(':disabled')).toBe(true);
    await control.unmount();
    fieldset.remove();
  });

  it('reports one edit and its native event', async () => {
    const changed = vi.fn<NonNullable<TimeFieldContractProps['onValueChange']>>();
    const field = await mount({ label: 'Time', onValueChange: changed });
    await page.elementLocator(field.part('input')).fill('10:45');
    expect(changed).toHaveBeenCalledOnce();
    expect(changed.mock.calls[0]?.[0]).toBe('10:45');
    expect(changed.mock.calls[0]?.[1].originalEvent).toBeInstanceOf(Event);
    await field.unmount();
  });

  it('uses the configured message for reversed limits', async () => {
    configureUiCore({ labels: pseudoLabels });
    const field = await mount({ min: '17:00', max: '09:00', defaultValue: '20:00' });
    try {
      const input = field.part('input');
      if (!(input instanceof HTMLInputElement)) {
        throw new Error('TimeField must contain an input');
      }
      expect(input.validationMessage).toBe(pseudoLabels.timeField.inconsistentLimits);
    } finally {
      await field.unmount();
      resetUiCoreConfig();
    }
  });
}
