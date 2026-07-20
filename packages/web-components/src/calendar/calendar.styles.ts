import { css } from 'lit';

/*
 * Font tokens note: --calendar-font-family / --calendar-*-font-weight /
 * --calendar-*-line-height are already defined in Figma Foundations but reach
 * tokens.css only with the next Luckino export — until then the fallbacks
 * mirror the Figma alias targets (typography/caption family + weights).
 */
export const calendarStyles = css`
  :host {
    display: inline-block;
  }

  .calendar {
    display: flex;
    flex-direction: column;
    gap: var(--calendar-header-gap);
    font-family: var(--calendar-font-family, var(--typography-caption-font-family));
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
    font-weight: var(--calendar-weekday-font-weight, var(--font-weight-medium));
    line-height: var(--calendar-day-line-height, var(--size-5));
    color: var(--color-calendar-header-text);
    text-transform: capitalize;
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
    font-weight: var(--calendar-weekday-font-weight, var(--font-weight-medium));
    line-height: var(--calendar-weekday-line-height, var(--size-4));
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
    font-weight: var(--calendar-day-font-weight, var(--typography-caption-font-weight));
    line-height: var(--calendar-day-line-height, var(--size-5));
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
`;
