import { afterEach, describe, expect, it, vi } from 'vitest';

import { hideTooltip, opensAtOnce, showTooltip } from './tooltip-group.ts';

describe('the tooltips of a page', () => {
  const owners: object[] = [];
  afterEach(() => {
    for (const owner of owners.splice(0)) {
      hideTooltip(owner, Number.NEGATIVE_INFINITY);
    }
    (globalThis as Record<symbol, unknown>)[Symbol.for('ui-core.tooltip')] = undefined;
  });
  const owner = () => {
    const created = {};
    owners.push(created);
    return created;
  };

  it('waits for the first tooltip, and opens the next at once while one is shown', () => {
    expect(opensAtOnce(1000, 500)).toBe(false);
    showTooltip(owner(), () => undefined);
    expect(opensAtOnce(1000, 500)).toBe(true);
  });

  it('opens at once within the window after one hid, and waits after it', () => {
    const first = owner();
    showTooltip(first, () => undefined);
    hideTooltip(first, 1000);
    expect(opensAtOnce(1499, 500)).toBe(true);
    expect(opensAtOnce(1500, 500)).toBe(false);
  });

  it('shows one tooltip at a time', () => {
    const hideFirst = vi.fn();
    const first = owner();
    showTooltip(first, hideFirst);
    showTooltip(owner(), () => undefined);
    expect(hideFirst).toHaveBeenCalledOnce();
    showTooltip(first, hideFirst);
    expect(hideFirst).toHaveBeenCalledOnce();
  });

  it('ignores the hiding of a tooltip that is no longer shown', () => {
    const first = owner();
    const second = owner();
    showTooltip(first, () => undefined);
    showTooltip(second, () => undefined);
    hideTooltip(first, 1000);
    expect(opensAtOnce(5000, 500)).toBe(true);
  });

  it('shares its state through the global symbol, across copies of the package', () => {
    showTooltip(owner(), () => undefined);
    expect((globalThis as Record<symbol, unknown>)[Symbol.for('ui-core.tooltip')]).toBeDefined();
  });
});
