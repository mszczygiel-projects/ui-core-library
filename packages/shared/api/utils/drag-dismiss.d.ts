export declare const DRAG_DISMISS_DISTANCE = 0.25;
export declare const DRAG_DISMISS_VELOCITY = 0.5;
export declare const DRAG_DISMISS_WINDOW = 100;
export interface DragSample {
    readonly position: number;
    readonly time: number;
}
export interface DragState {
    readonly start: number;
    readonly samples: readonly DragSample[];
}
export declare function startDrag(position: number, time: number): DragState;
export declare function moveDrag(state: DragState, position: number, time: number): DragState;
export declare function dragOffset(state: DragState): number;
export declare function dragVelocity(state: DragState): number;
export declare function shouldDismissDrag(state: DragState, extent: number): boolean;
