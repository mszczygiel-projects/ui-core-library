import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import type { UiChip } from './chip.js';
import './chip.js';

describe('UiChip', () => {
  it('renders with default slot content', async () => {
    const el = await fixture<UiChip>(html`<ui-chip>Filter</ui-chip>`);
    expect(el).to.not.equal(null);
    expect(el.textContent).to.equal('Filter');
  });

  it('has expected defaults', async () => {
    const el = await fixture<UiChip>(html`<ui-chip>Filter</ui-chip>`);
    expect(el.variant).to.equal('neutral');
    expect(el.appearance).to.equal('solid');
    expect(el.size).to.equal('small');
    expect(el.selected).to.equal(false);
    expect(el.disabled).to.equal(false);
    expect(el.dismissible).to.equal(false);
    expect(el.dismissLabel).to.equal('Remove');
  });

  it('reflects variant, appearance and data-size attributes', async () => {
    const el = await fixture<UiChip>(
      html`<ui-chip variant="success" appearance="outline">Done</ui-chip>`,
    );
    expect(el.getAttribute('variant')).to.equal('success');
    expect(el.getAttribute('appearance')).to.equal('outline');
    el.size = 'medium';
    await el.updateComplete;
    expect(el.getAttribute('data-size')).to.equal('medium');
  });

  it('renders the action area as a native button', async () => {
    const el = await fixture<UiChip>(html`<ui-chip>Filter</ui-chip>`);
    const action = el.shadowRoot!.querySelector<HTMLButtonElement>('button.action')!;
    expect(action).to.not.equal(null);
    expect(action.getAttribute('type')).to.equal('button');
    expect(action.disabled).to.equal(false);
  });

  it('reflects selected and sets aria-pressed on the action button', async () => {
    const el = await fixture<UiChip>(html`<ui-chip selected>Filter</ui-chip>`);
    expect(el.hasAttribute('selected')).to.equal(true);
    const action = el.shadowRoot!.querySelector('button.action')!;
    expect(action.getAttribute('aria-pressed')).to.equal('true');
  });

  it('sets aria-pressed="false" when not selected', async () => {
    const el = await fixture<UiChip>(html`<ui-chip>Filter</ui-chip>`);
    const action = el.shadowRoot!.querySelector('button.action')!;
    expect(action.getAttribute('aria-pressed')).to.equal('false');
  });

  it('does not render the dismiss button by default', async () => {
    const el = await fixture<UiChip>(html`<ui-chip>Filter</ui-chip>`);
    expect(el.shadowRoot!.querySelector('button.dismiss')).to.equal(null);
  });

  it('renders the dismiss button when dismissible', async () => {
    const el = await fixture<UiChip>(html`<ui-chip dismissible>Filter</ui-chip>`);
    const dismiss = el.shadowRoot!.querySelector('button.dismiss')!;
    expect(dismiss).to.not.equal(null);
    expect(dismiss.getAttribute('aria-label')).to.equal('Remove');
    expect(dismiss.querySelector('svg')).to.not.equal(null);
  });

  it('honours a custom dismiss-label', async () => {
    const el = await fixture<UiChip>(
      html`<ui-chip dismissible dismiss-label="Usuń filtr">Filter</ui-chip>`,
    );
    const dismiss = el.shadowRoot!.querySelector('button.dismiss')!;
    expect(dismiss.getAttribute('aria-label')).to.equal('Usuń filtr');
  });

  it('disabled: disables the action button and hides the dismiss button', async () => {
    const el = await fixture<UiChip>(html`<ui-chip dismissible disabled>Filter</ui-chip>`);
    const action = el.shadowRoot!.querySelector<HTMLButtonElement>('button.action')!;
    expect(action.disabled).to.equal(true);
    expect(el.shadowRoot!.querySelector('button.dismiss')).to.equal(null);
  });

  it('fires a dismiss event when the dismiss button is clicked', async () => {
    const el = await fixture<UiChip>(html`<ui-chip dismissible>Filter</ui-chip>`);
    const dismiss = el.shadowRoot!.querySelector<HTMLButtonElement>('button.dismiss')!;
    setTimeout(() => dismiss.click());
    const event = await oneEvent(el, 'dismiss');
    expect(event).to.not.equal(null);
  });

  it('dismiss click does not surface as a chip click', async () => {
    const el = await fixture<UiChip>(html`<ui-chip dismissible>Filter</ui-chip>`);
    let clicks = 0;
    el.addEventListener('click', () => {
      clicks += 1;
    });
    const dismiss = el.shadowRoot!.querySelector<HTMLButtonElement>('button.dismiss')!;
    setTimeout(() => dismiss.click());
    await oneEvent(el, 'dismiss');
    expect(clicks).to.equal(0);
  });

  it('fires a dismiss event on Delete keydown when dismissible', async () => {
    const el = await fixture<UiChip>(html`<ui-chip dismissible>Filter</ui-chip>`);
    const action = el.shadowRoot!.querySelector<HTMLButtonElement>('button.action')!;
    setTimeout(() =>
      action.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true })),
    );
    const event = await oneEvent(el, 'dismiss');
    expect(event).to.not.equal(null);
  });

  it('does not fire dismiss on Delete when not dismissible', async () => {
    const el = await fixture<UiChip>(html`<ui-chip>Filter</ui-chip>`);
    let fired = 0;
    el.addEventListener('dismiss', () => {
      fired += 1;
    });
    const action = el.shadowRoot!.querySelector<HTMLButtonElement>('button.action')!;
    action.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    await el.updateComplete;
    expect(fired).to.equal(0);
  });

  it('projects icon slot content', async () => {
    const el = await fixture<UiChip>(html`<ui-chip><span slot="icon">i</span>Filter</ui-chip>`);
    const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="icon"]')!;
    expect(slot.assignedElements().length).to.equal(1);
  });
});
