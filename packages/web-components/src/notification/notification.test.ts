import { fixture, expect, waitUntil } from '@open-wc/testing';
import { html } from 'lit';
import type { UiNotification } from './notification.js';
import './notification.js';

describe('UiNotification', () => {
  it('renders without error', async () => {
    const el = await fixture<UiNotification>(
      html`<ui-notification heading="Test notification"></ui-notification>`,
    );
    expect(el).to.not.equal(null);
  });

  it('reflects status attribute', async () => {
    const el = await fixture<UiNotification>(
      html`<ui-notification heading="Test" status="success"></ui-notification>`,
    );
    expect(el.getAttribute('status')).to.equal('success');
    expect(el.status).to.equal('success');
  });

  it('reflects variant attribute', async () => {
    const el = await fixture<UiNotification>(
      html`<ui-notification heading="Test" variant="subtle"></ui-notification>`,
    );
    expect(el.getAttribute('variant')).to.equal('subtle');
    expect(el.variant).to.equal('subtle');
  });

  it('reflects has-close-button attribute', async () => {
    const el = await fixture<UiNotification>(
      html`<ui-notification heading="Test" has-close-button></ui-notification>`,
    );
    expect(el.hasCloseButton).to.equal(true);
  });

  it('renders heading text', async () => {
    const el = await fixture<UiNotification>(
      html`<ui-notification heading="Hello world"></ui-notification>`,
    );
    const headingEl = el.shadowRoot!.querySelector('.heading');
    expect(headingEl?.textContent?.trim()).to.equal('Hello world');
  });

  it('renders close button by default', async () => {
    const el = await fixture<UiNotification>(
      html`<ui-notification heading="Test"></ui-notification>`,
    );
    const btn = el.shadowRoot!.querySelector('.close');
    expect(btn).to.not.equal(null);
  });

  it('does not render close button when has-close-button is absent', async () => {
    const el = await fixture<UiNotification>(
      html`<ui-notification heading="Test" .hasCloseButton=${false}></ui-notification>`,
    );
    const btn = el.shadowRoot!.querySelector('.close');
    expect(btn).to.equal(null);
  });

  it('close button has aria-label="Close notification"', async () => {
    const el = await fixture<UiNotification>(
      html`<ui-notification heading="Test"></ui-notification>`,
    );
    const btn = el.shadowRoot!.querySelector('.close');
    expect(btn?.getAttribute('aria-label')).to.equal('Close notification');
  });

  it('dispatches ui-close event when close button is clicked', async () => {
    const el = await fixture<UiNotification>(
      html`<ui-notification heading="Test"></ui-notification>`,
    );
    let fired = false;
    el.addEventListener('ui-close', () => {
      fired = true;
    });
    const btn = el.shadowRoot!.querySelector<HTMLButtonElement>('.close');
    btn?.click();
    expect(fired).to.equal(true);
  });

  it('icon element is always present in the DOM', async () => {
    const elDefault = await fixture<UiNotification>(
      html`<ui-notification heading="Test" variant="default"></ui-notification>`,
    );
    expect(elDefault.shadowRoot!.querySelector('.icon')).to.not.equal(null);

    const elSubtle = await fixture<UiNotification>(
      html`<ui-notification heading="Test" variant="subtle"></ui-notification>`,
    );
    expect(elSubtle.shadowRoot!.querySelector('.icon')).to.not.equal(null);
  });

  it('projects default slot content as description', async () => {
    const el = await fixture<UiNotification>(
      html`<ui-notification heading="Test">Description text</ui-notification>`,
    );
    // Wait for slotchange to fire and _hasDescription to update
    await waitUntil(() => el.shadowRoot!.querySelector('.description:not([hidden])') !== null);
    const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot');
    const nodes = slot!.assignedNodes({ flatten: true });
    const text = nodes.map((n) => n.textContent).join('');
    expect(text).to.include('Description text');
  });

  it('description wrapper is hidden when slot is empty', async () => {
    const el = await fixture<UiNotification>(
      html`<ui-notification heading="Test"></ui-notification>`,
    );
    await el.updateComplete;
    const desc = el.shadowRoot!.querySelector('.description');
    expect(desc?.hasAttribute('hidden')).to.equal(true);
  });

  it('renders inner .container element', async () => {
    const el = await fixture<UiNotification>(
      html`<ui-notification heading="Test"></ui-notification>`,
    );
    expect(el.shadowRoot!.querySelector('.container')).to.not.equal(null);
  });

  it('defaults to status="info"', async () => {
    const el = await fixture<UiNotification>(
      html`<ui-notification heading="Test"></ui-notification>`,
    );
    expect(el.status).to.equal('info');
  });

  it('defaults to variant="default"', async () => {
    const el = await fixture<UiNotification>(
      html`<ui-notification heading="Test"></ui-notification>`,
    );
    expect(el.variant).to.equal('default');
  });
});
