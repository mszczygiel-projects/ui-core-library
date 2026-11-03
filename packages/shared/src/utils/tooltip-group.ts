/**
 * The tooltips of a page show one at a time, and once one has shown, the next one opens at once,
 * so that a pointer moving along a toolbar reads each of them without waiting again.
 */
interface TooltipGroupState {
  /** The tooltip that is shown, and how to hide it. */
  current: { readonly owner: object; readonly hide: () => void } | undefined;
  /** When the last tooltip hid, in the milliseconds of the caller's clock. */
  hiddenAt: number;
}

const STATE_KEY = Symbol.for('ui-core.tooltip');

type Holder = typeof globalThis & { [STATE_KEY]?: TooltipGroupState };

/** One state for the page, which the tooltips of both packages and of every copy share. */
function sharedState(): TooltipGroupState {
  const holder = globalThis as Holder;
  holder[STATE_KEY] ??= { current: undefined, hiddenAt: Number.NEGATIVE_INFINITY };
  return holder[STATE_KEY];
}

/**
 * Whether a tooltip that the pointer asks for at `now` opens at once: another one is shown, or
 * one hid less than `window` milliseconds ago.
 */
export function opensAtOnce(now: number, window: number): boolean {
  const state = sharedState();
  return state.current !== undefined || now - state.hiddenAt < window;
}

/** Records that the tooltip of `owner` shows, and hides the one that was shown before it. */
export function showTooltip(owner: object, hide: () => void): void {
  const state = sharedState();
  const previous = state.current;
  state.current = { owner, hide };
  if (previous !== undefined && previous.owner !== owner) {
    previous.hide();
  }
}

/** Records that the tooltip of `owner` hid at `now`. Another owner's tooltip stays shown. */
export function hideTooltip(owner: object, now: number): void {
  const state = sharedState();
  if (state.current?.owner !== owner) {
    return;
  }
  state.current = undefined;
  state.hiddenAt = now;
}
