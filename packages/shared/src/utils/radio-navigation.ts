/** The direction of the text around a radio group, which turns the horizontal arrow keys. */
export type TextDirection = 'ltr' | 'rtl';

const FORWARD: Readonly<Record<TextDirection, readonly string[]>> = {
  ltr: ['ArrowDown', 'ArrowRight'],
  rtl: ['ArrowDown', 'ArrowLeft'],
};

const BACKWARD: Readonly<Record<TextDirection, readonly string[]>> = {
  ltr: ['ArrowUp', 'ArrowLeft'],
  rtl: ['ArrowUp', 'ArrowRight'],
};

/**
 * The option that an arrow key moves to from the option at `current`, as in a native radio group:
 * down and the arrow in reading order go to the next enabled option, up and the other arrow to the
 * previous one, wrapping around the ends. Returns undefined for any other key, or when no other
 * option is enabled.
 */
export function nextRadio(
  key: string,
  current: number,
  enabled: readonly boolean[],
  direction: TextDirection,
): number | undefined {
  const step = FORWARD[direction].includes(key) ? 1 : BACKWARD[direction].includes(key) ? -1 : 0;
  if (step === 0) {
    return undefined;
  }
  const count = enabled.length;
  for (let offset = 1; offset < count; offset++) {
    const index = (((current + step * offset) % count) + count) % count;
    if (enabled[index] === true) {
      return index;
    }
  }
  return undefined;
}
