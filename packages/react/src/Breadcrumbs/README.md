# `<Breadcrumbs>`

Hierarchical navigation trail. The **last item is always the current page**: it
renders as plain text with `aria-current="page"` and never links, even if it
carries an `href`.

## Basic usage

```tsx
import { Breadcrumbs } from '@mszczygiel-projects/ui-core-react';
import { IconHome } from '@mszczygiel-projects/ui-core-icons/react';

<Breadcrumbs
  items={[
    { label: 'Home', href: '/', icon: <IconHome /> },
    { label: 'Products', href: '/products' },
    { label: 'Widget' },
  ]}
/>;
```

| Prop        | Type                           | Default     |
| ----------- | ------------------------------ | ----------- |
| `items`     | `BreadcrumbsItem[]`            | — required  |
| `size`      | `'small' \| 'medium'`          | `'medium'`  |
| `separator` | `'chevron' \| 'slash'`         | `'chevron'` |
| `onSelect`  | `(item, index, event) => void` | —           |

## Responsive behaviour

The component is responsive on its own — there is no prop to configure it:

- the trail **wraps** when it runs out of horizontal room, so nothing is ever
  clipped;
- below `48rem` it **collapses** to a leading `…` plus the last two crumbs.

The collapsed crumbs are removed from the layout but stay in the accessibility
tree, so a screen reader still announces the full path. The `…` marker is
decorative (`aria-hidden`) and is only rendered when there is more than one
crumb to hide.

Cap a long label with the consumer hook:

```css
.ui-breadcrumbs {
  --breadcrumbs-label-max-width: 12rem; /* longer labels truncate with an ellipsis */
}
```

## Links vs. plain steps

A crumb with an `href` renders as a real `<a>`; a crumb without one renders as
plain text. Breadcrumbs that navigate should always be real links — that is what
makes keyboard access, middle-click and "open in new tab" work.

## Client-side routing

Keep the `href` for accessibility and cancel the navigation in `onSelect`:

```tsx
<Breadcrumbs
  items={trail}
  onSelect={(item, index, event) => {
    event.preventDefault();
    navigate(item.href!);
  }}
/>
```

## Tokens

Colours come from the Surfaces layer, so the component adapts to `data-surface`
without any per-component change:

| Part                  | Token                                                |
| --------------------- | ---------------------------------------------------- |
| link                  | `--color-breadcrumbs-item-foreground-default`        |
| link — hover / active | `--color-breadcrumbs-item-foreground-{hover,active}` |
| current page          | `--color-breadcrumbs-current-foreground`             |
| separator             | `--color-breadcrumbs-separator-foreground`           |
| ellipsis              | `--color-breadcrumbs-ellipsis-foreground`            |

Sizes come from `--breadcrumbs-{small,medium}-{font-size,line-height,icon-size,separator-size,gap}`
plus the size-independent `--breadcrumbs-{font-family,font-weight,letter-spacing,item-gap,radius}`
and `--breadcrumbs-current-font-weight`.
