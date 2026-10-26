import type { Ref } from 'react';

/**
 * Gives an element to a ref of either kind and returns the function that takes it back, so that a
 * component can use its own element and still pass it to the ref of its consumer.
 */
export function setRef<T>(ref: Ref<T> | undefined, value: T): () => void {
  if (typeof ref === 'function') {
    const cleanup = ref(value);
    return typeof cleanup === 'function'
      ? cleanup
      : () => {
          ref(null);
        };
  }
  if (ref !== null && ref !== undefined) {
    ref.current = value;
    return () => {
      ref.current = null;
    };
  }
  return () => undefined;
}
