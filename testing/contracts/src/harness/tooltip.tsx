import { Button, Tooltip } from '@mszczygiel-projects/ui-core-react';

import type { TooltipContractProps } from '../specs/tooltip.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** Sets props as properties, and the trigger as the child, as a page would. */
export const mountWebComponentTooltip = webComponentMount<TooltipContractProps>(
  'ui-tooltip',
  (element, { trigger, hint, ...properties }) => {
    Object.assign(element, properties);
    if (element.querySelector(':scope > :not([slot])') === null) {
      const button = document.createElement(trigger === 'native' ? 'button' : 'ui-button');
      button.textContent = 'Copy';
      if (hint !== undefined) {
        button.setAttribute('aria-describedby', hint);
      }
      element.prepend(button);
    }
  },
);

function TooltipWithTrigger({ trigger, hint, ...props }: TooltipContractProps) {
  return (
    <Tooltip {...props}>
      {trigger === 'native' ? (
        <button type="button" aria-describedby={hint}>
          Copy
        </button>
      ) : (
        <Button aria-describedby={hint}>Copy</Button>
      )}
    </Tooltip>
  );
}

export const mountReactTooltip = reactMount(TooltipWithTrigger, 'ui-tooltip');
