# `ui-date-field`

Date input built on the TextField shell (same mechanism as `ui-search-field`):
one combined text input in both modes, a trailing calendar button opening
`ui-date-picker`, and a locale-aware `Intl` parser/formatter — no i18n library.
Final composition of the pipeline Popover → Calendar → DatePicker → **DateField**.

## Modes & display

- `single` — one formatted date, locale `dateStyle: 'medium'` (pl "5 lip 2026",
  en-US "Jan 5, 2026"). Picking a day auto-commits and closes the panel.
- `range` — combined string `"<start> – <end>"` (space + en dash + space, both
  sides full medium format — unambiguous and parseable). Picking commits on
  Apply. The input always shows the **committed** value; the pending selection
  lives in the panel until Apply.

## Typing & validation

Typed text is parsed on blur/Enter. Accepted forms: ISO `YYYY-MM-DD`, the
locale's numeric short format (part order from `Intl`), and month-name forms
(long/short/genitive, e.g. "9 lipca 2026"). Ranges accept any of those on both
sides of a dash (spaces required); reversed endpoints are swapped; a lone date
is an open-ended range. Valid input commits (`ui-change` + reformat), empty
input commits a cleared value, invalid or out-of-bounds
(`min-date`/`max-date`/`disabledDates`) input sets the `data-invalid` error
treatment + `aria-invalid` and dispatches `ui-invalid` without committing;
typing again clears it. Full `state="error"` remains a consumer decision.

## Props

TextField shell props: `variant` (`outline | filled | underlined`), `data-size`
(`small | default | large`), `label`, `label-placement` (`top | floating |
inner`), `placeholder`, `hint`, `state`, `name`, `disabled`, `required`,
`readonly` (typing blocked, picker still works).

Date props: `mode`, `start-date`, `end-date`, `min-date`, `max-date`,
`disabledDates` (property), `first-day-of-week`, `locale`, `today`,
`placement`, `calendar-button-label`, `apply-label`, `clear-label`.

## Events

- `ui-change` — `{ startDate, endDate }` after any commit (picker or typed).
- `ui-input` — `{ value }` raw text on each keystroke.
- `ui-invalid` — `{ value }` when typed text fails parsing/validation.

## Forms

Form-associated: submits ISO `YYYY-MM-DD` (single) or `start/end` ISO interval
notation (range). `name` comes from the attribute (platform rule for
form-associated custom elements).
