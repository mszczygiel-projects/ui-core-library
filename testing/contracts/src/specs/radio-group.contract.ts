import type { RadioFieldProps } from '@mszczygiel-projects/ui-core-shared/radio-field';
import type {
  RadioGroupProps,
  RadioGroupValueChangeDetails,
} from '@mszczygiel-projects/ui-core-shared/radio-group';
import { afterEach, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { contrastRatio } from '../contrast.ts';
import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { tokenValue } from '../tokens.ts';
import { restPointer, surfaceColor } from './choice.contract.ts';
import { formFixture } from './text-control.contract.ts';

/** The props of the specification, plus what each harness translates: options and callbacks. */
export interface RadioGroupContractProps extends RadioGroupProps {
  readonly options?: readonly RadioFieldProps[];
  /** The initial value: the value attribute of the web component, defaultValue in React. */
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string, details: RadioGroupValueChangeDetails<Event>) => void;
}

const SIZES: readonly RadioFieldProps[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium', hint: 'Fits most' },
  { value: 'large', label: 'Large' },
];

/** The native radio buttons of a group, in order, across the shadow roots of its options. */
function radiosOf(group: Mounted<RadioGroupContractProps>): HTMLInputElement[] {
  const options = [...group.element.querySelectorAll('ui-radio-field')];
  const inputs =
    options.length > 0
      ? options.map((option) => option.shadowRoot?.querySelector('input'))
      : [...group.element.querySelectorAll('input')];
  return inputs.filter((input): input is HTMLInputElement => input instanceof HTMLInputElement);
}

/** The behaviour of RadioGroup, applied unchanged to the web component and the React component. */
export function radioGroupContract(adapter: Mount<RadioGroupContractProps>): void {
  const mounted: Mounted<RadioGroupContractProps>[] = [];
  const fixtures: HTMLElement[] = [];
  async function mount(props: RadioGroupContractProps = {}, options?: MountOptions) {
    const group = await adapter({ label: 'Size', options: SIZES, ...props }, options);
    mounted.push(group);
    return group;
  }
  afterEach(async () => {
    for (const group of mounted.splice(0)) {
      await group.unmount();
    }
    for (const fixture of fixtures.splice(0)) {
      fixture.remove();
    }
  });

  const checked = (group: Mounted<RadioGroupContractProps>) =>
    radiosOf(group).map((radio) => radio.checked);

  it('uses the documented defaults and falls back after invalid runtime settings', async () => {
    const group = await mount();
    const flow = () => getComputedStyle(group.part('options')).flexDirection;
    expect(flow()).toBe('column');
    expect(checked(group)).toEqual([false, false, false]);
    expect(group.part('options').hasAttribute('aria-invalid')).toBe(false);
    await group.update({ orientation: 'horizontal' });
    expect(flow()).toBe('row');
    await group.update({
      orientation: 'unsupported',
      state: 'unsupported',
    } as unknown as RadioGroupContractProps);
    expect(flow()).toBe('column');
    expect(group.part('options').hasAttribute('aria-invalid')).toBe(false);
  });

  it('is one radio group named by its label and described by its hint, of named options', async () => {
    const group = await mount({ hint: 'Pick one' });
    const tree = await group.accessibleTree();
    const groups = tree.filter((node) => node.role === 'radiogroup');
    expect(groups).toHaveLength(1);
    expect(groups[0]?.name).toBe(
      tokenValue('--control-label-text-uppercase') === 'uppercase' ? 'SIZE' : 'Size',
    );
    expect(groups[0]?.description).toBe('Pick one');
    const radios = tree.filter((node) => node.role === 'radio');
    expect(radios.map((node) => node.name)).toEqual(['Small', 'Medium', 'Large']);
    expect(radios[1]?.description).toBe('Fits most');
  });

  it('lets an author name a group without a visible label', async () => {
    const group = await mount({ label: '' }, { attributes: { 'aria-label': 'Shirt size' } });
    const tree = await group.accessibleTree();
    expect(tree.find((node) => node.role === 'radiogroup')?.name).toBe('Shirt size');
  });

  it('chooses one option at a time and reports each choice once', async () => {
    const changed = vi.fn<NonNullable<RadioGroupContractProps['onValueChange']>>();
    const group = await mount({ onValueChange: changed });
    const changes = vi.fn();
    group.element.addEventListener('change', changes);
    await page.elementLocator(radiosOf(group)[0] ?? group.element).click();
    expect(checked(group)).toEqual([true, false, false]);
    await page.getByText('Large').click();
    expect(checked(group)).toEqual([false, false, true]);
    expect(changed.mock.calls.map(([value]) => value)).toEqual(['small', 'large']);
    expect(changed.mock.calls[0]?.[1].originalEvent).toBeInstanceOf(Event);
    expect(changes).toHaveBeenCalledTimes(2);
  });

  it('is one stop for Tab, on the chosen option or else the first enabled one', async () => {
    const before = document.createElement('button');
    before.textContent = 'Before';
    document.body.prepend(before);
    fixtures.push(before);
    const group = await mount({
      options: [{ value: 'none', label: 'None', disabled: true }, ...SIZES],
    });
    before.focus();
    await userEvent.tab();
    expect(radiosOf(group)[1]?.matches(':focus')).toBe(true);
    await userEvent.tab();
    expect(radiosOf(group).some((radio) => radio.matches(':focus'))).toBe(false);
    await group.update({ value: 'large' });
    before.focus();
    await userEvent.tab();
    expect(radiosOf(group)[3]?.matches(':focus')).toBe(true);
  });

  it('moves and chooses with the arrow keys, around the ends and past disabled options', async () => {
    const changed = vi.fn();
    const group = await mount({
      defaultValue: 'small',
      options: [SIZES[0], { value: 'medium', label: 'Medium', disabled: true }, SIZES[2]].filter(
        (option): option is RadioFieldProps => option !== undefined,
      ),
      onValueChange: changed,
    });
    radiosOf(group)[0]?.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(checked(group)).toEqual([false, false, true]);
    expect(radiosOf(group)[2]?.matches(':focus')).toBe(true);
    await userEvent.keyboard('{ArrowRight}');
    expect(checked(group)).toEqual([true, false, false]);
    await userEvent.keyboard('{ArrowUp}');
    expect(checked(group)).toEqual([false, false, true]);
    await userEvent.keyboard('{ArrowLeft}');
    expect(checked(group)).toEqual([true, false, false]);
    expect(changed).toHaveBeenCalledTimes(4);
  });

  it('turns the horizontal arrow keys in right-to-left text', async () => {
    const group = await mount({ defaultValue: 'small' }, { attributes: { dir: 'rtl' } });
    radiosOf(group)[0]?.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(checked(group)).toEqual([false, true, false]);
    await userEvent.keyboard('{ArrowRight}');
    expect(checked(group)).toEqual([true, false, false]);
  });

  it('submits the chosen value under its name, and resets without an event', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const changed = vi.fn();
    const group = await mount(
      { name: 'size', defaultValue: 'medium', onValueChange: changed },
      { parent: fieldset },
    );
    expect(checked(group)).toEqual([false, true, false]);
    expect([...new FormData(form)]).toEqual([['size', 'medium']]);
    await page.getByText('Large').click();
    expect([...new FormData(form)]).toEqual([['size', 'large']]);
    changed.mockClear();
    form.reset();
    await expect.poll(() => checked(group)).toEqual([false, true, false]);
    expect([...new FormData(form)]).toEqual([['size', 'medium']]);
    expect(changed).not.toHaveBeenCalled();
  });

  it('submits nothing without a choice or without a name', async () => {
    const { form, fieldset } = formFixture(fixtures);
    await mount({ name: 'size' }, { parent: fieldset });
    await mount({ defaultValue: 'small' }, { parent: fieldset });
    expect([...new FormData(form)]).toEqual([]);
  });

  it('blocks a submission until a required group has a choice', async () => {
    const { form, fieldset, submitted } = formFixture(fixtures);
    const group = await mount({ name: 'size', required: true }, { parent: fieldset });
    form.requestSubmit();
    expect(submitted).not.toHaveBeenCalled();
    expect(form.checkValidity()).toBe(false);
    expect(radiosOf(group).every((radio) => radio.required)).toBe(true);
    await page.getByText('Small').click();
    form.requestSubmit();
    expect(submitted).toHaveBeenCalledExactlyOnceWith(null, [['size', 'small']]);
  });

  it('follows a controlled value, and chooses nothing for a value no option has', async () => {
    const group = await mount({ value: 'large' });
    expect(checked(group)).toEqual([false, false, true]);
    await group.update({ value: 'medium' });
    expect(checked(group)).toEqual([false, true, false]);
    await group.update({ value: 'extra' });
    expect(checked(group)).toEqual([false, false, false]);
  });

  it('disables every option with the group and its fieldset, and submits nothing', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const changed = vi.fn();
    const group = await mount(
      { name: 'size', defaultValue: 'small', onValueChange: changed },
      { parent: fieldset },
    );
    fieldset.disabled = true;
    await expect
      .poll(() => radiosOf(group).every((radio) => radio.matches(':disabled')))
      .toBe(true);
    expect([...new FormData(form)]).toEqual([]);
    fieldset.disabled = false;
    await expect
      .poll(() => radiosOf(group).every((radio) => !radio.matches(':disabled')))
      .toBe(true);
    await group.update({ disabled: true });
    expect(radiosOf(group).every((radio) => radio.matches(':disabled'))).toBe(true);
    radiosOf(group)[2]?.click();
    expect(changed).not.toHaveBeenCalled();
    expect([...new FormData(form)]).toEqual([]);
  });

  it('sets aria-invalid on the group for the error state', async () => {
    const group = await mount({ state: 'error' });
    expect(group.part('options').getAttribute('aria-invalid')).toBe('true');
    await restPointer();
    const errorBorder = getComputedStyle(radiosOf(group)[0] ?? group.element).borderTopColor;
    await group.update({ state: 'default' });
    expect(group.part('options').hasAttribute('aria-invalid')).toBe(false);
    // The colour changes with a transition, so the comparison waits for its end.
    await expect
      .poll(() => getComputedStyle(radiosOf(group)[0] ?? group.element).borderTopColor)
      .not.toBe(errorBorder);
  });

  it('hides the whole group with the hidden attribute', async () => {
    const group = await mount({}, { attributes: { hidden: 'hidden' } });
    expect(getComputedStyle(group.element).display).toBe('none');
  });

  it('keeps its labels, hint and options legible on every theme and surface', async () => {
    for (const theme of ['light', 'dark'] as const) {
      for (const surface of ['default', 'subtle', 'inverse', 'primary'] as const) {
        for (const state of ['default', 'error'] as const) {
          const context = { theme, surface };
          const group = await mount({ state, hint: 'Feedback', defaultValue: 'small' }, context);
          const outer = surfaceColor(context);
          const message = `${theme}/${surface}/${state}`;
          for (const part of ['label', 'hint']) {
            expect(
              contrastRatio(getComputedStyle(group.part(part)).color, outer),
              `${message}/${part}`,
            ).toBeGreaterThanOrEqual(4.5);
          }
          for (const radio of radiosOf(group)) {
            expect(
              contrastRatio(getComputedStyle(radio).borderTopColor, outer),
              `${message}/radio`,
            ).toBeGreaterThanOrEqual(3);
          }
          await group.unmount();
          mounted.splice(mounted.indexOf(group), 1);
        }
      }
    }
  });
}
