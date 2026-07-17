import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { getUiCoreConfig, type LoaderVariant } from '@mszczygiel-projects/ui-core-foundations';
import { loaderStyles } from './loader.styles';
import { motionStyles } from '../styles/motion.styles';
import { resetStyles } from '../styles/reset.styles';

export type { LoaderVariant };

/**
 * Inline spinner indicating a pending asynchronous operation.
 *
 * @element ui-loader
 *
 * @example
 * ```html
 * <ui-loader data-size="small" label="Loading results"></ui-loader>
 * ```
 *
 * @cssprop --loader-color - Spinner color. Defaults to `--color-icon-default`.
 * @cssprop --loader-duration - One full rotation duration. Defaults to `--duration-700`.
 * @cssprop --loader-easing - Rotation easing. Defaults to `--ease-linear`.
 */
@customElement('ui-loader')
export class UiLoader extends LitElement {
  static override styles = [resetStyles, motionStyles, loaderStyles];

  /**
   * Spinner diameter.
   * @default 'default'
   */
  @property({ type: String, reflect: true, attribute: 'data-size' }) size:
    | 'small'
    | 'default'
    | 'large' = 'default';

  /**
   * Accessible name announced by screen readers.
   * @default 'Loading'
   */
  @property({ type: String }) label = 'Loading';

  private get variant(): LoaderVariant {
    return getUiCoreConfig().loaderVariant;
  }

  override render() {
    return html`
      <span role="status" aria-label=${this.label} aria-live="polite">
        ${this.renderVariant()}
      </span>
    `;
  }

  private renderVariant() {
    switch (this.variant) {
      case 'spinner':
      default:
        return html`<span class="spinner" aria-hidden="true"></span>`;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-loader': UiLoader;
  }
}
