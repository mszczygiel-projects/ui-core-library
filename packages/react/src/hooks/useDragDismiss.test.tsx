import { describe, it, expect, vi, afterEach } from 'vitest';
import { useRef } from 'react';
import { render, cleanup, act } from '@testing-library/react';
import { useDragDismiss, type DragDismissDirection } from './useDragDismiss.js';

afterEach(() => cleanup());

/*
 * jsdom reports offsetHeight/offsetWidth as 0, so the distance threshold can
 * never fire here — `size > 0` guards it. Distance physics is covered by the
 * web-components suite, which runs on real Chromium. What these tests pin down
 * is the wiring: gating, handle scoping, the offset, and cleanup.
 */

function Harness({
  enabled = true,
  direction = 'down' as DragDismissDirection,
  onDismiss,
}: {
  enabled?: boolean;
  direction?: DragDismissDirection;
  onDismiss: () => void;
}) {
  const target = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  useDragDismiss({ targetRef: target, handleRefs: [handle], enabled, direction, onDismiss });
  return (
    <div ref={target} data-testid="target">
      <div ref={handle} data-testid="handle" />
      <div data-testid="body" />
    </div>
  );
}

const pointer = (type: string, x: number, y: number) =>
  new PointerEvent(type, {
    pointerId: 1,
    clientX: x,
    clientY: y,
    bubbles: true,
    composed: true,
    cancelable: true,
    button: 0,
  });

describe('useDragDismiss', () => {
  it('starts a gesture from a handle and marks the target', () => {
    const onDismiss = vi.fn();
    const { getByTestId } = render(<Harness onDismiss={onDismiss} />);
    act(() => {
      getByTestId('handle').dispatchEvent(pointer('pointerdown', 0, 0));
    });
    expect(getByTestId('target').hasAttribute('data-dragging')).toBe(true);
    act(() => {
      window.dispatchEvent(pointer('pointerup', 0, 5));
    });
    expect(getByTestId('target').hasAttribute('data-dragging')).toBe(false);
  });

  it('ignores gestures starting outside a handle', () => {
    const onDismiss = vi.fn();
    const { getByTestId } = render(<Harness onDismiss={onDismiss} />);
    act(() => {
      getByTestId('body').dispatchEvent(pointer('pointerdown', 0, 0));
    });
    expect(getByTestId('target').hasAttribute('data-dragging')).toBe(false);
  });

  it('ignores gestures while disabled', () => {
    const onDismiss = vi.fn();
    const { getByTestId } = render(<Harness enabled={false} onDismiss={onDismiss} />);
    act(() => {
      getByTestId('handle').dispatchEvent(pointer('pointerdown', 0, 0));
      window.dispatchEvent(pointer('pointerup', 0, 300));
    });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('offsets the target along the configured axis', () => {
    const onDismiss = vi.fn();
    const { getByTestId } = render(<Harness direction="right" onDismiss={onDismiss} />);
    act(() => {
      getByTestId('handle').dispatchEvent(pointer('pointerdown', 0, 0));
      window.dispatchEvent(pointer('pointermove', 25, 0));
    });
    expect(getByTestId('target').style.translate).toBe('25px 0');
    act(() => {
      window.dispatchEvent(pointer('pointerup', 25, 0));
    });
  });

  it('refuses to move away from the resting edge', () => {
    const onDismiss = vi.fn();
    const { getByTestId } = render(<Harness onDismiss={onDismiss} />);
    act(() => {
      getByTestId('handle').dispatchEvent(pointer('pointerdown', 0, 100));
      window.dispatchEvent(pointer('pointermove', 0, 20));
    });
    expect(getByTestId('target').style.translate).toBe('0 0px');
    act(() => {
      window.dispatchEvent(pointer('pointerup', 0, 20));
    });
  });

  it('clears the offset on pointercancel without dismissing', () => {
    const onDismiss = vi.fn();
    const { getByTestId } = render(<Harness onDismiss={onDismiss} />);
    act(() => {
      getByTestId('handle').dispatchEvent(pointer('pointerdown', 0, 0));
      window.dispatchEvent(pointer('pointermove', 0, 40));
      window.dispatchEvent(pointer('pointercancel', 0, 40));
    });
    expect(onDismiss).not.toHaveBeenCalled();
    expect(getByTestId('target').style.translate).toBe('');
    expect(getByTestId('target').hasAttribute('data-dragging')).toBe(false);
  });

  it('detaches window listeners on unmount', () => {
    const onDismiss = vi.fn();
    const { getByTestId, unmount } = render(<Harness onDismiss={onDismiss} />);
    act(() => {
      getByTestId('handle').dispatchEvent(pointer('pointerdown', 0, 0));
    });
    unmount();
    act(() => {
      window.dispatchEvent(pointer('pointerup', 0, 500));
    });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
