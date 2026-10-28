import type { CheckboxFieldProps } from '@mszczygiel-projects/ui-core-shared/checkbox-field';
import { afterEach, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import {
  checkboxOf,
  checkedControlContract,
  type CheckedControlContractProps,
} from './choice.contract.ts';
import { formFixture } from './text-control.contract.ts';

/** The props of the specification, plus what each harness translates. */
export interface CheckboxFieldContractProps
  extends CheckboxFieldProps, CheckedControlContractProps {}

/** The behaviour of CheckboxField, applied unchanged to the web component and the React component. */
export function checkboxFieldContract(adapter: Mount<CheckboxFieldContractProps>): void {
  checkedControlContract(adapter, { role: 'checkbox', sizeToken: '--checkbox-size' });

  const mounted: Mounted<CheckboxFieldContractProps>[] = [];
  const fixtures: HTMLElement[] = [];
  async function mount(props: CheckboxFieldContractProps = {}, options?: MountOptions) {
    const control = await adapter({ label: 'Select all', ...props }, options);
    mounted.push(control);
    return control;
  }
  afterEach(async () => {
    for (const control of mounted.splice(0)) {
      await control.unmount();
    }
    for (const fixture of fixtures.splice(0)) {
      fixture.remove();
    }
  });

  const mark = (control: Mounted<CheckboxFieldContractProps>, which: 'check' | 'mixed') => {
    const root = control.part('mark');
    const icon = root.querySelector(`[class*="mark-${which}"]`);
    return icon instanceof HTMLElement && getComputedStyle(icon).display !== 'none';
  };

  it('shows a check while checked and nothing while clear', async () => {
    const control = await mount({ defaultChecked: true });
    expect(mark(control, 'check')).toBe(true);
    expect(mark(control, 'mixed')).toBe(false);
    await page.elementLocator(checkboxOf(control)).click();
    expect(mark(control, 'check')).toBe(false);
  });

  it('shows the mixed state as a dash, and a click ends it', async () => {
    const control = await mount({ indeterminate: true });
    const input = checkboxOf(control);
    expect(input.indeterminate).toBe(true);
    expect(mark(control, 'mixed')).toBe(true);
    expect((await control.accessibleTree()).find((node) => node.role === 'checkbox')).toBeDefined();
    await page.elementLocator(input).click();
    expect(input.indeterminate).toBe(false);
    expect(input.checked).toBe(true);
    expect(mark(control, 'check')).toBe(true);
    expect(mark(control, 'mixed')).toBe(false);
  });

  it('keeps the mixed state through a reset, as a native checkbox does', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const control = await mount({ indeterminate: true }, { parent: fieldset });
    form.reset();
    await expect.poll(() => checkboxOf(control).checked).toBe(false);
    expect(checkboxOf(control).indeterminate).toBe(true);
  });

  it('blocks a submission until a required box is checked', async () => {
    const { form, fieldset, submitted } = formFixture(fixtures);
    const control = await mount({ name: 'terms', required: true }, { parent: fieldset });
    form.requestSubmit();
    expect(submitted).not.toHaveBeenCalled();
    expect(form.checkValidity()).toBe(false);
    const element = control.element as HTMLElement & { validity?: ValidityState };
    expect((element.validity ?? checkboxOf(control).validity).valueMissing).toBe(true);
    await page.elementLocator(checkboxOf(control)).click();
    form.requestSubmit();
    expect(submitted).toHaveBeenCalledExactlyOnceWith(null, [['terms', 'on']]);
  });
}
