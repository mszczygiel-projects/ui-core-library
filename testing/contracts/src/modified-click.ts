/** The keys that make a click on a link open it somewhere else, or download it. */
export const MODIFIERS = ['metaKey', 'ctrlKey', 'shiftKey', 'altKey'] as const;

/**
 * Clicks an element with a modifier key held, and says whether anything on the way to the window
 * canceled the click. The helper then cancels it itself, so that the test opens no tab.
 */
export function modifiedClick(element: Element, modifier: (typeof MODIFIERS)[number]): boolean {
  let canceled: boolean | undefined;
  const stop = (event: Event) => {
    canceled = event.defaultPrevented;
    event.preventDefault();
  };
  window.addEventListener('click', stop);
  element.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      composed: true,
      cancelable: true,
      [modifier]: true,
    }),
  );
  window.removeEventListener('click', stop);
  if (canceled === undefined) {
    throw new Error('The click did not reach the window.');
  }
  return canceled;
}
