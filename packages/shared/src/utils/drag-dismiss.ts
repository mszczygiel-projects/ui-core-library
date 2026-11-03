/**
 * The part of its own height that a panel must travel down before a release dismisses it.
 */
export const DRAG_DISMISS_DISTANCE = 0.25;

/** The speed down, in pixels per millisecond, at which a short flick dismisses too. */
export const DRAG_DISMISS_VELOCITY = 0.5;

/**
 * The trailing time, in milliseconds, over which the speed is measured. A single jittery sample
 * just before the release would otherwise read as a flick.
 */
export const DRAG_DISMISS_WINDOW = 100;

/** Where the pointer was along the vertical axis, and when, in the units of the pointer event. */
export interface DragSample {
  readonly position: number;
  readonly time: number;
}

/** A drag of a panel down towards dismissal, from the press to the release. */
export interface DragState {
  /** Where the press started. */
  readonly start: number;
  /** The samples of the trailing window and the one before it, oldest first. */
  readonly samples: readonly DragSample[];
}

/** Starts a drag at a press. */
export function startDrag(position: number, time: number): DragState {
  return { start: position, samples: [{ position, time }] };
}

/**
 * Adds a sample of the pointer and drops those older than the trailing window, except the newest
 * of them, so that the window always spans its full time when the pointer moves slowly.
 */
export function moveDrag(state: DragState, position: number, time: number): DragState {
  const all = [...state.samples, { position, time }];
  const anchor = all.findLastIndex((sample) => time - sample.time >= DRAG_DISMISS_WINDOW);
  return { start: state.start, samples: all.slice(Math.max(anchor, 0)) };
}

/** How far the panel follows the pointer down: never up, past its resting edge. */
export function dragOffset(state: DragState): number {
  const last = state.samples.at(-1);
  return last === undefined ? 0 : Math.max(0, last.position - state.start);
}

/** The speed down over the trailing window, in pixels per millisecond. */
export function dragVelocity(state: DragState): number {
  const first = state.samples[0];
  const last = state.samples.at(-1);
  if (first === undefined || last === undefined || last.time <= first.time) {
    return 0;
  }
  return (last.position - first.position) / (last.time - first.time);
}

/**
 * Whether a release dismisses a panel of `extent` pixels: it travelled a quarter of its height, or
 * it was flicked down fast enough.
 */
export function shouldDismissDrag(state: DragState, extent: number): boolean {
  const travelled = dragOffset(state);
  return (
    (extent > 0 && travelled >= extent * DRAG_DISMISS_DISTANCE) ||
    dragVelocity(state) >= DRAG_DISMISS_VELOCITY
  );
}
