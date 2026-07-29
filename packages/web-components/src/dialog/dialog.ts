import { LitElement, html, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import { dialogStyles } from './dialog.styles.js';
import { resetStyles } from '../styles/reset.styles.js';
import { motionStyles } from '../styles/motion.styles.js';
import { DragDismissController } from '../controllers/drag-dismiss.js';
import '../icon-button/icon-button.js';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';

export type DialogSize = 'small' | 'medium' | 'large' | 'fullscreen';

export type DialogVariant = 'default' | 'alert';

export type DialogDismiss = 'outside-click' | 'escape' | 'both' | 'none';

export type DialogOpenChangeReason = 'close-button' | 'outside-click' | 'escape' | 'drag';

/**
 * The sheet breakpoint, mirrored from dialog.styles.ts. 48rem is
 * --breakpoint-md; neither a media query nor matchMedia can read a CSS custom
 * property, so the value is repeated in both places.
 */
const SHEET_QUERY = '(max-width: 47.999rem)';

export interface DialogOpenChangeDetail {
  open: boolean;
  reason: DialogOpenChangeReason;
}

/**
 * showModal() does not portably stop the page behind from scrolling, and
 * `html:has(dialog[open])` cannot see into a shadow root. Dialogs nest, so the
 * lock is reference-counted at module level rather than per instance.
 */
let scrollLockCount = 0;
let previousOverflow = '';

function lockScroll() {
  if (scrollLockCount === 0) {
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
  }
  scrollLockCount += 1;
}

function releaseScroll() {
  if (scrollLockCount === 0) return;
  scrollLockCount -= 1;
  if (scrollLockCount === 0) document.documentElement.style.overflow = previousOverflow;
}

/**
 * Modal overlay rendered in the browser top layer via the native `<dialog>`
 * element — no z-index scale involved. Focus trapping, page inerting and
 * Escape come from the platform.
 *
 * Fully controlled: the component never mutates its own `open` state. Escape,
 * backdrop clicks and the close button only dispatch `open-change` requests —
 * the consumer owns the state and writes `open` back.
 *
 * @element ui-dialog
 *
 * @example
 * ```html
 * <ui-dialog open data-size="medium">
 *   <span slot="title">Delete account?</span>
 *   <span slot="description">This cannot be undone.</span>
 *   <p>Everything associated with the account is removed immediately.</p>
 *   <div slot="footer">
 *     <ui-button variant="outline">Cancel</ui-button>
 *     <ui-button variant="danger">Delete</ui-button>
 *   </div>
 * </ui-dialog>
 * <script>
 *   const dialog = document.querySelector('ui-dialog');
 *   dialog.addEventListener('open-change', (e) => (dialog.open = e.detail.open));
 * </script>
 * ```
 *
 * @slot title - Accessible name of the dialog; also the visible heading.
 * @slot description - Optional supporting text below the title.
 * @slot - Dialog body. Scrolls on its own when it outgrows the panel.
 * @slot footer - Action buttons. Stacks full-width on narrow viewports.
 *
 * @fires open-change - Request to change the open state; `detail: { open, reason }`.
 *
 * @csspart panel - The dialog surface.
 * @csspart header - Header region holding title, description and close button.
 * @csspart body - Scrollable content region.
 * @csspart footer - Action region.
 * @csspart grabber - Drag affordance, present only with `drag-to-dismiss`.
 */
@customElement('ui-dialog')
export class UiDialog extends LitElement {
  static override styles = [resetStyles, dialogStyles, motionStyles];

  /**
   * Controlled open state — set by the consumer, typically in response to
   * `open-change`.
   * @default false
   */
  @property({ type: Boolean, reflect: true }) open = false;

  /**
   * Panel width preset. `fullscreen` fills the viewport and is the only size
   * with no max-width token, because it is viewport-driven.
   * @default 'medium'
   */
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: DialogSize = 'medium';

  /**
   * `alert` switches the role to `alertdialog` and refuses to close on a
   * backdrop click, so a destructive choice cannot be dismissed by accident.
   * @default 'default'
   */
  @property({ type: String, reflect: true }) variant: DialogVariant = 'default';

  /**
   * Which interactions request a close. `alert` ignores `outside-click`
   * regardless of this value.
   * @default 'both'
   */
  @property({ type: String, reflect: true, attribute: 'dismiss-on' })
  dismissOn: DialogDismiss = 'both';

  /**
   * Shows the × close button in the header.
   * @default true
   */
  @property({ type: Boolean, reflect: true, attribute: 'has-close-button' })
  hasCloseButton = true;

  /** Accessible name used when no `title` slot is provided. */
  @property({ type: String }) label?: string;

  /**
   * Accessible name of the close button.
   * @default `getUiCoreConfig().labels.dialog.close`
   */
  @property({ type: String, attribute: 'close-label' }) closeLabel?: string;

  /**
   * Allows the sheet to be flicked away downwards. Sheet-only — it does nothing
   * on the centred desktop layout, and it never replaces Escape, the backdrop
   * or the close button, none of which a pointer gesture is a substitute for.
   * @default false
   */
  @property({ type: Boolean, reflect: true, attribute: 'drag-to-dismiss' })
  dragToDismiss = false;

  @query('.panel') private _panel?: HTMLDialogElement;
  @query('.body') private _body?: HTMLElement;
  @query('.grabber') private _grabber?: HTMLElement;
  @query('.header') private _header?: HTMLElement;

  @state() private _hasTitle = false;
  @state() private _hasDescription = false;
  @state() private _hasFooter = false;

  private _resizeObserver?: ResizeObserver;
  private _scrollLocked = false;

  private readonly _drag = new DragDismissController(this, {
    target: () => this._panel,
    // The body is deliberately excluded: a drag starting there must scroll.
    handles: () => [this._grabber, this._header],
    enabled: () => this.dragToDismiss && this._isSheet,
    onDismiss: () => this._dispatchOpenChange(false, 'drag'),
  });

  private get _isSheet(): boolean {
    return typeof matchMedia === 'function' && matchMedia(SHEET_QUERY).matches;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._teardown();
  }

  override updated(changed: PropertyValues<this>) {
    if (changed.has('open')) {
      if (this.open) this._show();
      else if (changed.get('open')) this._hide();
    }
  }

  private _show() {
    const panel = this._panel;
    if (!panel) return;
    try {
      if (!panel.open) panel.showModal();
    } catch {
      // Some environments implement <dialog> only partially — best effort.
    }
    if (!this._scrollLocked) {
      lockScroll();
      this._scrollLocked = true;
    }
    this._observeBodyScroll();
  }

  private _hide() {
    const panel = this._panel;
    try {
      if (panel?.open) panel.close();
    } catch {
      // See _show().
    }
    this._teardown();
  }

  private _teardown() {
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
    if (this._scrollLocked) {
      releaseScroll();
      this._scrollLocked = false;
    }
    // A sheet dismissed mid-drag keeps its offset otherwise, and would reopen
    // already pushed off-screen.
    this._drag.reset();
    this.removeAttribute('data-scroll-start');
    this.removeAttribute('data-scroll-end');
  }

  private _observeBodyScroll() {
    const body = this._body;
    if (!body) return;
    this._syncScrollEdges();
    if (typeof ResizeObserver === 'function') {
      this._resizeObserver?.disconnect();
      this._resizeObserver = new ResizeObserver(() => this._syncScrollEdges());
      this._resizeObserver.observe(body);
    }
  }

  /** Separators are shown only on the edges the content actually runs past. */
  private _syncScrollEdges = () => {
    const body = this._body;
    if (!body) return;
    const overflowing = body.scrollHeight - body.clientHeight > 1;
    const atTop = body.scrollTop <= 0;
    const atBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 1;
    this.toggleAttribute('data-scroll-start', overflowing && !atTop);
    this.toggleAttribute('data-scroll-end', overflowing && !atBottom);
  };

  private _dispatchOpenChange(open: boolean, reason: DialogOpenChangeReason) {
    if (open === this.open) return;
    this.dispatchEvent(
      new CustomEvent<DialogOpenChangeDetail>('open-change', {
        detail: { open, reason },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Escape fires the native `cancel`, which would close the element and
   * desynchronise it from the controlled prop — so the default is prevented and
   * a request is dispatched instead.
   */
  private _onCancel = (event: Event) => {
    event.preventDefault();
    if (this.dismissOn === 'outside-click' || this.dismissOn === 'none') return;
    this._dispatchOpenChange(false, 'escape');
  };

  /** A click landing on the dialog element itself is a click on the backdrop. */
  private _onPanelClick = (event: MouseEvent) => {
    if (event.target !== this._panel) return;
    if (this.variant === 'alert') return;
    if (this.dismissOn === 'escape' || this.dismissOn === 'none') return;
    this._dispatchOpenChange(false, 'outside-click');
  };

  private _onCloseClick = () => {
    this._dispatchOpenChange(false, 'close-button');
  };

  private _onTitleSlotChange = (event: Event) => {
    this._hasTitle = (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };

  private _onDescriptionSlotChange = (event: Event) => {
    this._hasDescription =
      (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };

  private _onFooterSlotChange = (event: Event) => {
    this._hasFooter = (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };

  override render() {
    const showHeader = this._hasTitle || this._hasDescription || this.hasCloseButton;
    return html`
      <dialog
        class="panel"
        part="panel"
        role=${this.variant === 'alert' ? 'alertdialog' : 'dialog'}
        aria-labelledby=${this._hasTitle ? 'dialog-title' : nothing}
        aria-label=${!this._hasTitle && this.label ? this.label : nothing}
        aria-describedby=${this._hasDescription ? 'dialog-description' : nothing}
        @cancel=${this._onCancel}
        @click=${this._onPanelClick}
      >
        ${this.dragToDismiss
          ? html`<div class="grabber" part="grabber" aria-hidden="true"><span></span></div>`
          : nothing}

        <div class="header" part="header" ?hidden=${!showHeader}>
          <div class="header-text">
            <h2 class="title" id="dialog-title" ?hidden=${!this._hasTitle}>
              <slot name="title" @slotchange=${this._onTitleSlotChange}></slot>
            </h2>
            <p class="description" id="dialog-description" ?hidden=${!this._hasDescription}>
              <slot name="description" @slotchange=${this._onDescriptionSlotChange}></slot>
            </p>
          </div>
          ${this.hasCloseButton
            ? html`
                <ui-icon-button
                  class="close"
                  variant="ghost"
                  data-size="small"
                  label=${this.closeLabel ?? getUiCoreConfig().labels.dialog.close}
                  @click=${this._onCloseClick}
                >
                  ${unsafeSVG(svgMap['icon-close'])}
                </ui-icon-button>
              `
            : nothing}
        </div>

        <div class="body" part="body" @scroll=${this._syncScrollEdges}>
          <slot></slot>
        </div>

        <div class="footer" part="footer" ?hidden=${!this._hasFooter}>
          <slot name="footer" @slotchange=${this._onFooterSlotChange}></slot>
        </div>
      </dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-dialog': UiDialog;
  }
}
