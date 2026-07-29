# `DatePicker`

Date picker composition: `Popover` (`trigger="manual"`, focus trap) + `Calendar`,
plus a Clear/Apply footer in range mode. Third building block of the DateField
pipeline (Popover → Calendar → DatePicker → DateField).

## Commit model (mode-dependent)

- **`single`** — auto-commit: clicking a day calls `onDateChange` and requests
  close immediately. No footer (matches native date-input UX).
- **`range`** — explicit commit: day clicks only build a _pending_ selection
  shown in the calendar; `Apply` calls `onRangeChange` with the pending range
  and requests close; `Clear` resets the pending selection to empty without
  committing (Apply afterwards commits `{ null, null }`).

## Controlled model

`open` and the committed `startDate`/`endDate` are owned by the consumer
(ultimately DateField). Callbacks:

- `onDateChange({ date })` — single mode
- `onRangeChange({ startDate, endDate })` — range mode, on Apply
- `onOpenChange({ open, reason })` — close requests (`select`, `apply`) and
  forwarded popover dismissals (`escape`, `outside-click`)

Opening seeds the pending range from the committed values.

## Props

| Prop                                                                            | Type                          | Default               |
| ------------------------------------------------------------------------------- | ----------------------------- | --------------------- |
| `selectionMode`                                                                 | `'single' \| 'range'`         | `'single'`            |
| `open`                                                                          | boolean (controlled)          | `false`               |
| `placement`                                                                     | popover placement             | `'bottom-start'`      |
| `startDate` / `endDate`                                                         | ISO `YYYY-MM-DD`              | —                     |
| `minDate` / `maxDate` / `disabledDates` / `firstDayOfWeek` / `locale` / `today` | forwarded to `Calendar`       | —                     |
| `applyLabel` / `clearLabel`                                                     | string                        | `'Apply'` / `'Clear'` |
| `prevMonthLabel` / `nextMonthLabel`                                             | string                        | English defaults      |
| `anchor`                                                                        | `ReactNode`                   | —                     |
| `onDateChange` / `onRangeChange` / `onOpenChange`                               | callbacks                     | —                     |
| `className` / `style`                                                           | forwarded to the Popover root | —                     |

## Tokens

No new colors — the panel surface comes entirely from `popover/*` tokens and the
grid from `calendar/*`. Layout uses `--date-picker-gap` (content stack + footer
buttons; falls back to `--spacing-2` until the next Luckino export) and the
popover offset token for anchor↔panel distance.
