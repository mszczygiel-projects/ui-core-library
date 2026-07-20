# `ui-calendar`

Pure date-grid component: one month with weekday header and prev/next navigation.
Supports single-date and range selection. First building block of the DatePicker /
DateField composition (used standalone as well).

## Basic usage

```html
<ui-calendar selection-mode="range" start-date="2026-07-08" end-date="2026-07-14"></ui-calendar>
```

## Controlled model

The component never mutates its own selection. Clicking a day dispatches
`date-select` with the proposed `{ date, startDate, endDate }` — apply it back via
properties. It only owns the displayed month and the roving keyboard focus.

Range proposal logic: no start (or a complete range) → restart with the clicked
date; start without end → complete the range, swapping endpoints when the second
click lands before the start.

## Props

| Prop | WC attr | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `selectionMode` | `selection-mode` | `'single' \| 'range'` | `'single'` | |
| `startDate` | `start-date` | ISO `YYYY-MM-DD` | — | Selected date in single mode |
| `endDate` | `end-date` | ISO string | — | Range mode only |
| `minDate` / `maxDate` | `min-date` / `max-date` | ISO string | — | Outside dates are disabled |
| `disabledDates` | — (property only) | `string[] \| (iso) => boolean` | — | |
| `firstDayOfWeek` | `first-day-of-week` | `1-7` (ISO, 1 = Monday) | locale `weekInfo` | Fallback: Monday |
| `locale` | `locale` | BCP 47 tag | runtime locale | Native `Intl`, no i18n lib |
| `today` | `today` | ISO string | real today | Deterministic rendering (tests/SSR) |
| `prevMonthLabel` / `nextMonthLabel` | `prev-month-label` / `next-month-label` | string | English defaults | Localize via props |

## Events

- `date-select` — `{ date, startDate, endDate }` proposed selection.
- `month-change` — `{ year, month }` (1-12) after navigation (header buttons,
  keyboard crossing a month edge, or clicking an outside-month day).

## Accessibility

- `role="grid"` labelled by the month heading; rows are `role="row"`, weekday
  cells `role="columnheader"`, day cells `role="gridcell"` with an inner button.
- Roving tabindex: one focusable day; Arrow keys move by day/week, Home/End jump
  to week edges, PageUp/PageDown to the adjacent month (view follows focus).
- Today gets `aria-current="date"`; selected/in-range cells `aria-selected="true"`;
  disabled days use `aria-disabled` and stay focusable for grid continuity.

## Tokens

Colors `--color-calendar-*` (day background default/hover/selected/in-range, text
default/selected/in-range/disabled/outside, today border, weekday + header text)
and sizes `--calendar-*` (day size/font-size/radius/gap, weekday font-size, header
gap, today border width). Font family/weight/line-height tokens
(`--calendar-font-family`, …) are defined in Figma but land in `tokens.css` with
the next Luckino export — until then the styles fall back to their exact Figma
alias targets (`typography-caption` family/weight, `font-weight-medium`).
