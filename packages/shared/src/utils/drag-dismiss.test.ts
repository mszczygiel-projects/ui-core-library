import { describe, expect, it } from 'vitest';

import {
  DRAG_DISMISS_WINDOW,
  dragOffset,
  dragVelocity,
  moveDrag,
  shouldDismissDrag,
  startDrag,
} from './drag-dismiss.ts';

/** A drag through `positions`, one sample every `step` milliseconds. */
function drag(positions: readonly number[], step: number) {
  const [first = 0, ...rest] = positions;
  return rest.reduce(
    (state, position, index) => moveDrag(state, position, (index + 1) * step),
    startDrag(first, 0),
  );
}

describe('dragOffset', () => {
  it('follows the pointer down from the press', () => {
    expect(dragOffset(drag([100, 140], 50))).toBe(40);
  });

  it('never moves the panel up past its resting edge', () => {
    expect(dragOffset(drag([100, 60], 50))).toBe(0);
  });
});

describe('moveDrag', () => {
  it('keeps the samples of the trailing window and the one before it', () => {
    const state = drag([0, 10, 20, 30, 40], 40);
    expect(state.samples.map((sample) => sample.time)).toEqual([40, 80, 120, 160]);
    expect(160 - (state.samples[1]?.time ?? 0)).toBeLessThan(DRAG_DISMISS_WINDOW);
    expect(state.start).toBe(0);
  });
});

describe('shouldDismissDrag', () => {
  it('dismisses once the panel travelled a quarter of its height', () => {
    expect(shouldDismissDrag(drag([0, 50, 100], 200), 400)).toBe(true);
  });

  it('snaps back below that distance when the drag was slow', () => {
    expect(shouldDismissDrag(drag([0, 40, 80], 200), 400)).toBe(false);
  });

  it('dismisses a short but fast flick', () => {
    const flick = drag([0, 20, 40], 20);
    expect(dragVelocity(flick)).toBeGreaterThanOrEqual(0.5);
    expect(shouldDismissDrag(flick, 400)).toBe(true);
  });

  it('reads no flick from one jittery sample at the end of a slow drag', () => {
    const slow = drag([0, 10, 20, 30, 40, 50], 150);
    const jitter = moveDrag(slow, 60, 751);
    expect(shouldDismissDrag(jitter, 400)).toBe(false);
  });

  it('does not dismiss a drag up, however fast', () => {
    expect(shouldDismissDrag(drag([300, 200, 100], 20), 400)).toBe(false);
  });
});
