import { afterEach, describe, expect, it, vi } from 'vitest';

import { isScrollLocked, lockScroll, type ScrollLockStyles, unlockScroll } from './scroll-lock.ts';

const saved: ScrollLockStyles = { overflow: 'auto', 'padding-inline-end': '' };
const apply = () => saved;
const owners: object[] = [];

function owner(): object {
  const created = {};
  owners.push(created);
  return created;
}

afterEach(() => {
  for (const each of owners.splice(0)) {
    unlockScroll(each, () => undefined);
  }
});

describe('lockScroll', () => {
  it('applies the lock for the first owner only', () => {
    const first = vi.fn(apply);
    const second = vi.fn(apply);
    lockScroll(owner(), first);
    lockScroll(owner(), second);
    expect(first).toHaveBeenCalledOnce();
    expect(second).not.toHaveBeenCalled();
    expect(isScrollLocked()).toBe(true);
  });

  it('counts an owner once however often it locks', () => {
    const dialog = owner();
    lockScroll(dialog, apply);
    lockScroll(dialog, apply);
    const restore = vi.fn();
    unlockScroll(dialog, restore);
    expect(restore).toHaveBeenCalledWith(saved);
    expect(isScrollLocked()).toBe(false);
  });
});

describe('unlockScroll', () => {
  it('keeps the page locked until the last owner releases it, in any order', () => {
    const drawer = owner();
    const dialog = owner();
    lockScroll(drawer, apply);
    lockScroll(dialog, () => ({ overflow: 'hidden' }));
    const restore = vi.fn();
    unlockScroll(drawer, restore);
    expect(restore).not.toHaveBeenCalled();
    expect(isScrollLocked()).toBe(true);
    unlockScroll(dialog, restore);
    expect(restore).toHaveBeenCalledExactlyOnceWith(saved);
  });

  it('ignores an owner that holds no lock', () => {
    const dialog = owner();
    lockScroll(dialog, apply);
    const restore = vi.fn();
    unlockScroll(owner(), restore);
    expect(restore).not.toHaveBeenCalled();
    expect(isScrollLocked()).toBe(true);
  });

  it('keeps its state where every copy of the module on the page finds it', () => {
    const dialog = owner();
    lockScroll(dialog, apply);
    const holder = globalThis as Record<symbol, { owners: Set<object> } | undefined>;
    expect(holder[Symbol.for('ui-core.scroll-lock')]?.owners.has(dialog)).toBe(true);
  });
});
