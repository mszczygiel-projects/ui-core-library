import type {
  ButtonShape,
  ButtonSize,
  ButtonType,
  ButtonVariant,
} from '@mszczygiel-projects/ui-core-shared/button';
import { afterEach, expect, it, type Mock, vi } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';

import { type Mount, type Mounted, type MountOptions, required } from '../harness/types.ts';
import { pixels, tokenValue } from '../tokens.ts';

/** The props that every action shares: Button, IconButton and LinkButton. */
export interface ActionSurfaceProps {
  readonly variant?: ButtonVariant;
  readonly disabled?: boolean;
}

/** The props of an action that submits or resets its form and has a loading state. */
export interface ActionFormProps extends ActionSurfaceProps {
  readonly type?: ButtonType;
  readonly name?: string;
  readonly value?: string;
  readonly loading?: boolean;
}

const VARIANTS = ['primary', 'secondary', 'outline', 'ghost', 'danger'] as const;

export function resolvedColor(value: string): string {
  const probe = document.createElement('span');
  probe.style.color = value;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/**
 * Forms that a case builds around an action, removed after each case: a fieldset with a named
 * field, and the entries of each submission.
 */
/** A form around an action, and the entries of each of its submissions. */
export interface FormFixture {
  readonly form: HTMLFormElement;
  readonly fieldset: HTMLFieldSetElement;
  readonly field: HTMLInputElement;
  readonly submitted: Mock;
}

export function formFixtures(): {
  formFixture: () => FormFixture;
  track: (fixture: HTMLElement) => void;
} {
  const fixtures: HTMLElement[] = [];
  afterEach(() => {
    for (const fixture of fixtures.splice(0)) {
      fixture.remove();
    }
  });
  const track = (fixture: HTMLElement) => {
    fixtures.push(fixture);
  };
  function formFixture(): FormFixture {
    const form = document.createElement('form');
    const fieldset = document.createElement('fieldset');
    const field = document.createElement('input');
    field.name = 'title';
    field.defaultValue = 'Draft';
    fieldset.append(field);
    form.append(fieldset);
    document.body.append(form);
    track(form);
    const submitted = vi.fn();
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted([...new FormData(form, event.submitter)]);
    });
    return { form, fieldset, field, submitted };
  }
  return { formFixture, track };
}

/** Mounts with the props that name the action, and unmounts after each case. */
function mounter<Props extends object>(adapter: Mount<Props>, named: Props) {
  const mounted: Mounted<Props>[] = [];
  afterEach(async () => {
    for (const component of mounted.splice(0)) {
      await component.unmount();
    }
  });
  return async (props: Partial<Props> = {}, options?: MountOptions) => {
    const component = await adapter({ ...named, ...props }, options);
    mounted.push(component);
    return component;
  };
}

/**
 * The surface of an action: the colours of its variants on every surface, the active and disabled
 * states and the focus ring, which every action draws from the Button tokens.
 */
export function actionSurfaceContract<Props extends ActionSurfaceProps>(
  adapter: Mount<Props>,
  named: Props,
): void {
  const mount = mounter(adapter, named);

  for (const theme of ['light', 'dark'] as const) {
    it(`uses the variant colour tokens on every ${theme} surface`, async () => {
      for (const surface of ['default', 'subtle', 'inverse', 'primary'] as const) {
        for (const variant of VARIANTS) {
          const options = { theme, surface };
          const action = await mount({ variant } as Partial<Props>, options);
          // A preceding test can leave the pointer over the newly mounted action.
          await page.elementLocator(action.part('base')).unhover();
          const style = getComputedStyle(action.part('base'));
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

  it('uses active colours and shadows, with the disabled state taking precedence', async () => {
    for (const variant of VARIANTS) {
      const action = await mount({ variant } as Partial<Props>);
      const base = action.part('base');
      await page.elementLocator(base).hover();
      expect(getComputedStyle(base).color).toBe(
        resolvedColor(tokenValue(`--color-button-${variant}-text-active`)),
      );
      expect(getComputedStyle(base).boxShadow === 'none').toBe(variant === 'ghost');
      await action.update({ disabled: true } as Partial<Props>);
      expect(getComputedStyle(base).color).toBe(
        resolvedColor(tokenValue(`--color-button-${variant}-text-disabled`)),
      );
      expect(getComputedStyle(base).boxShadow).toBe('none');
    }
  });

  it('draws its own focus ring, which stays visible in forced colours', async () => {
    const action = await mount();
    const base = action.part('base');
    // Keyboard focus, so that :focus-visible applies without any global stylesheet.
    await userEvent.keyboard('{Tab}');
    base.focus();
    expect(Number.parseFloat(getComputedStyle(base).outlineWidth)).toBe(
      pixels(tokenValue('--ring-width')),
    );
    expect(getComputedStyle(base).outlineColor).toBe(
      resolvedColor(tokenValue('--color-ring-default')),
    );
    await commands.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    expect(getComputedStyle(base).outlineStyle).not.toBe('none');
    expect(Number.parseFloat(getComputedStyle(base).borderWidth)).toBeGreaterThan(0);
  });
}

/**
 * A form-associated action: native activation, submitting its own name and value, resetting,
 * disabled fieldsets and the blocking of loading. Button and IconButton share it.
 */
export function actionFormContract<Props extends ActionFormProps>(
  adapter: Mount<Props>,
  named: Props,
): void {
  const mount = mounter(adapter, named);
  const { formFixture, track } = formFixtures();
  const props = (value: ActionFormProps) => value as Partial<Props>;

  it('activates exactly once with pointer, Enter and Space', async () => {
    const action = await mount();
    const clicked = vi.fn();
    action.element.addEventListener('click', clicked);
    await page.elementLocator(action.part('base')).click();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(clicked).toHaveBeenCalledTimes(3);
  });

  it('defaults to an ordinary action and submits only the activated name/value', async () => {
    const { form, fieldset, submitted } = formFixture();
    const action = await mount(props({ name: 'action', value: 'save' }), { parent: fieldset });
    const other = await mount(props({ type: 'submit', name: 'action', value: 'publish' }), {
      parent: fieldset,
    });
    expect([...new FormData(form)]).toEqual([['title', 'Draft']]);
    await page.elementLocator(action.part('base')).click();
    expect(submitted).not.toHaveBeenCalled();
    await action.update(props({ type: 'submit' }));
    await page.elementLocator(action.part('base')).click();
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
    await action.update(props({ name: '' }));
    await page.elementLocator(action.part('base')).click();
    expect(submitted).toHaveBeenLastCalledWith([['title', 'Draft']]);
  });

  it('honours native validation and never leaves stale action data after a failed submit', async () => {
    const { form, fieldset, field, submitted } = formFixture();
    field.required = true;
    field.value = '';
    const action = await mount(props({ type: 'submit', name: 'action', value: 'save' }), {
      parent: fieldset,
    });
    await page.elementLocator(action.part('base')).click();
    expect(submitted).not.toHaveBeenCalled();
    expect(form.checkValidity()).toBe(false);
    expect([...new FormData(form)]).toEqual([['title', '']]);
    await page.elementLocator(field).fill('Article');
    await page.elementLocator(action.part('base')).click();
    expect(submitted).toHaveBeenCalledOnce();
  });

  it('lets an ancestor cancel click before submit or reset', async () => {
    const { fieldset, field, submitted } = formFixture();
    const action = await mount(props({ type: 'submit' }), { parent: fieldset });
    fieldset.addEventListener('click', (event) => {
      event.preventDefault();
    });
    await page.elementLocator(action.part('base')).click();
    expect(submitted).not.toHaveBeenCalled();
    field.value = 'Edited';
    await action.update(props({ type: 'reset' }));
    await page.elementLocator(action.part('base')).click();
    expect(field.value).toBe('Edited');
  });

  it('resets the owning form without changing the configured action', async () => {
    const { fieldset, field, submitted } = formFixture();
    const action = await mount(props({ type: 'reset', name: 'action', value: 'reset' }), {
      parent: fieldset,
    });
    field.value = 'Edited';
    await page.elementLocator(action.part('base')).click();
    expect(field.value).toBe('Draft');
    expect(submitted).not.toHaveBeenCalled();
  });

  it('follows overlapping own and fieldset disabled states, including re-enabling', async () => {
    const { fieldset, submitted } = formFixture();
    const action = await mount(props({ type: 'submit' }), { parent: fieldset });
    const base = action.part('base');
    const normalColor = getComputedStyle(base).color;
    fieldset.disabled = true;
    await expect.poll(() => base.matches(':disabled')).toBe(true);
    expect(getComputedStyle(base).color).not.toBe(normalColor);
    base.click();
    expect(submitted).not.toHaveBeenCalled();
    await action.update(props({ disabled: true }));
    fieldset.disabled = false;
    await expect.poll(() => base.matches(':disabled')).toBe(true);
    await action.update(props({ disabled: false }));
    await expect.poll(() => base.matches(':disabled')).toBe(false);
    await action.update(props({ disabled: true }));
    fieldset.disabled = true;
    await action.update(props({ disabled: false }));
    await expect.poll(() => base.matches(':disabled')).toBe(true);
    fieldset.disabled = false;
    await expect.poll(() => base.matches(':disabled')).toBe(false);
    await page.elementLocator(base).click();
    expect(submitted).toHaveBeenCalledOnce();
  });

  it('cancels a click on a loading action where it starts, before it bubbles to the page', async () => {
    const action = await mount(props({ loading: true }));
    const frame = required(action.element.parentElement, 'the frame');
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
    action.part('base').click();
    // A listener of the page in the capture phase runs before the click reaches the action.
    expect(captured).toHaveLength(1);
    expect(captured[0]?.defaultPrevented).toBe(true);
    expect(bubbled).not.toHaveBeenCalled();
  });

  it('completes an activation whose click handler starts loading', async () => {
    const { fieldset, submitted } = formFixture();
    const action = await mount(props({ type: 'submit', name: 'action', value: 'save' }), {
      parent: fieldset,
    });
    fieldset.addEventListener(
      'click',
      () => {
        void action.update(props({ loading: true }));
      },
      { once: true },
    );
    await page.elementLocator(action.part('base')).click();
    expect(submitted).toHaveBeenCalledWith([
      ['title', 'Draft'],
      ['action', 'save'],
    ]);
    await expect.poll(() => action.part('base').getAttribute('aria-busy')).toBe('true');
  });

  it('keeps its resting colours and no shadow while loading, even under the pointer', async () => {
    for (const variant of VARIANTS) {
      const action = await mount(props({ variant }));
      const base = action.part('base');
      await page.elementLocator(base).hover();
      await action.update(props({ loading: true }));
      expect(getComputedStyle(base).color).toBe(
        resolvedColor(tokenValue(`--color-button-${variant}-text-default`)),
      );
      expect(getComputedStyle(base).boxShadow).toBe('none');
    }
  });

  it('closes the dialog of a dialog form with its value as the return value', async () => {
    const dialog = document.createElement('dialog');
    const form = document.createElement('form');
    form.method = 'dialog';
    dialog.append(form);
    document.body.append(dialog);
    track(dialog);
    const action = await mount(props({ type: 'submit', value: 'confirm' }), { parent: form });
    dialog.showModal();
    form.addEventListener(
      'submit',
      (event) => {
        event.preventDefault();
      },
      { once: true },
    );
    await page.elementLocator(action.part('base')).click();
    expect([dialog.open, dialog.returnValue]).toEqual([true, '']);
    await page.elementLocator(action.part('base')).click();
    expect([dialog.open, dialog.returnValue]).toEqual([false, 'confirm']);
  });
}

/** The props of an action with corners of its own: Button, IconButton, SplitButton and LinkButton. */
export interface ActionShapeProps extends ActionSurfaceProps {
  readonly size?: ButtonSize;
  readonly shape?: ButtonShape;
}

/** The corners of an action: the radius of its size when square, the pill token when rounded. */
export function actionShapeContract<Props extends ActionShapeProps>(
  adapter: Mount<Props>,
  named: Props,
): void {
  const mount = mounter(adapter, named);

  it('takes the radius of its size when square and the rounded radius when rounded', async () => {
    const radius = {
      small: '--button-small-radius',
      medium: '--button-radius',
      large: '--button-large-radius',
    } as const;
    for (const size of ['small', 'medium', 'large'] as const) {
      const square = await mount({ size } as Partial<Props>);
      expect(pixels(getComputedStyle(square.part('base')).borderStartStartRadius)).toBe(
        pixels(tokenValue(radius[size])),
      );
      await square.update({ shape: 'rounded' } as Partial<Props>);
      expect(pixels(getComputedStyle(square.part('base')).borderStartStartRadius)).toBe(
        pixels(tokenValue('--button-rounded-radius')),
      );
      await square.update({ shape: 'unsupported' } as unknown as Partial<Props>);
      expect(pixels(getComputedStyle(square.part('base')).borderStartStartRadius)).toBe(
        pixels(tokenValue(radius[size])),
      );
    }
  });
}
