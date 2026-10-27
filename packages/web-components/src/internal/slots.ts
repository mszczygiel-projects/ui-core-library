/**
 * Whether the slot of a `slotchange` event has content, so that a component hides the wrapper of
 * an empty slot, such as an icon that the page did not supply.
 */
export function hasAssignedContent(event: Event): boolean {
  const slot = event.target;
  return slot instanceof HTMLSlotElement && slot.assignedNodes({ flatten: true }).length > 0;
}

/**
 * Whether the slot of a `slotchange` event has content that a reader sees: an element or text
 * that is not only white space, so that the markup around a slotted icon does not count as text.
 */
export function hasAssignedText(event: Event): boolean {
  const slot = event.target;
  return (
    slot instanceof HTMLSlotElement &&
    slot
      .assignedNodes({ flatten: true })
      .some((node) => node instanceof Element || (node.textContent ?? '').trim() !== '')
  );
}
