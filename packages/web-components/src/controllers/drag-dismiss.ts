import type { ReactiveController, ReactiveControllerHost } from 'lit';

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

export interface DragDismissOptions {
  /** The element that moves with the gesture. */
  target: () => HTMLElement | null | undefined;
  /**
   * Elements a gesture may start from. Keep scrollable content out of this
   * list — otherwise a drag competes with scrolling and the content becomes
   * unreachable.
   */
  handles: () => Array<HTMLElement | null | undefined>;
  /** Called once the gesture passes either threshold. */
  onDismiss: () => void;
  /** @default 'down' */
  direction?: DragDismissDirection;
  /** @default 0.25 */
  distanceThreshold?: number;
  /** @default 0.5 */
  velocityThreshold?: number;
  /**
   * Checked on every pointerdown, so the gesture can be switched off per
   * viewport or per prop without re-creating the controller.
   * @default always enabled
   */
  enabled?: () => boolean;
}

/**
 * Drag-to-dismiss gesture for a panel, as a Lit reactive controller.
 *
 * Direction-aware so it suits any edge-anchored surface — a bottom sheet drags
 * `down`, a left drawer drags `left`. Movement is clamped to the dismiss
 * direction, so a panel can never be dragged away from its resting edge.
 *
 * The offset is written to the CSS `translate` property rather than
 * `transform`, so it composes with whatever entry animation the component
 * already runs on `transform`. While a gesture is active the host carries
 * `data-dragging`, which the component's CSS should use to suppress the
 * transition so the panel tracks the pointer exactly.
 *
 * This gesture is never the only way out — it is unreachable by keyboard and
 * screen reader, so the component must keep its other dismissal paths.
 *
 * @example
 * ```ts
 * private _drag = new DragDismissController(this, {
 *   target: () => this._panel,
 *   handles: () => [this._grabber, this._header],
 *   enabled: () => this.dragToDismiss && this._isSheet,
 *   onDismiss: () => this._requestClose('drag'),
 * });
 * ```
 */
export class DragDismissController implements ReactiveController {
  private readonly host: ReactiveControllerHost & HTMLElement;
  private readonly options: DragDismissOptions;

  private pointerId?: number;
  private startCoord = 0;
  private samples: Array<{ coord: number; time: number }> = [];
  private dragging = false;

  constructor(host: ReactiveControllerHost & HTMLElement, options: DragDismissOptions) {
    this.host = host;
    this.options = options;
    host.addController(this);
  }

  hostConnected() {
    // Bound on the host rather than on the handles: handles are re-rendered by
    // Lit, and a listener on the host survives that.
    this.host.addEventListener('pointerdown', this.onPointerDown);
  }

  hostDisconnected() {
    this.host.removeEventListener('pointerdown', this.onPointerDown);
    this.cancel();
  }

  private get direction(): DragDismissDirection {
    return this.options.direction ?? 'down';
  }

  private coordOf(event: PointerEvent): number {
    return AXIS[this.direction] === 'y' ? event.clientY : event.clientX;
  }

  /** Distance travelled towards dismissal; negative means the wrong way. */
  private progress(coord: number): number {
    return (coord - this.startCoord) * SIGN[this.direction];
  }

  private record(coord: number, time: number) {
    this.samples.push({ coord, time });
    while (this.samples.length > 1 && time - this.samples[0].time > VELOCITY_WINDOW_MS) {
      this.samples.shift();
    }
  }

  /** px/ms towards dismissal, averaged over the trailing window. */
  private get velocity(): number {
    if (this.samples.length < 2) return 0;
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const elapsed = last.time - first.time;
    if (elapsed <= 0) return 0;
    return ((last.coord - first.coord) * SIGN[this.direction]) / elapsed;
  }

  private onPointerDown = (event: PointerEvent) => {
    if (this.dragging) return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    if (this.options.enabled && !this.options.enabled()) return;

    const handles = this.options.handles().filter(Boolean) as HTMLElement[];
    if (handles.length === 0) return;
    const path = event.composedPath();
    if (!handles.some((h) => path.includes(h))) return;

    const target = this.options.target();
    if (!target) return;

    this.pointerId = event.pointerId;
    this.startCoord = this.coordOf(event);
    this.samples = [];
    this.record(this.startCoord, event.timeStamp);
    this.dragging = true;
    this.host.setAttribute('data-dragging', '');

    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerCancel);
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.dragging || event.pointerId !== this.pointerId) return;
    const target = this.options.target();
    if (!target) return;

    const coord = this.coordOf(event);
    this.record(coord, event.timeStamp);

    // Clamp: the panel may move towards dismissal, never away from its edge.
    const travelled = Math.max(0, this.progress(coord));
    const offset = travelled * SIGN[this.direction];
    target.style.translate =
      AXIS[this.direction] === 'y' ? `0 ${offset}px` : `${offset}px 0`;

    // A gesture in progress must not also scroll or select.
    event.preventDefault();
  };

  private onPointerUp = (event: PointerEvent) => {
    if (!this.dragging || event.pointerId !== this.pointerId) return;
    const target = this.options.target();
    const releaseCoord = this.coordOf(event);
    this.record(releaseCoord, event.timeStamp);
    const travelled = Math.max(0, this.progress(releaseCoord));

    const size = target
      ? AXIS[this.direction] === 'y'
        ? target.offsetHeight
        : target.offsetWidth
      : 0;
    const distanceThreshold =
      size * (this.options.distanceThreshold ?? DEFAULT_DISTANCE_THRESHOLD);
    const velocityThreshold = this.options.velocityThreshold ?? DEFAULT_VELOCITY_THRESHOLD;

    const shouldDismiss =
      (size > 0 && travelled >= distanceThreshold) || this.velocity >= velocityThreshold;

    this.finish();

    if (shouldDismiss) {
      this.options.onDismiss();
    } else if (target) {
      // Clearing the inline offset lets the component's transition ease it back.
      target.style.removeProperty('translate');
    }
  };

  private onPointerCancel = () => this.cancel();

  /** Abandons the gesture and returns the panel to its resting position. */
  private cancel() {
    if (!this.dragging) return;
    const target = this.options.target();
    this.finish();
    target?.style.removeProperty('translate');
  }

  private finish() {
    this.dragging = false;
    this.pointerId = undefined;
    this.host.removeAttribute('data-dragging');
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerCancel);
  }

  /** Clears any offset left behind — call when the panel closes by other means. */
  reset() {
    this.cancel();
    this.options.target()?.style.removeProperty('translate');
  }
}
