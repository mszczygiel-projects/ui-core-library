# `ui-date-picker`

Date picker composition: `ui-popover` (`trigger="manual"`, focus trap) +
`ui-calendar`, plus a Clear/Apply footer in range mode. Third building block of
the DateField pipeline (Popover → Calendar → DatePicker → DateField).

## Commit model (mode-dependent)

- **`single`** — auto-commit: clicking a day dispatches `date-change` and a
  close request immediately. No footer (matches native date-input UX).
- **`range`** — explicit commit: day clicks only build a _pending_ selection
  shown in the calendar; `Apply` dispatches `range-change` with the pending
  range and requests close; `Clear` resets the pending selection to empty
  without committing (Apply afterwards commits `{ null, null }`).

## Controlled model

`open` and the committed `start-date`/`end-date` are owned by the consumer
(ultimately DateField). The component dispatches:

- `date-change` — `{ date }` (single mode)
- `range-change` — `{ startDate, endDate }` (range mode, on Apply)
- `open-change` — `{ open, reason }`: close requests after select/apply and
  forwarded popover dismissals (`escape`, `outside-click`)

Opening seeds the pending range from the committed values.

## Props

| Prop                                                                            | WC attr                                 | Type                       | Default               |
| ------------------------------------------------------------------------------- | --------------------------------------- | -------------------------- | --------------------- |
| `selectionMode`                                                                 | `selection-mode`                        | `'single' \| 'range'`      | `'single'`            |
| `open`                                                                          | `open`                                  | boolean (controlled)       | `false`               |
| `placement`                                                                     | `placement`                             | popover placement          | `'bottom-start'`      |
| `startDate` / `endDate`                                                         | `start-date` / `end-date`               | ISO `YYYY-MM-DD`           | —                     |
| `minDate` / `maxDate` / `disabledDates` / `firstDayOfWeek` / `locale` / `today` | —                                       | forwarded to `ui-calendar` | —                     |
| `applyLabel` / `clearLabel`                                                     | `apply-label` / `clear-label`           | string                     | `'Apply'` / `'Clear'` |
| `prevMonthLabel` / `nextMonthLabel`                                             | `prev-month-label` / `next-month-label` | string                     | English defaults      |

The calendar heading opens a month grid and then a 24-year page (see the
`ui-calendar` README). Those six extra labels have no picker-level attribute —
override them globally through `configureUiCore({ labels: { calendar: … } })`,
or per instance on a standalone `ui-calendar`.

## Slots

- `trigger` — anchor element (DateField's input in the final composition).

## Tokens

No new colors — the panel surface comes entirely from `popover/*` tokens and the
grid from `calendar/*`. Layout uses `--date-picker-gap` (content stack + footer
buttons; falls back to `--spacing-2` until the next Luckino export) and the
popover offset token for trigger↔panel distance.
