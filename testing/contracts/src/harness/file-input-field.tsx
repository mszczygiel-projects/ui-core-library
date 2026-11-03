import { FileInputField } from '@mszczygiel-projects/ui-core-react';

import type { FileInputFieldContractProps } from '../specs/file-input-field.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/**
 * Sets props as properties, the initial files as the defaultValue property, and maps the callbacks
 * to the events, as a page would.
 */
export const mountWebComponentFileInputField = webComponentMount<FileInputFieldContractProps>(
  'ui-file-input-field',
  (element, { defaultValue, onValueChange, onReject, ...properties }) => {
    Object.assign(element, properties);
    if (defaultValue !== undefined) {
      Object.assign(element, { defaultValue });
    }
    if (onValueChange) {
      element.addEventListener('ui-value-change', (event) => {
        // The global event map types ui-value-change after TextField, so the detail is narrowed here.
        const { detail } = event as unknown as CustomEvent<
          Parameters<typeof onValueChange>[1] & { value: readonly File[] }
        >;
        const { value, ...details } = detail;
        onValueChange(value, details);
      });
    }
    if (onReject) {
      element.addEventListener('ui-reject', (event) => {
        const { detail } = event as CustomEvent<
          Parameters<typeof onReject>[1] & { rejections: Parameters<typeof onReject>[0] }
        >;
        const { rejections, ...details } = detail;
        onReject(rejections, details);
      });
    }
  },
);

export const mountReactFileInputField = reactMount(FileInputField, 'ui-file-input-field');
