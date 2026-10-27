# @mszczygiel-projects/ui-core-react

The React components of UI Core Library, safe for server rendering. Import the components from the root and their styles once:

```ts
import { Button } from '@mszczygiel-projects/ui-core-react';
import '@mszczygiel-projects/ui-core-react/styles.css';
```

| Component  | Export       |
| ---------- | ------------ |
| Button     | `Button`     |
| IconButton | `IconButton` |
| LinkButton | `LinkButton` |
| Loader     | `Loader`     |
| TextField  | `TextField`  |

The components read the tokens of `@mszczygiel-projects/ui-core-foundations`, which a page loads once. `react` and `react-dom` 19 are peer dependencies. The Storybook site documents each component.
