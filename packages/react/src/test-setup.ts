import '@testing-library/react/pure';

/*
 * jsdom ships HTMLDialogElement as an empty subclass of HTMLElement — no
 * showModal, no close, no `cancel` event, no ::backdrop. Anything built on the
 * native <dialog> would throw here without a stand-in.
 *
 * This models only what the components rely on: the `open` attribute reflecting
 * the shown state, and `close` firing on close(). Real modal semantics — top
 * layer, focus trap, inerting, Escape — are untestable in jsdom by design and
 * are covered by the web-components suite, which runs on real Chromium.
 */
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  Object.defineProperty(HTMLDialogElement.prototype, 'open', {
    configurable: true,
    get(this: HTMLDialogElement) {
      return this.hasAttribute('open');
    },
    set(this: HTMLDialogElement, value: boolean) {
      this.toggleAttribute('open', Boolean(value));
    },
  });

  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };

  HTMLDialogElement.prototype.show = function show(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };

  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement, returnValue?: string) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    if (returnValue !== undefined) this.returnValue = returnValue;
    this.dispatchEvent(new Event('close'));
  };
}
