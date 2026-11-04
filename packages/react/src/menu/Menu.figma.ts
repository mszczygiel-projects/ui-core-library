// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=3202-130
// source=packages/react/src/menu/Menu.tsx
// component=Menu
import figma from 'figma';

const instance = figma.selectedInstance;
const size = instance.getEnum('size', { small: 'small', medium: 'medium', large: 'large' });

// The actions of the set are sample content; the page supplies its own.
export default {
  example: figma.code`<Menu${size === 'medium' ? '' : figma.code` size="${size}"`}
  trigger={<Button>…</Button>}
  options={[{ value: '…', label: '…' }]}
  onAction={(value) => {}}
/>`,
  imports: ['import { Button, Menu } from "@mszczygiel-projects/ui-core-react"'],
  id: 'menu',
  metadata: { nestable: false },
};
