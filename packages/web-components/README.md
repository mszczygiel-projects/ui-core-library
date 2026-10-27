# @mszczygiel-projects/ui-core-web-components

The web components of UI Core Library, for any framework or none. Each component has a subpath that defines its tag, and the root defines them all:

```ts
import '@mszczygiel-projects/ui-core-web-components/button';
```

| Component    | Tag               | Subpath          |
| ------------ | ----------------- | ---------------- |
| Badge        | `ui-badge`        | `./badge`        |
| Button       | `ui-button`       | `./button`       |
| Chip         | `ui-chip`         | `./chip`         |
| IconButton   | `ui-icon-button`  | `./icon-button`  |
| LinkButton   | `ui-link-button`  | `./link-button`  |
| Loader       | `ui-loader`       | `./loader`       |
| Notification | `ui-notification` | `./notification` |
| TextField    | `ui-text-field`   | `./text-field`   |

The components read the tokens of `@mszczygiel-projects/ui-core-foundations`, which a page loads once. `custom-elements.json` describes their API. The Storybook site documents each component.
