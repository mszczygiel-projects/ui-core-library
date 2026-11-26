/** The modifier keys of a click, as a native mouse event reports them. */
export interface ClickModifiers {
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
}

/**
 * Whether a click on a link asks the browser to open it somewhere else, in a new tab or window, or
 * to download it. A component leaves such a click to the browser and reports no move, so that a
 * page that cancels the event to route on its own does not take it over.
 */
export function isModifiedClick({ metaKey, ctrlKey, shiftKey, altKey }: ClickModifiers): boolean {
  return metaKey || ctrlKey || shiftKey || altKey;
}
