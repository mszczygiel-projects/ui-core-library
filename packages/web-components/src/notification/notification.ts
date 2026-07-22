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
  success: svgMap['icon-check'],
  warning: svgMap['icon-danger'],
  error: svgMap['icon-danger'],
};

const statusRoles: Record<NotificationStatus, 'status' | 'alert'> = {
  info: 'status',
  success: 'status',
  warning: 'status',
  error: 'alert',
};

/**
 * Banner communicating a status message; `error` renders as an assertive `role="alert"`.
 *
 * @element ui-notification
 *
 * @example
 * ```html
 * <ui-notification status="success" heading="Changes saved">
 *   Your profile is now up to date.
 * </ui-notification>
 * ```
 *
 * @slot - Optional description text rendered below the heading.
 * @fires {CustomEvent} ui-close - Dispatched when the close button is clicked.
 */
@customElement('ui-notification')
export class UiNotification extends LitElement {
  static override styles = [resetStyles, notificationStyles];

  /**
   * Semantic tone; also picks the status icon and ARIA role.
   * @default 'info'
   */
  @property({ type: String, reflect: true }) status: NotificationStatus = 'info';

  /**
   * Visual style: solid accent or subtle tinted background.
   * @default 'default'
   */
  @property({ type: String, reflect: true }) variant: NotificationVariant = 'default';

  /** Heading text — the primary message. */
  @property({ type: String }) heading = '';

  /**
   * Shows the status icon in front of the heading. Available in every variant.
   * @default true
   */
  @property({ type: Boolean, attribute: 'has-leading-icon', reflect: true })
  hasLeadingIcon = true;

  /**
   * Shows the × close button.
   * @default true
   */
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
      <div class="container" role=${statusRoles[this.status]}>
        <div class="header">
          ${this.hasLeadingIcon
            ? html`<span class="icon" aria-hidden="true"
                >${unsafeSVG(statusIcons[this.status])}</span
              >`
            : nothing}
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
