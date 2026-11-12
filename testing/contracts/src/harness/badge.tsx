import { Badge } from '@mszczygiel-projects/ui-core-react';

import { type BadgeContractProps, DOT_SIZE } from '../specs/badge.contract.ts';
import { iconElement, IconNode } from './icon.tsx';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

const DOT_STYLE = `display:block;inline-size:${String(DOT_SIZE)}px;block-size:${String(DOT_SIZE)}px;border-radius:50%;background:currentColor`;

/** A status dot as an author writes it: an empty element that it sizes and colours itself. */
function dotElement(slot: string): HTMLElement {
  const dot = document.createElement('span');
  dot.slot = slot;
  dot.dataset['contractDot'] = '';
  dot.setAttribute('style', DOT_STYLE);
  return dot;
}

/** Sets props as properties, the text as content and the flags as the leading and trailing slots. */
export const mountWebComponentBadge = webComponentMount<BadgeContractProps>(
  'ui-badge',
  (element, { children, leading, trailing, ...properties }) => {
    Object.assign(element, properties);
    if (children !== undefined) {
      for (const node of [...element.childNodes]) {
        if (!(node instanceof Element && node.slot !== '')) {
          node.remove();
        }
      }
      element.append(children);
    }
    if (leading !== undefined) {
      element.querySelector('[slot="leading"]')?.remove();
      if (leading) {
        element.prepend(iconElement('leading'));
      }
    }
    if (trailing !== undefined) {
      element.querySelector('[slot="trailing"]')?.remove();
      if (trailing) {
        element.append(dotElement('trailing'));
      }
    }
  },
);

/** The same content, expressed as React nodes instead of named slots. */
function ReactBadge({ leading, trailing, children, ...props }: BadgeContractProps) {
  return (
    <Badge
      {...props}
      leading={leading === true ? <IconNode /> : undefined}
      trailing={
        trailing === true ? (
          <span
            data-contract-dot=""
            style={{
              display: 'block',
              inlineSize: DOT_SIZE,
              blockSize: DOT_SIZE,
              borderRadius: '50%',
              background: 'currentColor',
            }}
          />
        ) : undefined
      }
    >
      {children === '' ? undefined : children}
    </Badge>
  );
}

export const mountReactBadge = reactMount(ReactBadge, 'ui-badge');
