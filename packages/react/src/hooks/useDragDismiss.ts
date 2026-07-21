import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';

export type DragDismissDirection = 'down' | 'up' | 'left' | 'right';

/** Fraction of the target's own size past which releasing dismisses. */
const DEFAULT_DISTANCE_THRESHOLD = 0.25;
/** px per ms — a flick dismisses even if it never travelled far. */
const DEFAULT_VELOCITY_THRESHOLD = 0.5;
/**
 * Velocity is measured across this trailing window rather than the last
 * pointermove alone: a single jittery sample right before release would
 * otherwise read as a flick and close the panel out from under the user.
 */
const VELOCITY_WINDOW_MS = 100;

const AXIS: Record<DragDismissDirection, 'x' | 'y'> = {
  down: 'y',
  up: 'y',
  left: 'x',
  right: 'x',
};

/** Which way counts as "towards dismissal" along that axis. */
const SIGN: Record<DragDismissDirection, 1 | -1> = {
  down: 1,
  up: -1,
  left: -1,
  right: 1,
};

export interface UseDragDismissOptions {
  /** The element that moves with the gesture. */
  targetRef: RefObject<HTMLElement | null>;
  /**
   * Elements a gesture may start from. Keep scrollable content out of this
   * list — otherwise a drag competes with scrolling and the content becomes
   * unreachable.
   */
  handleRefs: Array<RefObject<HTMLElement | null>>;
  /** Called once the gesture passes either threshold. */
  onDismiss: () => void;
  /** @default 'down' */
  direction?: DragDismissDirection;
  /** @default 0.25 */
  distanceThreshold?: number;
  /** @default 0.5 */
  velocityThreshold?: number;
  /**
   * Re-checked on every pointerdown, so the gesture can be switched off per
   * viewport or per prop without remounting.
   * @default true
   */
  enabled?: boolean;
}

/**
 * Drag-to-dismiss gesture for a panel.
 *
 * Direction-aware so it suits any edge-anchored surface — a bottom sheet drags
 * `down`, a left drawer drags `left`. Movement is clamped to the dismiss
 * direction, so a panel can never be dragged away from its resting edge.
 *
 * The offset is written to the CSS `translate` property rather than
 * `transform`, so it composes with whatever entry animation the component
 * already runs on `transform`. While a gesture is active the target carries
 * `data-dragging`, which CSS should use to suppress the transition so the panel
 * tracks the pointer exactly.
 *
 * This gesture is never the only way out — it is unreachable by keyboard and
 * screen reader, so the component must keep its other dismissal paths.
 *
 * @example
 * const dragging = useDragDismiss({
 *   targetRef: panelRef,
 *   handleRefs: [grabberRef, headerRef],
 *   enabled: dragToDismiss && isSheet,
 *   onDismiss: () => request('drag'),
 * });
 */
export function useDragDismiss({
  targetRef,
  handleRefs,
  onDismiss,
  direction = 'down',
  distanceThreshold = DEFAULT_DISTANCE_THRESHOLD,
  velocityThreshold = DEFAULT_VELOCITY_THRESHOLD,
  enabled = true,
}: UseDragDismissOptions) {
  const state = useRef({
    pointerId: undefined as number | undefined,
    startCoord: 0,
    samples: [] as Array<{ coord: number; time: number }>,
    dragging: false,
  });

  const record = useCallback((coord: number, time: number) => {
    const s = state.current.samples;
    s.push({ coord, time });
    while (s.length > 1 && time - s[0].time > VELOCITY_WINDOW_MS) s.shift();
  }, []);

  /** px/ms towards dismissal, averaged over the trailing window. */
  const velocityOf = useCallback((dir: DragDismissDirection) => {
    const s = state.current.samples;
    if (s.length < 2) return 0;
    const elapsed = s[s.length - 1].time - s[0].time;
    if (elapsed <= 0) return 0;
    return ((s[s.length - 1].coord - s[0].coord) * SIGN[dir]) / elapsed;
  }, []);

  // Read through refs so the window listeners never need re-binding.
  const latest = useRef({ onDismiss, direction, distanceThreshold, velocityThreshold, enabled });
  latest.current = { onDismiss, direction, distanceThreshold, velocityThreshold, enabled };

  const coordOf = useCallback(
    (event: PointerEvent) =>
      AXIS[latest.current.direction] === 'y' ? event.clientY : event.clientX,
    [],
  );

  const finish = useCallback(() => {
    const s = state.current;
    s.dragging = false;
    s.pointerId = undefined;
    targetRef.current?.removeAttribute('data-dragging');
  }, [targetRef]);

  const clearOffset = useCallback(() => {
    targetRef.current?.style.removeProperty('translate');
  }, [targetRef]);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const onPointerMove = (event: PointerEvent) => {
      const s = state.current;
      if (!s.dragging || event.pointerId !== s.pointerId) return;
      const el = targetRef.current;
      if (!el) return;

      const dir = latest.current.direction;
      const coord = coordOf(event);
      record(coord, event.timeStamp);

      // Clamp: the panel may move towards dismissal, never away from its edge.
      const travelled = Math.max(0, (coord - s.startCoord) * SIGN[dir]);
      const offset = travelled * SIGN[dir];
      el.style.translate = AXIS[dir] === 'y' ? `0 ${offset}px` : `${offset}px 0`;

      // A gesture in progress must not also scroll or select.
      event.preventDefault();
    };

    const onPointerUp = (event: PointerEvent) => {
      const s = state.current;
      if (!s.dragging || event.pointerId !== s.pointerId) return;
      const el = targetRef.current;
      const dir = latest.current.direction;
      const releaseCoord = coordOf(event);
      record(releaseCoord, event.timeStamp);
      const travelled = Math.max(0, (releaseCoord - s.startCoord) * SIGN[dir]);
      const size = el ? (AXIS[dir] === 'y' ? el.offsetHeight : el.offsetWidth) : 0;

      const shouldDismiss =
        (size > 0 && travelled >= size * latest.current.distanceThreshold) ||
        velocityOf(dir) >= latest.current.velocityThreshold;

      detach();
      finish();

      if (shouldDismiss) latest.current.onDismiss();
      else clearOffset();
    };

    const onPointerCancel = () => {
      detach();
      finish();
      clearOffset();
    };

    const attach = () => {
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerCancel);
    };
    const detach = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
    };

    const onPointerDown = (event: PointerEvent) => {
      const s = state.current;
      if (s.dragging) return;
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      if (!latest.current.enabled) return;

      const handles = handleRefs.map((r) => r.current).filter(Boolean) as HTMLElement[];
      if (handles.length === 0) return;
      const path = event.composedPath();
      if (!handles.some((h) => path.includes(h))) return;

      s.pointerId = event.pointerId;
      s.startCoord = coordOf(event);
      s.samples = [];
      record(s.startCoord, event.timeStamp);
      s.dragging = true;
      targetRef.current?.setAttribute('data-dragging', '');
      attach();
    };

    target.addEventListener('pointerdown', onPointerDown);
    return () => {
      target.removeEventListener('pointerdown', onPointerDown);
      detach();
      finish();
    };
    // handleRefs is intentionally absent: it is a fresh array literal on every
    // render, and the refs inside it are read at gesture time, not bind time.
  }, [targetRef, coordOf, finish, clearOffset, record, velocityOf]);

  /** Clears any offset left behind — call when the panel closes by other means. */
  return useCallback(() => {
    finish();
    clearOffset();
  }, [finish, clearOffset]);
}
