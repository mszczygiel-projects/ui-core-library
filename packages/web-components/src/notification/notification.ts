import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import { notificationStyles } from './notification.styles.js';
import { resetStyles } from '../styles/reset.styles.js';

export type NotificationStatus = 'info' | 'success' | 'warning' | 'error';
export type NotificationVariant = 'default' | 'subtle';

const statusIcons: Record<NotificationStatus, string> = {
  info: svgMap['icon-info'],
  success: svgMap['icon-flag'],
  warning: svgMap['icon-danger'],
  error: svgMap['icon-danger'],
};

/**
 * Notification banner communicating a status message to the user.
 *
 * @slot - Optional description text rendered below the heading.
 * @fires {CustomEvent} ui-close - Dispatched when the close button is clicked.
 *
 * @attr {string} status - info | success | warning | error (default: info)
 * @attr {string} variant - default | subtle (default: default)
 * @attr {string} heading - Required heading text.
 * @attr {boolean} has-close-button - Shows the × close button (default: true).
 */
@customElement('ui-notification')
export class UiNotification extends LitElement {
  static override styles = [resetStyles, notificationStyles];

  @property({ type: String, reflect: true }) status: NotificationStatus = 'info';
  @property({ type: String, reflect: true }) variant: NotificationVariant = 'default';
  @property({ type: String }) heading = '';
  @property({ type: Boolean, attribute: 'has-close-button', reflect: true })
  hasCloseButton = true;

  /** Tracks whether the default slot has any content. */
  @state() private _hasDescription = false;

  private _handleClose() {
    this.dispatchEvent(new CustomEvent('ui-close', { bubbles: true, composed: true }));
  }

  private _onSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    const nodes = slot.assignedNodes({ flatten: true });
    this._hasDescription = nodes.some(
      (n) =>
        n.nodeType === Node.ELEMENT_NODE ||
        (n.nodeType === Node.TEXT_NODE && n.textContent?.trim() !== ''),
    );
  }

  protected override render() {
    return html`
      <div class="container" role="alert">
        <div class="header">
          <span class="icon" aria-hidden="true">${unsafeSVG(statusIcons[this.status])}</span>
          <div class="heading">${this.heading}</div>
        </div>

        <div class="description" ?hidden=${!this._hasDescription}>
          <slot @slotchange=${this._onSlotChange}></slot>
        </div>

        ${this.hasCloseButton
          ? html`
              <button
                type="button"
                class="close"
                aria-label="Close notification"
                @click=${this._handleClose}
              >
                <span aria-hidden="true">${unsafeSVG(svgMap['icon-close'])}</span>
              </button>
            `
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-notification': UiNotification;
  }
}
