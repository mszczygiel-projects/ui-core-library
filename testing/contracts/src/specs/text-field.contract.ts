import type {
  TextFieldProps,
  TextFieldValueChangeDetails,
} from '@mszczygiel-projects/ui-core-shared/text-field';
import { afterEach, expect, it, vi } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';

import { appearance } from '../appearance.ts';
import { type Mount, type Mounted, type MountOptions } from '../harness/types.ts';
import { pixels, tokenNumber, tokenValue } from '../tokens.ts';

/**
 * The props of the specification, plus what each harness translates: the initial value, the
 * value callback and decorative icons as flags.
 */
export interface TextFieldContractProps extends TextFieldProps {
  readonly defaultValue?: string;
  readonly leadingIcon?: boolean;
  readonly trailingIcon?: boolean;
  readonly onValueChange?: (value: string, details: TextFieldValueChangeDetails<Event>) => void;
}

function inputOf(field: Mounted<TextFieldContractProps>): HTMLInputElement {
  const input = field.part('input');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('TextField must contain a native input');
  }
  return input;
}

/** WCAG relative luminance for browser-computed opaque colours. */
function contrast(first: string, second: string): number {
  const luminance = (color: string) => {
    const rgb = color
      .match(/[\d.]+/g)
      ?.slice(0, 3)
      .map(Number);
    if (rgb?.length !== 3) {
      throw new Error(`Invalid computed colour: ${color}`);
    }
    return rgb.reduce((sum, channel, index) => {
      const value = channel / 255;
      return (
        sum +
        (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4) *
          ([0.2126, 0.7152, 0.0722][index] ?? 0)
      );
    }, 0);
  };
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** One contract for both native implementations. */
export function textFieldContract(adapter: Mount<TextFieldContractProps>): void {
  const mounted: Mounted<TextFieldContractProps>[] = [];
  const fixtures: HTMLElement[] = [];
  async function mount(props: TextFieldContractProps = {}, options?: MountOptions) {
    const field = await adapter({ label: 'Account name', ...props }, options);
    mounted.push(field);
    return field;
  }
  function formFixture() {
    const form = document.createElement('form');
    const fieldset = document.createElement('fieldset');
    form.append(fieldset);
    document.body.append(form);
    fixtures.push(form);
    const submitted = vi.fn();
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted(event.submitter, [...new FormData(form, event.submitter)]);
    });
    return { form, fieldset, submitted };
  }
  afterEach(async () => {
    for (const field of mounted.splice(0)) {
      await field.unmount();
    }
    for (const fixture of fixtures.splice(0)) {
      fixture.remove();
    }
  });

  it('uses the documented defaults and falls back after invalid runtime settings', async () => {
    const defaults = await mount();
    const explicit = await mount({
      variant: 'outline',
      size: 'medium',
      labelPlacement: 'top',
      state: 'default',
      type: 'text',
    });
    const input = inputOf(defaults);
    const compare = () => {
      for (const part of ['input', 'label', 'control']) {
        expect(appearance(defaults.part(part))).toEqual(appearance(explicit.part(part)));
      }
      expect(input.type).toBe('text');
    };
    compare();
    expect(input.value).toBe('');
    expect(input.disabled).toBe(false);
    expect(input.readOnly).toBe(false);
    expect(input.required).toBe(false);
    for (const value of ['unsupported', null, 42]) {
      await defaults.update({
        variant: value,
        size: value,
        labelPlacement: value,
        state: value,
        type: value,
      } as unknown as TextFieldContractProps);
      compare();
    }
  });

  it('has one named textbox, decorative icons and a connected hint', async () => {
    const field = await mount({
      hint: 'Use your work account',
      leadingIcon: true,
      trailingIcon: true,
    });
    const tree = await field.accessibleTree();
    const boxes = tree.filter((node) => node.role === 'textbox');
    expect(boxes).toHaveLength(1);
    expect(boxes[0]?.description).toBe('Use your work account');
    expect(boxes[0]?.name).toBe(
      tokenValue('--control-label-text-uppercase') === 'uppercase'
        ? 'ACCOUNT NAME'
        : 'Account name',
    );
    expect(tree.some((node) => node.role === 'form' || node.name === 'Decorative star')).toBe(
      false,
    );
    const input = inputOf(field);
    expect(input.getAttribute('aria-describedby')).toBe(field.part('hint').id);
    expect(field.part('hint').textContent).toBe('Use your work account');
    await page.elementLocator(field.part('label')).click();
    expect(input.matches(':focus')).toBe(true);
  });

  it('hides the whole field with the hidden attribute', async () => {
    const field = await mount(
      { hint: 'Use your work account' },
      { attributes: { hidden: 'hidden' } },
    );
    expect(getComputedStyle(field.element).display).toBe('none');
    expect((await field.accessibleTree()).some((node) => node.role === 'textbox')).toBe(false);
  });

  it('lets an author replace the accessible name', async () => {
    const field = await mount({}, { attributes: { 'aria-label': 'Author name' } });
    expect((await field.accessibleTree()).find((node) => node.role === 'textbox')?.name).toBe(
      'Author name',
    );
  });

  it('emits one input and one value callback per edit, and one change on commit', async () => {
    const changed = vi.fn<NonNullable<TextFieldContractProps['onValueChange']>>();
    const field = await mount({ onValueChange: changed });
    const inputEvents = vi.fn();
    const changeEvents = vi.fn();
    field.element.addEventListener('input', inputEvents);
    field.element.addEventListener('change', changeEvents);
    await page.elementLocator(inputOf(field)).fill('Ada');
    expect(inputEvents).toHaveBeenCalledOnce();
    expect(changed).toHaveBeenCalledOnce();
    expect(changed.mock.calls[0]?.[0]).toBe('Ada');
    expect(changed.mock.calls[0]?.[1].originalEvent).toBeInstanceOf(Event);
    await userEvent.tab();
    expect(changeEvents).toHaveBeenCalledOnce();
  });

  it('submits the current string and resets to the initial value without an edit event', async () => {
    const { form, fieldset } = formFixture();
    const changed = vi.fn<NonNullable<TextFieldContractProps['onValueChange']>>();
    const field = await mount(
      { name: 'account', defaultValue: 'Initial', onValueChange: changed },
      { parent: fieldset },
    );
    await page.elementLocator(inputOf(field)).fill('Edited');
    expect([...new FormData(form)]).toEqual([['account', 'Edited']]);
    changed.mockClear();
    form.reset();
    await expect.poll(() => inputOf(field).value).toBe('Initial');
    expect([...new FormData(form)]).toEqual([['account', 'Initial']]);
    expect(changed).not.toHaveBeenCalled();
  });

  it('keeps sanitized values in form data after an unedited reset', async () => {
    const { form, fieldset } = formFixture();
    const field = await mount(
      { name: 'email', type: 'email', defaultValue: ' ada@example.com ' },
      { parent: fieldset },
    );
    expect(inputOf(field).value).toBe('ada@example.com');
    expect(new FormData(form).get('email')).toBe(inputOf(field).value);
    form.reset();
    expect(new FormData(form).get('email')).toBe(inputOf(field).value);
    await field.update({});
    expect(new FormData(form).get('email')).toBe(inputOf(field).value);
    expect(form.checkValidity()).toBe(true);
  });

  it('tracks fieldset disabling, own disabling and readonly submission', async () => {
    const { form, fieldset } = formFixture();
    const field = await mount(
      { name: 'account', defaultValue: 'Ada', required: true },
      { parent: fieldset },
    );
    fieldset.disabled = true;
    await expect.poll(() => inputOf(field).matches(':disabled')).toBe(true);
    expect([...new FormData(form)]).toEqual([]);
    fieldset.disabled = false;
    await expect.poll(() => inputOf(field).matches(':disabled')).toBe(false);
    await field.update({ disabled: true });
    expect([...new FormData(form)]).toEqual([]);
    await field.update({ disabled: false, readOnly: true });
    expect(inputOf(field).readOnly).toBe(true);
    expect([...new FormData(form)]).toEqual([['account', 'Ada']]);
    expect(form.checkValidity()).toBe(true);
  });

  it('blocks invalid required, type and pattern values in the owning form', async () => {
    const { form, fieldset, submitted } = formFixture();
    const field = await mount(
      { name: 'account', required: true, type: 'email' },
      { parent: fieldset },
    );
    form.requestSubmit();
    expect(submitted).not.toHaveBeenCalled();
    expect(form.checkValidity()).toBe(false);
    await page.elementLocator(inputOf(field)).fill('invalid');
    expect(form.checkValidity()).toBe(false);
    await page.elementLocator(inputOf(field)).fill('ada@example.com');
    expect(form.checkValidity()).toBe(true);
    await field.update({ pattern: '.+@work\\.example' });
    expect(form.checkValidity()).toBe(false);
    await page.elementLocator(inputOf(field)).fill('ada@work.example');
    form.requestSubmit();
    expect(submitted).toHaveBeenCalledOnce();
  });

  it('uses native user-entered length constraints', async () => {
    const { form, fieldset } = formFixture();
    const field = await mount({ minLength: 3, maxLength: 5 }, { parent: fieldset });
    await page.elementLocator(inputOf(field)).click();
    await userEvent.keyboard('ab');
    expect(form.checkValidity()).toBe(false);
    await userEvent.keyboard('cdef');
    expect(inputOf(field).value).toBe('abcde');
    expect(form.checkValidity()).toBe(true);
  });

  it('keeps visual feedback separate from native validity', async () => {
    const { form, fieldset } = formFixture();
    const field = await mount({ state: 'error', hint: 'Check this account' }, { parent: fieldset });
    expect(inputOf(field).getAttribute('aria-invalid')).toBe('true');
    expect(form.checkValidity()).toBe(true);
    await field.update({ state: 'default', required: true });
    expect(inputOf(field).hasAttribute('aria-invalid')).toBe(false);
    expect(form.checkValidity()).toBe(false);
  });

  it('activates the native default submitter on Enter and respects a cancelled key', async () => {
    const { form, fieldset, submitted } = formFixture();
    const field = await mount({ name: 'account', defaultValue: 'Ada' }, { parent: fieldset });
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.name = 'action';
    submit.value = 'save';
    form.append(submit);
    await page.elementLocator(inputOf(field)).click();
    await userEvent.keyboard('{Enter}');
    expect(submitted).toHaveBeenCalledExactlyOnceWith(submit, [
      ['account', 'Ada'],
      ['action', 'save'],
    ]);
    form.addEventListener('keydown', (event) => {
      event.preventDefault();
    });
    await userEvent.keyboard('{Enter}');
    expect(submitted).toHaveBeenCalledOnce();
  });

  it('does not bypass a disabled default submitter or a cancelled submitter click', async () => {
    const { form, fieldset, submitted } = formFixture();
    const field = await mount({}, { parent: fieldset });
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.disabled = true;
    form.append(submit);
    await page.elementLocator(inputOf(field)).click();
    await userEvent.keyboard('{Enter}');
    expect(submitted).not.toHaveBeenCalled();
    submit.disabled = false;
    submit.addEventListener('click', (event) => {
      event.preventDefault();
    });
    await userEvent.keyboard('{Enter}');
    expect(submitted).not.toHaveBeenCalled();
  });

  it('submits one field without a submitter but not a multi-field form', async () => {
    const { fieldset, submitted } = formFixture();
    const field = await mount({}, { parent: fieldset });
    await page.elementLocator(inputOf(field)).click();
    await userEvent.keyboard('{Enter}');
    expect(submitted).toHaveBeenCalledExactlyOnceWith(null, []);
    await mount({ label: 'Second field' }, { parent: fieldset });
    await page.elementLocator(inputOf(field)).click();
    await userEvent.keyboard('{Enter}');
    expect(submitted).toHaveBeenCalledOnce();
  });

  it('blocks implicit submission from native peers in mixed forms without a submitter', async () => {
    const { form, fieldset, submitted } = formFixture();
    const field = await mount({ name: 'account', defaultValue: 'Ada' }, { parent: fieldset });
    const native = document.createElement('input');
    native.name = 'other';
    native.value = 'Other';
    form.append(native);
    await page.elementLocator(native).click();
    await userEvent.keyboard('{Enter}');
    expect(submitted).not.toHaveBeenCalled();
    await page.elementLocator(inputOf(field)).click();
    await userEvent.keyboard('{Enter}');
    expect(submitted).not.toHaveBeenCalled();
    form.id = 'mixed-form';
    native.setAttribute('form', form.id);
    document.body.append(native);
    fixtures.push(native);
    await page.elementLocator(native).click();
    await userEvent.keyboard('{Enter}');
    expect(submitted).not.toHaveBeenCalled();
    const other = formFixture();
    other.form.id = 'other-form';
    native.setAttribute('form', other.form.id);
    await userEvent.keyboard('{Enter}');
    expect(other.submitted).toHaveBeenCalledOnce();
    expect(submitted).not.toHaveBeenCalled();
    native.setAttribute('form', form.id);
    form.requestSubmit();
    expect(submitted).toHaveBeenCalledOnce();
    submitted.mockClear();
    const submitter = document.createElement('button');
    submitter.type = 'submit';
    form.append(submitter);
    await page.elementLocator(native).click();
    await userEvent.keyboard('{Enter}');
    expect(submitted).toHaveBeenCalledOnce();
    submitted.mockClear();
    submitter.disabled = true;
    await userEvent.keyboard('{Enter}');
    expect(submitted).not.toHaveBeenCalled();
    submitter.remove();
    await field.unmount();
    await userEvent.keyboard('{Enter}');
    expect(submitted).toHaveBeenCalledOnce();
  });

  it('raises a floating label for focus, edits, reset and programmatic values', async () => {
    const { form, fieldset } = formFixture();
    const field = await mount(
      { labelPlacement: 'floating', placeholder: 'Example', defaultValue: '' },
      { parent: fieldset },
    );
    const raised = () =>
      field.part('label').getBoundingClientRect().top <
      field.part('control').getBoundingClientRect().top;
    expect(raised()).toBe(false);
    expect(getComputedStyle(inputOf(field), '::placeholder').color).toBe('rgba(0, 0, 0, 0)');
    await page.elementLocator(inputOf(field)).click();
    await expect.poll(raised).toBe(true);
    await page.elementLocator(inputOf(field)).fill('Ada');
    await userEvent.tab();
    await expect.poll(raised).toBe(true);
    form.reset();
    await expect.poll(raised).toBe(false);
    const controlled = await mount({
      value: '',
      labelPlacement: 'floating',
      onValueChange: vi.fn(),
    });
    await controlled.update({ value: 'Programmatic' });
    await expect
      .poll(() => controlled.part('label').getBoundingClientRect().top)
      .toBeLessThan(controlled.part('control').getBoundingClientRect().top);
  });

  it('keeps a resting floating label clear of the trailing icon', async () => {
    const box = document.createElement('div');
    box.style.inlineSize = '15rem';
    document.body.append(box);
    fixtures.push(box);
    const field = await mount(
      {
        labelPlacement: 'floating',
        label: 'A label long enough to reach the trailing icon',
        trailingIcon: true,
      },
      { parent: box },
    );
    expect(field.part('label').getBoundingClientRect().right).toBeLessThanOrEqual(
      field.part('trailing-icon').getBoundingClientRect().left,
    );
  });

  it('animates the floating label between its resting and raised positions', async () => {
    await commands.emulateMedia({ reducedMotion: 'no-preference' });
    const field = await mount({ labelPlacement: 'floating' });
    const label = field.part('label');
    const rest = label.getBoundingClientRect().top;
    expect(Number.parseFloat(getComputedStyle(label).transitionDuration) * 1000).toBe(
      Number.parseFloat(tokenValue('--duration-150')),
    );
    expect(getComputedStyle(label).transitionProperty).toContain('transform');
    await field.update({ value: 'Ada' });
    await expect.poll(() => label.getAnimations().length).toBeGreaterThan(0);
    await Promise.all(label.getAnimations().map((animation) => animation.finished));
    expect(label.getBoundingClientRect().top).toBeLessThan(rest);
    await field.update({ value: '' });
    await expect.poll(() => label.getAnimations().length).toBeGreaterThan(0);
    await Promise.all(label.getAnimations().map((animation) => animation.finished));
    expect(label.getBoundingClientRect().top).toBeCloseTo(rest);
  });

  it('uses the focus roles and the underlined label alignment from the design notes', async () => {
    for (const variant of ['outline', 'filled', 'underlined'] as const) {
      const field = await mount({ variant, labelPlacement: 'floating', defaultValue: 'Ada' });
      await page.elementLocator(inputOf(field)).click();
      const control = field.part('control');
      expect(Number.parseFloat(getComputedStyle(field.part('label')).top)).toBe(
        -pixels(tokenValue('--control-label-floating-padding-inline')),
      );
      expect(Number.parseFloat(getComputedStyle(field.part('label')).lineHeight)).toBeCloseTo(
        tokenNumber('--control-label-floating-line-height'),
      );
      if (variant === 'underlined') {
        expect(getComputedStyle(control).outlineStyle).toBe('none');
        expect(Number.parseFloat(getComputedStyle(control, '::before').borderBottomWidth)).toBe(
          pixels(tokenValue('--ring-width')),
        );
        expect(field.part('label').getBoundingClientRect().left).toBe(
          control.getBoundingClientRect().left,
        );
        expect(getComputedStyle(field.part('label')).paddingInlineStart).toBe('0px');
      } else {
        expect(Number.parseFloat(getComputedStyle(control).outlineWidth)).toBe(
          pixels(tokenValue('--ring-width')),
        );
        expect(getComputedStyle(field.part('label')).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      }
    }
  });

  it('follows sizes, density and RTL using the control tokens', async () => {
    for (const density of ['comfortable', 'compact'] as const) {
      for (const size of ['small', 'medium', 'large'] as const) {
        const field = await mount(
          { size, labelPlacement: 'inner', leadingIcon: true, trailingIcon: true },
          { density, dir: 'rtl' },
        );
        const prefix = size === 'medium' ? '--control-' : `--control-${size}-`;
        expect(Number.parseFloat(getComputedStyle(inputOf(field)).fontSize)).toBe(
          pixels(tokenValue(`${prefix}font-size`, { density })),
        );
        expect(Number.parseFloat(getComputedStyle(field.part('control')).paddingBlockStart)).toBe(
          pixels(tokenValue(`${prefix}padding-stack`, { density })),
        );
        expect(field.part('leading-icon').getBoundingClientRect().left).toBeGreaterThan(
          inputOf(field).getBoundingClientRect().left,
        );
        const icon = field.part('trailing-icon').getBoundingClientRect();
        const input = inputOf(field).getBoundingClientRect();
        const control = field.part('control');
        expect(icon.top + icon.height / 2).toBeCloseTo(input.top + input.height / 2);
        expect(icon.left - control.getBoundingClientRect().left).toBeCloseTo(
          Number.parseFloat(getComputedStyle(control).paddingInlineEnd),
        );
      }
    }
  });

  it('matches the designed line and control heights in every size and density', async () => {
    for (const density of ['comfortable', 'compact'] as const) {
      for (const size of ['small', 'medium', 'large'] as const) {
        for (const labelPlacement of ['top', 'floating', 'inner'] as const) {
          const field = await mount({ size, labelPlacement, defaultValue: 'Ada' }, { density });
          const prefix = size === 'medium' ? '--control-' : `--control-${size}-`;
          const line = tokenNumber(`${prefix}line-height`, { density });
          const padding = pixels(tokenValue(`${prefix}padding-stack`, { density }));
          const inner =
            labelPlacement === 'inner'
              ? tokenNumber('--control-label-inner-line-height', { density }) +
                pixels(tokenValue('--control-label-inner-gap', { density }))
              : 0;
          expect(Number.parseFloat(getComputedStyle(inputOf(field)).lineHeight)).toBeCloseTo(line);
          expect(field.part('control').getBoundingClientRect().height).toBeCloseTo(
            line + padding * 2 + inner,
          );
        }
      }
    }
  });

  it('preserves the focus indicator in forced colours and respects reduced motion', async () => {
    await commands.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    const field = await mount({ variant: 'underlined', labelPlacement: 'floating' });
    await page.elementLocator(inputOf(field)).click();
    const stroke = getComputedStyle(field.part('control'), '::before');
    expect(stroke.borderBottomStyle).toBe('solid');
    expect(Number.parseFloat(stroke.borderBottomWidth)).toBe(pixels(tokenValue('--ring-width')));
    expect(getComputedStyle(field.part('label')).transitionDuration).toBe('0s');
  });
  it('retains native text editing and does not submit a composing Enter', async () => {
    const { fieldset, submitted } = formFixture();
    const field = await mount({ defaultValue: 'Ada' }, { parent: fieldset });
    const input = inputOf(field);
    await page.elementLocator(input).click();
    await userEvent.keyboard('{End}{ArrowLeft}{Backspace}');
    expect(input.value).toBe('Aa');
    input.dispatchEvent(
      new CompositionEvent('compositionstart', { bubbles: true, composed: true }),
    );
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        isComposing: true,
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
    input.dispatchEvent(
      new CompositionEvent('compositionend', { bubbles: true, composed: true, data: '漢' }),
    );
    expect(submitted).not.toHaveBeenCalled();
  });

  it('keeps text, placeholders, labels, hints and borders legible on every theme and surface', async () => {
    for (const theme of ['light', 'dark'] as const) {
      for (const surface of ['default', 'subtle', 'inverse', 'primary'] as const) {
        for (const variant of ['outline', 'filled', 'underlined'] as const) {
          for (const state of ['default', 'error', 'success'] as const) {
            const context = { theme, surface };
            const field = await mount(
              { variant, state, labelPlacement: 'inner', hint: 'Feedback', placeholder: 'Example' },
              context,
            );
            const probe = document.createElement('span');
            probe.style.color = tokenValue('--color-background-default', context);
            document.body.append(probe);
            const outer = getComputedStyle(probe).color;
            probe.remove();
            const control = field.part('control');
            const fill = getComputedStyle(control).backgroundColor;
            const background = /^rgba\(.*?,\s*0\)$/.test(fill) ? outer : fill;
            const message = `${theme}/${surface}/${variant}/${state}`;
            expect(
              contrast(getComputedStyle(inputOf(field)).color, background),
              message + '/text',
            ).toBeGreaterThanOrEqual(4.5);
            expect(
              contrast(getComputedStyle(inputOf(field), '::placeholder').color, background),
              message + '/placeholder',
            ).toBeGreaterThanOrEqual(4.5);
            expect(
              contrast(getComputedStyle(field.part('label')).color, background),
              message + '/label',
            ).toBeGreaterThanOrEqual(4.5);
            expect(
              contrast(getComputedStyle(field.part('hint')).color, outer),
              message + '/hint',
            ).toBeGreaterThanOrEqual(4.5);
            expect(
              contrast(getComputedStyle(control, '::before').borderBottomColor, outer),
              message + '/border',
            ).toBeGreaterThanOrEqual(3);
          }
        }
      }
    }
  });
}
