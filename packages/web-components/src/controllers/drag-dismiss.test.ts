import { fixture, html, expect, nextFrame, aTimeout } from '@open-wc/testing';
import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { DragDismissController } from './drag-dismiss.js';
import type { DragDismissDirection } from './drag-dismiss.js';

/** Host used only by these tests; the controller needs a ReactiveControllerHost. */
@customElement('drag-test-host')
class DragTestHost extends LitElement {
  dismissals = 0;
  enabled = true;
  controller!: DragDismissController;

  panel = document.createElement('div');
  handle = document.createElement('div');

  setup(direction: DragDismissDirection = 'down') {
    // 200x200 so thresholds are easy to reason about: 25% is 50px.
    Object.assign(this.panel.style, { width: '200px', height: '200px' });
    this.controller = new DragDismissController(this, {
      target: () => this.panel,
      handles: () => [this.handle],
      direction,
      enabled: () => this.enabled,
      onDismiss: () => {
        this.dismissals += 1;
      },
    });
  }

  override createRenderRoot() {
    return this;
  }
}

const pointer = (type: string, x: number, y: number, extra: Record<string, unknown> = {}) =>
  new PointerEvent(type, {
    pointerId: 1,
    clientX: x,
    clientY: y,
    bubbles: true,
    composed: true,
    cancelable: true,
    button: 0,
    ...extra,
  });

/** offsetHeight is 0 for detached nodes, so the panel must be in the document. */
async function makeHost(direction: DragDismissDirection = 'down') {
  const el = await fixture<DragTestHost>(html`<drag-test-host></drag-test-host>`);
  el.appendChild(el.panel);
  el.appendChild(el.handle);
  el.setup(direction);
  el.connectedCallback();
  await nextFrame();
  return el;
}

describe('DragDismissController', () => {
  it('ignores gestures that do not start on a handle', async () => {
    const el = await makeHost();
    const stranger = document.createElement('div');
    el.appendChild(stranger);
    stranger.dispatchEvent(pointer('pointerdown', 0, 0));
    window.dispatchEvent(pointer('pointermove', 0, 400));
    window.dispatchEvent(pointer('pointerup', 0, 400));
    expect(el.dismissals).to.equal(0);
    expect(el.hasAttribute('data-dragging')).to.equal(false);
  });

  it('ignores gestures while disabled', async () => {
    const el = await makeHost();
    el.enabled = false;
    el.handle.dispatchEvent(pointer('pointerdown', 0, 0));
    expect(el.hasAttribute('data-dragging')).to.equal(false);
    window.dispatchEvent(pointer('pointerup', 0, 400));
    expect(el.dismissals).to.equal(0);
  });

  it('marks the host while dragging and clears it on release', async () => {
    const el = await makeHost();
    el.handle.dispatchEvent(pointer('pointerdown', 0, 0));
    expect(el.hasAttribute('data-dragging')).to.equal(true);
    window.dispatchEvent(pointer('pointerup', 0, 10));
    expect(el.hasAttribute('data-dragging')).to.equal(false);
  });

  it('translates the target while dragging towards the dismiss direction', async () => {
    const el = await makeHost();
    el.handle.dispatchEvent(pointer('pointerdown', 0, 0));
    window.dispatchEvent(pointer('pointermove', 0, 30));
    // The browser normalises the shorthand, so 0 becomes 0px.
    expect(el.panel.style.translate).to.equal('0px 30px');
    window.dispatchEvent(pointer('pointerup', 0, 30));
  });

  it('refuses to move away from the resting edge', async () => {
    const el = await makeHost();
    el.handle.dispatchEvent(pointer('pointerdown', 0, 100));
    // Dragging up on a 'down' dismisser must not lift the panel.
    window.dispatchEvent(pointer('pointermove', 0, 40));
    // A zero offset on both axes collapses to the single-value form.
    expect(el.panel.style.translate).to.equal('0px');
    window.dispatchEvent(pointer('pointerup', 0, 40));
  });

  it('snaps back and does not dismiss below the distance threshold', async () => {
    const el = await makeHost();
    el.handle.dispatchEvent(pointer('pointerdown', 0, 0));
    // 200px tall, 25% threshold => needs 50px, so 20px is short. The real delay
    // matters: Event.timeStamp is read-only, so slowness cannot be faked, and
    // without it the gesture reads as a flick.
    window.dispatchEvent(pointer('pointermove', 0, 20));
    await aTimeout(150);
    window.dispatchEvent(pointer('pointerup', 0, 20));
    expect(el.dismissals).to.equal(0);
    expect(el.panel.style.translate).to.equal('');
  });

  it('dismisses a short but fast flick', async () => {
    const el = await makeHost();
    el.handle.dispatchEvent(pointer('pointerdown', 0, 0));
    // Well under the 50px distance threshold, but covered in one quick burst.
    window.dispatchEvent(pointer('pointermove', 0, 15));
    window.dispatchEvent(pointer('pointermove', 0, 30));
    window.dispatchEvent(pointer('pointerup', 0, 30));
    expect(el.dismissals).to.equal(1);
  });

  it('dismisses once past the distance threshold', async () => {
    const el = await makeHost();
    el.handle.dispatchEvent(pointer('pointerdown', 0, 0));
    window.dispatchEvent(pointer('pointermove', 0, 120));
    window.dispatchEvent(pointer('pointerup', 0, 120));
    expect(el.dismissals).to.equal(1);
  });

  it('honours the direction it was configured with', async () => {
    const el = await makeHost('right');
    el.handle.dispatchEvent(pointer('pointerdown', 0, 0));
    window.dispatchEvent(pointer('pointermove', 40, 0));
    expect(el.panel.style.translate).to.equal('40px');
    window.dispatchEvent(pointer('pointerup', 150, 0));
    expect(el.dismissals).to.equal(1);
  });

  it('abandons the gesture on pointercancel', async () => {
    const el = await makeHost();
    el.handle.dispatchEvent(pointer('pointerdown', 0, 0));
    window.dispatchEvent(pointer('pointermove', 0, 150));
    window.dispatchEvent(pointer('pointercancel', 0, 150));
    expect(el.dismissals).to.equal(0);
    expect(el.panel.style.translate).to.equal('');
    expect(el.hasAttribute('data-dragging')).to.equal(false);
  });

  it('reset() clears a leftover offset', async () => {
    const el = await makeHost();
    el.handle.dispatchEvent(pointer('pointerdown', 0, 0));
    window.dispatchEvent(pointer('pointermove', 0, 60));
    el.controller.reset();
    expect(el.panel.style.translate).to.equal('');
    expect(el.hasAttribute('data-dragging')).to.equal(false);
  });
});
