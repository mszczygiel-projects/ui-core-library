import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { setRef } from './set-ref.ts';

describe('setRef', () => {
  it('sets an object ref and clears it', () => {
    const ref = createRef<string>();
    const release = setRef(ref, 'button');
    expect(ref.current).toBe('button');
    release();
    expect(ref.current).toBeNull();
  });

  it('calls a callback ref with the value, and with null on release', () => {
    const ref = vi.fn();
    const release = setRef(ref, 'button');
    expect(ref).toHaveBeenLastCalledWith('button');
    release();
    expect(ref).toHaveBeenLastCalledWith(null);
  });

  it('releases a callback ref through the cleanup it returns', () => {
    const cleanup = vi.fn();
    const ref = vi.fn(() => cleanup);
    setRef(ref, 'button')();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(ref).toHaveBeenCalledOnce();
  });

  it('accepts a missing ref', () => {
    expect(() => {
      setRef(undefined, 'button')();
    }).not.toThrow();
  });
});
