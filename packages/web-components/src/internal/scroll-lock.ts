import {
  lockScroll,
  type ScrollLockStyles,
  unlockScroll,
} from '@mszczygiel-projects/ui-core-shared/scroll-lock';

/**
 * Stops the page behind a modal from scrolling. The page keeps its width: the padding at the end
 * of the root grows by the width of the scrollbar that the lock hides.
 */
export function lockPage(owner: object): void {
  lockScroll(owner, () => {
    const root = document.documentElement;
    const saved: ScrollLockStyles = {
      overflow: root.style.overflow,
      'padding-inline-end': root.style.paddingInlineEnd,
    };
    const scrollbar = window.innerWidth - root.clientWidth;
    if (scrollbar > 0) {
      const padding = Number.parseFloat(getComputedStyle(root).paddingInlineEnd) || 0;
      root.style.paddingInlineEnd = `${String(padding + scrollbar)}px`;
    }
    root.style.overflow = 'hidden';
    return saved;
  });
}

/** Releases the lock of a modal; the last release restores the styles of the page. */
export function unlockPage(owner: object): void {
  unlockScroll(owner, (saved) => {
    const root = document.documentElement;
    for (const [property, value] of Object.entries(saved)) {
      root.style.setProperty(property, value);
    }
  });
}
