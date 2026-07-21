# `<ui-pagination>`

Controlled pagination bar: prev/next arrows, numbered page items with ellipsis
truncation, an optional consumer-controlled page label, and a jump-to-page field.
The component never changes the page itself — it fires `ui-change` and waits for
a new `current-page` value.

## Basic usage

```html
<ui-pagination current-page="5" total-pages="42"></ui-pagination>

<script type="module">
  import '@mszczygiel-projects/ui-core-wc';

  const pagination = document.querySelector('ui-pagination');
  pagination.addEventListener('ui-change', (event) => {
    pagination.currentPage = event.detail.page; // controlled-only
  });
</script>
```

`ui-change` carries `detail.page` (already clamped to `[1, totalPages]`) and
`detail.source` — one of `prev | next | item | jump`. Filtering on
`source === 'jump'` is the analog of React's `onJumpToPage` handler.

## Page label

The `page-label` slot is fully consumer-controlled — content and visibility are
up to you. On viewports below `48rem` the number strip and the jump field
collapse and the slot is the only element between the arrows:

```html
<ui-pagination current-page="5" total-pages="42">
  <span slot="page-label">Page 5 of 42</span>
</ui-pagination>
```

## Sibling count

`sibling-count` (default `1`) controls how many pages are shown on each side of
the current page. The entry count stays constant near the boundaries.

## Jump to page

The jump field commits on <kbd>Enter</kbd> and on blur. Invalid input is
silently clamped to `[1, totalPages]` — no error state, no validation message.
Hide the field with `hide-jump-to-page`.

The field mirrors TextField's outline styling through the shared control tokens
(`inputmode="numeric"`); once a `ui-number-field` exists it will swap in without
any consumer-facing API change.

## Localization

All built-in texts are attributes: `prev-label`, `next-label`, `jump-label`
(visible caption and accessible name of the jump field), `label` for the root
`<nav>`, and the property-only `itemAriaLabel` callback for page items:

```html
<ui-pagination
  current-page="5"
  total-pages="42"
  label="Strony wyników"
  prev-label="Poprzednia strona"
  next-label="Następna strona"
  jump-label="Idź do strony"
></ui-pagination>

<script>
  document.querySelector('ui-pagination').itemAriaLabel = (page) => `Strona ${page}`;
</script>
```

## Accessibility

- Shadow root is a `<nav>` (accessible name from `label`) containing a list of
  page buttons.
- The current page carries `aria-current="page"`.
- Ellipses are `aria-hidden` — page buttons already announce their target.
- Prev/next are nested `<ui-icon-button variant="ghost">` with real `disabled`
  at the boundaries.
- The jump input carries `aria-label` (shadow boundaries rule out
  `aria-labelledby` against the visible caption).
