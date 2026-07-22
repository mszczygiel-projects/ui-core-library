import { fixture, html, expect, aTimeout, oneEvent } from '@open-wc/testing';
import type { UiCombobox, ComboboxChangeDetail, ComboboxFilterDetail } from './combobox.js';
import './combobox.js';

const OPTIONS = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
];

async function makeEl(): Promise<UiCombobox> {
  const el = await fixture<UiCombobox>(html`<ui-combobox label="Fruit"></ui-combobox>`);
  el.options = OPTIONS;
  await el.updateComplete;
  return el;
}

const inputOf = (el: UiCombobox) => el.shadowRoot!.querySelector<HTMLInputElement>('.input')!;

async function open(el: UiCombobox) {
  el.shadowRoot!.querySelector<HTMLElement>('.field')!.click();
  await el.updateComplete;
}

async function type(el: UiCombobox, text: string) {
  const input = inputOf(el);
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await el.updateComplete;
}

async function press(el: UiCombobox, key: string) {
  inputOf(el).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  await el.updateComplete;
}

const optionIds = (el: UiCombobox) =>
  [...el.shadowRoot!.querySelectorAll('[role="option"]')].map((n) => n.id);

const optionLabels = (el: UiCombobox) =>
  [...el.shadowRoot!.querySelectorAll('[role="option"]')].map((n) => n.textContent!.trim());

describe('UiCombobox', () => {
  it('has expected defaults', async () => {
    const el = await makeEl();
    expect(el.variant).to.equal('outline');
    expect(el.size).to.equal('default');
    expect(el.multiple).to.equal(false);
    expect(el.filterMode).to.equal('local');
    expect(el.allowCreate).to.equal(false);
    expect(el.placement).to.equal('bottom-start');
  });

  describe('combobox semantics', () => {
    it('puts the combobox role on the input, not the wrapper', async () => {
      const el = await makeEl();
      expect(inputOf(el).getAttribute('role')).to.equal('combobox');
      expect(inputOf(el).getAttribute('aria-autocomplete')).to.equal('list');
    });

    it('reports collapsed state while closed', async () => {
      const el = await makeEl();
      expect(inputOf(el).getAttribute('aria-expanded')).to.equal('false');
      expect(inputOf(el).hasAttribute('aria-activedescendant')).to.equal(false);
    });

    it('opens on field click and points at an option in the same shadow root', async () => {
      const el = await makeEl();
      await open(el);

      const input = inputOf(el);
      expect(input.getAttribute('aria-expanded')).to.equal('true');
      const active = input.getAttribute('aria-activedescendant');
      expect(active).to.equal('listbox-opt-0');
      expect(el.shadowRoot!.querySelector(`#${active}`)).to.not.equal(null);
    });
  });

  describe('local filtering', () => {
    it('narrows the list to label matches', async () => {
      const el = await makeEl();
      await type(el, 'ap');
      expect(optionLabels(el)).to.deep.equal(['Apple', 'Apricot']);
    });

    it('is case-insensitive', async () => {
      const el = await makeEl();
      await type(el, 'APRI');
      expect(optionLabels(el)).to.deep.equal(['Apricot']);
    });

    it('shows the empty message when nothing matches', async () => {
      const el = await makeEl();
      await type(el, 'zzz');
      expect(optionLabels(el)).to.deep.equal([]);
      expect(el.shadowRoot!.querySelector('.listbox__message')!.textContent!.trim()).to.equal(
        'No results found',
      );
    });

    it('reindexes rows so the active descendant tracks the filtered list', async () => {
      const el = await makeEl();
      await type(el, 'ap');
      expect(optionIds(el)).to.deep.equal(['listbox-opt-0', 'listbox-opt-1']);
    });

    it('leaves the list untouched in remote mode', async () => {
      const el = await makeEl();
      el.filterMode = 'remote';
      await el.updateComplete;
      await type(el, 'zzz');
      expect(optionLabels(el)).to.deep.equal(['Apple', 'Apricot', 'Banana', 'Cherry']);
    });
  });

  describe('filter event', () => {
    it('debounces the query', async () => {
      const el = await makeEl();
      el.filterDebounce = 30;
      await el.updateComplete;

      const seen: string[] = [];
      el.addEventListener('ui-filter', (e) =>
        seen.push((e as CustomEvent<ComboboxFilterDetail>).detail.query),
      );

      await type(el, 'a');
      await type(el, 'ap');
      await type(el, 'app');
      expect(seen).to.deep.equal([]);

      await aTimeout(60);
      expect(seen).to.deep.equal(['app']);
    });
  });

  describe('single selection', () => {
    it('selects with Enter and closes', async () => {
      const el = await makeEl();
      await type(el, 'ban');
      await press(el, 'Enter');
      expect(el.value).to.equal('banana');
      expect(el.hasAttribute('open')).to.equal(false);
    });

    it('shows the selected label in the input', async () => {
      const el = await makeEl();
      await type(el, 'ban');
      await press(el, 'Enter');
      expect(inputOf(el).value).to.equal('Banana');
    });

    it('emits ui-change with the value', async () => {
      const el = await makeEl();
      await type(el, 'ban');
      setTimeout(() => void press(el, 'Enter'));
      const event = (await oneEvent(el, 'ui-change')) as CustomEvent<ComboboxChangeDetail>;
      expect(event.detail.value).to.equal('banana');
    });

    it('skips disabled options when arrowing', async () => {
      const el = await makeEl();
      await open(el);
      await press(el, 'End');
      // Cherry is disabled, so End lands on Banana.
      expect(inputOf(el).getAttribute('aria-activedescendant')).to.equal('listbox-opt-2');
    });
  });

  describe('multiple selection', () => {
    async function makeMulti() {
      const el = await fixture<UiCombobox>(html`<ui-combobox multiple></ui-combobox>`);
      el.options = OPTIONS;
      await el.updateComplete;
      return el;
    }

    it('accumulates values and keeps the list open', async () => {
      const el = await makeMulti();
      await type(el, 'app');
      await press(el, 'Enter');
      expect(el.values).to.deep.equal(['apple']);
      expect(el.hasAttribute('open')).to.equal(true);
    });

    it('keeps the highlight on the option just picked, not the first row', async () => {
      const el = await makeMulti();
      await type(el, 'ban');
      await press(el, 'Enter');

      // The query is cleared, so the list is full again: banana is row 2.
      expect(inputOf(el).getAttribute('aria-activedescendant')).to.equal('listbox-opt-2');
      const active = el.shadowRoot!.querySelector('.option--active');
      expect(active!.textContent!.trim()).to.equal('Banana');
    });

    it('carries on arrowing from the picked option', async () => {
      const el = await makeMulti();
      await type(el, 'app');
      await press(el, 'Enter');
      // Apple is row 0 in the full list; ArrowDown must reach Apricot, not Banana.
      await press(el, 'ArrowDown');
      expect(inputOf(el).getAttribute('aria-activedescendant')).to.equal('listbox-opt-1');
    });

    it('renders a chip per selected value', async () => {
      const el = await makeMulti();
      el.values = ['apple', 'banana'];
      await el.updateComplete;
      const chips = el.shadowRoot!.querySelectorAll('ui-chip');
      expect(chips.length).to.equal(2);
      expect(chips[0].textContent!.trim()).to.equal('Apple');
    });

    it('toggles a value off when picked again', async () => {
      const el = await makeMulti();
      el.values = ['apple'];
      await el.updateComplete;
      await open(el);
      el.shadowRoot!.querySelector<HTMLElement>('#listbox-opt-0')!.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true }),
      );
      await el.updateComplete;
      expect(el.values).to.deep.equal([]);
    });

    it('marks the list as multi-selectable', async () => {
      const el = await makeMulti();
      await open(el);
      expect(
        el.shadowRoot!.querySelector('[role="listbox"]')!.getAttribute('aria-multiselectable'),
      ).to.equal('true');
    });

    it('removes the last chip on Backspace with an empty query', async () => {
      const el = await makeMulti();
      el.values = ['apple', 'banana'];
      await el.updateComplete;
      await press(el, 'Backspace');
      expect(el.values).to.deep.equal(['apple']);
    });

    it('keeps chips intact when Backspace edits a non-empty query', async () => {
      const el = await makeMulti();
      el.values = ['apple'];
      await el.updateComplete;
      await type(el, 'ban');
      await press(el, 'Backspace');
      expect(el.values).to.deep.equal(['apple']);
    });
  });

  describe('create affordance', () => {
    it('is absent unless allow-create is set', async () => {
      const el = await makeEl();
      await type(el, 'kiwi');
      expect(el.shadowRoot!.querySelector('.option--create')).to.equal(null);
    });

    it('offers the query as a new option', async () => {
      const el = await makeEl();
      el.allowCreate = true;
      await el.updateComplete;
      await type(el, 'kiwi');
      const create = el.shadowRoot!.querySelector('.option--create');
      expect(create).to.not.equal(null);
      expect(create!.textContent!.trim()).to.equal('Create "kiwi"');
      // Only the leading word carries the strong weight.
      const prefix = el.shadowRoot!.querySelector('.option__create-prefix');
      expect(prefix!.textContent).to.equal('Create');
    });

    it('does not offer to create an existing label', async () => {
      const el = await makeEl();
      el.allowCreate = true;
      await el.updateComplete;
      await type(el, 'Apple');
      expect(el.shadowRoot!.querySelector('.option--create')).to.equal(null);
    });

    it('emits ui-create with the query', async () => {
      const el = await makeEl();
      el.allowCreate = true;
      await el.updateComplete;
      await type(el, 'kiwi');
      setTimeout(() => void press(el, 'Enter'));
      const event = (await oneEvent(el, 'ui-create')) as CustomEvent<{ label: string }>;
      expect(event.detail.label).to.equal('kiwi');
    });
  });

  describe('loading', () => {
    it('replaces the list with the loading message', async () => {
      const el = await makeEl();
      el.loading = true;
      await el.updateComplete;
      await open(el);

      expect(el.shadowRoot!.querySelectorAll('[role="option"]').length).to.equal(0);
      expect(el.shadowRoot!.querySelector('ui-loader')).to.not.equal(null);
    });
  });

  describe('clearing', () => {
    it('drops the value and the query', async () => {
      const el = await makeEl();
      el.clearable = true;
      await type(el, 'ban');
      await press(el, 'Enter');
      await el.updateComplete;

      el.shadowRoot!.querySelector<HTMLElement>('.clear')!.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true }),
      );
      await el.updateComplete;

      expect(el.value).to.equal('');
      expect(inputOf(el).value).to.equal('');
    });
  });

  describe('disabled', () => {
    it('does not open', async () => {
      const el = await makeEl();
      el.disabled = true;
      await el.updateComplete;
      await open(el);
      expect(el.hasAttribute('open')).to.equal(false);
    });
  });

  describe('option groups', () => {
    it('filters within groups and drops the empty ones', async () => {
      const el = await fixture<UiCombobox>(html`<ui-combobox></ui-combobox>`);
      el.options = [
        { label: 'Pome', options: [{ value: 'apple', label: 'Apple' }] },
        { label: 'Berry', options: [{ value: 'blueberry', label: 'Blueberry' }] },
      ];
      await el.updateComplete;
      await type(el, 'apple');

      const groups = el.shadowRoot!.querySelectorAll('[role="group"]');
      expect(groups.length).to.equal(1);
      expect(optionLabels(el)).to.deep.equal(['Apple']);
    });
  });

  describe('multi-select indicator', () => {
    it('renders a checkbox after the label, not a bare tick', async () => {
      const el = await fixture<UiCombobox>(html`<ui-combobox multiple></ui-combobox>`);
      el.options = OPTIONS;
      await el.updateComplete;
      await open(el);

      const children = [...el.shadowRoot!.querySelector('#listbox-opt-0')!.children].map(
        (n) => n.className,
      );
      expect(children).to.deep.equal(['option__label', 'option__checkbox']);
    });

    it('does not paint the selected row in multi-select', async () => {
      const el = await fixture<UiCombobox>(html`<ui-combobox multiple></ui-combobox>`);
      el.options = OPTIONS;
      el.values = ['apple'];
      await el.updateComplete;
      await open(el);

      const list = el.shadowRoot!.querySelector('.listbox')!;
      expect(list.classList.contains('listbox--multiple')).to.equal(true);
      // Selection still reaches assistive tech through aria-selected.
      expect(
        el.shadowRoot!.querySelector('#listbox-opt-0')!.getAttribute('aria-selected'),
      ).to.equal('true');
    });

    it('renders no checkbox in single mode', async () => {
      const el = await makeEl();
      await open(el);
      expect(el.shadowRoot!.querySelector('.option__checkbox')).to.equal(null);
    });
  });
});
