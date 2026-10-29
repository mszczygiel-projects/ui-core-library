import {
  configureUiCore,
  resetUiCoreConfig,
} from '@mszczygiel-projects/ui-core-foundations/config';
import type {
  ListboxItems,
  ListboxValueChangeDetails,
} from '@mszczygiel-projects/ui-core-shared/listbox';
import type {
  SelectFieldOpenChangeDetails,
  SelectFieldProps,
} from '@mszczygiel-projects/ui-core-shared/select-field';
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
export interface SelectFieldContractProps extends Omit<SelectFieldProps, 'options'> {
  readonly options?: ListboxItems;
  /** The initial value: the value attribute of the web component, defaultValue in React. */
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string, details: ListboxValueChangeDetails<Event>) => void;
  readonly onOpenChange?: (open: boolean, details: SelectFieldOpenChangeDetails<Event>) => void;
}

type Field = Mounted<SelectFieldContractProps>;

/** The popup of the list, open or closed; React renders it only while it is open. */
function popupOf(field: Field): HTMLElement | null {
  const root = field.element.shadowRoot ?? field.element.ownerDocument;
  return root.querySelector<HTMLElement>('[popover]');
}

function isOpen(field: Field): boolean {
  return popupOf(field)?.matches(':popover-open') === true;
}

/** The behaviour of SelectField, applied unchanged to the web component and the React component. */
export function selectFieldContract(adapter: Mount<SelectFieldContractProps>): void {
  const mounted: Field[] = [];
  const fixtures: HTMLElement[] = [];
  async function mount(props: SelectFieldContractProps = {}, options?: MountOptions) {
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

  const trigger = (field: Field) => field.part('trigger');

  it('uses the documented defaults and falls back after invalid runtime settings', async () => {
    const field = await mount();
    const explicit = await mount({
      variant: 'outline',
      size: 'medium',
      labelPlacement: 'top',
      state: 'default',
    });
    expect(appearance(field.part('control'))).toEqual(appearance(explicit.part('control')));
    expect(isOpen(field)).toBe(false);
    expect(trigger(field).hasAttribute('aria-invalid')).toBe(false);
    await field.update({
      variant: 'unsupported',
      size: 'unsupported',
      labelPlacement: 'unsupported',
      state: 'unsupported',
    } as unknown as SelectFieldContractProps);
    expect(appearance(field.part('control'))).toEqual(appearance(explicit.part('control')));
  });

  it('is a collapsed combobox named by its label, not by its placeholder, and described by its hint', async () => {
    const field = await mount({ hint: 'Pick one', placeholder: 'Choose a fruit' });
    const node = (await field.accessibleTree()).find((item) => item.role === 'combobox');
    expect(node?.name).toBe(
      tokenValue('--control-label-text-uppercase') === 'uppercase' ? 'FRUIT' : 'Fruit',
    );
    expect(node?.description).toBe('Pick one');
    expect(trigger(field).getAttribute('aria-expanded')).toBe('false');
    expect(trigger(field).getAttribute('aria-haspopup')).toBe('listbox');
    expect(field.part('value').textContent).toBe('Choose a fruit');
  });

  it('lets an author name a field without a visible label', async () => {
    const field = await mount({ label: '' }, { attributes: { 'aria-label': 'Snack' } });
    const node = (await field.accessibleTree()).find((item) => item.role === 'combobox');
    expect(node?.name).toBe('Snack');
  });

  it('opens its list with a press, in the top layer, naming the chosen option', async () => {
    const opened = vi.fn<NonNullable<SelectFieldContractProps['onOpenChange']>>();
    const field = await mount({ defaultValue: 'cherry', onOpenChange: opened });
    await userEvent.click(trigger(field));
    expect(isOpen(field)).toBe(true);
    expect(trigger(field).getAttribute('aria-expanded')).toBe('true');
    const list = field.part('listbox');
    expect(trigger(field).getAttribute('aria-controls')).toBe(list.id);
    expect(highlightedOf(field, trigger(field))).toBe('Cherry');
    expect(selectedOf(field)).toEqual([false, false, false, true]);
    expect(trigger(field).matches(':focus')).toBe(true);
    await userEvent.click(trigger(field));
    expect(isOpen(field)).toBe(false);
    expect(opened.mock.calls.map(([open]) => open)).toEqual([true, false]);
  });

  it('only moves the focus on a click of its label', async () => {
    const field = await mount();
    await userEvent.click(field.part('label'));
    expect(isOpen(field)).toBe(false);
    expect(trigger(field).matches(':focus')).toBe(true);
  });

  it('opens with the keys of a closed list and highlights where they say', async () => {
    const field = await mount({ defaultValue: 'blueberry' });
    trigger(field).focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(highlightedOf(field, trigger(field))).toBe('Blueberry');
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{End}');
    expect(highlightedOf(field, trigger(field))).toBe('Cherry');
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{Home}');
    expect(highlightedOf(field, trigger(field))).toBe('Apple');
    await userEvent.keyboard('{Escape}');
    expect(isOpen(field)).toBe(false);
    await userEvent.keyboard('c');
    expect(isOpen(field)).toBe(true);
    expect(highlightedOf(field, trigger(field))).toBe('Cherry');
  });

  it('moves past disabled options and not around the ends, and chooses with Enter', async () => {
    const changed = vi.fn<NonNullable<SelectFieldContractProps['onValueChange']>>();
    const field = await mount({ onValueChange: changed });
    trigger(field).focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(highlightedOf(field, trigger(field))).toBe('Apple');
    await userEvent.keyboard('{ArrowUp}');
    expect(highlightedOf(field, trigger(field))).toBe('Apple');
    await userEvent.keyboard('{ArrowDown}');
    expect(highlightedOf(field, trigger(field))).toBe('Blueberry');
    expect(selectedOf(field)).toEqual([false, false, false, false]);
    await userEvent.keyboard('{Enter}');
    expect(isOpen(field)).toBe(false);
    expect(field.part('value').textContent).toBe('Blueberry');
    expect(changed).toHaveBeenCalledOnce();
    expect(changed.mock.calls[0]?.[0]).toBe('blueberry');
    expect(changed.mock.calls[0]?.[1].originalEvent).toBeInstanceOf(KeyboardEvent);
    expect(trigger(field).matches(':focus')).toBe(true);
  });

  it('closes without a change on Escape and Tab', async () => {
    const changed = vi.fn();
    const field = await mount({ defaultValue: 'apple', onValueChange: changed });
    trigger(field).focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Escape}');
    expect(isOpen(field)).toBe(false);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Tab}');
    expect(isOpen(field)).toBe(false);
    expect(field.part('value').textContent).toBe('Apple');
    expect(changed).not.toHaveBeenCalled();
  });

  it('chooses with a click, reports a change once, and closes on a press outside', async () => {
    const changed = vi.fn();
    const field = await mount({ onValueChange: changed });
    await userEvent.click(trigger(field));
    await page.getByRole('option', { name: 'Cherry' }).click();
    expect(isOpen(field)).toBe(false);
    expect(field.part('value').textContent).toBe('Cherry');
    await userEvent.click(trigger(field));
    await page.getByRole('option', { name: 'Cherry' }).click();
    expect(changed).toHaveBeenCalledTimes(1);
    const outside = document.createElement('p');
    outside.textContent = 'Outside';
    outside.style.cssText = 'position: fixed; inset-block-end: 0; inset-inline-end: 0; margin: 0;';
    document.body.append(outside);
    fixtures.push(outside);
    await userEvent.click(trigger(field));
    await userEvent.click(outside);
    expect(isOpen(field)).toBe(false);
  });

  it('keeps the clear button beside the trigger, never inside it', async () => {
    const changed = vi.fn();
    const field = await mount({ clearable: true, defaultValue: 'apple', onValueChange: changed });
    const clear = field.part('clear');
    expect(trigger(field).contains(clear)).toBe(false);
    expect(clear.getAttribute('aria-label')).toBe('Clear selection');
    await userEvent.click(clear);
    expect(isOpen(field)).toBe(false);
    expect(changed).toHaveBeenCalledWith('', expect.anything());
    await expect.poll(() => field.part('clear').hidden).toBe(true);
    await field.update({ value: 'cherry' });
    trigger(field).focus();
    await userEvent.keyboard('{Delete}');
    expect(changed).toHaveBeenLastCalledWith('', expect.anything());
  });

  it('takes the texts it renders from its props or the configuration', async () => {
    configureUiCore({ labels: pseudoLabels });
    const field = await mount({ clearable: true, defaultValue: 'apple', options: [] });
    await expect
      .poll(() => field.part('clear').getAttribute('aria-label'))
      .toBe(pseudoLabels.selectField.clear);
    await userEvent.click(trigger(field));
    expect(field.part('message').textContent).toBe(pseudoLabels.listbox.empty);
    await field.update({ clearLabel: 'Remove fruit', emptyLabel: 'Nothing' });
    expect(field.part('message').textContent).toBe('Nothing');
  });

  it('submits the chosen value or an empty string under its name, and resets without an event', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const changed = vi.fn();
    const field = await mount(
      { name: 'fruit', defaultValue: 'apple', onValueChange: changed },
      { parent: fieldset },
    );
    expect([...new FormData(form)]).toEqual([['fruit', 'apple']]);
    await userEvent.click(trigger(field));
    await page.getByRole('option', { name: 'Cherry' }).click();
    expect([...new FormData(form)]).toEqual([['fruit', 'cherry']]);
    changed.mockClear();
    form.reset();
    await expect.poll(() => field.part('value').textContent).toBe('Apple');
    expect([...new FormData(form)]).toEqual([['fruit', 'apple']]);
    expect(changed).not.toHaveBeenCalled();
    await field.update({ value: 'grape' });
    expect([...new FormData(form)]).toEqual([['fruit', '']]);
  });

  it('blocks a submission until a required field has a choice', async () => {
    const { form, fieldset, submitted } = formFixture(fixtures);
    const field = await mount({ name: 'fruit', required: true }, { parent: fieldset });
    form.requestSubmit();
    expect(submitted).not.toHaveBeenCalled();
    expect(form.checkValidity()).toBe(false);
    await userEvent.click(trigger(field));
    await page.getByRole('option', { name: 'Apple' }).click();
    form.requestSubmit();
    expect(submitted).toHaveBeenCalledExactlyOnceWith(null, [['fruit', 'apple']]);
  });

  it('disables the field with its prop and its fieldset, and submits nothing', async () => {
    const { form, fieldset } = formFixture(fixtures);
    const field = await mount({ name: 'fruit', defaultValue: 'apple' }, { parent: fieldset });
    fieldset.disabled = true;
    await expect.poll(() => trigger(field).matches(':disabled')).toBe(true);
    expect([...new FormData(form)]).toEqual([]);
    fieldset.disabled = false;
    await expect.poll(() => trigger(field).matches(':disabled')).toBe(false);
    await field.update({ disabled: true, open: true });
    expect(isOpen(field)).toBe(false);
  });

  it('follows a controlled open state', async () => {
    const field = await mount({ open: true });
    await expect.poll(() => isOpen(field)).toBe(true);
    await field.update({ open: false });
    await expect.poll(() => isOpen(field)).toBe(false);
  });

  it('sets aria-invalid on the trigger for the error state', async () => {
    const field = await mount({ state: 'error' });
    expect(trigger(field).getAttribute('aria-invalid')).toBe('true');
  });

  it('opens over a modal dialog and an ancestor that clips its content', async () => {
    const dialog = document.createElement('dialog');
    dialog.style.cssText = 'overflow: hidden; inline-size: 20rem; block-size: 8rem; padding: 0;';
    document.body.append(dialog);
    fixtures.push(dialog);
    dialog.showModal();
    const field = await mount({}, { parent: dialog });
    await userEvent.click(trigger(field));
    const last = optionsOf(field).at(-1);
    if (last === undefined) {
      throw new Error('Expected the options');
    }
    const box = last.getBoundingClientRect();
    const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
    const hit = document.elementFromPoint(x, y);
    expect(last.contains(hit?.shadowRoot?.elementFromPoint(x, y) ?? hit)).toBe(true);
  });

  it('opens above the field when the window has no room below, at least as wide as the field', async () => {
    const bottom = document.createElement('div');
    bottom.style.cssText = 'position: fixed; inset-inline: 0; inset-block-end: 0;';
    document.body.append(bottom);
    fixtures.push(bottom);
    const field = await mount({}, { parent: bottom });
    await userEvent.click(trigger(field));
    const popup = popupOf(field);
    const control = field.part('control').getBoundingClientRect();
    await expect
      .poll(() => popup?.getBoundingClientRect().bottom ?? Infinity)
      .toBeLessThanOrEqual(control.top);
    expect(popup?.getBoundingClientRect().width).toBeGreaterThanOrEqual(control.width - 1);
  });

  it('aligns its list with the start of the field in right-to-left text', async () => {
    const field = await mount({}, { attributes: { dir: 'rtl' } });
    await userEvent.click(trigger(field));
    const popup = popupOf(field)?.getBoundingClientRect();
    const control = field.part('control').getBoundingClientRect();
    expect(Math.abs((popup?.right ?? 0) - control.right)).toBeLessThan(1);
  });

  it('keeps its value and options legible on every theme and surface', async () => {
    for (const theme of ['light', 'dark'] as const) {
      for (const surface of ['default', 'subtle', 'inverse', 'primary'] as const) {
        const field = await mount({ defaultValue: 'apple' }, { theme, surface });
        paintSurface(field, { theme, surface });
        await userEvent.click(trigger(field));
        const message = `${theme}/${surface}`;
        expect(textContrast(field.part('value')), `${message}/value`).toBeGreaterThanOrEqual(4.5);
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
