import { fixture, html, expect } from '@open-wc/testing';
import type { UiIconButton } from './icon-button.js';
import './icon-button.js';

describe('UiIconButton', () => {
  it('renders inner <button> element', async () => {
    const el = await fixture<UiIconButton>(html`<ui-icon-button label="Action"></ui-icon-button>`);
    expect(el.shadowRoot!.querySelector('button')).to.not.equal(null);
  });

  it('has type="button" on inner <button> by default', async () => {
    const el = await fixture<UiIconButton>(html`<ui-icon-button label="Action"></ui-icon-button>`);
    expect(el.shadowRoot!.querySelector('button')!.type).to.equal('button');
  });

  it('reflects variant attribute', async () => {
    const el = await fixture<UiIconButton>(
      html`<ui-icon-button variant="secondary" label="Action"></ui-icon-button>`,
    );
    expect(el.getAttribute('variant')).to.equal('secondary');
  });

  it('defaults variant to primary', async () => {
    const el = await fixture<UiIconButton>(html`<ui-icon-button label="Action"></ui-icon-button>`);
    expect(el.variant).to.equal('primary');
  });

  it('reflects data-size attribute', async () => {
    const el = await fixture<UiIconButton>(html`<ui-icon-button label="Action"></ui-icon-button>`);
    el.size = 'large';
    await el.updateComplete;
    expect(el.getAttribute('data-size')).to.equal('large');
  });

  it('disabled prop disables inner <button>', async () => {
    const el = await fixture<UiIconButton>(
      html`<ui-icon-button disabled label="Action"></ui-icon-button>`,
    );
    expect(el.shadowRoot!.querySelector('button')!.disabled).to.equal(true);
  });

  it('loading prop disables inner <button> and sets aria-busy', async () => {
    const el = await fixture<UiIconButton>(
      html`<ui-icon-button loading label="Action"></ui-icon-button>`,
    );
    const btn = el.shadowRoot!.querySelector('button')!;
    expect(btn.disabled).to.equal(true);
    expect(btn.getAttribute('aria-busy')).to.equal('true');
  });

  it('loading prop reflects on host', async () => {
    const el = await fixture<UiIconButton>(
      html`<ui-icon-button loading label="Action"></ui-icon-button>`,
    );
    expect(el.hasAttribute('loading')).to.equal(true);
  });

  it('loading renders ui-loader and hides default slot', async () => {
    const el = await fixture<UiIconButton>(
      html`<ui-icon-button loading label="Action"></ui-icon-button>`,
    );
    expect(el.shadowRoot!.querySelector('ui-loader')).to.not.equal(null);
    expect(el.shadowRoot!.querySelector('slot')).to.equal(null);
  });

  it('non-loading renders default slot', async () => {
    const el = await fixture<UiIconButton>(html`<ui-icon-button label="Action"></ui-icon-button>`);
    expect(el.shadowRoot!.querySelector('slot')).to.not.equal(null);
    expect(el.shadowRoot!.querySelector('ui-loader')).to.equal(null);
  });

  it('label prop sets aria-label on inner <button>', async () => {
    const el = await fixture<UiIconButton>(
      html`<ui-icon-button label="Delete item"></ui-icon-button>`,
    );
    expect(el.shadowRoot!.querySelector('button')!.getAttribute('aria-label')).to.equal(
      'Delete item',
    );
  });

  it('default slot projects icon content', async () => {
    const el = await fixture<UiIconButton>(
      html`<ui-icon-button label="Action"><span>★</span></ui-icon-button>`,
    );
    const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot');
    expect(slot).to.not.equal(null);
    expect(slot!.assignedElements()[0].textContent).to.equal('★');
  });
});
