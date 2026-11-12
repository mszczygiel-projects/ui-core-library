// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=3203-984
// source=packages/web-components/src/split-button/split-button.tsx
// component=ui-split-button
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
const shape = instance.getEnum('shape', { square: 'square', rounded: 'rounded' });
const open = instance.getEnum('open', { false: 'false', true: 'true' }) === 'true';
// Each variant holds an exposed Button, named action, whose label designers set.
const nested = instance.findInstance('action');
const children = nested.type === 'INSTANCE' ? nested.getString('children') : '…';

// The actions of the menu are sample content; the page sets the options property.
export default {
  example: figma.code`<ui-split-button${variant === 'primary' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${shape === 'square' ? '' : figma.code` shape="${shape}"`}${open ? ' open' : ''}>${children}</ui-split-button>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/split-button'"],
  id: 'ui-split-button',
  metadata: { nestable: true },
};
