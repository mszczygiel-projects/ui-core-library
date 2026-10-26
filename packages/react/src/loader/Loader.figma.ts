// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=103-773
// source=packages/react/src/loader/Loader.tsx
// component=Loader
import figma from 'figma';

const instance = figma.selectedInstance;
const size = instance.getEnum('size', {
  small: 'small',
  medium: 'medium',
  large: 'large',
});

export default {
  example: figma.code`<Loader${size === 'medium' ? '' : figma.code` size="${size}"`} />`,
  imports: ['import { Loader } from "@mszczygiel-projects/ui-core-react"'],
  id: 'loader',
  metadata: { nestable: true },
};
