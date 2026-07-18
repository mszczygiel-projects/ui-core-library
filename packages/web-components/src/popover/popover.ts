import { LitElement, html, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  computePosition,
  autoUpdate,
  offset as offsetMiddleware,
  flip as flipMiddleware,
  shift as shiftMiddleware,
  arrow as arrowMiddleware,
} from '@floating-ui/dom';
import { popoverStyles } from './popover.styles.js';
import { resetStyles } from '../styles/reset.styles.js';

export type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export type PopoverTrigger = 'click' | 'hover' | 'manual';

export type PopoverDismiss = 'outside-click' | 'escape' | 'both';

export type PopoverOpenChangeReason = 'trigger' | 'hover' | 'outside-click' | 'escape';

export interface PopoverOpenChangeDetail {
  open: boolean;
  reason: PopoverOpenChangeReason;
}

/** Top-layer rendering via the native Popover API; falls back to position: fixed. */
const supportsNativePopover =
  typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Delay before a hover-triggered popover requests close, so the pointer can travel into the panel. */
const HOVER_CLOSE_DELAY_MS = 150;

/** Resolves the element that actually has focus, descending through nested shadow roots. */
function deepActiveElement(): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  return active;
}

/**
 * Generic overlay primitive: positions floating content relative to a trigger,
 * rendered in the browser top layer (native Popover API) with a
 * `position: fixed` + `--z-overlay` fallback.
 *
 * Fully controlled: the component never mutates its own `open` state. User
 * interactions (trigger click/hover, Escape, outside click) only dispatch
 * `open-change` requests — the consumer owns the state and writes `open` back.
 *
 * Focus ownership: the popover owns the outer boundary (initial focus and
 * focus return when `trap-focus` is set, Escape / outside-click dismissal);
 * slotted content owns its internal keyboard navigation.
 *
 * @element ui-popover
 *
 * @example
 * ```html
 * <ui-popover placement="bottom-start" trigger="click">
 *   <button slot="trigger">Open</button>
 *   <p>Floating content</p>
 * </ui-popover>
 * <script>
 *   const popover = document.querySelector('ui-popover');
 *   popover.addEventListener('open-change', (e) => (popover.open = e.detail.open));
 * </script>
 * ```
 *
 * @slot trigger - Anchor element the panel is positioned against.
 * @slot - Panel content.
 *
 * @fires open-change - Request to change the open state; `detail: { open, reason }`.
 *
 * @csspart panel - Floating panel surface.
 * @csspart arrow - Caret pointing at the trigger (rendered when `arrow` is set).
 * @csspart content - Padded wrapper around the default slot.
 *
 * @cssprop --z-overlay - Stacking level used only by the `position: fixed`
 *   fallback in browsers without the Popover API (default: 100).
 */
@customElement('ui-popover')
export class UiPopover extends LitElement {
  static override styles = [resetStyles, popoverStyles];

  /**
   * Controlled open state — set by the consumer, typically in response to
   * `open-change`.
   * @default false
   */
  @property({ type: Boolean, reflect: true }) open = false;

  /**
   * Preferred panel position relative to the trigger. Side (`top | bottom |
   * left | right`) optionally suffixed with an alignment (`-start | -end`);
   * the bare side means center alignment. May be flipped/shifted at runtime —
   * see `data-actual-placement` on the host for the resolved value.
   * @default 'bottom'
   */
  @property({ type: String, reflect: true }) placement: PopoverPlacement = 'bottom';

  /**
   * Which built-in interaction requests open/close: `click` toggles from the
   * trigger slot, `hover` opens on hover/focus of the trigger, `manual` makes
   * no requests (consumer drives everything — e.g. DateField).
   * @default 'click'
   */
  @property({ type: String, reflect: true }) trigger: PopoverTrigger = 'click';

  /**
   * Distance between trigger and panel in px. Defaults to the
   * `--popover-offset` design token (8px).
   */
  @property({ type: Number }) offset?: number;

  /**
   * Flip to the opposite side when there is not enough room (property only —
   * set from JS/framework bindings to disable).
   * @default true
   */
  @property({ attribute: false }) flip = true;

  /**
   * Nudge the panel along the alignment axis to keep it in the viewport
   * (property only — set from JS/framework bindings to disable).
   * @default true
   */
  @property({ attribute: false }) shift = true;

  /**
   * Which interactions outside the consumer's control request a close.
   * @default 'both'
   */
  @property({ type: String, reflect: true, attribute: 'dismiss-on' })
  dismissOn: PopoverDismiss = 'both';

  /**
   * Keep Tab cycling inside the panel, move focus into it on open, and return
   * focus to the trigger on close. Enable for dialog-like content
   * (DatePicker); leave off for tooltips and inline-typing flows.
   * @default false
   */
  @property({ type: Boolean, reflect: true, attribute: 'trap-focus' }) trapFocus = false;

  /**
   * Render a caret pointing at the trigger.
   * @default false
   */
  @property({ type: Boolean, reflect: true }) arrow = false;

  @query('.panel') private _panel?: HTMLElement;
  @query('.arrow') private _arrowEl?: HTMLElement | null;

  private _cleanupAutoUpdate?: () => void;
  private _returnFocusTo: HTMLElement | null = null;
  private _hoverCloseTimer?: ReturnType<typeof setTimeout>;

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this._onHostClick);
    this.addEventListener('mouseenter', this._onHostMouseEnter);
    this.addEventListener('mouseleave', this._onHostMouseLeave);
    this.addEventListener('focusin', this._onHostFocusIn);
    this.addEventListener('focusout', this._onHostFocusOut);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this._onHostClick);
    this.removeEventListener('mouseenter', this._onHostMouseEnter);
    this.removeEventListener('mouseleave', this._onHostMouseLeave);
    this.removeEventListener('focusin', this._onHostFocusIn);
    this.removeEventListener('focusout', this._onHostFocusOut);
    clearTimeout(this._hoverCloseTimer);
    this._teardownOpenState();
  }

  override updated(changed: PropertyValues<this>) {
    if (changed.has('open')) {
      if (this.open) {
        this._show();
      } else if (changed.get('open')) {
        this._hide();
      }
    } else if (
      this.open &&
      (changed.has('placement') || changed.has('offset') || changed.has('arrow'))
    ) {
      void this._position();
    }
    if (changed.has('open') || changed.has('trigger')) {
      this._syncTriggerAria();
    }
  }

  private get _anchorEl(): HTMLElement {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="trigger"]');
    const assigned = slot?.assignedElements({ flatten: true })[0];
    return (assigned as HTMLElement | undefined) ?? this;
  }

  private _show() {
    const panel = this._panel;
    if (!panel) return;

    if (supportsNativePopover) {
      try {
        if (!panel.matches(':popover-open')) panel.showPopover();
      } catch {
        // Best-effort: some environments expose Popover API only partially.
      }
    } else {
      panel.classList.add('panel--open');
    }

    this._cleanupAutoUpdate?.();
    this._cleanupAutoUpdate = autoUpdate(this._anchorEl, panel, () => void this._position(), {
      elementResize: typeof ResizeObserver === 'function',
      layoutShift: typeof IntersectionObserver === 'function',
    });

    document.addEventListener('pointerdown', this._onDocumentPointerDown, true);
    document.addEventListener('keydown', this._onDocumentKeyDown, true);

    if (this.trapFocus) {
      const previous = deepActiveElement();
      this._returnFocusTo =
        previous && previous !== document.body ? (previous as HTMLElement) : null;
      // Wait for first positioning so focus doesn't scroll to an unpositioned panel.
      requestAnimationFrame(() => {
        if (!this.open) return;
        const target = this._focusablesInPanel()[0] ?? panel;
        target.focus();
      });
    }
  }

  private _hide() {
    const panel = this._panel;
    if (!panel) return;

    const focusWasInside = this._containsFocus();

    if (supportsNativePopover) {
      try {
        if (panel.matches(':popover-open')) panel.hidePopover();
      } catch {
        // Best-effort: some environments expose Popover API only partially.
      }
    } else {
      panel.classList.remove('panel--open');
    }
    this._teardownOpenState();

    if (this.trapFocus && focusWasInside) {
      const target = this._returnFocusTo ?? this._anchorEl;
      target.focus();
    }
    this._returnFocusTo = null;
  }

  private _teardownOpenState() {
    this._cleanupAutoUpdate?.();
    this._cleanupAutoUpdate = undefined;
    document.removeEventListener('pointerdown', this._onDocumentPointerDown, true);
    document.removeEventListener('keydown', this._onDocumentKeyDown, true);
  }

  private async _position() {
    const panel = this._panel;
    if (!panel || !this.open) return;
    const arrowEl = this.arrow ? this._arrowEl : null;

    const middleware = [offsetMiddleware(this.offset ?? this._tokenLengthPx('--popover-offset', 8))];
    if (this.flip) middleware.push(flipMiddleware());
    if (this.shift) middleware.push(shiftMiddleware());
    if (arrowEl) middleware.push(arrowMiddleware({ element: arrowEl }));

    const { x, y, placement, middlewareData } = await computePosition(this._anchorEl, panel, {
      placement: this.placement,
      strategy: 'fixed',
      middleware,
    });

    panel.style.setProperty('--_x', `${x}px`);
    panel.style.setProperty('--_y', `${y}px`);
    // Resolved placement (after flip/shift) — drives arrow side styling.
    this.setAttribute('data-actual-placement', placement);

    if (arrowEl && middlewareData.arrow) {
      const { x: arrowX, y: arrowY } = middlewareData.arrow;
      if (arrowX != null) arrowEl.style.setProperty('--_arrow-x', `${arrowX}px`);
      else arrowEl.style.removeProperty('--_arrow-x');
      if (arrowY != null) arrowEl.style.setProperty('--_arrow-y', `${arrowY}px`);
      else arrowEl.style.removeProperty('--_arrow-y');
    }
  }

  /** Reads a length token off the host and converts it to px (tokens are emitted in rem). */
  private _tokenLengthPx(name: string, fallback: number): number {
    const raw = getComputedStyle(this).getPropertyValue(name).trim();
    const value = parseFloat(raw);
    if (!Number.isFinite(value)) return fallback;
    if (raw.endsWith('rem')) {
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      return value * rootFontSize;
    }
    return value;
  }

  private _focusablesInPanel(): HTMLElement[] {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    const roots = slot?.assignedElements({ flatten: true }) ?? [];
    const found: HTMLElement[] = [];
    for (const root of roots) {
      if (root.matches(FOCUSABLE_SELECTOR)) found.push(root as HTMLElement);
      found.push(...(Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)) as HTMLElement[]));
    }
    return found;
  }

  private _containsFocus(): boolean {
    const active = deepActiveElement();
    return active !== null && (this.contains(active) || this.shadowRoot!.contains(active));
  }

  private _syncTriggerAria = () => {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="trigger"]');
    const anchor = slot?.assignedElements({ flatten: true })[0];
    if (!anchor) return;
    // Manual mode: the consumer owns the trigger's ARIA (e.g. combobox pattern).
    if (this.trigger === 'manual') {
      anchor.removeAttribute('aria-expanded');
    } else {
      anchor.setAttribute('aria-expanded', String(this.open));
    }
  };

  private _dispatchOpenChange(open: boolean, reason: PopoverOpenChangeReason) {
    if (open === this.open) return;
    this.dispatchEvent(
      new CustomEvent<PopoverOpenChangeDetail>('open-change', {
        detail: { open, reason },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onHostClick = (event: MouseEvent) => {
    if (this.trigger !== 'click') return;
    // Clicks inside the panel are content interactions, not trigger toggles.
    if (this._panel && event.composedPath().includes(this._panel)) return;
    this._dispatchOpenChange(!this.open, 'trigger');
  };

  private _onHostMouseEnter = () => {
    if (this.trigger !== 'hover') return;
    clearTimeout(this._hoverCloseTimer);
    this._dispatchOpenChange(true, 'hover');
  };

  private _onHostMouseLeave = () => {
    if (this.trigger !== 'hover') return;
    clearTimeout(this._hoverCloseTimer);
    this._hoverCloseTimer = setTimeout(() => {
      this._dispatchOpenChange(false, 'hover');
    }, HOVER_CLOSE_DELAY_MS);
  };

  private _onHostFocusIn = () => {
    if (this.trigger !== 'hover') return;
    this._dispatchOpenChange(true, 'hover');
  };

  private _onHostFocusOut = (event: FocusEvent) => {
    if (this.trigger !== 'hover') return;
    const next = event.relatedTarget as Node | null;
    if (next && (this.contains(next) || this.shadowRoot!.contains(next))) return;
    this._dispatchOpenChange(false, 'hover');
  };

  private _onDocumentPointerDown = (event: PointerEvent) => {
    if (this.dismissOn === 'escape') return;
    if (event.composedPath().includes(this)) return;
    this._dispatchOpenChange(false, 'outside-click');
  };

  private _onDocumentKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    if (this.dismissOn === 'outside-click') return;
    this._dispatchOpenChange(false, 'escape');
  };

  private _onPanelKeyDown = (event: KeyboardEvent) => {
    if (!this.trapFocus || event.key !== 'Tab') return;
    const focusables = this._focusablesInPanel();
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = deepActiveElement();
    if (event.shiftKey && (active === first || active === this._panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  override render() {
    const panelClasses = classMap({
      panel: true,
      'panel--fallback': !supportsNativePopover,
      'panel--open': !supportsNativePopover && this.open,
    });
    return html`
      <slot name="trigger" @slotchange=${this._syncTriggerAria}></slot>
      <div
        class=${panelClasses}
        part="panel"
        popover=${supportsNativePopover ? 'manual' : nothing}
        tabindex="-1"
        @keydown=${this._onPanelKeyDown}
      >
        ${this.arrow ? html`<div class="arrow" part="arrow"></div>` : nothing}
        <div class="content" part="content"><slot></slot></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-popover': UiPopover;
  }
}
