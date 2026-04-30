import { fixture, html, expect } from '@open-wc/testing';
import type { UiButton } from './button.js';
import './button.js';

describe('UiButton', () => {
  it('renders inner <button> element', async () => {
    const el = await fixture<UiButton>(html`<ui-button>Click</ui-button>`);
    expect(el.shadowRoot!.querySelector('button')).to.not.equal(null);
  });

  it('has type="button" on inner <button> by default', async () => {
    const el = await fixture<UiButton>(html`<ui-button>Click</ui-button>`);
    expect(el.shadowRoot!.querySelector('button')!.type).to.equal('button');
  });

  it('reflects variant attribute', async () => {
    const el = await fixture<UiButton>(html`<ui-button variant="secondary">Click</ui-button>`);
    expect(el.getAttribute('variant')).to.equal('secondary');
  });

  it('defaults variant to primary', async () => {
    const el = await fixture<UiButton>(html`<ui-button>Click</ui-button>`);
    expect(el.variant).to.equal('primary');
  });

  it('reflects data-size attribute', async () => {
    const el = await fixture<UiButton>(html`<ui-button></ui-button>`);
    el.size = 'large';
    await el.updateComplete;
    expect(el.getAttribute('data-size')).to.equal('large');
  });

  it('disabled prop disables inner <button>', async () => {
    const el = await fixture<UiButton>(html`<ui-button disabled>Click</ui-button>`);
    expect(el.shadowRoot!.querySelector('button')!.disabled).to.equal(true);
  });

  it('loading prop disables inner <button> and sets aria-busy', async () => {
    const el = await fixture<UiButton>(html`<ui-button loading>Click</ui-button>`);
    const btn = el.shadowRoot!.querySelector('button')!;
    expect(btn.disabled).to.equal(true);
    expect(btn.getAttribute('aria-busy')).to.equal('true');
  });

  it('loading prop reflects on host', async () => {
    const el = await fixture<UiButton>(html`<ui-button loading>Click</ui-button>`);
    expect(el.hasAttribute('loading')).to.equal(true);
  });

  it('loading renders ui-loader and hides icon slots', async () => {
    const el = await fixture<UiButton>(html`<ui-button loading>Click</ui-button>`);
    expect(el.shadowRoot!.querySelector('ui-loader')).to.not.equal(null);
    expect(el.shadowRoot!.querySelector('slot[name="icon-left"]')).to.equal(null);
    expect(el.shadowRoot!.querySelector('slot[name="icon-right"]')).to.equal(null);
  });

  it('non-loading renders icon slots', async () => {
    const el = await fixture<UiButton>(html`<ui-button>Click</ui-button>`);
    expect(el.shadowRoot!.querySelector('slot[name="icon-left"]')).to.not.equal(null);
    expect(el.shadowRoot!.querySelector('slot[name="icon-right"]')).to.not.equal(null);
    expect(el.shadowRoot!.querySelector('ui-loader')).to.equal(null);
  });

  it('label prop sets aria-label on inner <button>', async () => {
    const el = await fixture<UiButton>(html`<ui-button label="Delete item">Click</ui-button>`);
    expect(el.shadowRoot!.querySelector('button')!.getAttribute('aria-label')).to.equal(
      'Delete item',
    );
  });

  it('default slot projects label text', async () => {
    const el = await fixture<UiButton>(html`<ui-button>Save changes</ui-button>`);
    const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot:not([name])');
    expect(slot).to.not.equal(null);
    expect(slot!.assignedNodes()[0].textContent).to.equal('Save changes');
  });

  it('icon-left slot projects content', async () => {
    const el = await fixture<UiButton>(
      html`<ui-button><span slot="icon-left">★</span>Click</ui-button>`,
    );
    const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="icon-left"]');
    expect(slot!.assignedElements()[0].textContent).to.equal('★');
  });
});
