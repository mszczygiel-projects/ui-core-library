import { fixture, html, expect } from '@open-wc/testing';
import type { UiTextInput } from './text-input.js';
import './text-input.js';

describe('UiTextInput', () => {
  it('renders without error', async () => {
    const el = await fixture<UiTextInput>(html`<ui-text-input label="Email"></ui-text-input>`);
    expect(el).to.not.equal(null);
  });

  it('renders inner <input> element', async () => {
    const el = await fixture<UiTextInput>(html`<ui-text-input></ui-text-input>`);
    expect(el.shadowRoot!.querySelector('input')).to.not.equal(null);
  });

  it('reflects variant attribute', async () => {
    const el = await fixture<UiTextInput>(html`<ui-text-input variant="filled"></ui-text-input>`);
    expect(el.getAttribute('variant')).to.equal('filled');
  });

  it('defaults variant to outline', async () => {
    const el = await fixture<UiTextInput>(html`<ui-text-input></ui-text-input>`);
    expect(el.variant).to.equal('outline');
  });

  it('reflects data-size attribute', async () => {
    const el = await fixture<UiTextInput>(html`<ui-text-input></ui-text-input>`);
    el.size = 'large';
    await el.updateComplete;
    expect(el.getAttribute('data-size')).to.equal('large');
  });

  it('reflects state attribute', async () => {
    const el = await fixture<UiTextInput>(html`<ui-text-input state="error"></ui-text-input>`);
    expect(el.getAttribute('state')).to.equal('error');
  });

  it('reflects label-placement attribute', async () => {
    const el = await fixture<UiTextInput>(
      html`<ui-text-input label-placement="floating"></ui-text-input>`,
    );
    expect(el.getAttribute('label-placement')).to.equal('floating');
  });

  it('disabled prop disables inner <input>', async () => {
    const el = await fixture<UiTextInput>(html`<ui-text-input disabled></ui-text-input>`);
    expect(el.shadowRoot!.querySelector('input')!.disabled).to.equal(true);
  });

  it('state=disabled disables inner <input>', async () => {
    const el = await fixture<UiTextInput>(html`<ui-text-input state="disabled"></ui-text-input>`);
    expect(el.shadowRoot!.querySelector('input')!.disabled).to.equal(true);
  });

  it('required prop reflects and forwards to input', async () => {
    const el = await fixture<UiTextInput>(html`<ui-text-input required></ui-text-input>`);
    expect(el.shadowRoot!.querySelector('input')!.required).to.equal(true);
    expect(el.getAttribute('required')).to.not.equal(null);
  });

  it('readonly prop forwards to input', async () => {
    const el = await fixture<UiTextInput>(html`<ui-text-input readonly></ui-text-input>`);
    expect(el.shadowRoot!.querySelector('input')!.readOnly).to.equal(true);
  });

  it('renders top label outside field-wrapper', async () => {
    const el = await fixture<UiTextInput>(
      html`<ui-text-input label="Name" label-placement="top"></ui-text-input>`,
    );
    const shadow = el.shadowRoot!;
    const label = shadow.querySelector('label');
    const fieldWrapper = shadow.querySelector('.field-wrapper');
    expect(label).to.not.equal(null);
    expect(fieldWrapper!.contains(label)).to.equal(false);
  });

  it('renders floating label inside field-wrapper', async () => {
    const el = await fixture<UiTextInput>(
      html`<ui-text-input label="Name" label-placement="floating"></ui-text-input>`,
    );
    const shadow = el.shadowRoot!;
    const fieldWrapper = shadow.querySelector('.field-wrapper');
    const label = fieldWrapper!.querySelector('label');
    expect(label).to.not.equal(null);
  });

  it('variant=underlined always uses floating label', async () => {
    const el = await fixture<UiTextInput>(
      html`<ui-text-input variant="underlined" label="Name" label-placement="top"></ui-text-input>`,
    );
    const shadow = el.shadowRoot!;
    const fieldWrapper = shadow.querySelector('.field-wrapper');
    const label = fieldWrapper!.querySelector('label');
    expect(label).to.not.equal(null);
  });

  it('variant=filled always uses top label', async () => {
    const el = await fixture<UiTextInput>(
      html`<ui-text-input
        variant="filled"
        label="Name"
        label-placement="floating"
      ></ui-text-input>`,
    );
    const shadow = el.shadowRoot!;
    const fieldWrapper = shadow.querySelector('.field-wrapper');
    const labelInsideWrapper = fieldWrapper!.querySelector('label');
    expect(labelInsideWrapper).to.equal(null);
  });

  it('renders hint when provided', async () => {
    const el = await fixture<UiTextInput>(html`<ui-text-input hint="Helper text"></ui-text-input>`);
    const hint = el.shadowRoot!.querySelector('.hint');
    expect(hint).to.not.equal(null);
    expect(hint!.textContent).to.equal('Helper text');
  });

  it('does not render hint when not provided', async () => {
    const el = await fixture<UiTextInput>(html`<ui-text-input></ui-text-input>`);
    expect(el.shadowRoot!.querySelector('.hint')).to.equal(null);
  });

  it('input aria-invalid is set on error state', async () => {
    const el = await fixture<UiTextInput>(html`<ui-text-input state="error"></ui-text-input>`);
    expect(el.shadowRoot!.querySelector('input')!.getAttribute('aria-invalid')).to.equal('true');
  });

  it('input aria-describedby points to hint when hint is set', async () => {
    const el = await fixture<UiTextInput>(html`<ui-text-input hint="Some hint"></ui-text-input>`);
    expect(el.shadowRoot!.querySelector('input')!.getAttribute('aria-describedby')).to.equal(
      'hint',
    );
  });

  it('sets has-leading-icon attribute when slot is filled', async () => {
    const el = await fixture<UiTextInput>(html`
      <ui-text-input>
        <span slot="leading-icon">icon</span>
      </ui-text-input>
    `);
    await el.updateComplete;
    expect(el.hasAttribute('has-leading-icon')).to.equal(true);
  });

  it('sets has-trailing-icon attribute when slot is filled', async () => {
    const el = await fixture<UiTextInput>(html`
      <ui-text-input>
        <span slot="trailing-icon">icon</span>
      </ui-text-input>
    `);
    await el.updateComplete;
    expect(el.hasAttribute('has-trailing-icon')).to.equal(true);
  });

  it('dispatches ui-input event with value on input', async () => {
    const el = await fixture<UiTextInput>(html`<ui-text-input></ui-text-input>`);
    const nativeInput = el.shadowRoot!.querySelector('input')!;
    let received: string | undefined;
    el.addEventListener('ui-input', (e: Event) => {
      received = (e as CustomEvent<{ value: string }>).detail.value;
    });
    nativeInput.value = 'hello';
    nativeInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    expect(received).to.equal('hello');
  });

  it('dispatches ui-change event on change', async () => {
    const el = await fixture<UiTextInput>(html`<ui-text-input></ui-text-input>`);
    const nativeInput = el.shadowRoot!.querySelector('input')!;
    let received: string | undefined;
    el.addEventListener('ui-change', (e: Event) => {
      received = (e as CustomEvent<{ value: string }>).detail.value;
    });
    nativeInput.value = 'world';
    nativeInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    expect(received).to.equal('world');
  });

  it('renders leading-icon and trailing-icon slots', async () => {
    const el = await fixture<UiTextInput>(html`<ui-text-input></ui-text-input>`);
    const shadow = el.shadowRoot!;
    expect(shadow.querySelector('slot[name="leading-icon"]')).to.not.equal(null);
    expect(shadow.querySelector('slot[name="trailing-icon"]')).to.not.equal(null);
  });
});
