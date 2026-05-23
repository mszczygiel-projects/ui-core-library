# `Notification`

A React notification banner for communicating status messages (info, success, warning, error) to the user.

## Basic usage

```tsx
<Notification heading="File saved successfully." status="success">
  Your changes have been saved and are now live.
</Notification>
```

## Variants

### Default — solid background

```tsx
<Notification heading="Something went wrong." status="error">
  Please try again or contact support if the problem persists.
</Notification>
```

### Subtle — tinted background with left border accent

```tsx
<Notification heading="New update available." status="info" variant="subtle">
  Refresh the page to load the latest version.
</Notification>
```

## Description via children

Pass description content as `children`. Omit `children` for a heading-only notification:

```tsx
{
  /* With description */
}
<Notification heading="Upload complete." status="success">
  3 files were uploaded to your account.
</Notification>;

{
  /* Heading only */
}
<Notification heading="Upload complete." status="success" />;
```

## Without close button

```tsx
<Notification heading="Maintenance scheduled." status="info" hasCloseButton={false}>
  The service will be unavailable on Sunday from 02:00 to 04:00 UTC.
</Notification>
```

## CSS customisation

The component exposes no consumer hooks — styling is done through the status and variant classes. To override colours for a specific context, target the modifier classes:

```css
/* Example: muted info colour in a sidebar */
.my-sidebar .ui-notification--info {
  --_base: var(--color-brand-secondary);
}
```

## Props

| Prop             | Type                                          | Default     | Description                                                                 |
| ---------------- | --------------------------------------------- | ----------- | --------------------------------------------------------------------------- |
| `heading`        | `string`                                      | —           | **Required.** Main heading text.                                            |
| `status`         | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'`    | Colour scheme and status icon.                                              |
| `variant`        | `'default' \| 'subtle'`                       | `'default'` | `default` = solid fill; `subtle` = tinted background with left border.      |
| `children`       | `ReactNode`                                   | —           | Optional description rendered below the heading.                            |
| `hasCloseButton` | `boolean`                                     | `true`      | Shows the × close button.                                                   |
| `onClose`        | `() => void`                                  | —           | Called when the close button is clicked. Consumer manages `open` state.     |
| `className`      | `string`                                      | —           | Extra class on the root element.                                            |
| `style`          | `CSSProperties`                               | —           | Inline style on the root element (intended for positioning overrides only). |

## Accessibility notes

- The root element has `role="alert"` — screen readers announce it on insertion.
- The status icon is decorative (`aria-hidden="true"`). Status is communicated through heading text.
- The close button is a native `<button>` with `aria-label="Close notification"`.
- To show/hide the notification, conditionally render it or wrap it in a container with `display: none`.
