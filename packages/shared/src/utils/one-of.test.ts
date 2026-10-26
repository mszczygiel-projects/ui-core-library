import { describe, expect, it } from 'vitest';

import { oneOf } from './one-of.ts';

describe('oneOf', () => {
  it('preserves a supported value', () => {
    expect(oneOf('large', ['small', 'large'], 'small')).toBe('large');
  });

  it.each(['other', null, undefined, 1, true, {}, []])('uses the fallback for %j', (value) => {
    expect(oneOf(value, ['small', 'large'], 'small')).toBe('small');
  });
});
