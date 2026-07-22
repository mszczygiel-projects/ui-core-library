import { fixture, html, expect, nextFrame, aTimeout, oneEvent } from '@open-wc/testing';
import type { UiPopover, PopoverOpenChangeDetail } from './popover.js';
import './popover.js';

const openChangeEvents = (el: UiPopover) => {
  const events: PopoverOpenChangeDetail[] = [];
  el.addEventListener('open-change', (e) => {
    events.push((e as CustomEvent<PopoverOpenChangeDetail>).detail);
  });
  return events;
};

const panelOf = (el: UiPopover) => el.shadowRoot!.querySelector<HTMLElement>('.panel')!;

const isShown = (el: UiPopover) => panelOf(el).matches(':popover-open');

describe('UiPopover', () => {
  it('has expected defaults', async () => {
    const el = await fixture<UiPopover>(html`<ui-popover></ui-popover>`);
    expect(el.open).to.equal(false);
    expect(el.placement).to.equal('bottom');
    expect(el.trigger).to.equal('click');
    expect(el.dismissOn).to.equal('both');
    expect(el.trapFocus).to.equal(false);
    expect(el.arrow).to.equal(false);
    expect(el.flip).to.equal(true);
    expect(el.shift).to.equal(true);
  });

  it('renders trigger and content slots', async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover>
        <button slot="trigger">Open</button>
        <p>Content</p>
      </ui-popover>
    `);
    const triggerSlot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="trigger"]')!;
    const defaultSlot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot:not([name])')!;
    expect(triggerSlot.assignedElements()[0]!.textContent).to.equal('Open');
    expect(defaultSlot.assignedElements()[0]!.textContent).to.equal('Content');
  });

  it('panel is hidden until open is set', async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover
        ><button slot="trigger">Open</button>
        <p>Content</p></ui-popover
      >
    `);
    expect(isShown(el)).to.equal(false);

    el.open = true;
    await el.updateComplete;
    expect(isShown(el)).to.equal(true);

    el.open = false;
    await el.updateComplete;
    expect(isShown(el)).to.equal(false);
  });

  it('positions the panel and records the resolved placement', async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover placement="top-start">
        <button slot="trigger">Open</button>
        <p>Content</p>
      </ui-popover>
    `);
    el.open = true;
    await el.updateComplete;
    await nextFrame();
    await nextFrame();
    expect(el.getAttribute('data-actual-placement')).to.be.a('string');
    expect(panelOf(el).style.getPropertyValue('--_x')).to.not.equal('');
    expect(panelOf(el).style.getPropertyValue('--_y')).to.not.equal('');
  });

  it('trigger click requests open but never mutates open itself (controlled)', async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover
        ><button slot="trigger">Open</button>
        <p>Content</p></ui-popover
      >
    `);
    const trigger = el.querySelector('button')!;
    setTimeout(() => trigger.click());
    const ev = (await oneEvent(el, 'open-change')) as CustomEvent<PopoverOpenChangeDetail>;
    expect(ev.detail).to.deep.equal({ open: true, reason: 'trigger' });
    expect(el.open).to.equal(false);
    expect(isShown(el)).to.equal(false);
  });

  it('trigger click requests close when already open', async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover open
        ><button slot="trigger">Open</button>
        <p>Content</p></ui-popover
      >
    `);
    const trigger = el.querySelector('button')!;
    setTimeout(() => trigger.click());
    const ev = (await oneEvent(el, 'open-change')) as CustomEvent<PopoverOpenChangeDetail>;
    expect(ev.detail).to.deep.equal({ open: false, reason: 'trigger' });
  });

  it('clicks inside the panel content do not toggle', async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover open>
        <button slot="trigger">Open</button>
        <button id="inside">Inside</button>
      </ui-popover>
    `);
    const events = openChangeEvents(el);
    el.querySelector<HTMLElement>('#inside')!.click();
    await aTimeout(20);
    expect(events.length).to.equal(0);
  });

  it('manual trigger makes no open/close requests from clicks', async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover trigger="manual"
        ><button slot="trigger">Open</button>
        <p>C</p></ui-popover
      >
    `);
    const events = openChangeEvents(el);
    el.querySelector('button')!.click();
    await aTimeout(20);
    expect(events.length).to.equal(0);
  });

  it('Escape requests close while open', async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover open
        ><button slot="trigger">Open</button>
        <p>C</p></ui-popover
      >
    `);
    const events = openChangeEvents(el);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await aTimeout(20);
    expect(events).to.deep.equal([{ open: false, reason: 'escape' }]);
  });

  it('outside pointerdown requests close while open', async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover open
        ><button slot="trigger">Open</button>
        <p>C</p></ui-popover
      >
    `);
    const events = openChangeEvents(el);
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await aTimeout(20);
    expect(events).to.deep.equal([{ open: false, reason: 'outside-click' }]);
  });

  it('pointerdown inside the popover does not request close', async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover open
        ><button slot="trigger">Open</button>
        <p id="c">C</p></ui-popover
      >
    `);
    const events = openChangeEvents(el);
    el.querySelector('#c')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await aTimeout(20);
    expect(events.length).to.equal(0);
  });

  it("dismissOn='escape' ignores outside clicks", async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover open dismiss-on="escape"
        ><button slot="trigger">O</button>
        <p>C</p></ui-popover
      >
    `);
    const events = openChangeEvents(el);
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await aTimeout(20);
    expect(events.length).to.equal(0);
  });

  it("dismissOn='outside-click' ignores Escape", async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover open dismiss-on="outside-click">
        <button slot="trigger">O</button>
        <p>C</p>
      </ui-popover>
    `);
    const events = openChangeEvents(el);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await aTimeout(20);
    expect(events.length).to.equal(0);
  });

  it('dismiss listeners are inactive while closed', async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover
        ><button slot="trigger">O</button>
        <p>C</p></ui-popover
      >
    `);
    const events = openChangeEvents(el);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await aTimeout(20);
    expect(events.length).to.equal(0);
  });

  it('syncs aria-expanded on the trigger element for non-manual triggers', async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover
        ><button slot="trigger">O</button>
        <p>C</p></ui-popover
      >
    `);
    const trigger = el.querySelector('button')!;
    expect(trigger.getAttribute('aria-expanded')).to.equal('false');

    el.open = true;
    await el.updateComplete;
    expect(trigger.getAttribute('aria-expanded')).to.equal('true');
  });

  it('manual trigger leaves trigger ARIA to the consumer', async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover trigger="manual"
        ><button slot="trigger">O</button>
        <p>C</p></ui-popover
      >
    `);
    expect(el.querySelector('button')!.hasAttribute('aria-expanded')).to.equal(false);
  });

  it('manual trigger never overwrites aria-expanded set by the consumer', async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover trigger="manual">
        <button slot="trigger" aria-expanded="true">O</button>
        <p>C</p>
      </ui-popover>
    `);
    const trigger = el.querySelector('button')!;
    expect(trigger.getAttribute('aria-expanded')).to.equal('true');

    // Toggling open must not clear what the consumer owns.
    el.open = true;
    await el.updateComplete;
    expect(trigger.getAttribute('aria-expanded')).to.equal('true');

    el.open = false;
    await el.updateComplete;
    expect(trigger.getAttribute('aria-expanded')).to.equal('true');
  });

  it('renders the arrow part only when arrow is set', async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover
        ><button slot="trigger">O</button>
        <p>C</p></ui-popover
      >
    `);
    expect(el.shadowRoot!.querySelector('[part="arrow"]')).to.equal(null);

    el.arrow = true;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[part="arrow"]')).to.not.equal(null);
  });

  it('trap-focus moves focus into the panel on open and restores it on close', async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover trap-focus>
        <button slot="trigger">Open</button>
        <button id="first">First</button>
        <button id="second">Second</button>
      </ui-popover>
    `);
    const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
    trigger.focus();

    el.open = true;
    await el.updateComplete;
    await nextFrame();
    await nextFrame();
    expect(document.activeElement).to.equal(el.querySelector('#first'));

    el.open = false;
    await el.updateComplete;
    expect(document.activeElement).to.equal(trigger);
  });

  it('without trap-focus the popover never steals focus', async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover>
        <button slot="trigger">Open</button>
        <button id="first">First</button>
      </ui-popover>
    `);
    const trigger = el.querySelector<HTMLElement>('[slot="trigger"]')!;
    trigger.focus();

    el.open = true;
    await el.updateComplete;
    await nextFrame();
    await nextFrame();
    expect(document.activeElement).to.equal(trigger);
  });

  it('Tab wraps focus inside the panel when trap-focus is set', async () => {
    const el = await fixture<UiPopover>(html`
      <ui-popover trap-focus open>
        <button slot="trigger">Open</button>
        <button id="first">First</button>
        <button id="second">Second</button>
      </ui-popover>
    `);
    await nextFrame();
    const second = el.querySelector<HTMLElement>('#second')!;
    second.focus();

    panelOf(el).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, composed: true }),
    );
    await aTimeout(0);
    expect(document.activeElement).to.equal(el.querySelector('#first'));
  });
});
