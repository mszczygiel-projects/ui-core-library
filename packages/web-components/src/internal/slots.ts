/**
 * Whether the slot of a `slotchange` event has content, so that a component hides the wrapper of
 * an empty slot, such as an icon that the page did not supply.
 */
export function hasAssignedContent(event: Event): boolean {
  const slot = event.target;
  return slot instanceof HTMLSlotElement && slot.assignedNodes({ flatten: true }).length > 0;
}
