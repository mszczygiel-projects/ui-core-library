import { configureUiCore } from '@mszczygiel-projects/ui-core-foundations/config';
import type { ButtonProps } from '@mszczygiel-projects/ui-core-shared/button';
import { afterEach, expect, it, vi } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';

import { appearance } from '../appearance.ts';
import { type Mount, type Mounted, type MountOptions, required } from '../harness/types.ts';
import { pseudoLabels } from '../pseudo.ts';
import { pixels, tokenValue } from '../tokens.ts';

/**
 * The props of the specification, plus content as text and icons as flags, which the harness of
 * each framework turns into its own children and icons.
 */
export interface ButtonContractProps extends ButtonProps {
  readonly children?: string;
  readonly leadingIcon?: boolean;
  readonly trailingIcon?: boolean;
}

function resolvedColor(value: string): string {
  const probe = document.createElement('span');
  probe.style.color = value;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** One behaviour contract, applied unchanged to the web component and the React component. */
export function buttonContract(adapter: Mount<ButtonContractProps>): void {
  const mounted: Mounted<ButtonContractProps>[] = [];
  const fixtures: HTMLElement[] = [];
  async function mount(props: ButtonContractProps = {}, options?: MountOptions) {
    const button = await adapter({ children: 'Save draft', ...props }, options);
    mounted.push(button);
    return button;
  }
  function formFixture() {
    const form = document.createElement('form');
    const fieldset = document.createElement('fieldset');
    const field = document.createElement('input');
    field.name = 'title';
    field.defaultValue = 'Draft';
    fieldset.append(field);
    form.append(fieldset);
    document.body.append(form);
    fixtures.push(form);
    const submitted = vi.fn();
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted([...new FormData(form, event.submitter)]);
    });
    return { form, fieldset, field, submitted };
  }
  afterEach(async () => {
    for (const button of mounted.splice(0)) {
      await button.unmount();
    }
    for (const fixture of fixtures.splice(0)) {
      fixture.remove();
    }
  });

  it('uses the documented defaults and falls back after invalid runtime settings', async () => {
    const defaults = await mount();
    const explicit = await mount({ variant: 'primary', size: 'medium', type: 'button' });
    const base = defaults.part('base');
    expect(appearance(base)).toEqual(appearance(explicit.part('base')));
    expect(base.getAttribute('type')).toBe('button');
    expect(base.hasAttribute('disabled')).toBe(false);
    expect(base.getAttribute('aria-busy')).not.toBe('true');
    for (const value of ['unsupported', null, 42]) {
      await defaults.update({
        variant: value,
        size: value,
        type: value,
      } as unknown as ButtonContractProps);
      expect(appearance(base)).toEqual(appearance(explicit.part('base')));
      expect(base.getAttribute('type')).toBe('button');
    }
  });

  it('exposes one accessible button, named by its content, with decorative icons', async () => {
    const button = await mount({ leadingIcon: true, trailingIcon: true });
    const tree = await button.accessibleTree();
    expect(tree.filter((node) => node.role === 'button')).toEqual([
      {
        role: 'button',
        name: tokenValue('--button-text-uppercase') === 'uppercase' ? 'SAVE DRAFT' : 'Save draft',
      },
    ]);
    expect(tree.some((node) => node.name === 'Decorative star')).toBe(false);
    // An element the component needs inside, such as a form, adds no node of its own.
    expect(tree.some((node) => node.role === 'form')).toBe(false);
  });

  it('prefers a label to content and an author aria-label to either', async () => {
    const button = await mount({ label: 'Save article' });
    expect((await button.accessibleTree()).filter((node) => node.role === 'button')).toEqual([
      { role: 'button', name: 'Save article' },
    ]);
    await button.update({ label: 'Publish article' });
    expect((await button.accessibleTree()).find((node) => node.role === 'button')?.name).toBe(
      'Publish article',
    );
    const named = await mount(
      { label: 'Ignored' },
      { attributes: { 'aria-label': 'Author name' } },
    );
    expect((await named.accessibleTree()).find((node) => node.role === 'button')?.name).toBe(
      'Author name',
    );
  });

  it('activates exactly once with pointer, Enter and Space', async () => {
    const button = await mount();
    const clicked = vi.fn();
    button.element.addEventListener('click', clicked);
    await page.elementLocator(button.part('base')).click();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(clicked).toHaveBeenCalledTimes(3);
  });

  it('defaults to an ordinary action and submits only the activated name/value', async () => {
    const { form, fieldset, submitted } = formFixture();
    const button = await mount({ name: 'action', value: 'save' }, { parent: fieldset });
    const other = await mount(
      { type: 'submit', name: 'action', value: 'publish' },
      { parent: fieldset },
    );
    expect([...new FormData(form)]).toEqual([['title', 'Draft']]);
    await page.elementLocator(button.part('base')).click();
    expect(submitted).not.toHaveBeenCalled();
    await button.update({ type: 'submit' });
    await page.elementLocator(button.part('base')).click();
    expect(submitted).toHaveBeenLastCalledWith([
      ['title', 'Draft'],
      ['action', 'save'],
    ]);
    await page.elementLocator(other.part('base')).click();
    expect(submitted).toHaveBeenLastCalledWith([
      ['title', 'Draft'],
      ['action', 'publish'],
    ]);
    expect([...new FormData(form)]).toEqual([['title', 'Draft']]);
    await button.update({ name: '' });
    await page.elementLocator(button.part('base')).click();
    expect(submitted).toHaveBeenLastCalledWith([['title', 'Draft']]);
  });

  it('honours native validation and never leaves stale action data after a failed submit', async () => {
    const { form, fieldset, field, submitted } = formFixture();
    field.required = true;
    field.value = '';
    const button = await mount(
      { type: 'submit', name: 'action', value: 'save' },
      { parent: fieldset },
    );
    await page.elementLocator(button.part('base')).click();
    expect(submitted).not.toHaveBeenCalled();
    expect(form.checkValidity()).toBe(false);
    expect([...new FormData(form)]).toEqual([['title', '']]);
    await page.elementLocator(field).fill('Article');
    await page.elementLocator(button.part('base')).click();
    expect(submitted).toHaveBeenCalledOnce();
  });

  it('lets an ancestor cancel click before submit or reset', async () => {
    const { fieldset, field, submitted } = formFixture();
    const button = await mount({ type: 'submit' }, { parent: fieldset });
    fieldset.addEventListener('click', (event) => {
      event.preventDefault();
    });
    await page.elementLocator(button.part('base')).click();
    expect(submitted).not.toHaveBeenCalled();
    field.value = 'Edited';
    await button.update({ type: 'reset' });
    await page.elementLocator(button.part('base')).click();
    expect(field.value).toBe('Edited');
  });

  it('resets the owning form without changing the configured action', async () => {
    const { fieldset, field, submitted } = formFixture();
    const button = await mount(
      { type: 'reset', name: 'action', value: 'reset' },
      { parent: fieldset },
    );
    field.value = 'Edited';
    await page.elementLocator(button.part('base')).click();
    expect(field.value).toBe('Draft');
    expect(submitted).not.toHaveBeenCalled();
  });

  it('follows overlapping own and fieldset disabled states, including re-enabling', async () => {
    const { fieldset, submitted } = formFixture();
    const button = await mount({ type: 'submit' }, { parent: fieldset });
    const base = button.part('base');
    const normalColor = getComputedStyle(base).color;
    fieldset.disabled = true;
    await expect.poll(() => base.matches(':disabled')).toBe(true);
    expect(getComputedStyle(base).color).not.toBe(normalColor);
    base.click();
    expect(submitted).not.toHaveBeenCalled();
    await button.update({ disabled: true });
    fieldset.disabled = false;
    await expect.poll(() => base.matches(':disabled')).toBe(true);
    await button.update({ disabled: false });
    await expect.poll(() => base.matches(':disabled')).toBe(false);
    await button.update({ disabled: true });
    fieldset.disabled = true;
    await button.update({ disabled: false });
    await expect.poll(() => base.matches(':disabled')).toBe(true);
    fieldset.disabled = false;
    await expect.poll(() => base.matches(':disabled')).toBe(false);
    await page.elementLocator(base).click();
    expect(submitted).toHaveBeenCalledOnce();
  });

  it('retains focus, width and its action name while loading, blocking every activation', async () => {
    const { form, fieldset, submitted } = formFixture();
    const button = await mount(
      { type: 'submit', name: 'action', value: 'save', leadingIcon: true },
      { parent: fieldset },
    );
    const base = button.part('base');
    base.focus();
    const width = base.getBoundingClientRect().width;
    await button.update({ loading: true });
    expect(button.part('base')).toBe(base);
    expect(base.matches(':focus')).toBe(true);
    expect(base.matches(':disabled')).toBe(false);
    expect(base.getBoundingClientRect().width).toBe(width);
    expect(getComputedStyle(button.part('content')).opacity).toBe('0');
    expect(base.getAttribute('aria-busy')).toBe('true');
    expect(base.getAttribute('aria-disabled')).toBe('true');
    const clicked = vi.fn();
    button.element.addEventListener('click', clicked);
    // Browser automation treats aria-disabled as disabled, so use the native click method here.
    base.click();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(clicked).not.toHaveBeenCalled();
    expect(submitted).not.toHaveBeenCalled();
    expect([...new FormData(form)]).toEqual([['title', 'Draft']]);
    const tree = await button.accessibleTree();
    expect(tree.filter((node) => node.role === 'button')).toEqual([
      {
        role: 'button',
        name: tokenValue('--button-text-uppercase') === 'uppercase' ? 'SAVE DRAFT' : 'Save draft',
        description: 'Loading',
      },
    ]);
    expect(tree.some((node) => node.role === 'progressbar')).toBe(false);
    // The description lives inside the component, which stays one element on the page.
    expect(required(button.element.parentElement, 'the frame').childElementCount).toBe(1);
    await userEvent.tab({ shift: true });
    await userEvent.tab();
    expect(base.matches(':focus')).toBe(true);
    await button.update({ loading: false });
    expect(base.matches(':focus')).toBe(true);
    expect(getComputedStyle(button.part('content')).opacity).toBe('1');
    await userEvent.keyboard('{Enter}');
    expect(submitted).toHaveBeenCalledOnce();
  });

  it('cancels a click on a loading button where it starts, before it bubbles to the page', async () => {
    const button = await mount({ loading: true });
    const frame = required(button.element.parentElement, 'the frame');
    const captured: Event[] = [];
    const bubbled = vi.fn();
    frame.addEventListener(
      'click',
      (event) => {
        captured.push(event);
      },
      true,
    );
    frame.addEventListener('click', bubbled);
    button.part('base').click();
    // A listener of the page in the capture phase runs before the click reaches the button.
    expect(captured).toHaveLength(1);
    expect(captured[0]?.defaultPrevented).toBe(true);
    expect(bubbled).not.toHaveBeenCalled();
  });

  it('completes an activation whose click handler starts loading', async () => {
    const { fieldset, submitted } = formFixture();
    const button = await mount(
      { type: 'submit', name: 'action', value: 'save' },
      { parent: fieldset },
    );
    fieldset.addEventListener(
      'click',
      () => {
        void button.update({ loading: true });
      },
      { once: true },
    );
    await page.elementLocator(button.part('base')).click();
    expect(submitted).toHaveBeenCalledWith([
      ['title', 'Draft'],
      ['action', 'save'],
    ]);
    await expect.poll(() => button.part('base').getAttribute('aria-busy')).toBe('true');
  });

  it('closes the dialog of a dialog form with its value as the return value', async () => {
    const dialog = document.createElement('dialog');
    const form = document.createElement('form');
    form.method = 'dialog';
    dialog.append(form);
    document.body.append(dialog);
    fixtures.push(dialog);
    const button = await mount({ type: 'submit', value: 'confirm' }, { parent: form });
    dialog.showModal();
    form.addEventListener(
      'submit',
      (event) => {
        event.preventDefault();
      },
      { once: true },
    );
    await page.elementLocator(button.part('base')).click();
    expect([dialog.open, dialog.returnValue]).toEqual([true, '']);
    await page.elementLocator(button.part('base')).click();
    expect([dialog.open, dialog.returnValue]).toEqual([false, 'confirm']);
  });

  it('uses configurable loading text, follows live changes, and prefers its prop', async () => {
    configureUiCore({ labels: pseudoLabels });
    const button = await mount({ loading: true });
    const description = async () =>
      (await button.accessibleTree()).find((node) => node.role === 'button')?.description;
    expect(await description()).toBe(pseudoLabels.button.loading);
    configureUiCore({ labels: { button: { loading: 'Zapisywanie' } } });
    await expect.poll(description).toBe('Zapisywanie');
    await button.update({ loadingLabel: 'Saving article' });
    expect(await description()).toBe('Saving article');
    await button.update({ disabled: true });
    await expect.poll(() => button.part('base').matches(':disabled')).toBe(true);
  });

  for (const density of ['comfortable', 'compact'] as const) {
    it(`uses each size's geometry tokens in ${density} density`, async () => {
      for (const size of ['small', 'medium', 'large'] as const) {
        const button = await mount({ size, leadingIcon: true }, { density });
        const prefix = size === 'medium' ? '--button' : `--button-${size}`;
        const style = getComputedStyle(button.part('base'));
        expect(Number.parseFloat(style.paddingBlockStart)).toBe(
          pixels(tokenValue(`${prefix}-padding-stack`, { density })),
        );
        expect(Number.parseFloat(style.fontSize)).toBe(
          pixels(tokenValue(`${prefix}-font-size`, { density })),
        );
        await expect
          .poll(() => button.part('leading-icon').getBoundingClientRect().width)
          .toBe(pixels(tokenValue(`${prefix}-icon-size`, { density })));
      }
    });
  }

  for (const theme of ['light', 'dark'] as const) {
    it(`uses the variant colour tokens on every ${theme} surface`, async () => {
      for (const surface of ['default', 'subtle', 'inverse', 'primary'] as const) {
        for (const variant of ['primary', 'secondary', 'outline', 'ghost', 'danger'] as const) {
          const options = { theme, surface };
          const button = await mount({ variant }, options);
          // A preceding test can leave the pointer over the newly mounted button.
          await page.elementLocator(button.part('base')).unhover();
          const style = getComputedStyle(button.part('base'));
          expect(style.color).toBe(
            resolvedColor(tokenValue(`--color-button-${variant}-text-default`, options)),
          );
          expect(style.backgroundColor).toBe(
            resolvedColor(tokenValue(`--color-button-${variant}-background-default`, options)),
          );
        }
      }
    });
  }

  it('puts leading and trailing icons in reading order in RTL', async () => {
    const button = await mount({ leadingIcon: true, trailingIcon: true }, { dir: 'rtl' });
    await expect
      .poll(() => button.part('leading-icon').getBoundingClientRect().x)
      .toBeGreaterThan(button.part('label').getBoundingClientRect().x);
    expect(button.part('trailing-icon').getBoundingClientRect().x).toBeLessThan(
      button.part('label').getBoundingClientRect().x,
    );
  });

  it('uses active colours and shadows, with disabled and loading taking precedence', async () => {
    for (const variant of ['primary', 'secondary', 'outline', 'ghost', 'danger'] as const) {
      const button = await mount({ variant });
      const base = button.part('base');
      await page.elementLocator(base).hover();
      expect(getComputedStyle(base).color).toBe(
        resolvedColor(tokenValue(`--color-button-${variant}-text-active`)),
      );
      expect(getComputedStyle(base).boxShadow === 'none').toBe(variant === 'ghost');
      await button.update({ loading: true });
      expect(getComputedStyle(base).color).toBe(
        resolvedColor(tokenValue(`--color-button-${variant}-text-default`)),
      );
      expect(getComputedStyle(base).boxShadow).toBe('none');
      await button.update({ disabled: true });
      expect(getComputedStyle(base).color).toBe(
        resolvedColor(tokenValue(`--color-button-${variant}-text-disabled`)),
      );
      expect(getComputedStyle(base).boxShadow).toBe('none');
    }
  });

  it('centres a correctly sized loader in the action colour', async () => {
    for (const size of ['small', 'medium', 'large'] as const) {
      const button = await mount({ size, loading: true, variant: 'danger' });
      const loader = button.part('loader').firstElementChild;
      if (!(loader instanceof HTMLElement)) {
        throw new Error('Missing embedded loader');
      }
      const base = button.part('base');
      const bounds = base.getBoundingClientRect();
      const indicator = loader.getBoundingClientRect();
      expect(indicator.width).toBe(
        pixels(tokenValue(size === 'large' ? '--loader-size' : '--loader-small-size')),
      );
      // Layout rounds the two rectangles independently to fractions of a CSS pixel.
      expect(indicator.x + indicator.width / 2).toBeCloseTo(bounds.x + bounds.width / 2, 1);
      expect(indicator.y + indicator.height / 2).toBeCloseTo(bounds.y + bounds.height / 2, 1);
      expect(getComputedStyle(loader).color).toBe(getComputedStyle(base).color);
    }
  });

  it('keeps a visible focus ring in forced colours and respects the uppercase token', async () => {
    const button = await mount();
    const base = button.part('base');
    button.element.style.setProperty('--button-text-uppercase', 'uppercase');
    expect(getComputedStyle(base).textTransform).toBe('uppercase');
    await userEvent.keyboard('{Tab}');
    base.focus();
    expect(Number.parseFloat(getComputedStyle(base).outlineWidth)).toBe(
      pixels(tokenValue('--ring-width')),
    );
    await commands.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    expect(getComputedStyle(base).outlineStyle).not.toBe('none');
    expect(Number.parseFloat(getComputedStyle(base).borderWidth)).toBeGreaterThan(0);
  });
}
