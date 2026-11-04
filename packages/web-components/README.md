# @mszczygiel-projects/ui-core-web-components

The web components of UI Core Library, for any framework or none. Each component has a subpath that defines its tag, and the root defines them all:

```ts
import '@mszczygiel-projects/ui-core-web-components/button';
```

| Component      | Tag                   | Subpath              |
| -------------- | --------------------- | -------------------- |
| Accordion      | `ui-accordion`        | `./accordion`        |
| AccordionItem  | `ui-accordion-item`   | `./accordion-item`   |
| Badge          | `ui-badge`            | `./badge`            |
| Breadcrumbs    | `ui-breadcrumbs`      | `./breadcrumbs`      |
| Button         | `ui-button`           | `./button`           |
| Calendar       | `ui-calendar`         | `./calendar`         |
| CheckboxField  | `ui-checkbox-field`   | `./checkbox-field`   |
| Chip           | `ui-chip`             | `./chip`             |
| Combobox       | `ui-combobox`         | `./combobox`         |
| DateField      | `ui-date-field`       | `./date-field`       |
| Dialog         | `ui-dialog`           | `./dialog`           |
| Drawer         | `ui-drawer`           | `./drawer`           |
| FileInputField | `ui-file-input-field` | `./file-input-field` |
| IconButton     | `ui-icon-button`      | `./icon-button`      |
| LinkButton     | `ui-link-button`      | `./link-button`      |
| Listbox        | `ui-listbox`          | `./listbox`          |
| Loader         | `ui-loader`           | `./loader`           |
| Menu           | `ui-menu`             | `./menu`             |
| Notification   | `ui-notification`     | `./notification`     |
| NumberField    | `ui-number-field`     | `./number-field`     |
| Pagination     | `ui-pagination`       | `./pagination`       |
| PasswordField  | `ui-password-field`   | `./password-field`   |
| Popover        | `ui-popover`          | `./popover`          |
| RadioField     | `ui-radio-field`      | `./radio-field`      |
| RadioGroup     | `ui-radio-group`      | `./radio-group`      |
| SearchField    | `ui-search-field`     | `./search-field`     |
| SelectField    | `ui-select-field`     | `./select-field`     |
| SplitButton    | `ui-split-button`     | `./split-button`     |
| SwitchField    | `ui-switch-field`     | `./switch-field`     |
| Tab            | `ui-tab`              | `./tab`              |
| Tabs           | `ui-tabs`             | `./tabs`             |
| TextField      | `ui-text-field`       | `./text-field`       |
| TextareaField  | `ui-textarea-field`   | `./textarea-field`   |
| Tooltip        | `ui-tooltip`          | `./tooltip`          |

The components read the tokens of `@mszczygiel-projects/ui-core-foundations`, which a page loads once. `custom-elements.json` describes their API. The Storybook site documents each component.
