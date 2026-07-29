import { LitElement, html } from 'lit';
import type { PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { badgeStyles } from './badge.styles.js';
import { resetStyles } from '../styles/reset.styles.js';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'info';
export type BadgeAppearance = 'solid' | 'subtle';
export type BadgeSize = 'small' | 'medium';
export type BadgeShape = 'rounded' | 'square';

/**
 * Compact status label for counts, categories, and state indicators.
 *
 * @element ui-badge
 *
 * @example
 * ```html
 * <ui-badge variant="success" appearance="subtle">Active</ui-badge>
 * ```
 *
 * @slot - Badge label content.
 * @slot icon - Leading icon; combine with `icon-only` to hide the label.
 */
@customElement('ui-badge')
export class UiBadge extends LitElement {
  static override styles = [resetStyles, badgeStyles];

  /**
   * Semantic color scheme.
   * @default 'neutral'
   */
  @property({ type: String, reflect: true }) variant: BadgeVariant = 'neutral';

  /**
   * Visual style — maps to the Figma `Style` property (renamed: `style` is reserved in HTML/React).
   * @default 'solid'
   */
  @property({ type: String, reflect: true }) appearance: BadgeAppearance = 'solid';

  /**
   * Overall badge height and typography scale.
   * @default 'small'
   */
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: BadgeSize = 'small';

  /**
   * Corner rounding: fully rounded pill or square with small radius.
   * @default 'rounded'
   */
  @property({ type: String, reflect: true }) shape: BadgeShape = 'rounded';

  /** Icon-only mode — hides the label and switches to icon-only padding. */
  @property({ type: Boolean, reflect: true, attribute: 'icon-only' }) iconOnly = false;

  /** Accessible name; required in icon-only mode. Sets role="img" + aria-label on the host. */
  @property({ type: String }) label?: string;

  override updated(changed: PropertyValues<this>) {
    if (changed.has('label') || changed.has('iconOnly')) {
      if (this.iconOnly && this.label) {
        this.setAttribute('role', 'img');
        this.setAttribute('aria-label', this.label);
      } else {
        this.removeAttribute('role');
        this.removeAttribute('aria-label');
      }
    }
  }

  override render() {
    return html`
      <span class="content">
        <slot name="icon"></slot>
        <span class="label"><slot></slot></span>
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-badge': UiBadge;
  }
}
