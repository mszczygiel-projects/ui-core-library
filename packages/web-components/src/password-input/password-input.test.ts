import { fixture, html, expect } from '@open-wc/testing';
import type { UiPasswordInput } from './password-input.js';
import './password-input.js';

describe('UiPasswordInput', () => {
  it('renders without error', async () => {
    const el = await fixture<UiPasswordInput>(html`<ui-password-input label="Password"></ui-password-input>`);
    expect(el).to.not.equal(null);
  });

  it('renders inner <input> element', async () => {
    const el = await fixture<UiPasswordInput>(html`<ui-password-input></ui-password-input>`);
    expect(el.shadowRoot!.querySelector('input')).to.not.equal(null);
  });

  it('input type is password by default', async () => {
    const el = await fixture<UiPasswordInput>(html`<ui-password-input></ui-password-input>`);
    expect(el.shadowRoot!.querySelector('input')!.type).to.equal('password');
  });

  it('input type is text when show-password is set', async () => {
    const el = await fixture<UiPasswordInput>(html`<ui-password-input show-password></ui-password-input>`);
    expect(el.shadowRoot!.querySelector('input')!.type).to.equal('text');
  });

  it('clicking toggle changes input type to text', async () => {
    const el = await fixture<UiPasswordInput>(html`<ui-password-input></ui-password-input>`);
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>('button.toggle')!;
    toggle.click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('input')!.type).to.equal('text');
    expect(el.showPassword).to.equal(true);
  });

  it('clicking toggle twice reverts to password type', async () => {
    const el = await fixture<UiPasswordInput>(html`<ui-password-input></ui-password-input>`);
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>('button.toggle')!;
    toggle.click();
    await el.updateComplete;
    toggle.click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('input')!.type).to.equal('password');
  });

  it('toggle button has aria-label', async () => {
    const el = await fixture<UiPasswordInput>(html`<ui-password-input></ui-password-input>`);
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>('button.toggle')!;
    expect(toggle.getAttribute('aria-label')).to.equal('Show password');
  });

  it('toggle aria-label changes after toggle', async () => {
    const el = await fixture<UiPasswordInput>(html`<ui-password-input></ui-password-input>`);
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>('button.toggle')!;
    toggle.click();
    await el.updateComplete;
    expect(toggle.getAttribute('aria-label')).to.equal('Hide password');
  });

  it('toggle has aria-pressed reflecting show-password state', async () => {
    const el = await fixture<UiPasswordInput>(html`<ui-password-input></ui-password-input>`);
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>('button.toggle')!;
    expect(toggle.getAttribute('aria-pressed')).to.equal('false');
    toggle.click();
    await el.updateComplete;
    expect(toggle.getAttribute('aria-pressed')).to.equal('true');
  });

  it('toggle button is disabled when state=disabled', async () => {
    const el = await fixture<UiPasswordInput>(html`<ui-password-input state="disabled"></ui-password-input>`);
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>('button.toggle')!;
    expect(toggle.disabled).to.equal(true);
  });

  it('toggle button is disabled when disabled attribute is set', async () => {
    const el = await fixture<UiPasswordInput>(html`<ui-password-input disabled></ui-password-input>`);
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>('button.toggle')!;
    expect(toggle.disabled).to.equal(true);
  });

  it('dispatches ui-toggle event on click', async () => {
    const el = await fixture<UiPasswordInput>(html`<ui-password-input></ui-password-input>`);
    let eventDetail: { showPassword: boolean } | null = null;
    el.addEventListener('ui-toggle', (e) => {
      eventDetail = (e as CustomEvent).detail;
    });
    el.shadowRoot!.querySelector<HTMLButtonElement>('button.toggle')!.click();
    await el.updateComplete;
    expect(eventDetail).to.not.equal(null);
    expect(eventDetail!.showPassword).to.equal(true);
  });

  it('dispatches ui-input event on typing', async () => {
    const el = await fixture<UiPasswordInput>(html`<ui-password-input></ui-password-input>`);
    let fired = false;
    el.addEventListener('ui-input', () => { fired = true; });
    const input = el.shadowRoot!.querySelector('input')!;
    input.value = 'test';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(fired).to.equal(true);
  });

  it('reflects show-password attribute', async () => {
    const el = await fixture<UiPasswordInput>(html`<ui-password-input></ui-password-input>`);
    el.showPassword = true;
    await el.updateComplete;
    expect(el.hasAttribute('show-password')).to.equal(true);
  });

  it('always has has-trailing-icon attribute', async () => {
    const el = await fixture<UiPasswordInput>(html`<ui-password-input></ui-password-input>`);
    await el.updateComplete;
    expect(el.hasAttribute('has-trailing-icon')).to.equal(true);
  });

  it('reflects variant attribute', async () => {
    const el = await fixture<UiPasswordInput>(html`<ui-password-input variant="filled"></ui-password-input>`);
    expect(el.getAttribute('variant')).to.equal('filled');
  });

  it('reflects state attribute', async () => {
    const el = await fixture<UiPasswordInput>(html`<ui-password-input state="error"></ui-password-input>`);
    expect(el.getAttribute('state')).to.equal('error');
  });
});
