import { fixture, html, expect } from '@open-wc/testing';
import type { UiSelectField } from './select-field.js';
import './select-field.js';

const OPTIONS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
];

async function makeEl(attrs = '') {
  const el = await fixture<UiSelectField>(html`<ui-select-field ${attrs}></ui-select-field>`);
  el.options = OPTIONS;
  await el.updateComplete;
  return el;
}

describe('UiSelectField', () => {
  it('renders without error', async () => {
    const el = await makeEl();
    expect(el).to.not.equal(null);
  });

  it('renders trigger button', async () => {
    const el = await makeEl();
    expect(el.shadowRoot!.querySelector('button.trigger')).to.not.equal(null);
  });

  it('trigger has role=combobox', async () => {
    const el = await makeEl();
    const trigger = el.shadowRoot!.querySelector('button.trigger')!;
    expect(trigger.getAttribute('role')).to.equal('combobox');
  });

  it('trigger has aria-haspopup=listbox', async () => {
    const el = await makeEl();
    const trigger = el.shadowRoot!.querySelector('button.trigger')!;
    expect(trigger.getAttribute('aria-haspopup')).to.equal('listbox');
  });

  it('dropdown is closed by default', async () => {
    const el = await makeEl();
    expect(el.shadowRoot!.querySelector('.dropdown')).to.equal(null);
  });

  it('dropdown opens on trigger click', async () => {
    const el = await makeEl();
    el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.dropdown')).to.not.equal(null);
  });

  it('host gets open attribute when open', async () => {
    const el = await makeEl();
    el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
    await el.updateComplete;
    expect(el.hasAttribute('open')).to.equal(true);
  });

  it('dropdown shows options', async () => {
    const el = await makeEl();
    el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
    await el.updateComplete;
    const items = el.shadowRoot!.querySelectorAll('.option');
    expect(items.length).to.equal(3);
  });

  it('selecting an option sets value', async () => {
    const el = await makeEl();
    el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
    await el.updateComplete;
    const opts = el.shadowRoot!.querySelectorAll<HTMLElement>('.option');
    opts[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal('apple');
  });

  it('selecting an option closes the dropdown', async () => {
    const el = await makeEl();
    el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
    await el.updateComplete;
    el.shadowRoot!.querySelectorAll<HTMLElement>('.option')[0].dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true }),
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.dropdown')).to.equal(null);
  });

  it('dispatches ui-change event on selection', async () => {
    const el = await makeEl();
    let detail: { value: string } | null = null;
    el.addEventListener('ui-change', (e) => {
      detail = (e as CustomEvent).detail;
    });
    el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
    await el.updateComplete;
    el.shadowRoot!.querySelectorAll<HTMLElement>('.option')[0].dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true }),
    );
    await el.updateComplete;
    expect(detail).to.not.equal(null);
    expect(detail!.value).to.equal('apple');
  });

  it('disabled option cannot be selected', async () => {
    const el = await makeEl();
    el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
    await el.updateComplete;
    const disabledOpt = el.shadowRoot!.querySelector<HTMLElement>('.option--disabled')!;
    disabledOpt.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal('');
  });

  it('shows placeholder when no value', async () => {
    const el = await makeEl();
    const valueEl = el.shadowRoot!.querySelector('.value')!;
    expect(valueEl.textContent?.trim()).to.equal('Select option...');
    expect(valueEl.classList.contains('value--placeholder')).to.equal(true);
  });

  it('shows selected label when value is set', async () => {
    const el = await makeEl();
    el.value = 'banana';
    await el.updateComplete;
    const valueEl = el.shadowRoot!.querySelector('.value')!;
    expect(valueEl.textContent?.trim()).to.equal('Banana');
    expect(valueEl.classList.contains('value--placeholder')).to.equal(false);
  });

  it('reflects state attribute', async () => {
    const el = await fixture<UiSelectField>(
      html`<ui-select-field state="error"></ui-select-field>`,
    );
    expect(el.getAttribute('state')).to.equal('error');
  });

  it('reflects variant attribute', async () => {
    const el = await fixture<UiSelectField>(
      html`<ui-select-field variant="filled"></ui-select-field>`,
    );
    expect(el.getAttribute('variant')).to.equal('filled');
  });

  it('reflects data-size attribute', async () => {
    const el = await fixture<UiSelectField>(
      html`<ui-select-field data-size="small"></ui-select-field>`,
    );
    expect(el.size).to.equal('small');
  });

  it('trigger is disabled when state=disabled', async () => {
    const el = await fixture<UiSelectField>(
      html`<ui-select-field state="disabled"></ui-select-field>`,
    );
    el.options = OPTIONS;
    await el.updateComplete;
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!;
    expect(trigger.disabled).to.equal(true);
  });

  it('trigger is disabled when disabled attribute is set', async () => {
    const el = await fixture<UiSelectField>(html`<ui-select-field disabled></ui-select-field>`);
    el.options = OPTIONS;
    await el.updateComplete;
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!;
    expect(trigger.disabled).to.equal(true);
  });

  it('clear button not shown without clearable prop', async () => {
    const el = await makeEl();
    el.value = 'apple';
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.clear')).to.equal(null);
  });

  it('clear button shown when clearable and has value', async () => {
    const el = await makeEl();
    el.clearable = true;
    el.value = 'apple';
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.clear')).to.not.equal(null);
  });

  it('clear button clears value and dispatches ui-change', async () => {
    const el = await makeEl();
    el.clearable = true;
    el.value = 'apple';
    await el.updateComplete;
    let detail: { value: string } | null = null;
    el.addEventListener('ui-change', (e) => {
      detail = (e as CustomEvent).detail;
    });
    el.shadowRoot!.querySelector<HTMLElement>('.clear')!.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true }),
    );
    await el.updateComplete;
    expect(el.value).to.equal('');
    expect(detail!.value).to.equal('');
  });

  it('renders label element when label prop is set', async () => {
    const el = await fixture<UiSelectField>(
      html`<ui-select-field label="Fruit"></ui-select-field>`,
    );
    el.options = OPTIONS;
    await el.updateComplete;
    const labelEl = el.shadowRoot!.querySelector('label.label')!;
    expect(labelEl.textContent).to.equal('Fruit');
  });

  it('renders hint when hint prop is set', async () => {
    const el = await fixture<UiSelectField>(
      html`<ui-select-field hint="Pick one"></ui-select-field>`,
    );
    el.options = OPTIONS;
    await el.updateComplete;
    const hintEl = el.shadowRoot!.querySelector('.hint')!;
    expect(hintEl.textContent).to.equal('Pick one');
  });

  it('Delete key clears value when clearable', async () => {
    const el = await makeEl();
    el.clearable = true;
    el.value = 'apple';
    await el.updateComplete;
    let detail: { value: string } | null = null;
    el.addEventListener('ui-change', (e) => {
      detail = (e as CustomEvent).detail;
    });
    el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }),
    );
    await el.updateComplete;
    expect(el.value).to.equal('');
    expect(detail!.value).to.equal('');
  });

  it('Backspace key clears value when clearable', async () => {
    const el = await makeEl();
    el.clearable = true;
    el.value = 'banana';
    await el.updateComplete;
    el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }),
    );
    await el.updateComplete;
    expect(el.value).to.equal('');
  });

  it('Delete key does not clear when clearable is false', async () => {
    const el = await makeEl();
    el.value = 'apple';
    await el.updateComplete;
    el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }),
    );
    await el.updateComplete;
    expect(el.value).to.equal('apple');
  });

  it('trigger shows aria-expanded=false when closed', async () => {
    const el = await makeEl();
    const trigger = el.shadowRoot!.querySelector('button.trigger')!;
    expect(trigger.getAttribute('aria-expanded')).to.equal('false');
  });

  it('trigger shows aria-expanded=true when open', async () => {
    const el = await makeEl();
    el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
    await el.updateComplete;
    const trigger = el.shadowRoot!.querySelector('button.trigger')!;
    expect(trigger.getAttribute('aria-expanded')).to.equal('true');
  });

  it('submits value through form-associated custom element', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <ui-select-field name="fruit"></ui-select-field>
      </form>
    `);
    const el = form.querySelector('ui-select-field') as UiSelectField;
    el.options = OPTIONS;
    await el.updateComplete;

    el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
    await el.updateComplete;
    el.shadowRoot!.querySelectorAll<HTMLElement>('.option')[1].dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true }),
    );
    await el.updateComplete;

    const data = new FormData(form);
    expect(data.get('fruit')).to.equal('banana');
  });

  it('resets value to initial attribute on form reset', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <ui-select-field name="fruit" value="apple"></ui-select-field>
      </form>
    `);
    const el = form.querySelector('ui-select-field') as UiSelectField;
    el.options = OPTIONS;
    await el.updateComplete;

    el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
    await el.updateComplete;
    el.shadowRoot!.querySelectorAll<HTMLElement>('.option')[1].dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true }),
    );
    await el.updateComplete;
    expect(el.value).to.equal('banana');

    form.reset();
    await el.updateComplete;
    expect(el.value).to.equal('apple');
    expect(el.hasAttribute('open')).to.equal(false);
  });

  it('dispatches native input and change events on selection', async () => {
    const el = await makeEl();
    let inputCount = 0;
    let changeCount = 0;
    el.addEventListener('input', () => {
      inputCount += 1;
    });
    el.addEventListener('change', () => {
      changeCount += 1;
    });

    el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
    await el.updateComplete;
    el.shadowRoot!.querySelectorAll<HTMLElement>('.option')[0].dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true }),
    );
    await el.updateComplete;

    expect(inputCount).to.equal(1);
    expect(changeCount).to.equal(1);
  });

  it('clear on Enter does not open dropdown', async () => {
    const el = await makeEl();
    el.clearable = true;
    el.value = 'apple';
    await el.updateComplete;

    let detail: { value: string } | null = null;
    el.addEventListener('ui-change', (e) => {
      detail = (e as CustomEvent).detail;
    });

    el.shadowRoot!.querySelector<HTMLElement>('.clear')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    await el.updateComplete;

    expect(el.value).to.equal('');
    expect(detail!.value).to.equal('');
    expect(el.hasAttribute('open')).to.equal(false);
  });

  it('clear on Space does not open dropdown', async () => {
    const el = await makeEl();
    el.clearable = true;
    el.value = 'apple';
    await el.updateComplete;

    el.shadowRoot!.querySelector<HTMLElement>('.clear')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );
    await el.updateComplete;

    expect(el.value).to.equal('');
    expect(el.hasAttribute('open')).to.equal(false);
  });
});
