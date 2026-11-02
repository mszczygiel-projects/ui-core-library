# @mszczygiel-projects/ui-core-web-components

The web components of UI Core Library, for any framework or none. Each component has a subpath that defines its tag, and the root defines them all:

```ts
import '@mszczygiel-projects/ui-core-web-components/button';
```

| Component     | Tag                 | Subpath            |
| ------------- | ------------------- | ------------------ |
| Badge         | `ui-badge`          | `./badge`          |
| Button        | `ui-button`         | `./button`         |
| CheckboxField | `ui-checkbox-field` | `./checkbox-field` |
| Chip          | `ui-chip`           | `./chip`           |
| DateField     | `ui-date-field`     | `./date-field`     |
| IconButton    | `ui-icon-button`    | `./icon-button`    |
| LinkButton    | `ui-link-button`    | `./link-button`    |
| Listbox       | `ui-listbox`        | `./listbox`        |
| Loader        | `ui-loader`         | `./loader`         |
| Notification  | `ui-notification`   | `./notification`   |
| NumberField   | `ui-number-field`   | `./number-field`   |
| PasswordField | `ui-password-field` | `./password-field` |
| RadioField    | `ui-radio-field`    | `./radio-field`    |
| RadioGroup    | `ui-radio-group`    | `./radio-group`    |
| SearchField   | `ui-search-field`   | `./search-field`   |
| SelectField   | `ui-select-field`   | `./select-field`   |
| SwitchField   | `ui-switch-field`   | `./switch-field`   |
| TextField     | `ui-text-field`     | `./text-field`     |
| TextareaField | `ui-textarea-field` | `./textarea-field` |

The components read the tokens of `@mszczygiel-projects/ui-core-foundations`, which a page loads once. `custom-elements.json` describes their API. The Storybook site documents each component.
