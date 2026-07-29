import { css } from 'lit';

export const drawerStyles = css`
  /*
   * The host must not box anything: the panel is promoted to the top layer, so
   * host layout is irrelevant, and display: contents keeps it out of the flow
   * whether the drawer is open or closed.
   */
  :host {
    display: contents;
  }

  /*
   * Native <dialog> carries UA styles (inset, margin, padding, border,
   * background, color, max-width/height) — every one of them is overridden.
   * Each placement then re-establishes only the insets it needs.
   */
  .panel {
    position: fixed;
    margin: 0;
    max-width: none;
    max-height: none;
    /*
     * Vertical padding lives on the panel so the body keeps its inset even when
     * the dismiss row is hidden; inline padding stays on the regions so the
     * body's scrollbar sits flush with the panel edge.
     */
    padding: var(--drawer-padding-stack) 0;
    display: none;
    flex-direction: column;
    overflow: hidden;
    color: var(--color-text-primary);
    background-color: var(--color-drawer-background);
    border: 0 solid var(--color-drawer-border);
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

  /* ---- Placement: insets, the one bordered edge, and the entry offset ----
     Side drawers span the full viewport height and sit flush against their
     edge, so they carry no radius — only the sheet's top corners are rounded. */
  :host(:not([placement])) .panel,
  :host([placement='right']) .panel {
    inset: 0 0 0 auto;
    height: 100dvh;
    width: var(--drawer-width);
    max-width: 100%;
    border-left-width: var(--drawer-border-width);
  }

  :host([placement='left']) .panel {
    inset: 0 auto 0 0;
    height: 100dvh;
    width: var(--drawer-width);
    max-width: 100%;
    border-left-width: 0;
    border-right-width: var(--drawer-border-width);
  }

  /*
   * The sheet hugs its content: height is auto, capped so a long drawer still
   * leaves the page visible behind it. Viewport units have no token — the token
   * build emits every number as rem.
   */
  :host([placement='bottom']) .panel {
    inset: auto 0 0 0;
    width: 100%;
    height: auto;
    max-height: 90dvh;
    border-left-width: 0;
    border-top-width: var(--drawer-border-width);
    border-radius: var(--drawer-radius) var(--drawer-radius) 0 0;
  }

  /* ---- Regions ---- */
  .dismiss {
    display: flex;
    flex: 0 0 auto;
    justify-content: flex-end;
    padding: 0 var(--drawer-padding-inline) var(--drawer-gap);
  }

  .body {
    /*
     * Side drawers fill the leftover height so their content scrolls; the sheet
     * must only take what it needs, or it would defeat the hug.
     */
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 0 var(--drawer-padding-inline);
    font-family: var(--typography-body-font-family);
    font-size: var(--typography-body-font-size);
    font-weight: var(--typography-body-font-weight);
    line-height: var(--typography-body-line-height);
    letter-spacing: var(--typography-body-letter-spacing);
    overflow-wrap: break-word;
  }

  :host([placement='bottom']) .body {
    flex: 0 1 auto;
  }

  /* Flex children ignore the plain [hidden] UA rule — an empty region must not
     contribute padding. */
  [hidden] {
    display: none !important;
  }

  /*
   * Drag affordance. Rendered only for the bottom sheet, where the gesture
   * exists — an affordance that does nothing is worse than none at all. The
   * generous block padding is the touch target; the visible bar is the span.
   */
  .grabber {
    display: flex;
    flex: 0 0 auto;
    justify-content: center;
    padding-block: var(--drawer-grabber-gap);
    cursor: grab;
    touch-action: none;
  }

  .grabber span {
    display: block;
    width: var(--drawer-grabber-width);
    height: var(--drawer-grabber-height);
    background-color: var(--color-drawer-grabber);
    border-radius: var(--radius-pill);
  }

  :host([data-dragging]) .grabber {
    cursor: grabbing;
  }

  /* The panel must track the pointer exactly, so no easing mid-gesture. */
  :host([data-dragging]) .panel {
    transition: none;
  }

  /* ---- Entry animation: no JS, discrete properties allowed to transition ----
     The offset rides on transform because the drag gesture owns translate; the
     two compose instead of overwriting each other. */
  .panel,
  .panel::backdrop {
    transition:
      opacity var(--duration-200) var(--ease-out),
      transform var(--duration-200) var(--ease-out),
      translate var(--duration-200) var(--ease-out),
      overlay var(--duration-200) allow-discrete,
      display var(--duration-200) allow-discrete;
  }

  .panel {
    transform: translate3d(0, 0, 0);
  }

  :host(:not([placement])) .panel:not([open]),
  :host([placement='right']) .panel:not([open]) {
    transform: translate3d(100%, 0, 0);
  }

  :host([placement='left']) .panel:not([open]) {
    transform: translate3d(-100%, 0, 0);
  }

  :host([placement='bottom']) .panel:not([open]) {
    transform: translate3d(0, 100%, 0);
  }

  @starting-style {
    :host([placement='right']) .panel[open],
    :host(:not([placement])) .panel[open] {
      transform: translate3d(100%, 0, 0);
    }

    :host([placement='left']) .panel[open] {
      transform: translate3d(-100%, 0, 0);
    }

    :host([placement='bottom']) .panel[open] {
      transform: translate3d(0, 100%, 0);
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
   * Below 48rem a side drawer keeps its edge and its slide-in, and only widens
   * to the full viewport. 48rem mirrors --breakpoint-md; media queries cannot
   * read CSS custom properties. The Sizes collection is no help here — its
   * Desktop mode only starts at 80rem.
   */
  @media (max-width: 47.999rem) {
    :host(:not([placement])) .panel,
    :host([placement='right']) .panel,
    :host([placement='left']) .panel {
      width: 100%;
    }
  }
`;
