# @mszczygiel-projects/ui-core-react

The React components of UI Core Library, safe for server rendering. Import the components from the root and their styles once:

```ts
import { Button } from '@mszczygiel-projects/ui-core-react';
import '@mszczygiel-projects/ui-core-react/styles.css';
```

| Component      | Export           |
| -------------- | ---------------- |
| Accordion      | `Accordion`      |
| AccordionItem  | `AccordionItem`  |
| Badge          | `Badge`          |
| Breadcrumbs    | `Breadcrumbs`    |
| Button         | `Button`         |
| Calendar       | `Calendar`       |
| CheckboxField  | `CheckboxField`  |
| Chip           | `Chip`           |
| Combobox       | `Combobox`       |
| DateField      | `DateField`      |
| DateTimeField  | `DateTimeField`  |
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
| Tab            | `Tab`            |
| Tabs           | `Tabs`           |
| TextField      | `TextField`      |
| TextareaField  | `TextareaField`  |
| TimeField      | `TimeField`      |
| Tooltip        | `Tooltip`        |

The components read the tokens of `@mszczygiel-projects/ui-core-foundations`, which a page loads once. `react` and `react-dom` 19 are peer dependencies. The documentation site documents [the components](https://mszczygiel-projects.github.io/ui-core-library/?path=/docs/components-status--docs), one page each. [Getting started](https://mszczygiel-projects.github.io/ui-core-library/?path=/docs/guides-getting-started--docs) renders the first one, and [Configuration](https://mszczygiel-projects.github.io/ui-core-library/?path=/docs/guides-configuration--docs) translates the texts they render.
