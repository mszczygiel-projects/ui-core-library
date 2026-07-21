import { fixture, html, expect } from '@open-wc/testing';
import type { UiSwitchField } from './switch-field.js';
import './switch-field.js';

describe('UiSwitchField', () => {
  it('renders without error', async () => {
    const el = await fixture<UiSwitchField>(
      html`<ui-switch-field label="Notifications"></ui-switch-field>`,
    );
    expect(el).to.not.equal(null);
  });

  it('renders an inner checkbox input with role="switch"', async () => {
    const el = await fixture<UiSwitchField>(html`<ui-switch-field></ui-switch-field>`);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('input[type="checkbox"]');
    expect(input).to.not.equal(null);
    expect(input!.getAttribute('role')).to.equal('switch');
  });

  it('reflects label and renders it', async () => {
    const el = await fixture<UiSwitchField>(
      html`<ui-switch-field label="Email notifications"></ui-switch-field>`,
    );
    expect(el.getAttribute('label')).to.equal('Email notifications');
    expect(el.shadowRoot!.querySelector('.label')!.textContent).to.equal('Email notifications');
  });

  it('does not render the label element when label is empty', async () => {
    const el = await fixture<UiSwitchField>(html`<ui-switch-field></ui-switch-field>`);
    expect(el.shadowRoot!.querySelector('.label')).to.equal(null);
  });

  it('renders the description and links it via aria-describedby', async () => {
    const el = await fixture<UiSwitchField>(
      html`<ui-switch-field description="Helper text"></ui-switch-field>`,
    );
    const description = el.shadowRoot!.querySelector('.description');
    expect(description).to.not.equal(null);
    expect(description!.textContent).to.equal('Helper text');

    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.getAttribute('aria-describedby')).to.equal(description!.id);
  });

  it('does not render the description when not provided', async () => {
    const el = await fixture<UiSwitchField>(html`<ui-switch-field></ui-switch-field>`);
    expect(el.shadowRoot!.querySelector('.description')).to.equal(null);
    expect(el.shadowRoot!.querySelector('input')!.hasAttribute('aria-describedby')).to.equal(false);
  });

  it('defaults label-position to right and reflects an explicit left', async () => {
    const el = await fixture<UiSwitchField>(html`<ui-switch-field></ui-switch-field>`);
    expect(el.labelPosition).to.equal('right');

    el.labelPosition = 'left';
    await el.updateComplete;
    expect(el.getAttribute('label-position')).to.equal('left');
  });

  it('reflects checked and forwards it to the input', async () => {
    const el = await fixture<UiSwitchField>(html`<ui-switch-field checked></ui-switch-field>`);
    expect(el.checked).to.equal(true);
    expect(el.shadowRoot!.querySelector('input')!.checked).to.equal(true);
  });

  it('disables the input via the disabled attribute', async () => {
    const el = await fixture<UiSwitchField>(html`<ui-switch-field disabled></ui-switch-field>`);
    expect(el.shadowRoot!.querySelector('input')!.disabled).to.equal(true);
  });

  it('disables the input via state="disabled"', async () => {
    const el = await fixture<UiSwitchField>(
      html`<ui-switch-field state="disabled"></ui-switch-field>`,
    );
    expect(el.shadowRoot!.querySelector('input')!.disabled).to.equal(true);
  });

  it('marks the input invalid in the error state', async () => {
    const el = await fixture<UiSwitchField>(
      html`<ui-switch-field state="error"></ui-switch-field>`,
    );
    expect(el.shadowRoot!.querySelector('input')!.getAttribute('aria-invalid')).to.equal('true');
  });

  it('emits change and ui-change on user interaction', async () => {
    const el = await fixture<UiSwitchField>(html`<ui-switch-field></ui-switch-field>`);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;

    let changeFired = false;
    let detailChecked: boolean | undefined;
    el.addEventListener('change', () => {
      changeFired = true;
    });
    el.addEventListener('ui-change', (e) => {
      detailChecked = (e as CustomEvent<{ checked: boolean }>).detail.checked;
    });

    input.click();
    await el.updateComplete;

    expect(changeFired).to.equal(true);
    expect(detailChecked).to.equal(true);
    expect(el.checked).to.equal(true);
  });

  it('projects icon-on and icon-off into named slots', async () => {
    const el = await fixture<UiSwitchField>(html`
      <ui-switch-field>
        <span slot="icon-on" id="on">on</span>
        <span slot="icon-off" id="off">off</span>
      </ui-switch-field>
    `);

    const slots = [...el.shadowRoot!.querySelectorAll('slot')].map((s) => s.name);
    expect(slots).to.include('icon-on');
    expect(slots).to.include('icon-off');

    const onSlot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="icon-on"]')!;
    expect(onSlot.assignedElements()[0]!.id).to.equal('on');
  });

  it('restores the initial checked state on form reset', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><ui-switch-field checked name="notify"></ui-switch-field></form>
    `);
    const el = form.querySelector<UiSwitchField>('ui-switch-field')!;

    el.checked = false;
    await el.updateComplete;
    expect(el.checked).to.equal(false);

    form.reset();
    await el.updateComplete;
    expect(el.checked).to.equal(true);
  });

  it('submits its value only while on and enabled', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><ui-switch-field name="notify" value="yes"></ui-switch-field></form>
    `);
    const el = form.querySelector<UiSwitchField>('ui-switch-field')!;

    expect(new FormData(form).get('notify')).to.equal(null);

    el.checked = true;
    await el.updateComplete;
    expect(new FormData(form).get('notify')).to.equal('yes');

    el.disabled = true;
    await el.updateComplete;
    expect(new FormData(form).get('notify')).to.equal(null);
  });
});
