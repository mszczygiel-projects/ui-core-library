# @mszczygiel-projects/ui-core-react

The React components of UI Core Library, safe for server rendering. Import the components from the root and their styles once:

```ts
import { Button } from '@mszczygiel-projects/ui-core-react';
import '@mszczygiel-projects/ui-core-react/styles.css';
```

| Component      | Export           |
| -------------- | ---------------- |
| Badge          | `Badge`          |
| Breadcrumbs    | `Breadcrumbs`    |
| Button         | `Button`         |
| Calendar       | `Calendar`       |
| CheckboxField  | `CheckboxField`  |
| Chip           | `Chip`           |
| Combobox       | `Combobox`       |
| DateField      | `DateField`      |
| Dialog         | `Dialog`         |
| Drawer         | `Drawer`         |
| FileInputField | `FileInputField` |
| IconButton     | `IconButton`     |
| LinkButton     | `LinkButton`     |
| Listbox        | `Listbox`        |
| Loader         | `Loader`         |
| Menu           | `Menu`           |
| Notification   | `Notification`   |
| NumberField    | `NumberField`    |
| Pagination     | `Pagination`     |
| PasswordField  | `PasswordField`  |
| Popover        | `Popover`        |
| RadioField     | `RadioField`     |
| RadioGroup     | `RadioGroup`     |
| SearchField    | `SearchField`    |
| SelectField    | `SelectField`    |
| SplitButton    | `SplitButton`    |
| SwitchField    | `SwitchField`    |
| TextField      | `TextField`      |
| TextareaField  | `TextareaField`  |
| Tooltip        | `Tooltip`        |

The components read the tokens of `@mszczygiel-projects/ui-core-foundations`, which a page loads once. `react` and `react-dom` 19 are peer dependencies. The Storybook site documents each component.
