import { configureUiCore } from '@mszczygiel-projects/ui-core-foundations/config';
import type {
  PasswordFieldProps,
  PasswordFieldRevealedChangeDetails,
} from '@mszczygiel-projects/ui-core-shared/password-field';
import { afterEach, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { pseudoLabels } from '../pseudo.ts';
import { pixels, tokenValue } from '../tokens.ts';
import {
  controlOf,
  formFixture,
  textControlContract,
  type TextControlContractProps,
} from './text-control.contract.ts';

/** The props of the specification, plus what each harness translates. */
export interface PasswordFieldContractProps extends PasswordFieldProps, TextControlContractProps {
  /** The initial visibility: the revealed attribute of the web component, defaultRevealed in React. */
  readonly defaultRevealed?: boolean;
  readonly onRevealedChange?: (
    revealed: boolean,
    details: PasswordFieldRevealedChangeDetails<Event>,
  ) => void;
}

/** The behaviour of PasswordField, applied unchanged to the web component and the React component. */
export function passwordFieldContract(adapter: Mount<PasswordFieldContractProps>): void {
  textControlContract(adapter, { role: 'textbox', graphic: 'reveal' });

  const mounted: Mounted<PasswordFieldContractProps>[] = [];
  const fixtures: HTMLElement[] = [];
  async function mount(props: PasswordFieldContractProps = {}, options?: MountOptions) {
    const field = await adapter({ label: 'Password', ...props }, options);
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

  it('shows and hides the password with a toggle button of one name', async () => {
    const changed = vi.fn<NonNullable<PasswordFieldContractProps['onRevealedChange']>>();
    const field = await mount({ defaultValue: 'secret', onRevealedChange: changed });
    const reveal = field.part('reveal');
    const button = async () =>
      (await field.accessibleTree()).find((node) => node.role === 'button');
    expect(controlOf(field).type).toBe('password');
    expect(reveal.getAttribute('aria-pressed')).toBe('false');
    expect((await button())?.name).toBe('Show password');
    await page.elementLocator(reveal).click();
    expect(controlOf(field).type).toBe('text');
    expect(reveal.getAttribute('aria-pressed')).toBe('true');
    expect((await button())?.name).toBe('Show password');
    expect(changed).toHaveBeenCalledExactlyOnceWith(true, expect.anything());
    expect(changed.mock.calls[0]?.[1].originalEvent).toBeInstanceOf(MouseEvent);
    await page.elementLocator(reveal).click();
    expect(controlOf(field).type).toBe('password');
    expect(reveal.getAttribute('aria-pressed')).toBe('false');
    expect(changed).toHaveBeenLastCalledWith(false, expect.anything());
    expect(controlOf(field).value).toBe('secret');
  });

  it('takes the name of the button from the configured labels, then from its prop', async () => {
    const field = await mount();
    const named = async () =>
      (await field.accessibleTree()).find((node) => node.role === 'button')?.name;
    configureUiCore({ labels: pseudoLabels });
    await expect.poll(named).toBe(pseudoLabels.passwordField.reveal);
    await field.update({ revealLabel: 'Passwort anzeigen' });
    expect(await named()).toBe('Passwort anzeigen');
  });

  it('reaches the reveal button after the input with Tab and keeps the focus on it', async () => {
    const field = await mount();
    await page.elementLocator(controlOf(field)).click();
    await userEvent.tab();
    expect(field.part('reveal').matches(':focus-visible')).toBe(true);
    await userEvent.keyboard(' ');
    expect(controlOf(field).type).toBe('text');
    expect(field.part('reveal').matches(':focus')).toBe(true);
  });

  it('starts from its initial visibility and follows a controlled one', async () => {
    const field = await mount({ defaultRevealed: true });
    expect(controlOf(field).type).toBe('text');
    const controlled = await mount({ revealed: false, onRevealedChange: vi.fn() });
    await controlled.update({ revealed: true });
    expect(controlOf(controlled).type).toBe('text');
  });

  it('hides the password again when the form submits or resets', async () => {
    const { form, fieldset, submitted } = formFixture(fixtures);
    const changed = vi.fn<NonNullable<PasswordFieldContractProps['onRevealedChange']>>();
    const field = await mount(
      { name: 'password', defaultValue: 'secret', onRevealedChange: changed },
      { parent: fieldset },
    );
    await page.elementLocator(field.part('reveal')).click();
    expect(controlOf(field).type).toBe('text');
    changed.mockClear();
    form.requestSubmit();
    expect(submitted).toHaveBeenCalledExactlyOnceWith(null, [['password', 'secret']]);
    await expect.poll(() => controlOf(field).type).toBe('password');
    expect(changed).toHaveBeenCalledExactlyOnceWith(false, expect.anything());
    await page.elementLocator(field.part('reveal')).click();
    form.reset();
    await expect.poll(() => controlOf(field).type).toBe('password');
  });

  it('keeps the visibility when the page cancels a reset', async () => {
    const { form, fieldset } = formFixture(fixtures);
    form.addEventListener('reset', (event) => {
      event.preventDefault();
    });
    const field = await mount(
      { defaultValue: 'secret', defaultRevealed: true },
      { parent: fieldset },
    );
    await page.elementLocator(field.part('reveal')).click();
    expect(controlOf(field).type).toBe('password');
    form.reset();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(controlOf(field).type).toBe('password');
  });

  it('disables the button with the field and its fieldset, but not when read-only', async () => {
    const { fieldset } = formFixture(fixtures);
    const field = await mount({}, { parent: fieldset });
    const reveal = field.part('reveal');
    fieldset.disabled = true;
    await expect.poll(() => field.part('reveal').matches(':disabled')).toBe(true);
    fieldset.disabled = false;
    await expect.poll(() => field.part('reveal').matches(':disabled')).toBe(false);
    await field.update({ disabled: true });
    expect(field.part('reveal').matches(':disabled')).toBe(true);
    await field.update({ disabled: false, readOnly: true });
    expect(reveal.matches(':disabled')).toBe(false);
  });

  it('submits on Enter like a single-line field', async () => {
    const { fieldset, submitted } = formFixture(fixtures);
    const field = await mount({ name: 'password', defaultValue: 'secret' }, { parent: fieldset });
    await page.elementLocator(controlOf(field)).click();
    await userEvent.keyboard('{Enter}');
    expect(submitted).toHaveBeenCalledExactlyOnceWith(null, [['password', 'secret']]);
  });

  it('blocks a value that the pattern rejects', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const field = await mount({ pattern: '.{12,}' }, { parent: fieldset });
    await page.elementLocator(controlOf(field)).fill('short');
    expect(form.checkValidity()).toBe(false);
    await page.elementLocator(controlOf(field)).fill('long enough password');
    expect(form.checkValidity()).toBe(true);
  });

  it('gives the reveal button a pointer target of the minimum size', async () => {
    for (const density of ['comfortable', 'compact'] as const) {
      const field = await mount({ size: 'small' }, { density });
      const target = getComputedStyle(field.part('reveal'), '::after');
      const minimum = pixels(tokenValue('--control-action-target-min-size', { density }));
      const box = field.part('reveal').getBoundingClientRect();
      const inset = Number.parseFloat(target.insetBlockStart);
      expect(box.height - 2 * inset).toBeGreaterThanOrEqual(minimum);
      expect(box.width - 2 * inset).toBeGreaterThanOrEqual(minimum);
    }
  });
}
