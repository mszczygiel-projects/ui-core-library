import { fixture, html, expect } from '@open-wc/testing';
import type { UiLoader } from './loader.js';
import './loader.js';

describe('UiLoader', () => {
  it('renders with role="status"', async () => {
    const el = await fixture<UiLoader>(html`<ui-loader></ui-loader>`);
    const status = el.shadowRoot!.querySelector('[role="status"]');
    expect(status).to.not.equal(null);
  });

  it('aria-label reflects label prop', async () => {
    const el = await fixture<UiLoader>(html`<ui-loader label="Please wait"></ui-loader>`);
    const status = el.shadowRoot!.querySelector('[role="status"]');
    expect(status!.getAttribute('aria-label')).to.equal('Please wait');
  });

  it('host reflects size as data-size attribute', async () => {
    const el = await fixture<UiLoader>(html`<ui-loader></ui-loader>`);
    el.size = 'large';
    await el.updateComplete;
    expect(el.getAttribute('data-size')).to.equal('large');
  });

  it('matches snapshot', async () => {
    const el = await fixture<UiLoader>(html`<ui-loader></ui-loader>`);
    expect(el).shadowDom.to.equal(`
      <span role="status" aria-label="Loading" aria-live="polite">
        <span class="spinner" aria-hidden="true"></span>
      </span>
    `);
  });
});
