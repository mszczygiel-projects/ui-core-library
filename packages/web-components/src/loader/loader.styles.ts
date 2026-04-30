import { css } from 'lit';

export const loaderStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* Standalone fallback — inherited color wins when parent sets color */
    color: var(--loader-color, var(--color-icon-default));
  }

  .spinner {
    display: block;
    border-radius: var(--radius-full);
    border-style: solid;
    border-color: color-mix(in srgb, currentColor 20%, transparent);
    border-top-color: currentColor;
    animation: ui-spin var(--loader-duration, var(--duration-700))
      var(--loader-easing, var(--ease-linear)) infinite;
  }

  :host([data-size='small']) .spinner {
    width: var(--size-5);
    height: var(--size-5);
    border-width: var(--size-1);
  }

  :host([data-size='default']) .spinner,
  :host(:not([data-size])) .spinner {
    width: var(--size-6);
    height: var(--size-6);
    border-width: var(--size-1);
  }

  :host([data-size='large']) .spinner {
    width: var(--size-8);
    height: var(--size-8);
    border-width: var(--size-1);
  }

  @keyframes ui-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
