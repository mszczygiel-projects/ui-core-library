import type {
  TextControlProps,
  TextFieldValueChangeDetails,
} from '@mszczygiel-projects/ui-core-shared/text-field';
import { afterEach, expect, it, type Mock, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { appearance } from '../appearance.ts';
import { contrastRatio } from '../contrast.ts';
import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { tokenValue } from '../tokens.ts';

/** The props of a text field, plus what each harness translates: the initial value and callback. */
export interface TextControlContractProps extends TextControlProps {
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string, details: TextFieldValueChangeDetails<Event>) => void;
}

/** What differs between the fields that share this contract. */
export interface TextControlContractOptions {
  /** The role of the native control in the accessibility tree. */
  readonly role: 'textbox' | 'searchbox';
  /** A part that must stay legible as a non-text graphic, such as a button in the field. */
  readonly graphic?: string;
  /** Props that make the graphic part render, such as a value for a clear button. */
  readonly graphicProps?: TextControlContractProps;
}

/** The native control of a mounted field. */
export function controlOf(
  field: Mounted<TextControlContractProps>,
): HTMLInputElement | HTMLTextAreaElement {
  const control = field.part('input');
  if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) {
    throw new Error('A text field must contain a native input or textarea');
  }
  return control;
}

/** A form with a fieldset, whose submissions a mock records with the submitter and the entries. */
export function formFixture(fixtures: HTMLElement[]): {
  readonly form: HTMLFormElement;
  readonly fieldset: HTMLFieldSetElement;
  readonly submitted: Mock;
} {
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

/**
 * The behaviour every text field shares with TextField: its name, value, form, validity, visual
 * feedback and legibility. Each field adds its own contract for what it does on top.
 */
export function textControlContract<Props extends TextControlContractProps>(
  adapter: Mount<Props>,
  options: TextControlContractOptions,
): void {
  const mounted: Mounted<Props>[] = [];
  const fixtures: HTMLElement[] = [];
  async function mount(props: TextControlContractProps = {}, mountOptions?: MountOptions) {
    const field = await adapter({ label: 'Account name', ...props } as Props, mountOptions);
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

  it('uses the documented defaults and falls back after invalid runtime settings', async () => {
    const defaults = await mount();
    const explicit = await mount({
      variant: 'outline',
      size: 'medium',
      labelPlacement: 'top',
      state: 'default',
    });
    const compare = () => {
      for (const part of ['input', 'label', 'control']) {
        expect(appearance(defaults.part(part))).toEqual(appearance(explicit.part(part)));
      }
    };
    compare();
    const control = controlOf(defaults);
    expect(control.value).toBe('');
    expect(control.disabled).toBe(false);
    expect(control.readOnly).toBe(false);
    expect(control.required).toBe(false);
    expect(control.placeholder.trim()).toBe('');
    for (const value of ['unsupported', null, 42]) {
      await defaults.update({
        variant: value,
        size: value,
        labelPlacement: value,
        state: value,
      } as unknown as Props);
      compare();
    }
  });

  it('has one named control with a connected hint, and its label focuses it', async () => {
    const field = await mount({ hint: 'Use your work account' });
    const tree = await field.accessibleTree();
    const controls = tree.filter((node) => node.role === options.role);
    expect(controls).toHaveLength(1);
    expect(controls[0]?.description).toBe('Use your work account');
    expect(controls[0]?.name).toBe(
      tokenValue('--control-label-text-uppercase') === 'uppercase'
        ? 'ACCOUNT NAME'
        : 'Account name',
    );
    expect(tree.some((node) => node.role === 'form')).toBe(false);
    await page.elementLocator(field.part('label')).click();
    expect(controlOf(field).matches(':focus')).toBe(true);
  });

  it('hides the whole field with the hidden attribute', async () => {
    const field = await mount({}, { attributes: { hidden: 'hidden' } });
    expect(getComputedStyle(field.element).display).toBe('none');
    expect((await field.accessibleTree()).some((node) => node.role === options.role)).toBe(false);
  });

  it('lets an author replace the accessible name', async () => {
    const field = await mount({ label: '' }, { attributes: { 'aria-label': 'Author name' } });
    expect((await field.accessibleTree()).find((node) => node.role === options.role)?.name).toBe(
      'Author name',
    );
  });

  it('emits one input and one value callback per edit, and one change on commit', async () => {
    const changed = vi.fn<NonNullable<TextControlContractProps['onValueChange']>>();
    const field = await mount({ onValueChange: changed });
    const inputEvents = vi.fn();
    const changeEvents = vi.fn();
    field.element.addEventListener('input', inputEvents);
    field.element.addEventListener('change', changeEvents);
    await page.elementLocator(controlOf(field)).fill('Ada');
    expect(inputEvents).toHaveBeenCalledOnce();
    expect(changed).toHaveBeenCalledExactlyOnceWith('Ada', expect.anything());
    expect(changed.mock.calls[0]?.[1].originalEvent).toBeInstanceOf(Event);
    await userEvent.tab();
    expect(changeEvents).toHaveBeenCalledOnce();
  });

  it('submits the current string and resets to the initial value without an edit event', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const changed = vi.fn<NonNullable<TextControlContractProps['onValueChange']>>();
    const field = await mount(
      { name: 'account', defaultValue: 'Initial', onValueChange: changed },
      { parent: fieldset },
    );
    await page.elementLocator(controlOf(field)).fill('Edited');
    expect([...new FormData(form)]).toEqual([['account', 'Edited']]);
    changed.mockClear();
    form.reset();
    await expect.poll(() => controlOf(field).value).toBe('Initial');
    expect([...new FormData(form)]).toEqual([['account', 'Initial']]);
    expect(changed).not.toHaveBeenCalled();
  });

  it('tracks fieldset disabling, own disabling and readonly submission', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const field = await mount(
      { name: 'account', defaultValue: 'Ada', required: true },
      { parent: fieldset },
    );
    fieldset.disabled = true;
    await expect.poll(() => controlOf(field).matches(':disabled')).toBe(true);
    expect([...new FormData(form)]).toEqual([]);
    fieldset.disabled = false;
    await expect.poll(() => controlOf(field).matches(':disabled')).toBe(false);
    await field.update({ disabled: true } as Partial<Props>);
    expect([...new FormData(form)]).toEqual([]);
    await field.update({ disabled: false, readOnly: true } as Partial<Props>);
    expect(controlOf(field).readOnly).toBe(true);
    expect([...new FormData(form)]).toEqual([['account', 'Ada']]);
    expect(form.checkValidity()).toBe(true);
  });

  it('blocks a submission while a required value is missing', async () => {
    const { form, fieldset, submitted } = formFixture(fixtures);
    const field = await mount({ name: 'account', required: true }, { parent: fieldset });
    form.requestSubmit();
    expect(submitted).not.toHaveBeenCalled();
    expect(form.checkValidity()).toBe(false);
    const element = field.element as HTMLElement & { validity?: ValidityState };
    expect((element.validity ?? controlOf(field).validity).valueMissing).toBe(true);
    await page.elementLocator(controlOf(field)).fill('Ada');
    form.requestSubmit();
    expect(submitted).toHaveBeenCalledExactlyOnceWith(null, [['account', 'Ada']]);
  });

  it('uses native user-entered length constraints', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const field = await mount({ minLength: 3, maxLength: 5 }, { parent: fieldset });
    await page.elementLocator(controlOf(field)).click();
    await userEvent.keyboard('ab');
    expect(form.checkValidity()).toBe(false);
    await userEvent.keyboard('cdef');
    expect(controlOf(field).value).toBe('abcde');
    expect(form.checkValidity()).toBe(true);
  });

  it('sets aria-invalid for the error state, separately from native validity', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const field = await mount({ state: 'error', hint: 'Check this account' }, { parent: fieldset });
    expect(controlOf(field).getAttribute('aria-invalid')).toBe('true');
    expect(form.checkValidity()).toBe(true);
    await field.update({ state: 'default', required: true } as Partial<Props>);
    expect(controlOf(field).hasAttribute('aria-invalid')).toBe(false);
    expect(form.checkValidity()).toBe(false);
  });

  it('raises a floating label for a value and lowers it after a reset', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const field = await mount({ labelPlacement: 'floating' }, { parent: fieldset });
    const raised = () =>
      field.part('label').getBoundingClientRect().top <
      field.part('control').getBoundingClientRect().top;
    expect(raised()).toBe(false);
    await page.elementLocator(controlOf(field)).fill('Ada');
    await userEvent.tab();
    await expect.poll(raised).toBe(true);
    form.reset();
    await expect.poll(raised).toBe(false);
  });

  it('lays out the field in the direction set on the component itself', async () => {
    const field = await mount({}, { attributes: { dir: 'rtl' } });
    expect(getComputedStyle(field.part('label')).direction).toBe('rtl');
    expect(getComputedStyle(controlOf(field)).direction).toBe('rtl');
  });

  it('keeps text, labels, hints, borders and graphics legible on every theme and surface', async () => {
    for (const theme of ['light', 'dark'] as const) {
      for (const surface of ['default', 'subtle', 'inverse', 'primary'] as const) {
        for (const variant of ['outline', 'filled', 'underlined'] as const) {
          for (const state of ['default', 'error', 'success'] as const) {
            const context = { theme, surface };
            const field = await mount(
              {
                variant,
                state,
                labelPlacement: 'inner',
                hint: 'Feedback',
                placeholder: 'Example',
                ...options.graphicProps,
              },
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
            const ratio = (color: string, behind: string) => contrastRatio(color, behind);
            expect(
              ratio(getComputedStyle(controlOf(field)).color, background),
              message,
            ).toBeGreaterThanOrEqual(4.5);
            expect(
              ratio(getComputedStyle(controlOf(field), '::placeholder').color, background),
              `${message}/placeholder`,
            ).toBeGreaterThanOrEqual(4.5);
            expect(
              ratio(getComputedStyle(field.part('label')).color, background),
              `${message}/label`,
            ).toBeGreaterThanOrEqual(4.5);
            expect(
              ratio(getComputedStyle(field.part('hint')).color, outer),
              `${message}/hint`,
            ).toBeGreaterThanOrEqual(4.5);
            expect(
              ratio(getComputedStyle(control, '::before').borderBottomColor, outer),
              `${message}/border`,
            ).toBeGreaterThanOrEqual(3);
            if (options.graphic !== undefined) {
              expect(
                ratio(getComputedStyle(field.part(options.graphic)).color, background),
                `${message}/${options.graphic}`,
              ).toBeGreaterThanOrEqual(3);
            }
          }
        }
      }
    }
  });
}
