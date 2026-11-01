import {
  configureUiCore,
  resetUiCoreConfig,
} from '@mszczygiel-projects/ui-core-foundations/config';
import type {
  NumberFieldProps,
  NumberFieldValueChangeDetails,
} from '@mszczygiel-projects/ui-core-shared/number-field';
import { afterEach, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { pseudoLabels } from '../pseudo.ts';
import { parsedFieldAppearanceContract } from './parsed-field-appearance.contract.ts';

/** Shared props with event and default-value adapters only. */
export interface NumberFieldContractProps extends NumberFieldProps {
  readonly defaultValue?: number | null;
  readonly onValueChange?: (
    value: number | null,
    details: NumberFieldValueChangeDetails<Event>,
  ) => void;
}

/** Runs unchanged against each native implementation. */
export function numberFieldContract(adapter: Mount<NumberFieldContractProps>): void {
  parsedFieldAppearanceContract(adapter, { controls: 'inline' }, 'increment');
  const mounted: Mounted<NumberFieldContractProps>[] = [];
  const fixtures: HTMLElement[] = [];
  async function mount(props: NumberFieldContractProps = {}, options?: MountOptions) {
    const field = await adapter({ label: 'Entry', locale: 'pl-PL', ...props }, options);
    mounted.push(field);
    return field;
  }
  function input(field: Mounted<NumberFieldContractProps>): HTMLInputElement {
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
      { name: 'entry', defaultValue: 12.5, step: 0.1, onValueChange: changed },
      { parent: node },
    );
    expect(input(field).value).toBe('12,5');
    expect([...new FormData(node)]).toEqual([['entry', '12.5']]);
    await page.elementLocator(input(field)).fill('23,5');
    expect(changed).toHaveBeenCalledOnce();
    changed.mockClear();
    node.reset();
    await expect.poll(() => input(field).value).toBe('12,5');
    expect([...new FormData(node)]).toEqual([['entry', '12.5']]);
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
      { name: 'entry', defaultValue: 12, onValueChange: changed },
      { parent: node },
    );
    await page.elementLocator(input(field)).fill('12,');
    expect(input(field).value).toBe('12,');
    expect(changed).toHaveBeenCalledExactlyOnceWith(
      null,
      expect.objectContaining({
        text: '12,',
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
    const field = await mount({ name: 'entry', max: 10 }, { parent: node });
    await page.elementLocator(input(field)).fill('12');
    expect(input(field).value).toBe('12');
    expect(input(field).validity.customError).toBe(true);
    expect(new FormData(node).get('entry')).toBe('12');
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
    const field = await mount({ defaultValue: 12 }, { parent: node });
    await page.elementLocator(input(field)).fill('23');
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
    expect(input(field).value).toBe('23');
  });

  it('uses prop locale before configuration and does not notify on a format change', async () => {
    configureUiCore({ locale: 'en-US' });
    const changed = vi.fn();
    const field = await mount({ defaultValue: 12.5, onValueChange: changed });
    expect(input(field).value).toBe('12,5');
    await field.update({ locale: undefined });
    await expect.poll(() => input(field).value).toBe('12.5');
    expect(changed).not.toHaveBeenCalled();
  });

  it('exposes a named spinbutton and its description', async () => {
    const field = await mount({ hint: 'Enter the value' });
    expect(await field.accessibleTree()).toContainEqual(
      expect.objectContaining({
        role: 'spinbutton',
        name: 'ENTRY',
        description: 'Enter the value',
      }),
    );
  });

  it('steps with keyboard and buttons once, without drift, and stops at the bound', async () => {
    const changed = vi.fn();
    const field = await mount({
      defaultValue: 0,
      step: 0.1,
      max: 1,
      controls: 'inline',
      onValueChange: changed,
    });
    await page.elementLocator(input(field)).click();
    await userEvent.keyboard(
      '{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}',
    );
    await page.elementLocator(field.part('increment')).click();
    expect(input(field).value).toBe('1');
    expect(changed).toHaveBeenCalledTimes(10);
    expect(field.part('increment').matches(':disabled')).toBe(true);
    field.part('decrement').focus();
    await userEvent.keyboard(' ');
    expect(input(field).value).toBe('0,9');
  });

  it('uses finite Home and End bounds without taking modified editing keys', async () => {
    const field = await mount({ defaultValue: 5, min: 1, max: 10 });
    await page.elementLocator(input(field)).click();
    await userEvent.keyboard('{Home}');
    expect(input(field).value).toBe('1');
    await userEvent.keyboard('{End}');
    expect(input(field).value).toBe('10');
  });

  it('takes the allowed value inside a bound that is off the step grid', async () => {
    const field = await mount({ defaultValue: 5, min: 0, max: 12, step: 5 });
    await page.elementLocator(input(field)).click();
    await userEvent.keyboard('{End}');
    expect(input(field).value).toBe('10');
    expect(input(field).validity.valid).toBe(true);
  });

  it('keeps unfinished text when a step key or button is used', async () => {
    const changed = vi.fn();
    const field = await mount({ controls: 'inline', max: 10, onValueChange: changed });
    await page.elementLocator(input(field)).fill('12,');
    changed.mockClear();
    await userEvent.keyboard('{ArrowUp}{End}');
    expect(input(field).value).toBe('12,');
    expect(field.part('increment').matches(':disabled')).toBe(true);
    expect(changed).not.toHaveBeenCalled();
  });

  it('reports a composed edit once, after composition ends', async () => {
    const changed = vi.fn();
    const field = await mount({ onValueChange: changed });
    const node = input(field);
    node.focus();
    node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, composed: true }));
    for (const text of ['1', '12']) {
      node.value = text;
      node.dispatchEvent(
        new InputEvent('input', { bubbles: true, composed: true, isComposing: true }),
      );
    }
    expect(changed).not.toHaveBeenCalled();
    node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, composed: true }));
    // Some browsers repeat the result as an input event after compositionend.
    node.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
    await expect.poll(() => changed.mock.calls.length).toBe(1);
    expect(changed.mock.calls[0]?.[0]).toBe(12);
    expect(node.value).toBe('12');
  });

  it('keeps the editing grammar stable through configuration changes and preserves partial input', async () => {
    const changed = vi.fn();
    configureUiCore({ locale: 'pl-PL' });
    const field = await mount({
      locale: undefined,
      defaultValue: 12.5,
      onValueChange: changed,
      step: 0.1,
    });
    await page.elementLocator(input(field)).click();
    configureUiCore({ locale: 'en-US' });
    await field.update({ hint: 'Updated' });
    expect(input(field).value).toBe('12,5');
    input(field).blur();
    await expect.poll(() => input(field).value).toBe('12.5');
    expect(changed).not.toHaveBeenCalled();
    await field.update({ locale: 'pl-PL' });
    await page.elementLocator(input(field)).fill('12,');
    await field.update({ locale: 'en-US' });
    input(field).blur();
    await expect.poll(() => input(field).value).toBe('12,');
    expect(input(field).validity.customError).toBe(true);
    expect(changed).toHaveBeenCalledOnce();
  });

  it('submits the current edit with Enter and leaves IME confirmation to the input', async () => {
    const { node, submit } = form();
    const submitter = document.createElement('button');
    submitter.type = 'submit';
    node.append(submitter);
    const field = await mount({ name: 'entry', step: 0.1 }, { parent: node });
    await page.elementLocator(input(field)).fill('12,5');
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
    expect(new FormData(node).get('entry')).toBe('12.5');
  });

  it('uses complete configured labels and allows per-instance overrides', async () => {
    configureUiCore({ labels: pseudoLabels });
    const field = await mount({ controls: 'inline', max: 2 });
    expect(field.part('increment').getAttribute('aria-label')).toBe(
      pseudoLabels.numberField.increment,
    );
    expect(field.part('decrement').getAttribute('aria-label')).toBe(
      pseudoLabels.numberField.decrement,
    );
    await page.elementLocator(input(field)).fill('3');
    expect(input(field).validationMessage).toBe(
      pseudoLabels.numberField.validationMessage({ reason: 'max', max: 2, locale: 'pl-PL' }),
    );
    await field.update({
      incrementLabel: 'More',
      getValidationMessageLabel: () => 'Outside limits.',
    });
    expect(field.part('increment').getAttribute('aria-label')).toBe('More');
    expect(input(field).validationMessage).toBe('Outside limits.');
  });
}
