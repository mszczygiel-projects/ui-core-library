import type { OverlayContractProps } from '../specs/overlay.contract.ts';

/** Turns `ui-open-change` into the callback, and a refusal into a cancelled event. */
export function listenToOpenChange(
  element: HTMLElement,
  onOpenChange: OverlayContractProps['onOpenChange'],
): void {
  if (onOpenChange === undefined) {
    return;
  }
  element.addEventListener('ui-open-change', (event) => {
    // The same event of a SelectField inside the modal bubbles through it.
    if (event.target !== element) {
      return;
    }
    const { detail } = event as CustomEvent<
      Parameters<NonNullable<OverlayContractProps['onOpenChange']>>[1] & { value: boolean }
    >;
    const { value, ...details } = detail;
    if (onOpenChange(value, details) === false) {
      event.preventDefault();
    }
  });
}
