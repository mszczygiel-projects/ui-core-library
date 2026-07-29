import { fixture, html, expect, nextFrame } from '@open-wc/testing';
import type { UiDialog, DialogOpenChangeDetail } from './dialog.js';
import './dialog.js';

const openChangeEvents = (el: UiDialog) => {
  const events: DialogOpenChangeDetail[] = [];
  el.addEventListener('open-change', (e) => {
    events.push((e as CustomEvent<DialogOpenChangeDetail>).detail);
  });
  return events;
};

const panelOf = (el: UiDialog) => el.shadowRoot!.querySelector<HTMLDialogElement>('.panel')!;

/** Opens through the controlled prop and waits for the render to settle. */
const openDialog = async (el: UiDialog) => {
  el.open = true;
  await el.updateComplete;
  await nextFrame();
};

describe('UiDialog', () => {
  it('has expected defaults', async () => {
    const el = await fixture<UiDialog>(html`<ui-dialog></ui-dialog>`);
    expect(el.open).to.equal(false);
    expect(el.size).to.equal('medium');
    expect(el.variant).to.equal('default');
    expect(el.dismissOn).to.equal('both');
    expect(el.hasCloseButton).to.equal(true);
  });

  it('reflects size to data-size and variant to an attribute', async () => {
    const el = await fixture<UiDialog>(html`<ui-dialog></ui-dialog>`);
    el.size = 'large';
    el.variant = 'alert';
    await el.updateComplete;
    expect(el.getAttribute('data-size')).to.equal('large');
    expect(el.getAttribute('variant')).to.equal('alert');
  });

  it('opens the native dialog only when open is set', async () => {
    const el = await fixture<UiDialog>(html`<ui-dialog></ui-dialog>`);
    expect(panelOf(el).open).to.equal(false);
    await openDialog(el);
    expect(panelOf(el).open).to.equal(true);
    el.open = false;
    await el.updateComplete;
    expect(panelOf(el).open).to.equal(false);
  });

  it('projects title, description, body and footer slots', async () => {
    const el = await fixture<UiDialog>(html`
      <ui-dialog>
        <span slot="title">Title text</span>
        <span slot="description">Description text</span>
        <p>Body text</p>
        <div slot="footer"><button>Act</button></div>
      </ui-dialog>
    `);
    await el.updateComplete;
    const assigned = (name: string) =>
      el
        .shadowRoot!.querySelector<HTMLSlotElement>(
          name ? `slot[name="${name}"]` : 'slot:not([name])',
        )!
        .assignedNodes({ flatten: true })
        .map((n) => n.textContent?.trim())
        .join('');
    expect(assigned('title')).to.contain('Title text');
    expect(assigned('description')).to.contain('Description text');
    expect(assigned('')).to.contain('Body text');
    expect(assigned('footer')).to.contain('Act');
  });

  it('wires aria-labelledby to the title and aria-describedby to the description', async () => {
    const el = await fixture<UiDialog>(html`
      <ui-dialog>
        <span slot="title">Title text</span>
        <span slot="description">Description text</span>
      </ui-dialog>
    `);
    await el.updateComplete;
    const panel = panelOf(el);
    expect(panel.getAttribute('aria-labelledby')).to.equal('dialog-title');
    expect(panel.getAttribute('aria-describedby')).to.equal('dialog-description');
    // Compared as a boolean on purpose: a failing chai assertion against a DOM
    // node serialises the shadow tree and stalls the runner.
    expect(el.shadowRoot!.querySelector('#dialog-title') !== null).to.equal(true);
  });

  it('falls back to aria-label when no title slot is provided', async () => {
    const el = await fixture<UiDialog>(html`<ui-dialog label="Settings"></ui-dialog>`);
    await el.updateComplete;
    const panel = panelOf(el);
    expect(panel.getAttribute('aria-label')).to.equal('Settings');
    expect(panel.hasAttribute('aria-labelledby')).to.equal(false);
  });

  it('uses role="alertdialog" for the alert variant', async () => {
    const el = await fixture<UiDialog>(html`<ui-dialog variant="alert"></ui-dialog>`);
    await el.updateComplete;
    expect(panelOf(el).getAttribute('role')).to.equal('alertdialog');
  });

  it('requests close from the close button without changing its own state', async () => {
    const el = await fixture<UiDialog>(html`<ui-dialog></ui-dialog>`);
    await openDialog(el);
    const events = openChangeEvents(el);
    el.shadowRoot!.querySelector<HTMLElement>('.close')!.click();
    expect(events.length).to.equal(1);
    expect(events[0].open).to.equal(false);
    expect(events[0].reason).to.equal('close-button');
    // Controlled: the element must not close itself.
    expect(el.open).to.equal(true);
  });

  it('requests close on Escape and keeps the native dialog open', async () => {
    const el = await fixture<UiDialog>(html`<ui-dialog></ui-dialog>`);
    await openDialog(el);
    const events = openChangeEvents(el);
    panelOf(el).dispatchEvent(new Event('cancel', { cancelable: true }));
    await nextFrame();
    expect(events.length).to.equal(1);
    expect(events[0].reason).to.equal('escape');
    expect(panelOf(el).open).to.equal(true);
  });

  it('ignores Escape when dismiss-on excludes it', async () => {
    const el = await fixture<UiDialog>(html`<ui-dialog dismiss-on="outside-click"></ui-dialog>`);
    await openDialog(el);
    const events = openChangeEvents(el);
    panelOf(el).dispatchEvent(new Event('cancel', { cancelable: true }));
    await nextFrame();
    expect(events.length).to.equal(0);
  });

  it('requests close when the backdrop is clicked', async () => {
    const el = await fixture<UiDialog>(html`<ui-dialog></ui-dialog>`);
    await openDialog(el);
    const events = openChangeEvents(el);
    // A click whose target is the dialog element itself is a backdrop click.
    panelOf(el).click();
    expect(events.length).to.equal(1);
    expect(events[0].reason).to.equal('outside-click');
  });

  it('never dismisses an alert dialog by backdrop click', async () => {
    const el = await fixture<UiDialog>(html`<ui-dialog variant="alert"></ui-dialog>`);
    await openDialog(el);
    const events = openChangeEvents(el);
    panelOf(el).click();
    expect(events.length).to.equal(0);
  });

  it('makes no requests at all with dismiss-on="none"', async () => {
    const el = await fixture<UiDialog>(html`<ui-dialog dismiss-on="none"></ui-dialog>`);
    await openDialog(el);
    const events = openChangeEvents(el);
    panelOf(el).click();
    panelOf(el).dispatchEvent(new Event('cancel', { cancelable: true }));
    await nextFrame();
    expect(events.length).to.equal(0);
  });

  it('hides the close button when has-close-button is off', async () => {
    const el = await fixture<UiDialog>(html`<ui-dialog></ui-dialog>`);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.close') !== null).to.equal(true);
    el.hasCloseButton = false;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.close') !== null).to.equal(false);
  });

  it('renders the drag affordance only when drag-to-dismiss is on', async () => {
    const el = await fixture<UiDialog>(html`<ui-dialog></ui-dialog>`);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.grabber') !== null).to.equal(false);

    el.dragToDismiss = true;
    await el.updateComplete;
    const grabber = el.shadowRoot!.querySelector('.grabber');
    expect(grabber !== null).to.equal(true);
    // Decorative: keyboard and screen-reader users close by other means.
    expect(grabber!.getAttribute('aria-hidden')).to.equal('true');
  });

  it('reflects drag-to-dismiss as an attribute', async () => {
    const el = await fixture<UiDialog>(html`<ui-dialog drag-to-dismiss></ui-dialog>`);
    await el.updateComplete;
    expect(el.dragToDismiss).to.equal(true);
    expect(el.hasAttribute('drag-to-dismiss')).to.equal(true);
  });

  it('traps focus inside the panel while open', async () => {
    const el = await fixture<UiDialog>(html`
      <ui-dialog><button id="inside">Inside</button></ui-dialog>
    `);
    await openDialog(el);
    // showModal() makes everything outside the top-layer dialog inert.
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    expect(
      el.contains(document.activeElement) || document.activeElement === document.body,
    ).to.equal(true);
    outside.remove();
  });

  it('locks page scroll while open and restores it on close', async () => {
    const el = await fixture<UiDialog>(html`<ui-dialog></ui-dialog>`);
    const before = document.documentElement.style.overflow;
    await openDialog(el);
    expect(document.documentElement.style.overflow).to.equal('hidden');
    el.open = false;
    await el.updateComplete;
    expect(document.documentElement.style.overflow).to.equal(before);
  });

  it('reference-counts the scroll lock across nested dialogs', async () => {
    const outer = await fixture<UiDialog>(html`<ui-dialog></ui-dialog>`);
    const inner = await fixture<UiDialog>(html`<ui-dialog></ui-dialog>`);
    await openDialog(outer);
    await openDialog(inner);
    inner.open = false;
    await inner.updateComplete;
    // The outer dialog is still open — the lock must survive.
    expect(document.documentElement.style.overflow).to.equal('hidden');
    outer.open = false;
    await outer.updateComplete;
    expect(document.documentElement.style.overflow).to.not.equal('hidden');
  });
});
