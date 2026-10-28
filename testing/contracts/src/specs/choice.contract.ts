import type {
  CheckedChangeDetails,
  ChoiceControlProps,
  ChoiceState,
} from '@mszczygiel-projects/ui-core-shared/checkbox-field';
import { afterEach, expect, it, vi } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';

import { contrastRatio } from '../contrast.ts';
import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { tokenNumber, tokenValue } from '../tokens.ts';
import { formFixture } from './text-control.contract.ts';

/** The props of a checkable control, plus what each harness translates. */
export interface CheckedControlContractProps extends ChoiceControlProps {
  checked?: boolean;
  state?: ChoiceState;
  name?: string;
  value?: string;
  /** The initial state: the checked attribute of the web component, defaultChecked in React. */
  readonly defaultChecked?: boolean;
  readonly onCheckedChange?: (checked: boolean, details: CheckedChangeDetails<Event>) => void;
}

/** What differs between the checkable controls that share this contract. */
export interface CheckedControlContractOptions {
  /** The role of the native control in the accessibility tree. */
  readonly role: 'checkbox' | 'switch';
  /** The token of the size of the drawn control, along the block axis. */
  readonly sizeToken: string;
}

/** The native checkbox of a mounted control. */
export function checkboxOf(control: Mounted<object>): HTMLInputElement {
  const input = control.part('input');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('A choice control must contain a native input');
  }
  return input;
}

/** The opaque colour of the surface of a frame, as a page paints it behind the component. */
export function surfaceColor(context: Pick<MountOptions, 'theme' | 'surface'>): string {
  const probe = document.createElement('span');
  probe.style.color = tokenValue('--color-background-default', context);
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** Moves the pointer to a corner of the page, so that no control is in the active state. */
export async function restPointer(): Promise<void> {
  const corner = document.createElement('div');
  corner.style.cssText =
    'position: fixed; inset-block-end: 0; inset-inline-end: 0; inline-size: 4px; block-size: 4px;';
  document.body.append(corner);
  await userEvent.hover(corner);
  corner.remove();
}

/**
 * The behaviour CheckboxField and SwitchField share: their name, state, form entry, events,
 * disabling, visual feedback, pointer target and legibility. Each adds its own contract.
 */
export function checkedControlContract<Props extends CheckedControlContractProps>(
  adapter: Mount<Props>,
  options: CheckedControlContractOptions,
): void {
  const mounted: Mounted<Props>[] = [];
  const fixtures: HTMLElement[] = [];
  async function mount(props: CheckedControlContractProps = {}, mountOptions?: MountOptions) {
    const control = await adapter({ label: 'Email updates', ...props } as Props, mountOptions);
    mounted.push(control);
    return control;
  }
  afterEach(async () => {
    await restPointer();
    for (const control of mounted.splice(0)) {
      await control.unmount();
    }
    for (const fixture of fixtures.splice(0)) {
      fixture.remove();
    }
  });

  it('uses the documented defaults and falls back after an invalid state', async () => {
    const defaults = await mount({ name: 'updates' });
    const explicit = await mount({ name: 'updates', state: 'default', value: 'on' });
    await restPointer();
    const input = checkboxOf(defaults);
    expect(input.checked).toBe(false);
    expect(input.disabled).toBe(false);
    expect(input.hasAttribute('aria-invalid')).toBe(false);
    const colour = (control: Mounted<Props>) =>
      getComputedStyle(checkboxOf(control)).borderTopColor;
    expect(colour(defaults)).toBe(colour(explicit));
    for (const value of ['unsupported', null, 42]) {
      await defaults.update({ state: value } as unknown as Props);
      expect(colour(defaults)).toBe(colour(explicit));
      expect(checkboxOf(defaults).hasAttribute('aria-invalid')).toBe(false);
    }
  });

  it('is one control named by its label alone, described by its hint', async () => {
    const control = await mount({ hint: 'At most one a week' });
    const tree = await control.accessibleTree();
    const controls = tree.filter((node) => node.role === options.role);
    expect(controls).toHaveLength(1);
    expect(controls[0]?.name).toBe('Email updates');
    expect(controls[0]?.description).toBe('At most one a week');
  });

  it('lets an author name a control without a visible label', async () => {
    const control = await mount({ label: '' }, { attributes: { 'aria-label': 'Author name' } });
    const tree = await control.accessibleTree();
    expect(tree.find((node) => node.role === options.role)?.name).toBe('Author name');
  });

  it('toggles from its label and with Space, and reports each change once', async () => {
    const changed = vi.fn<NonNullable<CheckedControlContractProps['onCheckedChange']>>();
    const control = await mount({ onCheckedChange: changed });
    const changes = vi.fn();
    control.element.addEventListener('change', changes);
    await page.elementLocator(control.part('label-text')).click();
    expect(checkboxOf(control).checked).toBe(true);
    expect(changed).toHaveBeenCalledExactlyOnceWith(true, expect.anything());
    expect(changed.mock.calls[0]?.[1].originalEvent).toBeInstanceOf(Event);
    expect(changes).toHaveBeenCalledOnce();
    checkboxOf(control).focus();
    await userEvent.keyboard(' ');
    expect(checkboxOf(control).checked).toBe(false);
    expect(changed).toHaveBeenLastCalledWith(false, expect.anything());
    expect(changes).toHaveBeenCalledTimes(2);
  });

  it('draws the checked state of a click in an uncontrolled control', async () => {
    const control = await mount();
    const input = checkboxOf(control);
    const unchecked = getComputedStyle(input).backgroundColor;
    await page.elementLocator(input).click();
    await restPointer();
    await expect.poll(() => getComputedStyle(input).backgroundColor).not.toBe(unchecked);
    const checked = await mount({ defaultChecked: true });
    // The colour changes with a transition, so the comparison waits for its end.
    await expect
      .poll(() => getComputedStyle(input).backgroundColor)
      .toBe(getComputedStyle(checkboxOf(checked)).backgroundColor);
  });

  it('follows a controlled state', async () => {
    const control = await mount({ checked: true });
    expect(checkboxOf(control).checked).toBe(true);
    await control.update({ checked: false } as Partial<Props>);
    expect(checkboxOf(control).checked).toBe(false);
  });

  it('submits its value while checked, and resets to its initial state without an event', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const changed = vi.fn();
    const control = await mount(
      { name: 'updates', value: 'weekly', defaultChecked: true, onCheckedChange: changed },
      { parent: fieldset },
    );
    expect([...new FormData(form)]).toEqual([['updates', 'weekly']]);
    await page.elementLocator(checkboxOf(control)).click();
    expect([...new FormData(form)]).toEqual([]);
    changed.mockClear();
    form.reset();
    await expect.poll(() => checkboxOf(control).checked).toBe(true);
    expect([...new FormData(form)]).toEqual([['updates', 'weekly']]);
    expect(changed).not.toHaveBeenCalled();
  });

  it('submits on under the default value, and nothing without a name', async () => {
    const { form, fieldset } = formFixture(fixtures);
    await mount({ name: 'updates', defaultChecked: true }, { parent: fieldset });
    await mount({ defaultChecked: true }, { parent: fieldset });
    expect([...new FormData(form)]).toEqual([['updates', 'on']]);
  });

  it('tracks fieldset disabling and its own, and submits nothing while disabled', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const control = await mount({ name: 'updates', defaultChecked: true }, { parent: fieldset });
    fieldset.disabled = true;
    await expect.poll(() => checkboxOf(control).matches(':disabled')).toBe(true);
    expect([...new FormData(form)]).toEqual([]);
    fieldset.disabled = false;
    await expect.poll(() => checkboxOf(control).matches(':disabled')).toBe(false);
    await control.update({ disabled: true } as Partial<Props>);
    expect(checkboxOf(control).disabled).toBe(true);
    expect([...new FormData(form)]).toEqual([]);
    await control.update({ disabled: false } as Partial<Props>);
    expect(checkboxOf(control).disabled).toBe(false);
    expect([...new FormData(form)]).toEqual([['updates', 'on']]);
  });

  it('sets aria-invalid for the error state, separately from native validity', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const control = await mount({ state: 'error' }, { parent: fieldset });
    expect(checkboxOf(control).getAttribute('aria-invalid')).toBe('true');
    expect(form.checkValidity()).toBe(true);
    await control.update({ state: 'default' } as Partial<Props>);
    expect(checkboxOf(control).hasAttribute('aria-invalid')).toBe(false);
  });

  it('hides the whole control with the hidden attribute', async () => {
    const control = await mount({}, { attributes: { hidden: 'hidden' } });
    expect(getComputedStyle(control.element).display).toBe('none');
    expect((await control.accessibleTree()).some((node) => node.role === options.role)).toBe(false);
  });

  it('shows the focus ring only for keyboard focus', async () => {
    const control = await mount();
    const input = checkboxOf(control);
    await userEvent.click(input);
    expect(getComputedStyle(input).outlineStyle).toBe('none');
    input.blur();
    await userEvent.keyboard('{Tab}');
    input.focus();
    await expect.poll(() => getComputedStyle(input).outlineStyle).toBe('solid');
  });

  for (const density of ['comfortable', 'compact'] as const) {
    it(`gives a control without a label a target of at least 24 px in ${density} density`, async () => {
      const control = await mount(
        { label: '' },
        { density, attributes: { 'aria-label': 'Updates' } },
      );
      control.element.parentElement?.style.setProperty('padding', '16px');
      const minimum = tokenNumber('--choice-target-min-size');
      expect(minimum).toBeGreaterThanOrEqual(24);
      const part = control.part('control');
      const box = part.getBoundingClientRect();
      const root = part.getRootNode() as Document | ShadowRoot;
      const centre = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      const reach = minimum / 2 - 1;
      for (const [x, y] of [
        [centre.x - reach, centre.y],
        [centre.x + reach, centre.y],
        [centre.x, centre.y - reach],
        [centre.x, centre.y + reach],
      ] as const) {
        const hit = root.elementFromPoint(x, y);
        expect(hit !== null && part.contains(hit), `${String(x)},${String(y)}`).toBe(true);
      }
      expect(box.height).toBe(tokenNumber(options.sizeToken, { density }));
    });
  }

  it('keeps its label, hint and control legible on every theme and surface', async () => {
    for (const theme of ['light', 'dark'] as const) {
      for (const surface of ['default', 'subtle', 'inverse', 'primary'] as const) {
        for (const state of ['default', 'error'] as const) {
          for (const defaultChecked of [false, true]) {
            const context = { theme, surface };
            const control = await mount({ state, hint: 'Feedback', defaultChecked }, context);
            const outer = surfaceColor(context);
            const message = `${theme}/${surface}/${state}/${String(defaultChecked)}`;
            const style = getComputedStyle(checkboxOf(control));
            expect(
              contrastRatio(getComputedStyle(control.part('label')).color, outer),
              `${message}/label`,
            ).toBeGreaterThanOrEqual(4.5);
            expect(
              contrastRatio(getComputedStyle(control.part('hint')).color, outer),
              `${message}/hint`,
            ).toBeGreaterThanOrEqual(4.5);
            // A control is legible by its border, or by its fill where the border takes its colour.
            const edge = defaultChecked ? style.backgroundColor : style.borderTopColor;
            expect(contrastRatio(edge, outer), `${message}/control`).toBeGreaterThanOrEqual(3);
            await control.unmount();
            mounted.splice(mounted.indexOf(control), 1);
          }
        }
      }
    }
  });

  it('keeps its control visible in forced colours and moves without animation on request', async () => {
    await commands.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    const control = await mount({ defaultChecked: true });
    const input = checkboxOf(control);
    expect(getComputedStyle(input).borderTopStyle).toBe('solid');
    expect(Number.parseFloat(getComputedStyle(input).transitionDuration)).toBe(0);
    await commands.emulateMedia({ forcedColors: null, reducedMotion: null });
  });

  it('lays out the control in the direction set on the component itself', async () => {
    const control = await mount({}, { attributes: { dir: 'rtl' } });
    const text = control.part('label-text').getBoundingClientRect();
    const box = control.part('control').getBoundingClientRect();
    expect(text.right).toBeLessThanOrEqual(box.left);
  });
}
