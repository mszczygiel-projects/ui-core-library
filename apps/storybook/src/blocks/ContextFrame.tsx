import type { ReactNode } from 'react';

import type { Context } from '../tokens.ts';

/**
 * Renders its content in a context of its own, whatever the toolbars choose: the attributes are
 * the ones an application sets, so the preview is what the stylesheet really does there. The
 * theme and the surface go on two elements, as they must in an application: on one element the
 * roles of the surface and their copies per theme point at each other, and the browser drops
 * them.
 */
export function ContextFrame({
  context,
  className = 'sb-frame',
  children,
}: {
  readonly context: Context;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <div data-theme={context.theme}>
      <div className={className} data-surface={context.surface} data-density={context.density}>
        {children}
      </div>
    </div>
  );
}
