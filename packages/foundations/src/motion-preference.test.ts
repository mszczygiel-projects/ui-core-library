import { expect, it, vi } from 'vitest';

import { getReducedMotionStore } from './motion-preference.ts';

it('shares one native listener per window and removes it when the last subscriber leaves', () => {
  const media = Object.assign(new EventTarget(), { matches: false });
  const add = vi.spyOn(media, 'addEventListener');
  const remove = vi.spyOn(media, 'removeEventListener');
  const host = { matchMedia: vi.fn(() => media) };
  const first = getReducedMotionStore(host);
  const second = getReducedMotionStore(host);
  const firstUpdate = vi.fn(first.getSnapshot);
  const secondUpdate = vi.fn(second.getSnapshot);
  const stopFirst = first.subscribe(firstUpdate);
  const stopSecond = second.subscribe(secondUpdate);

  expect(host.matchMedia).toHaveBeenCalledExactlyOnceWith('(prefers-reduced-motion: reduce)');
  expect(add).toHaveBeenCalledOnce();
  media.matches = true;
  media.dispatchEvent(new Event('change'));
  expect(firstUpdate).toHaveReturnedWith(true);
  expect(secondUpdate).toHaveReturnedWith(true);

  stopFirst();
  expect(remove).not.toHaveBeenCalled();
  media.matches = false;
  media.dispatchEvent(new Event('change'));
  expect(firstUpdate).toHaveBeenCalledOnce();
  expect(secondUpdate).toHaveReturnedWith(false);
  stopSecond();
  expect(remove).toHaveBeenCalledOnce();
});
