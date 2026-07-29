import { css } from 'lit';

export const paginationStyles = css`
  :host {
    display: block;
  }

  .root {
    display: flex;
    align-items: center;
    gap: var(--pagination-gap);
    font-family: var(--control-font-family);
  }

  /*
   * Mobile-first: the number strip and the jump field are hidden; the
   * page-label slot is centered between the prev/next controls. Flex \`order\`
   * keeps a single DOM order (prev, items, next, meta) working for both
   * layouts.
   */
  .prev {
    order: 1;
  }

  .meta {
    order: 2;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-6);
  }

  .next {
    order: 3;
  }

  .items {
    display: none;
    order: 2;
    align-items: center;
    gap: var(--pagination-gap);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .jump {
    display: none;
    align-items: center;
    gap: var(--spacing-2);
  }

  /* 48rem mirrors --breakpoint-md; media queries cannot read CSS custom properties */
  @media (min-width: 48rem) {
    .items {
      display: flex;
      order: 0;
    }

    .prev,
    .next {
      order: 0;
    }

    .meta {
      order: 0;
      flex: initial;
      justify-content: flex-end;
      margin-inline-start: auto;
    }

    .jump {
      display: flex;
    }
  }

  .cell {
    display: inline-flex;
  }

  .item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--pagination-item-size);
    height: var(--pagination-item-size);
    padding-inline: var(--spacing-1);
    background-color: var(--color-pagination-item-background-default);
    color: var(--color-pagination-item-foreground-default);
    border: var(--control-border-width) solid var(--color-pagination-item-border-default);
    border-radius: var(--control-radius);
    font-family: inherit;
    font-size: var(--control-font-size);
    font-weight: var(--control-font-weight);
    line-height: var(--control-line-height);
    cursor: pointer;
  }

  .item:hover:not(:disabled):not(.item--current) {
    background-color: var(--color-pagination-item-background-hover);
    color: var(--color-pagination-item-foreground-hover);
    border-color: var(--color-pagination-item-border-hover);
  }

  .item:active:not(:disabled):not(.item--current) {
    background-color: var(--color-pagination-item-background-active);
    color: var(--color-pagination-item-foreground-active);
    border-color: var(--color-pagination-item-border-active);
  }

  .item--current {
    background-color: var(--color-pagination-item-selected-background);
    color: var(--color-pagination-item-selected-foreground);
    border-color: var(--color-pagination-item-selected-background);
    cursor: default;
  }

  .item:disabled {
    background-color: var(--color-pagination-item-background-disabled);
    color: var(--color-pagination-item-foreground-disabled);
    border-color: var(--color-pagination-item-border-disabled);
    cursor: not-allowed;
  }

  .ellipsis {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--pagination-item-size);
    height: var(--pagination-item-size);
    color: var(--color-pagination-ellipsis-foreground);
    font-size: var(--control-font-size);
    line-height: var(--control-line-height);
  }

  .page-label {
    color: var(--color-text-secondary);
    font-family: var(--typography-body-font-family);
    font-size: var(--typography-body-small-font-size);
    line-height: var(--typography-body-small-line-height);
    white-space: nowrap;
  }

  .page-label.empty {
    display: none;
  }

  .jump-label {
    color: var(--color-text-secondary);
    font-family: var(--typography-caption-font-family);
    font-size: var(--typography-caption-font-size);
    line-height: var(--typography-caption-line-height);
    white-space: nowrap;
  }

  /*
   * The jump field mirrors TextField's outline styling through the shared
   * control tokens; swap for ui-number-field once it exists.
   */
  .jump-input {
    width: var(--pagination-jump-input-width);
    height: var(--pagination-item-size);
    padding-inline: var(--control-padding-inline);
    background-color: var(--color-control-outline-background-default);
    color: var(--color-control-outline-text-default);
    border: var(--control-border-width) solid var(--color-control-outline-border-default);
    border-radius: var(--control-radius);
    font-family: var(--control-font-family);
    font-size: var(--control-font-size);
    font-weight: var(--control-font-weight);
    line-height: var(--control-line-height);
  }

  .jump-input:hover {
    border-color: var(--color-control-outline-border-hover);
  }

  .jump-input:focus {
    border-color: var(--color-control-outline-border-active);
  }
`;
