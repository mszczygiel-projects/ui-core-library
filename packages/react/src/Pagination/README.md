# `Pagination`

Controlled pagination bar: prev/next arrows, numbered page items with ellipsis
truncation, an optional consumer-controlled page label, and a jump-to-page field.
The component never changes the page itself — it calls `onChange` (or
`onJumpToPage` for jump commits) and waits for a new `currentPage` prop.

## Basic usage

```tsx
import { Pagination } from '@mszczygiel-projects/ui-core-react';

const [page, setPage] = useState(1);

<Pagination currentPage={page} totalPages={42} onChange={setPage} />;
```

## Page label

`pageLabel` is fully consumer-controlled — content and visibility are up to you.
On viewports below `48rem` the number strip and the jump field collapse and the
label is the only element between the arrows:

```tsx
<Pagination
  currentPage={page}
  totalPages={42}
  onChange={setPage}
  pageLabel={`Page ${page} of 42`}
/>
```

## Sibling count

`siblingCount` (default `1`) controls how many pages are shown on each side of
the current page. The entry count stays constant near the boundaries:

```tsx
<Pagination currentPage={page} totalPages={100} siblingCount={2} onChange={setPage} />
```

## Jump to page

The jump field commits on <kbd>Enter</kbd> and on blur. Invalid input is
silently clamped to `[1, totalPages]` — no error state, no validation message.
`onJumpToPage` lets you distinguish jump commits from prev/next/item clicks; it
falls back to `onChange` when not provided:

```tsx
<Pagination
  currentPage={page}
  totalPages={42}
  onChange={setPage}
  onJumpToPage={(page) => {
    track('jump', page);
    setPage(page);
  }}
/>
```

Hide the field entirely with `hideJumpToPage`. The field renders a `TextField`
internally (`inputMode="numeric"`); once a NumberField component exists it will
swap in without any consumer-facing API change.

## Localization

All built-in texts are props: `prevLabel`, `nextLabel`, `jumpLabel` (visible
caption and accessible name of the jump field), `getItemAriaLabel` for page
items, and `aria-label` for the root `<nav>`:

```tsx
<Pagination
  currentPage={page}
  totalPages={42}
  onChange={setPage}
  aria-label="Strony wyników"
  prevLabel="Poprzednia strona"
  nextLabel="Następna strona"
  jumpLabel="Idź do strony"
  getItemAriaLabel={(page) => `Strona ${page}`}
/>
```

## Accessibility

- Root is a `<nav aria-label="Pagination">` containing a list of page buttons.
- The current page carries `aria-current="page"`.
- Ellipses are `aria-hidden` — page buttons already announce their target.
- Prev/next are ghost `IconButton`s with real `disabled` at the boundaries.
- The jump input is labelled by the visible caption via `aria-labelledby`.
