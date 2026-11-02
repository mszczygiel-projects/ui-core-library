import {
  configureUiCore,
  resetUiCoreConfig,
} from '@mszczygiel-projects/ui-core-foundations/config';
import type { ComboboxProps } from '@mszczygiel-projects/ui-core-shared/combobox';
import type {
  ListboxItems,
  ListboxValue,
  ListboxValueChangeDetails,
} from '@mszczygiel-projects/ui-core-shared/listbox';
import type { SelectFieldOpenChangeDetails } from '@mszczygiel-projects/ui-core-shared/select-field';
import { afterEach, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { appearance } from '../appearance.ts';
import { textContrast } from '../contrast.ts';
import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { pseudoLabels } from '../pseudo.ts';
import { tokenValue } from '../tokens.ts';
import { FRUIT, highlightedOf, optionsOf, paintSurface, selectedOf } from './listbox.contract.ts';
import { formFixture } from './text-control.contract.ts';

/** The props of the specification, plus what each harness translates. */
export interface ComboboxContractProps extends Omit<ComboboxProps, 'options'> {
  readonly options?: ListboxItems;
  /** The initial value: an attribute or defaultValue in the web component, defaultValue in React. */
  readonly defaultValue?: ListboxValue;
  readonly onValueChange?: (value: ListboxValue, details: ListboxValueChangeDetails<Event>) => void;
  readonly onOpenChange?: (open: boolean, details: SelectFieldOpenChangeDetails<Event>) => void;
  readonly onQueryChange?: (query: string, details: { readonly originalEvent: Event }) => void;
  readonly onCreate?: (query: string, details: { readonly originalEvent: Event }) => void;
}

type Field = Mounted<ComboboxContractProps>;

const FAUNA: ListboxItems = [
  { value: 'turtle', label: 'Żółw' },
  { value: 'stork', label: 'Bocian' },
  { value: 'otter', label: 'Wydra' },
];

/** The popup of the list, open or closed; React renders it only while it is open. */
function popupOf(field: Field): HTMLElement | null {
  const root = field.element.shadowRoot ?? field.element.ownerDocument;
  return root.querySelector<HTMLElement>('[popover]');
}

function isOpen(field: Field): boolean {
  return popupOf(field)?.matches(':popover-open') === true;
}

function chipsOf(field: Field): string[] {
  const root = field.element.shadowRoot ?? field.element;
  // The text of a chip, without the hidden name of its dismiss button.
  return [...root.querySelectorAll('.chip, .ui-combobox__chip')].map((chip) =>
    (chip.querySelector('.ui-chip__label') ?? chip).textContent.trim(),
  );
}

function labelsOf(field: Field): string[] {
  return optionsOf(field).map((option) => option.textContent);
}

/** The behaviour of Combobox, applied unchanged to the web component and the React component. */
export function comboboxContract(adapter: Mount<ComboboxContractProps>): void {
  const mounted: Field[] = [];
  const fixtures: HTMLElement[] = [];
  async function mount(props: ComboboxContractProps = {}, options?: MountOptions) {
    const field = await adapter({ label: 'Fruit', options: FRUIT, ...props }, options);
    mounted.push(field);
    return field;
  }
  afterEach(async () => {
    resetUiCoreConfig();
    for (const field of mounted.splice(0)) {
      await field.unmount();
    }
    for (const fixture of fixtures.splice(0)) {
      fixture.remove();
    }
  });

  const input = (field: Field) => field.part('input') as HTMLInputElement;

  async function type(field: Field, text: string) {
    await userEvent.click(input(field));
    await userEvent.keyboard(text);
  }

  /** Types over the whole text of the input, such as the label of a chosen option. */
  async function retype(field: Field, text: string) {
    await userEvent.click(input(field));
    input(field).select();
    await userEvent.keyboard(text);
  }

  it('uses the documented defaults and falls back after invalid runtime settings', async () => {
    const field = await mount();
    const explicit = await mount({
      variant: 'outline',
      size: 'medium',
      labelPlacement: 'top',
      state: 'default',
      filterMode: 'local',
    });
    expect(appearance(field.part('control'))).toEqual(appearance(explicit.part('control')));
    expect(isOpen(field)).toBe(false);
    await field.update({
      variant: 'unsupported',
      size: 'unsupported',
      labelPlacement: 'unsupported',
      state: 'unsupported',
      filterMode: 'unsupported',
    } as unknown as ComboboxContractProps);
    expect(appearance(field.part('control'))).toEqual(appearance(explicit.part('control')));
    await type(field, 'ch');
    expect(labelsOf(field)).toEqual(['Cherry']);
  });

  it('is an editable combobox with a list, named by its label and described by its hint', async () => {
    const field = await mount({ hint: 'Pick one' });
    const node = (await field.accessibleTree()).find((item) => item.role === 'combobox');
    expect(node?.name).toBe(
      tokenValue('--control-label-text-uppercase') === 'uppercase' ? 'FRUIT' : 'Fruit',
    );
    expect(node?.description).toBe('Pick one');
    expect(input(field).getAttribute('aria-autocomplete')).toBe('list');
    expect(input(field).getAttribute('aria-expanded')).toBe('false');
    expect(input(field).value).toBe('');
    expect(input(field).placeholder.trim()).toBe('');
  });

  it('opens on a press and on ArrowDown, never on focus alone', async () => {
    const opened = vi.fn<NonNullable<ComboboxContractProps['onOpenChange']>>();
    const field = await mount({ defaultValue: 'cherry', onOpenChange: opened });
    input(field).focus();
    expect(isOpen(field)).toBe(false);
    await userEvent.keyboard('{ArrowDown}');
    expect(isOpen(field)).toBe(true);
    expect(highlightedOf(field, input(field))).toBe('Cherry');
    await userEvent.keyboard('{Escape}');
    await userEvent.click(input(field));
    expect(isOpen(field)).toBe(true);
    expect(input(field).getAttribute('aria-controls')).toBe(field.part('listbox').id);
    expect(opened.mock.calls.map(([open]) => open)).toEqual([true, false, true]);
  });

  it('only moves the focus on a click of its label', async () => {
    const field = await mount();
    await userEvent.click(field.part('label'));
    expect(isOpen(field)).toBe(false);
    expect(input(field).matches(':focus')).toBe(true);
  });

  it('filters as a user types, ignoring case and diacritics, and chooses the first match with Enter', async () => {
    const changed = vi.fn<NonNullable<ComboboxContractProps['onValueChange']>>();
    const queried = vi.fn<NonNullable<ComboboxContractProps['onQueryChange']>>();
    const field = await mount({ options: FAUNA, onValueChange: changed, onQueryChange: queried });
    await type(field, 'ZOLW');
    expect(isOpen(field)).toBe(true);
    expect(labelsOf(field)).toEqual(['Żółw']);
    expect(highlightedOf(field, input(field))).toBe('Żółw');
    expect(queried.mock.calls.map(([query]) => query)).toEqual(['Z', 'ZO', 'ZOL', 'ZOLW']);
    await userEvent.keyboard('{Enter}');
    expect(isOpen(field)).toBe(false);
    expect(input(field).value).toBe('Żółw');
    expect(changed).toHaveBeenCalledExactlyOnceWith('turtle', expect.anything());
    expect(changed.mock.calls[0]?.[1].originalEvent).toBeInstanceOf(KeyboardEvent);
    expect(queried).toHaveBeenLastCalledWith('', expect.anything());
  });

  it('drops the groups without a match and shows a message when nothing matches', async () => {
    const field = await mount({
      options: [
        { label: 'Berries', options: [{ value: 'blueberry', label: 'Blueberry' }] },
        { label: 'Stone fruit', options: [{ value: 'cherry', label: 'Cherry' }] },
      ],
    });
    await type(field, 'blue');
    expect(field.part('listbox').querySelectorAll('[role="group"]')).toHaveLength(1);
    await userEvent.keyboard('x');
    expect(optionsOf(field)).toHaveLength(0);
    expect(field.part('message').textContent).toBe('No options');
  });

  it('leaves Home, End and the side arrows to the cursor, and moves the highlight with the others', async () => {
    const field = await mount();
    await type(field, 'b');
    expect(highlightedOf(field, input(field))).toBe('Blueberry');
    await userEvent.keyboard('{Home}');
    expect(input(field).selectionStart).toBe(0);
    await userEvent.keyboard('{End}{ArrowLeft}');
    expect(input(field).selectionStart).toBe(0);
    expect(highlightedOf(field, input(field))).toBe('Blueberry');
    await userEvent.keyboard('{End}{Backspace}{ArrowDown}{ArrowDown}');
    expect(highlightedOf(field, input(field))).toBe('Cherry');
    await userEvent.keyboard('{ArrowDown}');
    expect(highlightedOf(field, input(field))).toBe('Cherry');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(highlightedOf(field, input(field))).toBe('Apple');
  });

  it('closes without a change on Escape, Tab and a press outside, giving the label back', async () => {
    const changed = vi.fn();
    const field = await mount({ defaultValue: 'apple', onValueChange: changed });
    await retype(field, 'ch');
    expect(input(field).value).toBe('ch');
    await userEvent.keyboard('{Escape}');
    expect(isOpen(field)).toBe(false);
    expect(input(field).value).toBe('Apple');
    await userEvent.keyboard('ch{Tab}');
    expect(isOpen(field)).toBe(false);
    expect(input(field).value).toBe('Apple');
    const outside = document.createElement('p');
    outside.textContent = 'Outside';
    outside.style.cssText = 'position: fixed; inset-block-end: 0; inset-inline-end: 0; margin: 0;';
    document.body.append(outside);
    fixtures.push(outside);
    await type(field, 'b');
    await userEvent.click(outside);
    expect(isOpen(field)).toBe(false);
    expect(input(field).value).toBe('Apple');
    expect(changed).not.toHaveBeenCalled();
  });

  it('lets Escape of a closed list reach the page', async () => {
    const field = await mount();
    const heard = vi.fn();
    document.addEventListener('keydown', heard);
    input(field).focus();
    await userEvent.keyboard('{Escape}');
    document.removeEventListener('keydown', heard);
    expect(heard).toHaveBeenCalledOnce();
  });

  it('chooses several options as chips, keeping the list open and emptying the query', async () => {
    const changed = vi.fn<NonNullable<ComboboxContractProps['onValueChange']>>();
    const field = await mount({ multiple: true, onValueChange: changed });
    await type(field, 'ch');
    await userEvent.keyboard('{Enter}');
    expect(isOpen(field)).toBe(true);
    expect(input(field).value).toBe('');
    expect(chipsOf(field)).toEqual(['Cherry']);
    expect(highlightedOf(field, input(field))).toBe('Cherry');
    await page.getByRole('option', { name: 'Apple' }).click();
    expect(chipsOf(field)).toEqual(['Cherry', 'Apple']);
    expect(selectedOf(field)).toEqual([true, false, false, true]);
    expect(changed.mock.calls.map(([value]) => value)).toEqual([['cherry'], ['cherry', 'apple']]);
    await userEvent.keyboard('{Backspace}');
    expect(chipsOf(field)).toEqual(['Cherry']);
    expect(changed).toHaveBeenLastCalledWith(['cherry'], expect.anything());
  });

  it('never gets shorter when chips fill it, in every size', async () => {
    const height = (field: Field) => field.part('control').getBoundingClientRect().height;
    for (const size of ['small', 'medium', 'large'] as const) {
      const empty = await mount({ multiple: true, size });
      const filled = await mount({ multiple: true, size, defaultValue: ['apple', 'cherry'] });
      await expect.poll(() => chipsOf(filled)).toEqual(['Apple', 'Cherry']);
      expect(height(filled), size).toBeGreaterThanOrEqual(height(empty));
    }
  });

  it('removes a chip with its button, which stays out of the Tab order', async () => {
    const field = await mount({ multiple: true, defaultValue: ['apple', 'cherry'] });
    const root = field.element.shadowRoot ?? field.element;
    const chip = root.querySelector<HTMLElement>('.chip, .ui-combobox__chip');
    const dismiss =
      chip?.shadowRoot?.querySelector<HTMLButtonElement>('.dismiss') ??
      chip?.querySelector<HTMLButtonElement>('.ui-chip__dismiss');
    expect(dismiss?.tabIndex).toBe(-1);
    expect(dismiss?.getAttribute('aria-labelledby')).toBeTruthy();
    if (dismiss === null || dismiss === undefined) {
      throw new Error('Expected a dismiss button');
    }
    await userEvent.click(dismiss);
    expect(chipsOf(field)).toEqual(['Cherry']);
    expect(input(field).matches(':focus')).toBe(true);
  });

  it('shows the options as given in remote filtering, and keeps the labels of chosen ones', async () => {
    const queried = vi.fn();
    const { form, fieldset } = formFixture(fixtures);
    const field = await mount(
      { name: 'fruit', multiple: true, filterMode: 'remote', onQueryChange: queried },
      { parent: fieldset },
    );
    await type(field, 'zzz');
    expect(labelsOf(field)).toEqual(['Apple', 'Banana', 'Blueberry', 'Cherry']);
    expect(queried).toHaveBeenLastCalledWith('zzz', expect.anything());
    await page.getByRole('option', { name: 'Apple' }).click();
    await field.update({ options: [{ value: 'kiwi', label: 'Kiwi' }] });
    expect(chipsOf(field)).toEqual(['Apple']);
    expect([...new FormData(form)]).toEqual([['fruit', 'apple']]);
  });

  it('keeps the label of a value set from outside after the options change', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const field = await mount(
      { name: 'fruit', filterMode: 'remote', value: '' },
      { parent: fieldset },
    );
    await field.update({ value: 'apple' });
    await field.update({ options: [{ value: 'kiwi', label: 'Kiwi' }] });
    await expect.poll(() => input(field).value).toBe('Apple');
    expect([...new FormData(form)]).toEqual([['fruit', 'apple']]);
  });

  it('restores the default value on reset after its option left the options', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const field = await mount(
      { name: 'fruit', filterMode: 'remote', defaultValue: 'apple' },
      { parent: fieldset },
    );
    await field.update({ options: [{ value: 'banana', label: 'Banana' }] });
    await userEvent.click(input(field));
    await page.getByRole('option', { name: 'Banana' }).click();
    expect([...new FormData(form)]).toEqual([['fruit', 'banana']]);
    form.reset();
    await expect.poll(() => input(field).value).toBe('Apple');
    expect([...new FormData(form)]).toEqual([['fruit', 'apple']]);
    expect(form.checkValidity()).toBe(true);
  });

  it('clears a single clearable choice whose text a user empties, unless Escape cancels', async () => {
    const changed = vi.fn();
    const field = await mount({ clearable: true, defaultValue: 'apple', onValueChange: changed });
    await retype(field, '{Backspace}{Escape}');
    expect(input(field).value).toBe('Apple');
    expect(changed).not.toHaveBeenCalled();
    await retype(field, '{Backspace}{Tab}');
    expect(changed).toHaveBeenCalledExactlyOnceWith('', expect.anything());
    await expect.poll(() => input(field).value).toBe('');
    const kept = await mount({ defaultValue: 'apple', onValueChange: changed });
    changed.mockClear();
    await retype(kept, '{Backspace}{Tab}');
    expect(changed).not.toHaveBeenCalled();
    await expect.poll(() => input(kept).value).toBe('Apple');
  });

  it('offers to create an option from a query that no label equals', async () => {
    const created = vi.fn<NonNullable<ComboboxContractProps['onCreate']>>();
    const changed = vi.fn();
    const field = await mount({ allowCreate: true, onCreate: created, onValueChange: changed });
    await type(field, 'apple');
    expect(field.element.shadowRoot?.querySelector('[part="create"]') ?? null).toBeNull();
    expect(document.querySelector('.ui-combobox__create')).toBeNull();
    await userEvent.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}kiwi ');
    expect(field.part('create').textContent).toBe('Create “kiwi”');
    expect(field.part('create').getAttribute('role')).toBe('option');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(created).toHaveBeenCalledExactlyOnceWith('kiwi', expect.anything());
    expect(changed).not.toHaveBeenCalled();
    expect(isOpen(field)).toBe(false);
  });

  it('shows that options load instead of the options', async () => {
    const field = await mount({ loading: true });
    await userEvent.click(input(field));
    expect(optionsOf(field)).toHaveLength(0);
    expect(field.part('listbox').getAttribute('aria-busy')).toBe('true');
    expect(field.part('message').textContent).toBe('Loading options');
    await field.update({ loadingLabel: 'Fetching' });
    expect(field.part('message').textContent).toBe('Fetching');
  });

  it('takes the texts it renders from its props or the configuration', async () => {
    configureUiCore({ labels: pseudoLabels });
    const field = await mount({ clearable: true, allowCreate: true, defaultValue: 'apple' });
    await expect
      .poll(() => field.part('clear').getAttribute('aria-label'))
      .toBe(pseudoLabels.combobox.clear);
    await retype(field, 'zz');
    expect(field.part('create').textContent).toBe(pseudoLabels.combobox.create('zz'));
    await field.update({ getCreateLabel: (query: string) => `Add ${query}`, clearLabel: 'Reset' });
    expect(field.part('create').textContent).toBe('Add zz');
    expect(field.part('clear').getAttribute('aria-label')).toBe('Reset');
    await field.update({ allowCreate: false });
    expect(field.part('message').textContent).toBe(pseudoLabels.listbox.empty);
  });

  it('keeps the clear button beside the input, clearing the choice and the query', async () => {
    const changed = vi.fn();
    const field = await mount({ clearable: true, defaultValue: 'apple', onValueChange: changed });
    expect(input(field).contains(field.part('clear'))).toBe(false);
    await userEvent.click(field.part('clear'));
    expect(changed).toHaveBeenCalledWith('', expect.anything());
    expect(input(field).value).toBe('');
    await expect.poll(() => field.part('clear').hidden).toBe(true);
  });

  it('submits each chosen value under its name, and resets without an event', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const changed = vi.fn();
    const field = await mount(
      { name: 'fruit', defaultValue: 'apple', onValueChange: changed },
      { parent: fieldset },
    );
    expect([...new FormData(form)]).toEqual([['fruit', 'apple']]);
    form.reset();
    await expect.poll(() => [...new FormData(form)]).toEqual([['fruit', 'apple']]);
    await retype(field, 'cherry{Enter}');
    expect([...new FormData(form)]).toEqual([['fruit', 'cherry']]);
    changed.mockClear();
    form.reset();
    await expect.poll(() => input(field).value).toBe('Apple');
    expect([...new FormData(form)]).toEqual([['fruit', 'apple']]);
    expect(changed).not.toHaveBeenCalled();
    await mount(
      { name: 'many', multiple: true, defaultValue: ['apple', 'cherry'] },
      { parent: fieldset },
    );
    expect(new FormData(form).getAll('many')).toEqual(['apple', 'cherry']);
  });

  it('blocks a submission until a required field has a choice', async () => {
    const { form, fieldset, submitted } = formFixture(fixtures);
    const field = await mount(
      { name: 'fruit', required: true, multiple: true },
      { parent: fieldset },
    );
    form.requestSubmit();
    expect(submitted).not.toHaveBeenCalled();
    expect(form.checkValidity()).toBe(false);
    await type(field, 'apple{Enter}');
    form.requestSubmit();
    expect(submitted).toHaveBeenCalledExactlyOnceWith(null, [['fruit', 'apple']]);
  });

  it('disables the field with its prop and its fieldset, and submits nothing', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const field = await mount({ name: 'fruit', defaultValue: 'apple' }, { parent: fieldset });
    fieldset.disabled = true;
    await expect.poll(() => input(field).disabled).toBe(true);
    expect([...new FormData(form)]).toEqual([]);
    fieldset.disabled = false;
    await expect.poll(() => input(field).disabled).toBe(false);
    await field.update({ disabled: true, open: true });
    expect(isOpen(field)).toBe(false);
  });

  it('follows a controlled open state, highlighting the chosen option', async () => {
    const field = await mount({ open: true, defaultValue: 'cherry' });
    await expect.poll(() => isOpen(field)).toBe(true);
    expect(highlightedOf(field, input(field))).toBe('Cherry');
    await field.update({ open: false });
    await expect.poll(() => isOpen(field)).toBe(false);
    expect(input(field).hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('names its open list by the label of the field and sets aria-invalid for the error state', async () => {
    const field = await mount({ state: 'error' });
    expect(input(field).getAttribute('aria-invalid')).toBe('true');
    await userEvent.click(input(field));
    const node = (await field.accessibleTree()).find((item) => item.role === 'listbox');
    expect(node?.name).toBe(
      tokenValue('--control-label-text-uppercase') === 'uppercase' ? 'FRUIT' : 'Fruit',
    );
  });

  it('aligns its list with the start of the field in right-to-left text', async () => {
    const field = await mount({}, { attributes: { dir: 'rtl' } });
    await userEvent.click(input(field));
    const popup = popupOf(field)?.getBoundingClientRect();
    const control = field.part('control').getBoundingClientRect();
    expect(Math.abs((popup?.right ?? 0) - control.right)).toBeLessThan(1);
  });

  it('keeps its value, chips and options legible on every theme and surface', async () => {
    for (const theme of ['light', 'dark'] as const) {
      for (const surface of ['default', 'subtle', 'inverse', 'primary'] as const) {
        const field = await mount({ multiple: true, defaultValue: ['apple'] }, { theme, surface });
        paintSurface(field, { theme, surface });
        await userEvent.click(input(field));
        const message = `${theme}/${surface}`;
        const [apple] = optionsOf(field);
        expect(textContrast(apple ?? field.element), `${message}/option`).toBeGreaterThanOrEqual(
          4.5,
        );
        await field.unmount();
        mounted.splice(mounted.indexOf(field), 1);
      }
    }
  });
}
