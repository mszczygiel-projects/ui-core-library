# `Calendar`

Pure date-grid component: one month with weekday header and prev/next navigation,
plus a month/year picker behind the heading.
Supports single-date and range selection. First building block of the DatePicker /
DateField composition (used standalone as well). React mirror of `ui-calendar`.

## Basic usage

```tsx
<Calendar
  selectionMode="range"
  startDate="2026-07-08"
  endDate="2026-07-14"
  onDateSelect={({ startDate, endDate }) => setRange({ startDate, endDate })}
/>
```

## Controlled model

The component never mutates its own selection. Clicking a day calls
`onDateSelect` with the proposed `{ date, startDate, endDate }` — apply it back
via props. It only owns the displayed month and the roving keyboard focus.

Range proposal logic: no start (or a complete range) → restart with the clicked
date; start without end → complete the range, swapping endpoints when the second
click lands before the start.

## Month and year picker

The heading is a button that zooms out one level at a time:

```
day grid  ──▶  month grid (12 months of one year)  ──▶  year grid (24-year page)
   ◀── pick a month ───────┘   ◀── pick a year ────────────┘
```

The two chevrons keep their place and only change their stride — a month, then a
year, then a whole 24-year page — so October 1987 is four clicks away from
July 2026 instead of 470. Year pages are aligned to fixed 24-year blocks (…,
1992-2015, 2016-2039), so paging back and forth always lands on the same
boundaries.

Escape steps one level back down. Inside the picker popover the same key also
closes the panel — the collapse then just guarantees the day grid is what
reopens. A month or year that `minDate`/`maxDate` rule out entirely is disabled;
a `disabledDates` predicate is deliberately not consulted, since a single blocked
day must not hide its whole month.

## Props

| Prop                                | Type                           | Default           | Notes                                   |
| ----------------------------------- | ------------------------------ | ----------------- | --------------------------------------- |
| `selectionMode`                     | `'single' \| 'range'`          | `'single'`        |                                         |
| `startDate` / `endDate`             | ISO `YYYY-MM-DD`               | —                 | End is range mode only                  |
| `minDate` / `maxDate`               | ISO string                     | —                 | Outside dates are disabled              |
| `disabledDates`                     | `string[] \| (iso) => boolean` | —                 |                                         |
| `firstDayOfWeek`                    | `1-7` (ISO, 1 = Monday)        | locale `weekInfo` | Fallback: Monday                        |
| `locale`                            | BCP 47 tag                     | runtime locale    | Native `Intl`, no i18n lib              |
| `today`                             | ISO string                     | real today        | Deterministic rendering (tests/SSR)     |
| `prevMonthLabel` / `nextMonthLabel` | `string`                       | English defaults  | Localize via props                      |
| `prevYearLabel` / `nextYearLabel`   | `string`                       | English defaults  | Month grid chevrons                     |
| `prevYearsLabel` / `nextYearsLabel` | `string`                       | English defaults  | Year grid chevrons                      |
| `chooseMonthLabel`                  | `(monthAndYear) => string`     | English default   | Name of the heading button              |
| `chooseYearLabel`                   | `(year) => string`             | English default   | Name of the heading button (months)     |
| `onDateSelect`                      | `(detail) => void`             | —                 | Proposed `{ date, startDate, endDate }` |
| `onMonthChange`                     | `(detail) => void`             | —                 | `{ year, month }` (1-12)                |
| `className` / `style`               | —                              | —                 | Root element                            |
| `aria-*`                            | `AriaAttributes`               | —                 | Forwarded to the `role="grid"` element  |

## Accessibility

- `role="grid"` labelled by the month heading; rows are `role="row"`, weekday
  cells `role="columnheader"`, day cells `role="gridcell"` with an inner button.
- Roving tabindex: one focusable day; Arrow keys move by day/week, Home/End jump
  to week edges, PageUp/PageDown to the adjacent month (view follows focus).
- The month and year grids repeat the pattern: `role="grid"` labelled by the same
  heading, one focusable cell, Arrow keys by cell, Home/End to the row range's
  edges, PageUp/PageDown by a year (months) or a page (years). Crossing an edge
  turns the year page; months never spill into the neighbouring year.
- Today gets `aria-current="date"`; selected/in-range cells `aria-selected="true"`;
  disabled days use `aria-disabled` and stay focusable for grid continuity.
- Any `aria-*` prop is forwarded to the grid element (ARIA passthrough
  convention shared with the interactive components).

## Tokens

Colors `--color-calendar-*` and sizes `--calendar-*` — see the `ui-calendar`
README for the full list and the note about the pending `--calendar-font-*`
tokens (fallbacks mirror their Figma alias targets until the next Luckino export).
