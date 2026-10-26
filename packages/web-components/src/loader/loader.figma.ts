// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=103-773
// source=packages/web-components/src/loader/loader.tsx
// component=ui-loader
import figma from 'figma';

const instance = figma.selectedInstance;
const size = instance.getEnum('size', {
  small: 'small',
  medium: 'medium',
  large: 'large',
});

export default {
  example: figma.code`<ui-loader${size === 'medium' ? '' : figma.code` size="${size}"`}></ui-loader>`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/loader'"],
  id: 'ui-loader',
  metadata: { nestable: true },
};
