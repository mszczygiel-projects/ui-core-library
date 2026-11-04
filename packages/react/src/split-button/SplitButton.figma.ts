// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=3203-984
// source=packages/react/src/split-button/SplitButton.tsx
// component=SplitButton
import figma from 'figma';

const instance = figma.selectedInstance;
const variant = instance.getEnum('variant', {
  primary: 'primary',
  secondary: 'secondary',
  outline: 'outline',
  ghost: 'ghost',
  danger: 'danger',
});
const size = instance.getEnum('size', { small: 'small', medium: 'medium', large: 'large' });
const open = instance.getEnum('open', { false: 'false', true: 'true' }) === 'true';
// Each variant holds an exposed Button, named action, whose label designers set.
const nested = instance.findInstance('action');
const children = nested.type === 'INSTANCE' ? nested.getString('children') : '…';

// The actions of the menu are sample content; the page supplies its own.
export default {
  example: figma.code`<SplitButton${variant === 'primary' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${open ? ' defaultOpen' : ''}
  options={[{ value: '…', label: '…' }]}
  onAction={(value) => {}}
>{${JSON.stringify(children)}}</SplitButton>`,
  imports: ['import { SplitButton } from "@mszczygiel-projects/ui-core-react"'],
  id: 'split-button',
  metadata: { nestable: true },
};
