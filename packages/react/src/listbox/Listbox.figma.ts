// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=3031-560
// source=packages/react/src/listbox/Listbox.tsx
// component=Listbox
import figma from 'figma';

const instance = figma.selectedInstance;
const multiple = instance.getEnum('multiple', { false: 'false', true: 'true' }) === 'true';
const state = instance.getEnum('state', { default: 'default', error: 'error' });
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const label = instance.getString('label');
const hint = instance.getBoolean('showHint') ? instance.getString('hint') : undefined;

// The options are data, which the design only shows; the snippet names the array they come from.
export default {
  example: figma.code`<Listbox${label ? figma.code` label={${JSON.stringify(label)}}` : ''}${hint ? figma.code` hint={${JSON.stringify(hint)}}` : ''}${multiple ? ' multiple' : ''}${state === 'default' ? '' : figma.code` state="${state}"`}${disabled ? ' disabled' : ''} options={options} />`,
  imports: ['import { Listbox } from "@mszczygiel-projects/ui-core-react"'],
  id: 'listbox',
  metadata: { nestable: true },
};
