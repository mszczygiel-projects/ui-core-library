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
    expect(el.shadowRoot!.querySelector('.listbox')).to.equal(null);
  });

  it('dropdown opens on trigger click', async () => {
    const el = await makeEl();
    el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.listbox')).to.not.equal(null);
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
    expect(el.shadowRoot!.querySelector('.listbox')).to.equal(null);
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

  describe('inline label placement', () => {
    it('renders the label inside the trigger with a colon', async () => {
      const el = await makeEl();
      el.label = 'Season';
      el.labelPlacement = 'inline';
      await el.updateComplete;

      const inline = el.shadowRoot!.querySelector('.inline-label');
      expect(inline).to.not.equal(null);
      expect(inline!.textContent!.trim()).to.equal('Season:');
    });

    it('does not render the standalone label element', async () => {
      const el = await makeEl();
      el.label = 'Season';
      el.labelPlacement = 'inline';
      await el.updateComplete;

      expect(el.shadowRoot!.querySelector('label.label')).to.equal(null);
    });

    it('names the trigger through the inline label', async () => {
      const el = await makeEl();
      el.label = 'Season';
      el.labelPlacement = 'inline';
      await el.updateComplete;

      const trigger = el.shadowRoot!.querySelector('.trigger')!;
      expect(trigger.getAttribute('aria-labelledby')).to.equal('label');
      expect(el.shadowRoot!.querySelector('#label')).to.not.equal(null);
    });

    it('keeps the top label for the default placement', async () => {
      const el = await makeEl();
      el.label = 'Season';
      await el.updateComplete;

      expect(el.shadowRoot!.querySelector('label.label')).to.not.equal(null);
      expect(el.shadowRoot!.querySelector('.inline-label')).to.equal(null);
    });
  });

  describe('option groups', () => {
    const GROUPS = [
      { label: 'Recent', options: [{ value: 'apple', label: 'Apple' }] },
      {
        label: 'All',
        options: [
          { value: 'banana', label: 'Banana' },
          { value: 'cherry', label: 'Cherry' },
        ],
      },
    ];

    async function openGrouped() {
      const el = await fixture<UiSelectField>(html`<ui-select-field></ui-select-field>`);
      el.options = GROUPS;
      await el.updateComplete;
      el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
      await el.updateComplete;
      return el;
    }

    it('renders a group per entry with a labelled header', async () => {
      const el = await openGrouped();
      const groups = el.shadowRoot!.querySelectorAll('[role="group"]');
      expect(groups.length).to.equal(2);
      expect(groups[0].getAttribute('aria-labelledby')).to.equal('listbox-group-0');
      expect(el.shadowRoot!.querySelector('#listbox-group-0')!.textContent!.trim()).to.equal(
        'Recent',
      );
    });

    it('indexes options continuously across groups', async () => {
      const el = await openGrouped();
      expect(el.shadowRoot!.querySelector('#listbox-opt-0')!.textContent).to.contain('Apple');
      expect(el.shadowRoot!.querySelector('#listbox-opt-2')!.textContent).to.contain('Cherry');
    });

    it('selects an option from the second group', async () => {
      const el = await openGrouped();
      el.shadowRoot!.querySelector<HTMLElement>('#listbox-opt-2')!.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true }),
      );
      await el.updateComplete;
      expect(el.value).to.equal('cherry');
    });
  });

  describe('active descendant', () => {
    it('is absent while the list is closed', async () => {
      const el = await makeEl();
      const trigger = el.shadowRoot!.querySelector('.trigger')!;
      expect(trigger.hasAttribute('aria-activedescendant')).to.equal(false);
    });

    it('points at the active option once open', async () => {
      const el = await makeEl();
      el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
      await el.updateComplete;

      const trigger = el.shadowRoot!.querySelector('.trigger')!;
      const active = trigger.getAttribute('aria-activedescendant');
      expect(active).to.equal('listbox-opt-0');
      // The reference must resolve inside this same shadow root.
      expect(el.shadowRoot!.querySelector(`#${active}`)).to.not.equal(null);
    });

    it('follows arrow navigation and skips disabled options', async () => {
      const el = await makeEl();
      const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!;
      trigger.click();
      await el.updateComplete;

      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      expect(trigger.getAttribute('aria-activedescendant')).to.equal('listbox-opt-1');

      // Cherry is disabled, so the active row stays put.
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      expect(trigger.getAttribute('aria-activedescendant')).to.equal('listbox-opt-1');
    });

    it('keeps aria-expanded despite the popover manual mode', async () => {
      const el = await makeEl();
      const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!;
      expect(trigger.getAttribute('aria-expanded')).to.equal('false');
      trigger.click();
      await el.updateComplete;
      expect(trigger.getAttribute('aria-expanded')).to.equal('true');
    });
  });

  describe('floating list', () => {
    it('renders the list inside the popover', async () => {
      const el = await makeEl();
      el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
      await el.updateComplete;

      const popover = el.shadowRoot!.querySelector('ui-popover')!;
      expect(popover.hasAttribute('open')).to.equal(true);
      expect(popover.querySelector('.listbox')).to.not.equal(null);
    });

    it('defaults to bottom-start placement and forwards it', async () => {
      const el = await makeEl();
      expect(el.placement).to.equal('bottom-start');
      el.placement = 'top-start';
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('ui-popover')!.getAttribute('placement')).to.equal(
        'top-start',
      );
    });

    it('shows the empty message when there are no options', async () => {
      const el = await fixture<UiSelectField>(html`<ui-select-field></ui-select-field>`);
      el.options = [];
      await el.updateComplete;
      el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
      await el.updateComplete;

      const message = el.shadowRoot!.querySelector('.listbox__message');
      expect(message).to.not.equal(null);
      expect(message!.textContent!.trim()).to.equal('No results found');
    });
  });

  describe('option rendering per the Development annotations', () => {
    it('renders an option icon before the label when given', async () => {
      const el = await fixture<UiSelectField>(html`<ui-select-field></ui-select-field>`);
      el.options = [{ value: 'a', label: 'Alpha', icon: 'icon-star' }];
      await el.updateComplete;
      el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
      await el.updateComplete;

      const children = [...el.shadowRoot!.querySelector('#listbox-opt-0')!.children].map(
        (n) => n.className,
      );
      expect(children).to.deep.equal(['option__icon', 'option__label']);
      expect(el.shadowRoot!.querySelector('.option__icon svg')).to.not.equal(null);
    });

    it('omits the icon slot for options without one', async () => {
      const el = await makeEl();
      el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.option .option__icon')).to.equal(null);
    });

    it('flags grouped lists so the panel can drop its inline padding', async () => {
      const el = await fixture<UiSelectField>(html`<ui-select-field></ui-select-field>`);
      el.options = [{ label: 'G', options: [{ value: 'a', label: 'Alpha' }] }];
      await el.updateComplete;
      el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
      await el.updateComplete;

      expect(el.shadowRoot!.querySelector('.listbox--grouped')).to.not.equal(null);
      expect(el.shadowRoot!.querySelector('.listbox__group-options')).to.not.equal(null);
    });

    it('keeps the single-select row surface', async () => {
      const el = await makeEl();
      el.value = 'apple';
      await el.updateComplete;
      el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
      await el.updateComplete;

      const list = el.shadowRoot!.querySelector('.listbox')!;
      expect(list.classList.contains('listbox--multiple')).to.equal(false);
      expect(el.shadowRoot!.querySelector('.option--selected')).to.not.equal(null);
    });

    it('leaves a flat list unflagged', async () => {
      const el = await makeEl();
      el.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click();
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.listbox--grouped')).to.equal(null);
    });
  });
});
