import { css } from 'lit';

export const breadcrumbsStyles = css`
  :host {
    display: block;

    /* medium is the default ramp; the small host selector below swaps it */
    --_font-size: var(--breadcrumbs-medium-font-size);
    --_line-height: var(--breadcrumbs-medium-line-height);
    --_icon-size: var(--breadcrumbs-medium-icon-size);
    --_separator-size: var(--breadcrumbs-medium-separator-size);
    --_gap: var(--breadcrumbs-medium-gap);

    font-family: var(--breadcrumbs-font-family);
    font-weight: var(--breadcrumbs-font-weight);
    font-size: var(--_font-size);
    line-height: var(--_line-height);
    letter-spacing: var(--breadcrumbs-letter-spacing);
  }

  :host([data-size='small']) {
    --_font-size: var(--breadcrumbs-small-font-size);
    --_line-height: var(--breadcrumbs-small-line-height);
    --_icon-size: var(--breadcrumbs-small-icon-size);
    --_separator-size: var(--breadcrumbs-small-separator-size);
    --_gap: var(--breadcrumbs-small-gap);
  }

  .list {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--_gap);
    list-style: none;
  }

  .item,
  .ellipsis {
    display: inline-flex;
    align-items: center;
    gap: var(--_gap);
    min-width: 0;
  }

  .ellipsis {
    /* Rendered only for the collapsed mobile trail; hidden at every other width. */
    display: none;
    color: var(--color-breadcrumbs-ellipsis-foreground);
  }

  .link,
  .crumb {
    display: inline-flex;
    align-items: center;
    gap: var(--breadcrumbs-item-gap);
    min-width: 0;
    max-width: var(--breadcrumbs-label-max-width, none);
    border-radius: var(--breadcrumbs-radius);
    color: var(--color-breadcrumbs-item-foreground-default);
  }

  .link {
    text-decoration: none;
    cursor: pointer;
  }

  .link:hover {
    color: var(--color-breadcrumbs-item-foreground-hover);
    text-decoration: underline;
  }

  .link:active {
    color: var(--color-breadcrumbs-item-foreground-active);
  }

  /* The current page — last crumb, never a link */
  .crumb--current {
    color: var(--color-breadcrumbs-current-foreground);
    font-weight: var(--breadcrumbs-current-font-weight);
  }

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .icon {
    display: inline-flex;
    flex: none;
    width: var(--_icon-size);
    height: var(--_icon-size);
  }

  .separator {
    display: inline-flex;
    flex: none;
    align-items: center;
    color: var(--color-breadcrumbs-separator-foreground);
  }

  :host([separator='chevron']) .separator {
    width: var(--_separator-size);
    height: var(--_separator-size);
  }

  .icon svg,
  .separator svg {
    width: 100%;
    height: 100%;
  }

  /* 48rem mirrors --breakpoint-md; media queries cannot read CSS custom properties */
  @media (max-width: 47.9375rem) {
    .ellipsis {
      display: inline-flex;
    }

    /*
     * Below the breakpoint only the last two crumbs stay in the layout. The rest
     * are removed visually but kept in the accessibility tree, so a screen
     * reader still announces the whole trail — the "…" marker is decorative.
     */
    .item:not(:nth-last-child(-n + 2)) {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      clip-path: inset(50%);
      white-space: nowrap;
    }
  }
`;
