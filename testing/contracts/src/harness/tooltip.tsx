import { Button, Tooltip } from '@mszczygiel-projects/ui-core-react';

import type { TooltipContractProps } from '../specs/tooltip.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** Sets props as properties, and the trigger as the child, as a page would. */
export const mountWebComponentTooltip = webComponentMount<TooltipContractProps>(
  'ui-tooltip',
  (element, { trigger, ...properties }) => {
    Object.assign(element, properties);
    if (element.querySelector(':scope > :not([slot])') === null) {
      const button = document.createElement(trigger === 'native' ? 'button' : 'ui-button');
      button.textContent = 'Copy';
      element.prepend(button);
    }
  },
);

function TooltipWithTrigger({ trigger, ...props }: TooltipContractProps) {
  return (
    <Tooltip {...props}>
      {trigger === 'native' ? <button type="button">Copy</button> : <Button>Copy</Button>}
    </Tooltip>
  );
}

export const mountReactTooltip = reactMount(TooltipWithTrigger, 'ui-tooltip');
