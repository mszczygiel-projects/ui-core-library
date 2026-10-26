import type { ReactNode } from 'react';

/** Whether React renders anything for a node; `condition && <Icon />` gives `false`. */
export function rendersContent(node: ReactNode): boolean {
  return node !== undefined && node !== null && typeof node !== 'boolean' && node !== '';
}
