import { css } from 'lit';

export const calendarStyles = css`
  :host {
    display: inline-block;
  }

  .calendar {
    display: flex;
    flex-direction: column;
    gap: var(--calendar-header-gap);
    font-family: var(--calendar-font-family);
  }

  /* ---- Header ---- */

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--calendar-header-gap);
  }

  .month-label {
    font-size: var(--calendar-day-font-size);
    font-weight: var(--calendar-weekday-font-weight);
    line-height: var(--calendar-day-line-height);
    color: var(--color-calendar-header-text);
    text-transform: capitalize;
  }

  .zoom {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-1);
    border: none;
    padding-block: var(--spacing-1);
    padding-inline: var(--spacing-2);
    background-color: var(--color-calendar-day-background-default);
    color: var(--color-calendar-header-text);
    border-radius: var(--calendar-day-radius);
    font-family: inherit;
    cursor: pointer;
  }

  .zoom:hover {
    background-color: var(--color-calendar-day-background-hover);
  }

  .zoom-icon {
    display: inline-flex;
  }

  .zoom-icon svg {
    inline-size: var(--size-4);
    block-size: var(--size-4);
  }

  .nav {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--size-8);
    block-size: var(--size-8);
    border: none;
    padding: 0;
    background-color: var(--color-calendar-day-background-default);
    color: var(--color-calendar-header-text);
    border-radius: var(--calendar-day-radius);
    cursor: pointer;
  }

  .nav:hover {
    background-color: var(--color-calendar-day-background-hover);
  }

  .nav svg {
    inline-size: var(--size-5);
    block-size: var(--size-5);
  }

  /* ---- Grid ---- */

  .grid {
    display: flex;
    flex-direction: column;
    gap: var(--calendar-day-gap);
  }

  .week {
    display: flex;
    gap: var(--calendar-day-gap);
  }

  .weekday {
    inline-size: var(--calendar-day-size);
    text-align: center;
    font-size: var(--calendar-weekday-font-size);
    font-weight: var(--calendar-weekday-font-weight);
    line-height: var(--calendar-weekday-line-height);
    color: var(--color-calendar-weekday-text);
  }

  /* ---- Day cell ---- */

  .day-cell {
    position: relative;
    inline-size: var(--calendar-day-size);
    block-size: var(--calendar-day-size);
  }

  /* Range tint band behind the day button; halves keep the band continuous
     across cells while endpoints stay circular. */
  .band {
    position: absolute;
    inset-block: 0;
    background-color: var(--color-calendar-day-background-in-range);
    pointer-events: none;
  }

  .band--full {
    inset-inline: 0;
  }

  .band--start {
    inset-inline: 50% 0;
  }

  .band--end {
    inset-inline: 0 50%;
  }

  .day {
    position: relative;
    inline-size: 100%;
    block-size: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    padding: 0;
    background-color: var(--color-calendar-day-background-default);
    color: var(--color-calendar-day-text-default);
    border-radius: var(--calendar-day-radius);
    font-family: inherit;
    font-size: var(--calendar-day-font-size);
    font-weight: var(--calendar-day-font-weight);
    line-height: var(--calendar-day-line-height);
    cursor: pointer;
  }

  .day:hover {
    background-color: var(--color-calendar-day-background-hover);
  }

  .day--today {
    border: var(--calendar-today-border-width) solid var(--color-calendar-day-border-today);
  }

  .day--outside {
    color: var(--color-calendar-day-text-outside);
  }

  .day--in-range {
    color: var(--color-calendar-day-text-in-range);
  }

  .day--selected,
  .day--range-start,
  .day--range-end {
    background-color: var(--color-calendar-day-background-selected);
    color: var(--color-calendar-day-text-selected);
  }

  .day--selected:hover,
  .day--range-start:hover,
  .day--range-end:hover {
    background-color: var(--color-calendar-day-background-selected);
  }

  .day--disabled {
    color: var(--color-calendar-day-text-disabled);
    cursor: not-allowed;
  }

  .day--disabled:hover {
    background-color: var(--color-calendar-day-background-default);
  }
  /* ---- Month / year picker ---- */

  /* Sized off the day grid so zooming out never resizes the panel around it.
     The six inter-cell gaps are left out of the sum on purpose: --calendar-day-gap
     resolves to a bare zero, which is a length in a declaration but a *number*
     inside calc() — including it would invalidate the whole expression. */
  .picker {
    display: flex;
    flex-direction: column;
    gap: var(--calendar-day-gap);
    inline-size: calc(var(--calendar-day-size) * 7);
    min-block-size: calc(var(--calendar-day-size) * 6);
  }

  .picker-row {
    display: flex;
    flex: 1;
    gap: var(--calendar-day-gap);
  }

  /* Rows share the panel height evenly; the button keeps the day-cell height so
     a month pill never stretches into a lozenge. */
  .picker-cell {
    display: flex;
    flex: 1;
    align-items: center;
  }

  .picker-item {
    inline-size: 100%;
    block-size: var(--calendar-day-size);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    padding: 0;
    background-color: var(--color-calendar-day-background-default);
    color: var(--color-calendar-day-text-default);
    border-radius: var(--calendar-day-radius);
    font-family: inherit;
    font-size: var(--calendar-day-font-size);
    font-weight: var(--calendar-day-font-weight);
    line-height: var(--calendar-day-line-height);
    text-transform: capitalize;
    cursor: pointer;
  }

  .picker-item:hover {
    background-color: var(--color-calendar-day-background-hover);
  }

  .picker-item--current {
    border: var(--calendar-today-border-width) solid var(--color-calendar-day-border-today);
  }

  .picker-item--selected {
    background-color: var(--color-calendar-day-background-selected);
    color: var(--color-calendar-day-text-selected);
  }

  .picker-item--selected:hover {
    background-color: var(--color-calendar-day-background-selected);
  }

  .picker-item--disabled {
    color: var(--color-calendar-day-text-disabled);
    cursor: not-allowed;
  }

  .picker-item--disabled:hover {
    background-color: var(--color-calendar-day-background-default);
  }
`;
