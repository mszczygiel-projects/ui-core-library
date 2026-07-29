import type { AriaAttributes } from 'react';

/**
 * Runtime companion to the `extends AriaAttributes` passthrough pattern used by
 * interactive components: keeps only `aria-*` keys from a rest-props object, so
 * untyped call sites can never leak arbitrary DOM props through a component's
 * otherwise closed interface.
 */
export function pickAriaProps(props: AriaAttributes): AriaAttributes {
  const aria: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('aria-') && value !== undefined) aria[key] = value;
  }
  return aria as AriaAttributes;
}
