import { fixture, html, expect, nextFrame } from '@open-wc/testing';
import type { UiDrawer, DrawerOpenChangeDetail } from './drawer.js';
import './drawer.js';

const openChangeEvents = (el: UiDrawer) => {
  const events: DrawerOpenChangeDetail[] = [];
  el.addEventListener('open-change', (e) => {
    events.push((e as CustomEvent<DrawerOpenChangeDetail>).detail);
  });
  return events;
};

const panelOf = (el: UiDrawer) => el.shadowRoot!.querySelector<HTMLDialogElement>('.panel')!;

/** Opens through the controlled prop and waits for the render to settle. */
const openDrawer = async (el: UiDrawer) => {
  el.open = true;
  await el.updateComplete;
  await nextFrame();
};

describe('UiDrawer', () => {
  it('has expected defaults', async () => {
    const el = await fixture<UiDrawer>(html`<ui-drawer></ui-drawer>`);
    expect(el.open).to.equal(false);
    expect(el.placement).to.equal('right');
    expect(el.dismissOn).to.equal('both');
    expect(el.hasCloseButton).to.equal(true);
    expect(el.dragToDismiss).to.equal(false);
  });

  it('reflects placement and dismiss-on to attributes', async () => {
    const el = await fixture<UiDrawer>(html`<ui-drawer></ui-drawer>`);
    el.placement = 'bottom';
    el.dismissOn = 'escape';
    await el.updateComplete;
    expect(el.getAttribute('placement')).to.equal('bottom');
    expect(el.getAttribute('dismiss-on')).to.equal('escape');
  });

  it('opens the native dialog only when open is set', async () => {
    const el = await fixture<UiDrawer>(html`<ui-drawer></ui-drawer>`);
    expect(panelOf(el).open).to.equal(false);
    await openDrawer(el);
    expect(panelOf(el).open).to.equal(true);
    el.open = false;
    await el.updateComplete;
    expect(panelOf(el).open).to.equal(false);
  });

  it('projects content into the body region', async () => {
    const el = await fixture<UiDrawer>(html`<ui-drawer><p>Body text</p></ui-drawer>`);
    await el.updateComplete;
    const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('.body slot')!;
    const assigned = slot.assignedElements({ flatten: true });
    expect(assigned).to.have.lengthOf(1);
    expect(assigned[0].textContent).to.equal('Body text');
  });

  it('names the dialog from the label property', async () => {
    const el = await fixture<UiDrawer>(html`<ui-drawer label="Filters"></ui-drawer>`);
    await el.updateComplete;
    expect(panelOf(el).getAttribute('aria-label')).to.equal('Filters');
    expect(panelOf(el).getAttribute('role')).to.equal('dialog');
  });

  it('requests a close from the close button', async () => {
    const el = await fixture<UiDrawer>(html`<ui-drawer></ui-drawer>`);
    await openDrawer(el);
    const events = openChangeEvents(el);
    el.shadowRoot!.querySelector<HTMLElement>('.close')!.click();
    expect(events).to.deep.equal([{ open: false, reason: 'close-button' }]);
  });

  it('hides the dismiss region when has-close-button is false', async () => {
    const el = await fixture<UiDrawer>(html`<ui-drawer has-close-button="false"></ui-drawer>`);
    el.hasCloseButton = false;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.close')).to.equal(null);
  });

  it('requests a close when the backdrop is clicked', async () => {
    const el = await fixture<UiDrawer>(html`<ui-drawer></ui-drawer>`);
    await openDrawer(el);
    const events = openChangeEvents(el);
    // A click whose target is the dialog element itself is a backdrop click.
    panelOf(el).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(events).to.deep.equal([{ open: false, reason: 'outside-click' }]);
  });

  it('ignores the backdrop when dismiss-on excludes outside clicks', async () => {
    const el = await fixture<UiDrawer>(html`<ui-drawer dismiss-on="escape"></ui-drawer>`);
    await openDrawer(el);
    const events = openChangeEvents(el);
    panelOf(el).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(events).to.have.lengthOf(0);
  });

  it('requests a close on Escape and never closes itself', async () => {
    const el = await fixture<UiDrawer>(html`<ui-drawer></ui-drawer>`);
    await openDrawer(el);
    const events = openChangeEvents(el);
    panelOf(el).dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(events).to.deep.equal([{ open: false, reason: 'escape' }]);
    // Controlled: the request alone must not flip the element's own state.
    expect(el.open).to.equal(true);
    expect(panelOf(el).open).to.equal(true);
  });

  it('ignores Escape when dismiss-on is none', async () => {
    const el = await fixture<UiDrawer>(html`<ui-drawer dismiss-on="none"></ui-drawer>`);
    await openDrawer(el);
    const events = openChangeEvents(el);
    panelOf(el).dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(events).to.have.lengthOf(0);
  });

  it('renders the grabber only for a bottom sheet with drag-to-dismiss', async () => {
    const el = await fixture<UiDrawer>(html`<ui-drawer drag-to-dismiss></ui-drawer>`);
    await el.updateComplete;
    // Default placement is `right` — the gesture does not apply there.
    expect(el.shadowRoot!.querySelector('.grabber')).to.equal(null);

    el.placement = 'bottom';
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.grabber')).to.not.equal(null);

    el.dragToDismiss = false;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.grabber')).to.equal(null);
  });

  it('locks page scroll while open and releases it on close', async () => {
    const el = await fixture<UiDrawer>(html`<ui-drawer></ui-drawer>`);
    const before = document.documentElement.style.overflow;
    await openDrawer(el);
    expect(document.documentElement.style.overflow).to.equal('hidden');
    el.open = false;
    await el.updateComplete;
    expect(document.documentElement.style.overflow).to.equal(before);
  });

  it('anchors each placement to its own edge', async () => {
    const el = await fixture<UiDrawer>(html`<ui-drawer></ui-drawer>`);
    await openDrawer(el);
    const panel = panelOf(el);

    /*
     * getComputedStyle resolves `auto` insets to a used pixel value, so the
     * declared inset cannot be read back — measure the box instead. The entry
     * animation would offset that box mid-transition, and its resting transform
     * is the identity, so killing the transition snaps straight to the final
     * geometry.
     */
    panel.style.transition = 'none';
    const settle = async () => {
      await el.updateComplete;
      await nextFrame();
      return panel.getBoundingClientRect();
    };

    let rect = await settle();
    expect(Math.abs(rect.right - window.innerWidth)).to.be.lessThan(2);

    el.placement = 'left';
    rect = await settle();
    expect(Math.abs(rect.left)).to.be.lessThan(2);

    el.placement = 'bottom';
    rect = await settle();
    expect(Math.abs(rect.bottom - window.innerHeight)).to.be.lessThan(2);
    expect(Math.abs(rect.left)).to.be.lessThan(2);
    expect(Math.abs(rect.right - window.innerWidth)).to.be.lessThan(2);
  });
});
