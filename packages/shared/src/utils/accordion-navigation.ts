/**
 * The heading that a key moves the focus to from the heading at `current` in an accordion: Arrow
 * Down and Arrow Up go to the next and previous enabled heading and wrap at the ends, Home and End
 * go to the first and last enabled one. The headings stack vertically in every direction of text,
 * so no key depends on it. Returns undefined for any other key, or when no heading would take the
 * focus.
 */
export function nextAccordionHeading(
  key: string,
  current: number,
  enabled: readonly boolean[],
): number | undefined {
  const count = enabled.length;
  switch (key) {
    case 'Home':
      return firstFrom(enabled, 0, 1);
    case 'End':
      return firstFrom(enabled, count - 1, -1);
    case 'ArrowDown':
    case 'ArrowUp': {
      const step = key === 'ArrowDown' ? 1 : -1;
      for (let offset = 1; offset < count; offset++) {
        const index = (((current + step * offset) % count) + count) % count;
        if (enabled[index] === true) {
          return index;
        }
      }
      return undefined;
    }
    default:
      return undefined;
  }
}

function firstFrom(enabled: readonly boolean[], start: number, step: 1 | -1): number | undefined {
  for (let index = start; index >= 0 && index < enabled.length; index += step) {
    if (enabled[index] === true) {
      return index;
    }
  }
  return undefined;
}
