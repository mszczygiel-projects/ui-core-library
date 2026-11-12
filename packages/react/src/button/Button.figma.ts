// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=179-100
// source=packages/react/src/button/Button.tsx
// component=Button
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
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const loading = instance.getEnum('loading', { false: 'false', true: 'true' }) === 'true';
const children = instance.getString('children');
const leadingIcon = instance.getInstanceSwap('leadingIcon');
const trailingIcon = instance.getInstanceSwap('trailingIcon');
const leading =
  instance.getBoolean('showLeadingIcon') && leadingIcon?.type === 'INSTANCE'
    ? leadingIcon.executeTemplate().example
    : undefined;
const trailing =
  instance.getBoolean('showTrailingIcon') && trailingIcon?.type === 'INSTANCE'
    ? trailingIcon.executeTemplate().example
    : undefined;

// Interaction previews browser states; it is not a component prop.
export default {
  example: figma.code`<Button${variant === 'primary' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${shape === 'square' ? '' : figma.code` shape="${shape}"`}${disabled ? ' disabled' : ''}${loading ? ' loading' : ''}${leading ? figma.code` leadingIcon={${leading}}` : ''}${trailing ? figma.code` trailingIcon={${trailing}}` : ''}>{${JSON.stringify(children)}}</Button>`,
  imports: ['import { Button } from "@mszczygiel-projects/ui-core-react"'],
  id: 'button',
  metadata: { nestable: true },
};
