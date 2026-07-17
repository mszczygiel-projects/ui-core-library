import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import { chipStyles } from './chip.styles.js';
import { focusStyles } from '../styles/focus.styles.js';
import { resetStyles } from '../styles/reset.styles.js';

export type ChipVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'info';
export type ChipAppearance = 'solid' | 'subtle' | 'outline';
export type ChipSize = 'small' | 'medium';

/**
 * Interactive chip for filters, selections, and dismissible tags.
 *
 * @element ui-chip
 *
 * @example
 * ```html
 * <ui-chip variant="brand" appearance="subtle" selected dismissible>Filter</ui-chip>
 * ```
 *
 * @slot - Chip label content.
 * @slot icon - Leading icon (sized automatically per `data-size`).
 *
 * @fires {CustomEvent} dismiss - Dismiss button clicked, or Delete/Backspace pressed on the chip.
 */
@customElement('ui-chip')
export class UiChip extends LitElement {
  static override styles = [resetStyles, focusStyles, chipStyles];

  /**
   * Semantic color scheme.
   * @default 'neutral'
   */
  @property({ type: String, reflect: true }) variant: ChipVariant = 'neutral';

  /**
   * Visual style — maps to the Figma `Style` property (renamed: `style` is reserved in HTML/React).
   * @default 'solid'
   */
  @property({ type: String, reflect: true }) appearance: ChipAppearance = 'solid';

  /**
   * Overall chip height and typography scale.
   * @default 'small'
   */
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: ChipSize = 'small';

  /** Selected (pressed) state — renders `aria-pressed="true"` on the action button. */
  @property({ type: Boolean, reflect: true }) selected = false;

  /** Disables the chip; the dismiss button is not rendered while disabled. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Shows the trailing dismiss button (hidden while `disabled`). */
  @property({ type: Boolean, reflect: true }) dismissible = false;

  /**
   * Accessible name of the dismiss button.
   * @default 'Remove'
   */
  @property({ type: String, attribute: 'dismiss-label' }) dismissLabel = 'Remove';

  private dispatchDismiss() {
    this.dispatchEvent(new CustomEvent('dismiss', { bubbles: true, composed: true }));
  }

  private handleDismissClick(event: Event) {
    // Dismiss is independently interactive — never surfaces as a chip click.
    event.stopPropagation();
    this.dispatchDismiss();
  }

  private handleKeydown(event: KeyboardEvent) {
    if (
      (event.key === 'Delete' || event.key === 'Backspace') &&
      this.dismissible &&
      !this.disabled
    ) {
      event.preventDefault();
      this.dispatchDismiss();
    }
  }

  // `:host(:has(.action:focus-visible))` is not implemented by all engines
  // (:has() as a :host() argument, unlike bare :has()) — track focus-visible
  // on the action button imperatively instead, scoped to keyboard focus only.
  private handleActionFocus(event: FocusEvent) {
    this.classList.toggle('action-focused', (event.target as HTMLElement).matches(':focus-visible'));
  }

  private handleActionBlur() {
    this.classList.remove('action-focused');
  }

  override render() {
    return html`
      <button
        class="action"
        type="button"
        ?disabled=${this.disabled}
        aria-pressed=${this.selected ? 'true' : nothing}
        @keydown=${this.handleKeydown}
        @focus=${this.handleActionFocus}
        @blur=${this.handleActionBlur}
      >
        <slot name="icon"></slot>
        <span class="label"><slot></slot></span>
      </button>
      ${this.dismissible && !this.disabled
        ? html`
            <button
              class="dismiss"
              type="button"
              aria-label=${this.dismissLabel}
              @click=${this.handleDismissClick}
            >
              ${unsafeSVG(svgMap['icon-close'])}
            </button>
          `
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-chip': UiChip;
  }
}
