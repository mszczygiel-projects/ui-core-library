import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { getUiCoreConfig, type LoaderVariant } from '@ui-core/foundations';
import { loaderStyles } from './loader.styles';
import { motionStyles } from '../styles/motion.styles';
import { resetStyles } from '../styles/reset.styles';

export type { LoaderVariant };

@customElement('ui-loader')
export class UiLoader extends LitElement {
  static override styles = [resetStyles, motionStyles, loaderStyles];

  @property({ type: String, reflect: true, attribute: 'data-size' }) size:
    | 'small'
    | 'default'
    | 'large' = 'default';
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
