import manifest from '@mszczygiel-projects/ui-core-foundations/tokens.json' with { type: 'json' };

import type { MountOptions } from './harness/types.ts';

/** The modes of a frame that decide the value of a token. */
export type TokenContext = Pick<MountOptions, 'theme' | 'surface' | 'density'>;

/**
 * The value of a token in the modes of a frame, from the manifest that the build writes, so that a
 * contract compares what the user sees with the token rather than with a copied number.
 */
function manifestValue(name: string, options: TokenContext = {}) {
  const token = manifest.tokens.find((candidate) => candidate.name === name);
  const context = {
    theme: options.theme ?? 'light',
    surface: options.surface ?? 'default',
    density: options.density ?? 'comfortable',
  };
  const value = token?.values.find((candidate) =>
    Object.entries(candidate.context).every(
      ([axis, expected]) => Reflect.get(context, axis) === expected,
    ),
  );
  if (value === undefined) {
    throw new Error(`The manifest has no ${name} for ${JSON.stringify(context)}`);
  }
  return value;
}

/** A length of the manifest in CSS pixels, a rem resolved against the root font size. */
export function pixels(value: string): number {
  return (
    Number.parseFloat(value) *
    (value.endsWith('rem')
      ? Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
      : 1)
  );
}

/** The resolved CSS value in the chosen context. */
export function tokenValue(name: string, options: TokenContext = {}): string {
  return manifestValue(name, options).value;
}

/** The Figma number before CSS unit conversion. */
export function tokenNumber(name: string, options: TokenContext = {}): number {
  const raw = manifestValue(name, options).raw;
  if (typeof raw !== 'number') {
    throw new Error(`${name} is not a numeric token`);
  }
  return raw;
}
