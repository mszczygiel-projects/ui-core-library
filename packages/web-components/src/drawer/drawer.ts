import { LitElement, html, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import { drawerStyles } from './drawer.styles.js';
import { resetStyles } from '../styles/reset.styles.js';
import { motionStyles } from '../styles/motion.styles.js';
import { DragDismissController } from '../controllers/drag-dismiss.js';
import '../icon-button/icon-button.js';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';

export type DrawerPlacement = 'right' | 'left' | 'bottom';

export type DrawerDismiss = 'outside-click' | 'escape' | 'both' | 'none';

export type DrawerOpenChangeReason = 'close-button' | 'outside-click' | 'escape' | 'drag';

export interface DrawerOpenChangeDetail {
  open: boolean;
  reason: DrawerOpenChangeReason;
}

/**
 * showModal() does not portably stop the page behind from scrolling, and
 * `html:has(dialog[open])` cannot see into a shadow root. Drawers can coexist
 * with dialogs, so the lock is reference-counted at module level.
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
 * Edge-anchored modal panel built on the native `<dialog>` element. Rendered in
 * the browser top layer via `showModal()`, so no z-index is involved — focus
 * trapping, page inerting and Escape all come from the platform.
 *
 * A deliberately plain container: the drawer owns the surface, the scroll and
 * the close affordance, and nothing else. Headings, toolbars and action rows
 * are the consumer's to compose in the default slot.
 *
 * Fully controlled: the component never mutates its own `open` state. Escape,
 * backdrop clicks, the close button and the drag gesture only dispatch
 * `open-change` requests — the consumer owns the state and writes `open` back.
 *
 * @element ui-drawer
 *
 * @example
 * ```html
 * <ui-drawer open placement="right" label="Filters">
 *   <h2>Filters</h2>
 *   <p>Anything at all — the drawer imposes no structure.</p>
 * </ui-drawer>
 * <script>
 *   const drawer = document.querySelector('ui-drawer');
 *   drawer.addEventListener('open-change', (e) => (drawer.open = e.detail.open));
 * </script>
 * ```
 *
 * @slot - Drawer content. Scrolls on its own when it outgrows the panel.
 *
 * @fires open-change - Request to change the open state; `detail: { open, reason }`.
 *
 * @csspart panel - The drawer surface.
 * @csspart dismiss - Region holding the close button.
 * @csspart body - Scrollable content region.
 * @csspart grabber - Drag affordance, present only on a bottom sheet with `drag-to-dismiss`.
 *
 * @cssprop --drawer-width - Width of a `right` / `left` drawer. Defaults to `--drawer-width`.
 */
@customElement('ui-drawer')
export class UiDrawer extends LitElement {
  static override styles = [resetStyles, drawerStyles, motionStyles];

  /**
   * Controlled open state — set by the consumer, typically in response to
   * `open-change`.
   * @default false
   */
  @property({ type: Boolean, reflect: true }) open = false;

  /**
   * Which edge the drawer is anchored to. `right` and `left` span the full
   * viewport height at a fixed width; `bottom` is a sheet that hugs its content.
   * @default 'right'
   */
  @property({ type: String, reflect: true }) placement: DrawerPlacement = 'right';

  /**
   * Which interactions request a close.
   * @default 'both'
   */
  @property({ type: String, reflect: true, attribute: 'dismiss-on' })
  dismissOn: DrawerDismiss = 'both';

  /**
   * Shows the × close button.
   * @default true
   */
  @property({ type: Boolean, reflect: true, attribute: 'has-close-button' })
  hasCloseButton = true;

  /**
   * Accessible name of the drawer. The drawer has no title region of its own,
   * so without this there is nothing for `role="dialog"` to be named by — set
   * it, or point `aria-labelledby` at your own heading from the outside.
   */
  @property({ type: String }) label?: string;

  /**
   * Accessible name of the close button.
   * @default `getUiCoreConfig().labels.drawer.close`
   */
  @property({ type: String, attribute: 'close-label' }) closeLabel?: string;

  /**
   * Allows a bottom sheet to be flicked away downwards. Bottom-only — a
   * horizontal drag handle on a side panel is an affordance nobody recognises,
   * and the gesture never replaces Escape, the backdrop or the close button.
   * @default false
   */
  @property({ type: Boolean, reflect: true, attribute: 'drag-to-dismiss' })
  dragToDismiss = false;

  @query('.panel') private _panel?: HTMLDialogElement;
  @query('.grabber') private _grabber?: HTMLElement;
  @query('.dismiss') private _dismiss?: HTMLElement;

  private _scrollLocked = false;

  private readonly _drag = new DragDismissController(this, {
    target: () => this._panel,
    // The body is deliberately excluded: a drag starting there must scroll.
    handles: () => [this._grabber, this._dismiss],
    direction: 'down',
    enabled: () => this.dragToDismiss && this.placement === 'bottom',
    onDismiss: () => this._dispatchOpenChange(false, 'drag'),
  });

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
    if (this._scrollLocked) {
      releaseScroll();
      this._scrollLocked = false;
    }
    // A sheet dismissed mid-drag keeps its offset otherwise, and would reopen
    // already pushed off-screen.
    this._drag.reset();
  }

  private _dispatchOpenChange(open: boolean, reason: DrawerOpenChangeReason) {
    if (open === this.open) return;
    this.dispatchEvent(
      new CustomEvent<DrawerOpenChangeDetail>('open-change', {
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
    if (this.dismissOn === 'escape' || this.dismissOn === 'none') return;
    this._dispatchOpenChange(false, 'outside-click');
  };

  private _onCloseClick = () => {
    this._dispatchOpenChange(false, 'close-button');
  };

  override render() {
    const showGrabber = this.dragToDismiss && this.placement === 'bottom';
    return html`
      <dialog
        class="panel"
        part="panel"
        role="dialog"
        aria-label=${this.label ?? nothing}
        @cancel=${this._onCancel}
        @click=${this._onPanelClick}
      >
        ${showGrabber
          ? html`<div class="grabber" part="grabber" aria-hidden="true"><span></span></div>`
          : nothing}

        <div class="dismiss" part="dismiss" ?hidden=${!this.hasCloseButton}>
          ${this.hasCloseButton
            ? html`
                <ui-icon-button
                  class="close"
                  variant="ghost"
                  data-size="small"
                  label=${this.closeLabel ?? getUiCoreConfig().labels.drawer.close}
                  @click=${this._onCloseClick}
                >
                  ${unsafeSVG(svgMap['icon-close'])}
                </ui-icon-button>
              `
            : nothing}
        </div>

        <div class="body" part="body">
          <slot></slot>
        </div>
      </dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-drawer': UiDrawer;
  }
}
