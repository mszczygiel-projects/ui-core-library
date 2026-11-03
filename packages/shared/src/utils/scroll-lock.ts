/**
 * The inline styles that a lock replaced, by property name, so that the last release can put them
 * back exactly.
 */
export type ScrollLockStyles = Readonly<Record<string, string>>;

/** Who holds the lock, and what the first of them replaced. */
interface ScrollLockState {
  readonly owners: Set<object>;
  saved: ScrollLockStyles | undefined;
}

const STATE_KEY = Symbol.for('ui-core.scroll-lock');

type Holder = typeof globalThis & { [STATE_KEY]?: ScrollLockState };

/**
 * One state for the page: a dialog of the web components and a drawer of React, or two copies of
 * a package, lock the same page, so they must count their locks together.
 */
function sharedState(): ScrollLockState {
  const holder = globalThis as Holder;
  holder[STATE_KEY] ??= { owners: new Set(), saved: undefined };
  return holder[STATE_KEY];
}

/**
 * Stops the page from scrolling for `owner`, such as an open dialog. Only the first owner calls
 * `apply`, which locks the page and returns the inline styles it replaced. A second call for the
 * same owner changes nothing.
 */
export function lockScroll(owner: object, apply: () => ScrollLockStyles): void {
  const state = sharedState();
  if (state.owners.has(owner)) {
    return;
  }
  if (state.owners.size === 0) {
    state.saved = apply();
  }
  state.owners.add(owner);
}

/**
 * Releases the lock of `owner`. Only the release of the last owner calls `restore` with the styles
 * that the first one replaced, whichever package locked the page. Releasing an owner without a
 * lock changes nothing.
 */
export function unlockScroll(owner: object, restore: (saved: ScrollLockStyles) => void): void {
  const state = sharedState();
  if (!state.owners.delete(owner) || state.owners.size > 0) {
    return;
  }
  const saved = state.saved ?? {};
  state.saved = undefined;
  restore(saved);
}

/** Whether any owner holds the lock. */
export function isScrollLocked(): boolean {
  return sharedState().owners.size > 0;
}
