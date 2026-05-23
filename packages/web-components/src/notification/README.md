# `<ui-notification>`

A notification banner web component for communicating status messages (info, success, warning, error) to the user.

## Basic usage

```html
<ui-notification heading="File saved successfully." status="success">
  Your changes have been saved and are now live.
</ui-notification>
```

## Variants

### Default — solid background

```html
<ui-notification heading="Something went wrong." status="error">
  Please try again or contact support if the problem persists.
</ui-notification>
```

### Subtle — tinted background with left border accent

```html
<ui-notification heading="New update available." status="info" variant="subtle">
  Refresh the page to load the latest version.
</ui-notification>
```

## Description via default slot

Place description content in the default slot. Leave the slot empty for a heading-only notification:

```html
<!-- With description -->
<ui-notification heading="Upload complete." status="success">
  3 files were uploaded to your account.
</ui-notification>

<!-- Heading only -->
<ui-notification heading="Upload complete." status="success"></ui-notification>
```

## Without close button

```html
<ui-notification heading="Maintenance scheduled." status="info">
  The service will be unavailable on Sunday from 02:00 to 04:00 UTC.
</ui-notification>
```

`has-close-button` is `true` by default. Set the property to `false` or omit the attribute to hide the button:

```js
el.hasCloseButton = false;
```

## Events

| Event      | When                            | Detail |
| ---------- | ------------------------------- | ------ |
| `ui-close` | Close button is clicked by user | —      |

## Properties & attributes

| Property         | Attribute          | Type                                          | Default     | Description                                                                       |
| ---------------- | ------------------ | --------------------------------------------- | ----------- | --------------------------------------------------------------------------------- |
| `heading`        | `heading`          | `string`                                      | `''`        | **Required.** Main heading text.                                                  |
| `status`         | `status`           | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'`    | Colour scheme and status icon. Reflected.                                         |
| `variant`        | `variant`          | `'default' \| 'subtle'`                       | `'default'` | `default` = solid fill; `subtle` = tinted background with left border. Reflected. |
| `hasCloseButton` | `has-close-button` | `boolean`                                     | `true`      | Shows the × close button. Reflected.                                              |

## Accessibility notes

- `role="alert"` is on the inner container — screen readers announce it on insertion.
- The status icon is decorative (`aria-hidden="true"`). Status is communicated through heading text.
- The close button is a native `<button>` with `aria-label="Close notification"`.
- To show/hide the notification, add or remove it from the DOM, or toggle a container with `display: none`.
