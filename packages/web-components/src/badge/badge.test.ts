import { fixture, html, expect } from '@open-wc/testing';
import type { UiBadge } from './badge.js';
import './badge.js';

describe('UiBadge', () => {
  it('renders with default slot content', async () => {
    const el = await fixture<UiBadge>(html`<ui-badge>New</ui-badge>`);
    expect(el).to.not.equal(null);
    expect(el.textContent).to.equal('New');
  });

  it('has expected defaults', async () => {
    const el = await fixture<UiBadge>(html`<ui-badge>New</ui-badge>`);
    expect(el.variant).to.equal('neutral');
    expect(el.appearance).to.equal('solid');
    expect(el.size).to.equal('small');
    expect(el.shape).to.equal('rounded');
    expect(el.iconOnly).to.equal(false);
  });

  it('reflects variant attribute', async () => {
    const el = await fixture<UiBadge>(html`<ui-badge variant="success">Done</ui-badge>`);
    expect(el.getAttribute('variant')).to.equal('success');
  });

  it('reflects appearance attribute', async () => {
    const el = await fixture<UiBadge>(html`<ui-badge appearance="subtle">Done</ui-badge>`);
    expect(el.getAttribute('appearance')).to.equal('subtle');
  });

  it('reflects size as data-size attribute', async () => {
    const el = await fixture<UiBadge>(html`<ui-badge>New</ui-badge>`);
    el.size = 'medium';
    await el.updateComplete;
    expect(el.getAttribute('data-size')).to.equal('medium');
  });

  it('reflects shape attribute', async () => {
    const el = await fixture<UiBadge>(html`<ui-badge shape="square">New</ui-badge>`);
    expect(el.getAttribute('shape')).to.equal('square');
  });

  it('reflects icon-only attribute', async () => {
    const el = await fixture<UiBadge>(html`<ui-badge>New</ui-badge>`);
    el.iconOnly = true;
    await el.updateComplete;
    expect(el.hasAttribute('icon-only')).to.equal(true);
  });

  it('renders an icon slot', async () => {
    const el = await fixture<UiBadge>(html`<ui-badge>New</ui-badge>`);
    expect(el.shadowRoot!.querySelector('slot[name="icon"]')).to.not.equal(null);
  });

  it('projects icon slot content', async () => {
    const el = await fixture<UiBadge>(
      html`<ui-badge icon-only label="Info"><span slot="icon">i</span></ui-badge>`,
    );
    const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="icon"]')!;
    expect(slot.assignedElements().length).to.equal(1);
  });

  it('label sets role="img" and aria-label on host', async () => {
    const el = await fixture<UiBadge>(html`<ui-badge icon-only label="Notifications"></ui-badge>`);
    expect(el.getAttribute('role')).to.equal('img');
    expect(el.getAttribute('aria-label')).to.equal('Notifications');
  });

  it('clearing label removes role and aria-label', async () => {
    const el = await fixture<UiBadge>(html`<ui-badge icon-only label="Notifications"></ui-badge>`);
    el.label = undefined;
    await el.updateComplete;
    expect(el.hasAttribute('role')).to.equal(false);
    expect(el.hasAttribute('aria-label')).to.equal(false);
  });

  it('without label there is no role on host', async () => {
    const el = await fixture<UiBadge>(html`<ui-badge>New</ui-badge>`);
    expect(el.hasAttribute('role')).to.equal(false);
    expect(el.hasAttribute('aria-label')).to.equal(false);
  });
});
