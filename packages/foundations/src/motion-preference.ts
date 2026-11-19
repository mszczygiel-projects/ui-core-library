interface MotionQuery {
  readonly matches: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

interface MotionHost {
  matchMedia(query: string): MotionQuery;
}

interface MotionStore {
  readonly getSnapshot: () => boolean;
  readonly subscribe: (listener: () => void) => () => void;
}

const STATE_KEY = Symbol.for('ui-core.reduced-motion');

type Holder = typeof globalThis & { [STATE_KEY]?: WeakMap<MotionHost, MotionStore> };

/** Shares one reduced-motion query and native listener per window across both component packages. */
export function getReducedMotionStore(host: MotionHost): MotionStore {
  const holder = globalThis as Holder;
  const stores = (holder[STATE_KEY] ??= new WeakMap());
  const existing = stores.get(host);
  if (existing !== undefined) {
    return existing;
  }

  const query = host.matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of [...listeners]) {
      listener();
    }
  };
  const store: MotionStore = {
    getSnapshot: () => query.matches,
    subscribe(listener) {
      if (listeners.size === 0) {
        query.addEventListener('change', notify);
      }
      listeners.add(listener);
      return () => {
        if (listeners.delete(listener) && listeners.size === 0) {
          query.removeEventListener('change', notify);
        }
      };
    },
  };
  stores.set(host, store);
  return store;
}
