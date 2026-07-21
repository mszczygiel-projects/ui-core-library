import { useCallback, useEffect, useRef } from 'react';

/** Delay before a held stepper starts repeating. The first tick already fired on press. */
const INITIAL_DELAY_MS = 500;
/** Fixed cadence once repeating — no acceleration curve. */
const REPEAT_INTERVAL_MS = 100;

/**
 * Drives press-and-hold repetition for the stepper buttons.
 *
 * `onTick` performs one step and reports whether the value actually moved;
 * returning `false` (the value hit `min`/`max`) stops the repeat immediately,
 * so holding past a bound behaves like the discrete-click case.
 */
export function useHoldRepeat(onTick: () => boolean) {
  const timeoutRef = useRef<number | undefined>(undefined);
  const intervalRef = useRef<number | undefined>(undefined);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  const stop = useCallback(() => {
    if (timeoutRef.current !== undefined) window.clearTimeout(timeoutRef.current);
    if (intervalRef.current !== undefined) window.clearInterval(intervalRef.current);
    timeoutRef.current = undefined;
    intervalRef.current = undefined;
    // Release may land outside the button, so the listeners live on the window.
    window.removeEventListener('pointerup', stop);
    window.removeEventListener('pointercancel', stop);
  }, []);

  const start = useCallback(() => {
    stop();
    if (!onTickRef.current()) return;
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    timeoutRef.current = window.setTimeout(() => {
      intervalRef.current = window.setInterval(() => {
        if (!onTickRef.current()) stop();
      }, REPEAT_INTERVAL_MS);
    }, INITIAL_DELAY_MS);
  }, [stop]);

  // Unmounting mid-hold must not leave a live timer behind.
  useEffect(() => stop, [stop]);

  return { start, stop };
}
