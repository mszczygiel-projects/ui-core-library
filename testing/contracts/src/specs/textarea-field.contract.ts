import type { TextareaFieldProps } from '@mszczygiel-projects/ui-core-shared/textarea-field';
import { afterEach, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { pixels, tokenNumber, tokenValue } from '../tokens.ts';
import {
  controlOf,
  formFixture,
  textControlContract,
  type TextControlContractProps,
} from './text-control.contract.ts';

/** The props of the specification, plus what each harness translates. */
export interface TextareaFieldContractProps extends TextareaFieldProps, TextControlContractProps {}

/** The behaviour of TextareaField, applied unchanged to the web component and the React component. */
export function textareaFieldContract(adapter: Mount<TextareaFieldContractProps>): void {
  textControlContract(adapter, { role: 'textbox' });

  const mounted: Mounted<TextareaFieldContractProps>[] = [];
  const fixtures: HTMLElement[] = [];
  async function mount(props: TextareaFieldContractProps = {}, options?: MountOptions) {
    const field = await adapter({ label: 'Message', ...props }, options);
    mounted.push(field);
    return field;
  }
  afterEach(async () => {
    for (const field of mounted.splice(0)) {
      await field.unmount();
    }
    for (const fixture of fixtures.splice(0)) {
      fixture.remove();
    }
  });

  const lineHeight = (field: Mounted<TextareaFieldContractProps>) =>
    Number.parseFloat(getComputedStyle(controlOf(field)).lineHeight);

  it('is a multi-line textbox whose Enter starts a line and never submits', async () => {
    const { fieldset, submitted } = formFixture(fixtures);
    const field = await mount({ name: 'message' }, { parent: fieldset });
    expect(controlOf(field)).toBeInstanceOf(HTMLTextAreaElement);
    await page.elementLocator(controlOf(field)).click();
    await userEvent.keyboard('One{Enter}Two');
    expect(controlOf(field).value).toBe('One\nTwo');
    expect(submitted).not.toHaveBeenCalled();
  });

  it('keeps the designed minimum height in every size and density', async () => {
    for (const density of ['comfortable', 'compact'] as const) {
      for (const size of ['small', 'medium', 'large'] as const) {
        const field = await mount({ size }, { density });
        const name = size === 'medium' ? '--textarea-min-height' : `--textarea-${size}-min-height`;
        expect(field.part('control').getBoundingClientRect().height).toBeCloseTo(
          pixels(tokenValue(name, { density })),
        );
        await field.unmount();
      }
    }
  });

  it('lets the user drag the height only with resize vertical', async () => {
    const field = await mount();
    expect(getComputedStyle(controlOf(field)).resize).toBe('vertical');
    await field.update({ resize: 'none' });
    expect(getComputedStyle(controlOf(field)).resize).toBe('none');
    await field.update({ resize: 'unsupported' } as unknown as TextareaFieldContractProps);
    expect(getComputedStyle(controlOf(field)).resize).toBe('vertical');
  });

  it('grows with its content and its width, up to maxRows, with resize auto', async () => {
    const box = document.createElement('div');
    box.style.inlineSize = '20rem';
    document.body.append(box);
    fixtures.push(box);
    const field = await mount({ resize: 'auto' }, { parent: box });
    const height = () => controlOf(field).getBoundingClientRect().height;
    const empty = height();
    expect(getComputedStyle(controlOf(field)).resize).toBe('none');
    await page.elementLocator(controlOf(field)).click();
    await userEvent.keyboard('1{Enter}2{Enter}3{Enter}4{Enter}5{Enter}6{Enter}7');
    const grown = height();
    expect(grown).toBeGreaterThan(empty);
    expect(controlOf(field).scrollHeight).toBeLessThanOrEqual(Math.ceil(grown));
    await page.elementLocator(controlOf(field)).fill('word '.repeat(40));
    const wide = height();
    box.style.inlineSize = '10rem';
    await expect.poll(height).toBeGreaterThan(wide);
    await field.update({ maxRows: 3 });
    await expect.poll(height).toBeCloseTo(lineHeight(field) * 3, 0);
    expect(controlOf(field).scrollHeight).toBeGreaterThan(height());
  });

  it('measures its height again after a form reset with resize auto', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const field = await mount({ resize: 'auto' }, { parent: fieldset });
    const height = () => controlOf(field).getBoundingClientRect().height;
    const empty = height();
    await page.elementLocator(controlOf(field)).click();
    await userEvent.keyboard('1{Enter}2{Enter}3{Enter}4{Enter}5{Enter}6');
    expect(height()).toBeGreaterThan(empty);
    form.reset();
    await expect.poll(height).toBeCloseTo(empty, 0);
  });

  it('follows sizes and density with the control tokens', async () => {
    for (const density of ['comfortable', 'compact'] as const) {
      for (const size of ['small', 'medium', 'large'] as const) {
        const field = await mount({ size }, { density });
        const prefix = size === 'medium' ? '--control-' : `--control-${size}-`;
        expect(Number.parseFloat(getComputedStyle(controlOf(field)).fontSize)).toBe(
          pixels(tokenValue(`${prefix}font-size`, { density })),
        );
        expect(lineHeight(field)).toBeCloseTo(tokenNumber(`${prefix}line-height`, { density }));
        await field.unmount();
      }
    }
  });
}
