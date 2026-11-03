// url=https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2409-3222
// source=packages/react/src/file-input-field/FileInputField.tsx
// component=FileInputField
import figma from 'figma';
const instance = figma.selectedInstance;
const variant = instance.getEnum('variant', { outline: 'outline', filled: 'filled' });
const size = instance.getEnum('size', { small: 'small', medium: 'medium', large: 'large' });
const state = instance.getEnum('state', { default: 'default', error: 'error', success: 'success' });
const disabled = instance.getEnum('disabled', { false: 'false', true: 'true' }) === 'true';
const label = instance.getString('label');
const hint = instance.getBoolean('showHint') ? instance.getString('hint') : undefined;
// The English default of labels.fileInputField.prompt, which the snippet leaves to the configuration.
const prompt = instance.getString('promptLabel');
const promptLabel = prompt === 'Drag files here or browse' ? undefined : prompt;
// interaction (rest, active, focus, dragover) and valueState (empty, preview, list) preview states
// that code derives from the browser and the value. Neither becomes a prop.
export default {
  example: figma.code`<FileInputField${variant === 'outline' ? '' : figma.code` variant="${variant}"`}${size === 'medium' ? '' : figma.code` size="${size}"`}${state === 'default' ? '' : figma.code` state="${state}"`}${label ? figma.code` label={${JSON.stringify(label)}}` : ''}${hint ? figma.code` hint={${JSON.stringify(hint)}}` : ''}${promptLabel ? figma.code` promptLabel={${JSON.stringify(promptLabel)}}` : ''}${disabled ? ' disabled' : ''} />`,
  imports: ['import { FileInputField } from "@mszczygiel-projects/ui-core-react"'],
  id: 'file-input-field',
  metadata: { nestable: true },
};
