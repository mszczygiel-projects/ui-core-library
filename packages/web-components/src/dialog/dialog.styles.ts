import { css } from 'lit';

export const dialogStyles = css`
  /* ---- Shadow DOM UA reset (reset.css doesn't pierce the shadow boundary) ---- */
  h2,
  p {
    margin: 0;
    padding: 0;
  }

  /*
   * The host must not box anything: the panel is promoted to the top layer, so
   * host layout is irrelevant, and display: contents keeps it out of the flow
   * whether the dialog is open or closed.
   */
  :host {
    display: contents;
  }

  /*
   * Native <dialog> carries UA styles (inset, margin, padding, border,
   * background, color, max-width/height) — every one of them is overridden.
   * Centring comes from margin: auto against inset: 0.
   */
  .panel {
    position: fixed;
    inset: 0;
    margin: auto;
    width: calc(100% - 2 * var(--dialog-margin));
    max-width: var(--_max-width);
    /* Viewport units have no token — the build emits every number as rem. */
    max-height: 90dvh;
    /*
     * Vertical padding lives on the panel so a hidden header or footer still
     * leaves the body inset; inline padding stays on the regions so the body's
     * scrollbar sits flush with the panel edge.
     */
    padding: var(--dialog-padding-stack) 0;
    display: none;
    flex-direction: column;
    overflow: hidden;
    color: var(--color-text-primary);
    background-color: var(--color-dialog-background);
    border: var(--dialog-border-width) solid var(--color-dialog-border);
    border-radius: var(--dialog-radius);
    box-shadow: var(--shadow-lg);
  }

  .panel[open] {
    display: flex;
  }

  .panel:focus {
    outline: none;
  }

  .panel::backdrop {
    background-color: var(--color-background-overlay);
  }

  /* ---- Size: only the max-width differs; fullscreen drops the box entirely ---- */
  :host,
  :host([data-size='medium']) {
    --_max-width: var(--dialog-medium-max-width);
  }

  :host([data-size='small']) {
    --_max-width: var(--dialog-small-max-width);
  }

  :host([data-size='large']) {
    --_max-width: var(--dialog-large-max-width);
  }

  :host([data-size='fullscreen']) .panel {
    width: 100%;
    max-width: none;
    max-height: none;
    height: 100dvh;
    border-radius: 0;
    border-width: 0;
  }

  /* ---- Regions ---- */
  .header {
    display: flex;
    align-items: flex-start;
    gap: var(--dialog-header-gap);
    padding: 0 var(--dialog-padding-inline) var(--dialog-gap);
    border-bottom: var(--dialog-border-width) solid transparent;
  }

  .header-text {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    flex-direction: column;
    gap: var(--dialog-header-gap);
  }

  .title {
    font-family: var(--dialog-title-font-family);
    font-size: var(--dialog-title-font-size);
    font-weight: var(--dialog-title-font-weight);
    line-height: var(--dialog-title-line-height);
    letter-spacing: var(--dialog-title-letter-spacing);
    color: var(--color-text-primary);
    overflow-wrap: break-word;
  }

  .description {
    font-family: var(--dialog-description-font-family);
    font-size: var(--dialog-description-font-size);
    font-weight: var(--dialog-description-font-weight);
    line-height: var(--dialog-description-line-height);
    letter-spacing: var(--dialog-description-letter-spacing);
    color: var(--color-text-secondary);
    overflow-wrap: break-word;
  }

  .body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 0 var(--dialog-padding-inline);
    font-family: var(--typography-body-font-family);
    font-size: var(--typography-body-font-size);
    font-weight: var(--typography-body-font-weight);
    line-height: var(--typography-body-line-height);
    letter-spacing: var(--typography-body-letter-spacing);
    overflow-wrap: break-word;
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--dialog-footer-gap);
    padding: var(--dialog-gap) var(--dialog-padding-inline) 0;
    border-top: var(--dialog-border-width) solid transparent;
  }

  /*
   * Separators appear only while the body actually scrolls past that edge —
   * data-scroll-* is toggled from JS, since CSS cannot observe scroll offset.
   */
  :host([data-scroll-start]) .header {
    border-bottom-color: var(--color-dialog-divider);
  }

  :host([data-scroll-end]) .footer {
    border-top-color: var(--color-dialog-divider);
  }

  /* Flex children ignore the plain [hidden] UA rule — empty regions must not
     contribute padding or borders. */
  [hidden] {
    display: none !important;
  }

  .close {
    flex: 0 0 auto;
  }

  /*
   * Drag affordance. Hidden on the centred desktop layout, where the gesture is
   * inactive — an affordance that does nothing is worse than none at all. The
   * generous block padding is the touch target; the visible bar is the span.
   */
  .grabber {
    display: none;
    flex: 0 0 auto;
    justify-content: center;
    padding-block: var(--dialog-header-gap);
    cursor: grab;
    touch-action: none;
  }

  .grabber span {
    display: block;
    width: var(--size-8);
    height: var(--size-1);
    background-color: var(--color-dialog-divider);
    border-radius: var(--radius-pill);
  }

  :host([data-dragging]) .grabber {
    cursor: grabbing;
  }

  /* The panel must track the pointer exactly, so no easing mid-gesture. */
  :host([data-dragging]) .panel {
    transition: none;
  }

  /* ---- Entry animation: no JS, discrete properties allowed to transition ---- */
  .panel,
  .panel::backdrop {
    transition:
      opacity var(--duration-200) var(--ease-out),
      transform var(--duration-200) var(--ease-out),
      /* translate carries the drag offset, kept separate from transform so the
         gesture and the entry animation never overwrite each other */
      translate var(--duration-200) var(--ease-out),
      overlay var(--duration-200) allow-discrete,
      display var(--duration-200) allow-discrete;
  }

  .panel {
    opacity: 1;
    transform: scale(1);
  }

  .panel:not([open]) {
    opacity: 0;
    transform: scale(0.96);
  }

  @starting-style {
    .panel[open] {
      opacity: 0;
      transform: scale(0.96);
    }
  }

  .panel::backdrop {
    opacity: 1;
  }

  @starting-style {
    .panel[open]::backdrop {
      opacity: 0;
    }
  }

  /*
   * Bottom sheet below 48rem. 48rem mirrors --breakpoint-md; media queries
   * cannot read CSS custom properties. The Sizes collection is no help here —
   * its Desktop mode only starts at 80rem.
   */
  @media (max-width: 47.999rem) {
    .panel {
      width: 100%;
      max-width: none;
      margin: auto auto 0;
      border-radius: var(--dialog-sheet-radius) var(--dialog-sheet-radius) 0 0;
      border-bottom-width: 0;
      transform: translateY(0);
    }

    .panel:not([open]) {
      transform: translateY(100%);
      opacity: 1;
    }

    @starting-style {
      .panel[open] {
        transform: translateY(100%);
        opacity: 1;
      }
    }

    .footer {
      flex-direction: column;
    }

    /* The gesture only exists in sheet mode, so the affordance appears here. */
    .grabber {
      display: flex;
    }

    :host([data-size='fullscreen']) .panel {
      border-radius: 0;
    }
  }
`;
