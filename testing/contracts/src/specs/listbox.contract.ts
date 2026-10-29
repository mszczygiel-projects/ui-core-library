import {
  configureUiCore,
  resetUiCoreConfig,
} from '@mszczygiel-projects/ui-core-foundations/config';
import type {
  ListboxItems,
  ListboxProps,
  ListboxValue,
  ListboxValueChangeDetails,
} from '@mszczygiel-projects/ui-core-shared/listbox';
import { afterEach, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { contrastRatio, textContrast } from '../contrast.ts';
import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { pseudoLabels } from '../pseudo.ts';
import { pixels, tokenValue } from '../tokens.ts';
import { restPointer, surfaceColor } from './choice.contract.ts';
import { formFixture } from './text-control.contract.ts';

/** The props of the specification, plus what each harness translates. */
export interface ListboxContractProps extends Omit<ListboxProps, 'options'> {
  readonly options?: ListboxItems;
  /** The initial value: an attribute or defaultValue in the web component, defaultValue in React. */
  readonly defaultValue?: ListboxValue;
  readonly onValueChange?: (value: ListboxValue, details: ListboxValueChangeDetails<Event>) => void;
}

export const FRUIT: ListboxItems = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana', disabled: true },
  { value: 'blueberry', label: 'Blueberry' },
  { value: 'cherry', label: 'Cherry' },
];

export const GROUPED: ListboxItems = [
  { label: 'Fruit', options: [{ value: 'apple', label: 'Apple' }] },
  { label: 'Vegetables', options: [{ value: 'carrot', label: 'Carrot' }] },
  { options: [{ value: 'other', label: 'Other' }] },
];

/** The options a component renders, in order, inside its shadow root or its tree. */
export function optionsOf(control: Mounted<object>): HTMLElement[] {
  const root = control.element.shadowRoot ?? control.element.ownerDocument;
  return [...root.querySelectorAll<HTMLElement>('[role="option"]')];
}

/** Which options are chosen, by `aria-selected`. */
export function selectedOf(control: Mounted<object>): boolean[] {
  return optionsOf(control).map((option) => option.getAttribute('aria-selected') === 'true');
}

/** The option that the active descendant of `owner` names. */
export function highlightedOf(control: Mounted<object>, owner: HTMLElement): string | undefined {
  const id = owner.getAttribute('aria-activedescendant');
  return optionsOf(control).find((option) => option.id === id)?.textContent;
}

/** Paints the frame of a component with its surface, as the page behind it would be. */
export function paintSurface(
  control: Mounted<object>,
  context: Pick<MountOptions, 'theme' | 'surface'>,
): void {
  const frame = control.element.parentElement;
  if (frame !== null) {
    frame.style.backgroundColor = surfaceColor(context);
  }
}

/** The behaviour of Listbox, applied unchanged to the web component and the React component. */
export function listboxContract(adapter: Mount<ListboxContractProps>): void {
  const mounted: Mounted<ListboxContractProps>[] = [];
  const fixtures: HTMLElement[] = [];
  async function mount(props: ListboxContractProps = {}, options?: MountOptions) {
    const list = await adapter({ label: 'Fruit', options: FRUIT, ...props }, options);
    mounted.push(list);
    return list;
  }
  afterEach(async () => {
    resetUiCoreConfig();
    for (const list of mounted.splice(0)) {
      await list.unmount();
    }
    for (const fixture of fixtures.splice(0)) {
      fixture.remove();
    }
  });

  it('uses the documented defaults and falls back after invalid runtime settings', async () => {
    const list = await mount();
    const rows = () => getComputedStyle(optionsOf(list)[0] ?? list.element).paddingBlockStart;
    const medium = rows();
    expect(pixels(medium)).toBe(pixels(tokenValue('--listbox-option-padding-stack')));
    expect(list.part('listbox').hasAttribute('aria-invalid')).toBe(false);
    expect(list.part('listbox').hasAttribute('aria-multiselectable')).toBe(false);
    await list.update({ size: 'small' });
    expect(pixels(rows())).toBe(pixels(tokenValue('--listbox-option-small-padding-stack')));
    await list.update({
      size: 'unsupported',
      state: 'unsupported',
    } as unknown as ListboxContractProps);
    expect(rows()).toBe(medium);
    expect(list.part('listbox').hasAttribute('aria-invalid')).toBe(false);
  });

  it('is one list named by its label and described by its hint, of named options', async () => {
    const list = await mount({ hint: 'Pick one' });
    const tree = await list.accessibleTree();
    const lists = tree.filter((node) => node.role === 'listbox');
    expect(lists).toHaveLength(1);
    expect(lists[0]?.name).toBe(
      tokenValue('--control-label-text-uppercase') === 'uppercase' ? 'FRUIT' : 'Fruit',
    );
    expect(lists[0]?.description).toBe('Pick one');
    expect(tree.filter((node) => node.role === 'option').map((node) => node.name)).toEqual([
      'Apple',
      'Banana',
      'Blueberry',
      'Cherry',
    ]);
    expect(optionsOf(list)[1]?.getAttribute('aria-disabled')).toBe('true');
  });

  it('lets an author name a list without a visible label', async () => {
    const list = await mount({ label: '' }, { attributes: { 'aria-label': 'Snack' } });
    const tree = await list.accessibleTree();
    expect(tree.find((node) => node.role === 'listbox')?.name).toBe('Snack');
  });

  it('names its groups by their headings and separates a group without one', async () => {
    const list = await mount({ options: GROUPED });
    const tree = await list.accessibleTree();
    const heading = (text: string) =>
      tokenValue('--listbox-group-text-uppercase') === 'uppercase' ? text.toUpperCase() : text;
    expect(tree.filter((node) => node.role === 'group').map((node) => node.name)).toEqual([
      heading('Fruit'),
      heading('Vegetables'),
      '',
    ]);
    expect(optionsOf(list).map((option) => option.textContent)).toEqual([
      'Apple',
      'Carrot',
      'Other',
    ]);
  });

  it('is one stop for Tab, and highlights the chosen option or else the first enabled one', async () => {
    const before = document.createElement('button');
    before.textContent = 'Before';
    document.body.prepend(before);
    fixtures.push(before);
    const list = await mount({ defaultValue: 'cherry' });
    before.focus();
    await userEvent.tab();
    expect(list.part('listbox').matches(':focus')).toBe(true);
    expect(highlightedOf(list, list.part('listbox'))).toBe('Cherry');
    await userEvent.tab();
    expect(list.part('listbox').matches(':focus')).toBe(false);
  });

  it('moves the choice with the keys in a single choice, past disabled options and not around the ends', async () => {
    const changed = vi.fn<NonNullable<ListboxContractProps['onValueChange']>>();
    const list = await mount({ onValueChange: changed });
    list.part('listbox').focus();
    await expect.poll(() => highlightedOf(list, list.part('listbox'))).toBe('Apple');
    await userEvent.keyboard('{ArrowDown}');
    expect(selectedOf(list)).toEqual([false, false, true, false]);
    await userEvent.keyboard('{End}');
    expect(selectedOf(list)).toEqual([false, false, false, true]);
    await userEvent.keyboard('{ArrowDown}');
    expect(selectedOf(list)).toEqual([false, false, false, true]);
    await userEvent.keyboard('{Home}');
    expect(selectedOf(list)).toEqual([true, false, false, false]);
    await userEvent.keyboard('{ArrowUp}');
    expect(changed.mock.calls.map(([value]) => value)).toEqual(['blueberry', 'cherry', 'apple']);
    expect(changed.mock.calls[0]?.[1].originalEvent).toBeInstanceOf(KeyboardEvent);
  });

  it('moves to the option that typed letters start', async () => {
    const list = await mount();
    list.part('listbox').focus();
    await userEvent.keyboard('c');
    expect(selectedOf(list)).toEqual([false, false, false, true]);
    await list.unmount();
    mounted.splice(mounted.indexOf(list), 1);
    const again = await mount();
    again.part('listbox').focus();
    // Letters typed in time add up, and a disabled option is passed over.
    await userEvent.keyboard('bl');
    expect(highlightedOf(again, again.part('listbox'))).toBe('Blueberry');
  });

  it('chooses an option with a click, and ignores a disabled one', async () => {
    const changed = vi.fn();
    const list = await mount({ onValueChange: changed });
    await page.getByText('Cherry').click();
    expect(selectedOf(list)).toEqual([false, false, false, true]);
    expect(list.part('listbox').matches(':focus')).toBe(true);
    await page.getByText('Banana').click({ force: true });
    expect(selectedOf(list)).toEqual([false, false, false, true]);
    await page.getByText('Cherry').click();
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it('turns options on and off in a multiple choice, with Space and the pointer', async () => {
    const changed = vi.fn<NonNullable<ListboxContractProps['onValueChange']>>();
    const list = await mount({ multiple: true, onValueChange: changed });
    expect(list.part('listbox').getAttribute('aria-multiselectable')).toBe('true');
    list.part('listbox').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(selectedOf(list)).toEqual([false, false, false, false]);
    await userEvent.keyboard(' ');
    await page.getByText('Apple').click();
    expect(selectedOf(list)).toEqual([true, false, true, false]);
    await page.getByText('Blueberry').click();
    expect(selectedOf(list)).toEqual([true, false, false, false]);
    expect(changed.mock.calls.map(([value]) => value)).toEqual([
      ['blueberry'],
      ['blueberry', 'apple'],
      ['apple'],
    ]);
  });

  it('submits one entry for each chosen value, and resets without an event', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const changed = vi.fn();
    await mount(
      { name: 'fruit', multiple: true, defaultValue: ['apple', 'cherry'], onValueChange: changed },
      { parent: fieldset },
    );
    expect([...new FormData(form)]).toEqual([
      ['fruit', 'apple'],
      ['fruit', 'cherry'],
    ]);
    await page.getByText('Apple').click();
    expect([...new FormData(form)]).toEqual([['fruit', 'cherry']]);
    changed.mockClear();
    form.reset();
    await expect.poll(() => new FormData(form).getAll('fruit')).toEqual(['apple', 'cherry']);
    expect(changed).not.toHaveBeenCalled();
  });

  it('submits an empty single choice as an empty string, and a value no option has as none', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const list = await mount({ name: 'fruit', value: 'grape' }, { parent: fieldset });
    expect(selectedOf(list)).toEqual([false, false, false, false]);
    expect([...new FormData(form)]).toEqual([['fruit', '']]);
    await list.update({ value: 'cherry' });
    expect([...new FormData(form)]).toEqual([['fruit', 'cherry']]);
  });

  it('blocks a submission until a required list has a choice', async () => {
    const { form, fieldset, submitted } = formFixture(fixtures);
    await mount({ name: 'fruit', required: true }, { parent: fieldset });
    form.requestSubmit();
    expect(submitted).not.toHaveBeenCalled();
    expect(form.checkValidity()).toBe(false);
    await page.getByText('Apple').click();
    form.requestSubmit();
    expect(submitted).toHaveBeenCalledExactlyOnceWith(null, [['fruit', 'apple']]);
  });

  it('disables the list with its prop and its fieldset, and submits nothing', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const changed = vi.fn();
    const list = await mount(
      { name: 'fruit', defaultValue: 'apple', onValueChange: changed },
      { parent: fieldset },
    );
    fieldset.disabled = true;
    await expect.poll(() => list.part('listbox').getAttribute('aria-disabled')).toBe('true');
    expect([...new FormData(form)]).toEqual([]);
    fieldset.disabled = false;
    await expect.poll(() => list.part('listbox').hasAttribute('aria-disabled')).toBe(false);
    await list.update({ disabled: true });
    expect(list.part('listbox').tabIndex).toBe(-1);
    await page.getByText('Cherry').click({ force: true });
    expect(changed).not.toHaveBeenCalled();
    expect(selectedOf(list)).toEqual([true, false, false, false]);
  });

  it('sets aria-invalid for the error state', async () => {
    const list = await mount({ state: 'error' });
    expect(list.part('listbox').getAttribute('aria-invalid')).toBe('true');
  });

  it('shows the message of an empty list from its prop or the configuration', async () => {
    const list = await mount({ options: [] });
    expect(list.part('message').textContent).toBe('No options');
    configureUiCore({ labels: pseudoLabels });
    await expect.poll(() => list.part('message').textContent).toBe(pseudoLabels.listbox.empty);
    await list.update({ emptyLabel: 'Nothing here' });
    expect(list.part('message').textContent).toBe('Nothing here');
  });

  it('marks the chosen option and paints the highlight from its tokens', async () => {
    const list = await mount({ defaultValue: 'apple' });
    await restPointer();
    list.part('listbox').focus();
    const [apple, , blueberry] = optionsOf(list);
    const mark = (option: HTMLElement | undefined) =>
      getComputedStyle(option?.querySelector('[aria-hidden="true"]:last-child') ?? list.element)
        .visibility;
    expect(mark(apple)).toBe('visible');
    expect(mark(blueberry)).toBe('hidden');
    const probe = document.createElement('span');
    probe.style.backgroundColor = tokenValue('--color-listbox-option-background-highlighted');
    document.body.append(probe);
    const highlighted = getComputedStyle(probe).backgroundColor;
    probe.remove();
    await expect
      .poll(() => getComputedStyle(apple ?? list.element).backgroundColor)
      .toBe(highlighted);
  });

  it('keeps its options legible on every theme and surface', async () => {
    for (const theme of ['light', 'dark'] as const) {
      for (const surface of ['default', 'subtle', 'inverse', 'primary'] as const) {
        const context = { theme, surface };
        const list = await mount({ defaultValue: 'apple', hint: 'Feedback' }, context);
        paintSurface(list, context);
        list.part('listbox').focus();
        const message = `${theme}/${surface}`;
        const outer = surfaceColor(context);
        for (const part of ['label', 'hint']) {
          expect(
            contrastRatio(getComputedStyle(list.part(part)).color, outer),
            `${message}/${part}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
        expect(
          contrastRatio(getComputedStyle(list.part('listbox')).borderTopColor, outer),
          `${message}/border`,
        ).toBeGreaterThanOrEqual(3);
        const [apple] = optionsOf(list);
        expect(
          textContrast(apple ?? list.element),
          `${message}/highlighted option`,
        ).toBeGreaterThanOrEqual(4.5);
        await list.unmount();
        mounted.splice(mounted.indexOf(list), 1);
      }
    }
  });
}
