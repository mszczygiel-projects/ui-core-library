import type { RadioFieldProps } from '@mszczygiel-projects/ui-core-shared/radio-field';
import { afterEach, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import type { Mount, Mounted } from '../harness/types.ts';
import { checkboxOf } from './choice.contract.ts';
import { formFixture } from './text-control.contract.ts';

/** The props of the specification. */
export type RadioFieldContractProps = RadioFieldProps;

/**
 * The behaviour of RadioField on its own, applied unchanged to the web component and the React
 * component. Its behaviour in a group belongs to the contract of RadioGroup.
 */
export function radioFieldContract(adapter: Mount<RadioFieldContractProps>): void {
  const mounted: Mounted<RadioFieldContractProps>[] = [];
  const fixtures: HTMLElement[] = [];
  afterEach(async () => {
    for (const option of mounted.splice(0)) {
      await option.unmount();
    }
    for (const fixture of fixtures.splice(0)) {
      fixture.remove();
    }
  });

  it('is a radio button named by its label and described by its hint', async () => {
    const option = await adapter({ value: 'small', label: 'Small', hint: 'Fits children' });
    mounted.push(option);
    const radio = (await option.accessibleTree()).find((node) => node.role === 'radio');
    expect(radio?.name).toBe('Small');
    expect(radio?.description).toBe('Fits children');
  });

  it('has no state and submits nothing outside a group', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const option = await adapter({ value: 'small', label: 'Small' }, { parent: fieldset });
    mounted.push(option);
    await page.elementLocator(checkboxOf(option)).click();
    await expect.poll(() => checkboxOf(option).checked).toBe(false);
    expect([...new FormData(form)]).toEqual([]);
  });

  it('disables its radio button', async () => {
    const option = await adapter({ value: 'small', label: 'Small', disabled: true });
    mounted.push(option);
    expect(checkboxOf(option).disabled).toBe(true);
  });
}
