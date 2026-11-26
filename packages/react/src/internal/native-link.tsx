'use client';

import type { ComponentPropsWithRef } from 'react';

import { useActionRef } from './action.ts';

/**
 * The native link of LinkButton, which cancels a click while it is disabled. The hook behind that
 * lives here, so that LinkButton itself stays free to run in a server component.
 */
export function NativeLink({ ref, children, ...props }: ComponentPropsWithRef<'a'>) {
  const attachLink = useActionRef(ref);
  return (
    <a ref={attachLink} {...props}>
      {children}
    </a>
  );
}
