# `DateField`

Date input built on `TextField` (SearchField pattern): one combined text input
in both modes, a trailing calendar button opening `DatePicker`, and a
locale-aware `Intl` parser/formatter — no i18n library. Final composition of
the pipeline Popover → Calendar → DatePicker → **DateField**.

## Modes & display

- `single` — one formatted date, locale `dateStyle: 'medium'` (pl "5 lip 2026",
  en-US "Jan 5, 2026"). Picking a day auto-commits and closes the panel.
- `range` — combined string `"<start> – <end>"` (space + en dash + space, both
  sides full medium format). Picking commits on Apply. The input always shows
  the **committed** value; the pending selection lives in the panel until Apply.

## Typing & validation

Typed text is parsed on blur/Enter. Accepted forms: ISO `YYYY-MM-DD`, the
locale's numeric short format (part order from `Intl`), and month-name forms
(long/short/genitive, e.g. "9 lipca 2026"). Ranges accept any of those on both
sides of a dash (spaces required); reversed endpoints are swapped; a lone date
is an open-ended range. Valid input commits (`onChange` + reformat), empty
input commits a cleared value, invalid or out-of-bounds
(`minDate`/`maxDate`/`disabledDates`) input renders the `error` state (on top
of `state="default"`) and calls `onInvalid` without committing; typing again
clears it.

## Value model

Controlled (`startDate`/`endDate` + `onChange`) or uncontrolled
(`defaultStartDate`/`defaultEndDate`), mirroring SearchField's `value`/
`defaultValue` convention.

## Props

TextField shell: `variant`, `size`, `label`, `labelPlacement`, `placeholder`,
`hint`, `state`, `name`, `disabled`, `required`, `readOnly` (typing blocked,
picker still works).

Date behavior: `mode`, `startDate`/`endDate`, `defaultStartDate`/`defaultEndDate`,
`minDate`/`maxDate`/`disabledDates`, `firstDayOfWeek`, `locale`, `today`,
`placement`, `calendarButtonLabel`, `applyLabel`/`clearLabel`,
`prevMonthLabel`/`nextMonthLabel`, `onChange`, `onInvalid`.
