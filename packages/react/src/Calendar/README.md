# `Calendar`

Pure date-grid component: one month with weekday header and prev/next navigation.
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
| `onDateSelect`                      | `(detail) => void`             | —                 | Proposed `{ date, startDate, endDate }` |
| `onMonthChange`                     | `(detail) => void`             | —                 | `{ year, month }` (1-12)                |
| `className` / `style`               | —                              | —                 | Root element                            |
| `aria-*`                            | `AriaAttributes`               | —                 | Forwarded to the `role="grid"` element  |

## Accessibility

- `role="grid"` labelled by the month heading; rows are `role="row"`, weekday
  cells `role="columnheader"`, day cells `role="gridcell"` with an inner button.
- Roving tabindex: one focusable day; Arrow keys move by day/week, Home/End jump
  to week edges, PageUp/PageDown to the adjacent month (view follows focus).
- Today gets `aria-current="date"`; selected/in-range cells `aria-selected="true"`;
  disabled days use `aria-disabled` and stay focusable for grid continuity.
- Any `aria-*` prop is forwarded to the grid element (ARIA passthrough
  convention shared with the interactive components).

## Tokens

Colors `--color-calendar-*` and sizes `--calendar-*` — see the `ui-calendar`
README for the full list and the note about the pending `--calendar-font-*`
tokens (fallbacks mirror their Figma alias targets until the next Luckino export).
