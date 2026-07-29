import { fixture, html, expect, nextFrame } from '@open-wc/testing';
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

/**
 * The controller derives velocity from `event.timeStamp`, so any test that
 * exercises a flick has to state the gesture's timing rather than inherit
 * whatever spacing the machine happened to produce — under parallel suite load
 * three synchronous dispatches can straddle the 0.5 px/ms threshold and the
 * gesture silently stops reading as a flick.
 *
 * The `PointerEvent` constructor ignores a `timeStamp` option, but `timeStamp`
 * is a prototype getter, so an own data property on the instance shadows it —
 * and the override survives `dispatchEvent`. Pass `at` to pin a sample to a
 * specific millisecond on the gesture's own timeline.
 */
const pointer = (type: string, x: number, y: number, at?: number) => {
  const event = new PointerEvent(type, {
    pointerId: 1,
    clientX: x,
    clientY: y,
    bubbles: true,
    composed: true,
    cancelable: true,
    button: 0,
  });
  if (at !== undefined) {
    Object.defineProperty(event, 'timeStamp', { value: at, configurable: true });
    // Fail loudly rather than flakily if an engine ever stops honouring this.
    if (event.timeStamp !== at) {
      throw new Error(`Could not pin timeStamp to ${at}; got ${event.timeStamp}`);
    }
  }
  return event;
};

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
    el.handle.dispatchEvent(pointer('pointerdown', 0, 0, 0));
    // 200px tall, 25% threshold => needs 50px, so 20px is short. Spreading it
    // over 160ms also puts it far below the flick threshold, so neither rule
    // fires and the panel must spring back.
    window.dispatchEvent(pointer('pointermove', 0, 20, 150));
    window.dispatchEvent(pointer('pointerup', 0, 20, 160));
    expect(el.dismissals).to.equal(0);
    expect(el.panel.style.translate).to.equal('');
  });

  it('dismisses a short but fast flick', async () => {
    const el = await makeHost();
    el.handle.dispatchEvent(pointer('pointerdown', 0, 0, 0));
    // Well under the 50px distance threshold, so only velocity can dismiss
    // this: 30px in 30ms is 1 px/ms, twice the 0.5 px/ms flick threshold.
    window.dispatchEvent(pointer('pointermove', 0, 15, 10));
    window.dispatchEvent(pointer('pointermove', 0, 30, 20));
    window.dispatchEvent(pointer('pointerup', 0, 30, 30));
    expect(el.dismissals).to.equal(1);
  });

  /**
   * The reason velocity is averaged over a trailing window at all: a slow drag
   * that jitters on the very last sample must not read as a flick. The closing
   * pair here moves 5px in 5ms — 1 px/ms, twice the threshold — while the same
   * gesture across the window is 10px in 95ms, or 0.105 px/ms. Measuring from
   * the final pair alone would close the panel out from under the user.
   */
  it('ignores a jitter on the final sample of an otherwise slow drag', async () => {
    const el = await makeHost();
    el.handle.dispatchEvent(pointer('pointerdown', 0, 0, 0));
    window.dispatchEvent(pointer('pointermove', 0, 20, 100));
    window.dispatchEvent(pointer('pointermove', 0, 25, 190));
    window.dispatchEvent(pointer('pointerup', 0, 30, 195));
    // 30px total is also under the 50px distance threshold, so nothing dismisses.
    expect(el.dismissals).to.equal(0);
  });

  it('dismisses once past the distance threshold', async () => {
    const el = await makeHost();
    el.handle.dispatchEvent(pointer('pointerdown', 0, 0, 0));
    // Deliberately slow: the samples end up 400ms apart, so the trailing
    // velocity window keeps only the last one and the flick rule cannot fire.
    // Distance alone has to carry the dismissal, which is what this asserts.
    window.dispatchEvent(pointer('pointermove', 0, 120, 500));
    window.dispatchEvent(pointer('pointerup', 0, 120, 900));
    expect(el.dismissals).to.equal(1);
  });

  it('honours the direction it was configured with', async () => {
    const el = await makeHost('right');
    el.handle.dispatchEvent(pointer('pointerdown', 0, 0, 0));
    window.dispatchEvent(pointer('pointermove', 40, 0, 500));
    expect(el.panel.style.translate).to.equal('40px');
    // Slow again, so this too is a pure distance dismissal along the x axis.
    window.dispatchEvent(pointer('pointerup', 150, 0, 900));
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
