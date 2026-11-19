const pending = new WeakMap<CustomElementRegistry, Map<string, Set<() => void>>>();

/** A lazy bundle may never load. Its shared promise must not hold detached loader instances. */
export function followLoaderDefinition(
  registry: CustomElementRegistry,
  tag: string,
  listener: () => void,
): () => void {
  let definitions = pending.get(registry);
  if (definitions === undefined) {
    definitions = new Map();
    pending.set(registry, definitions);
  }
  const subscriptions = definitions;
  let listeners = subscriptions.get(tag);
  if (listeners === undefined) {
    const waiting = new Set<() => void>();
    listeners = waiting;
    subscriptions.set(tag, waiting);
    void registry.whenDefined(tag).then(
      () => {
        subscriptions.delete(tag);
        for (const notify of waiting) {
          waiting.delete(notify);
          notify();
        }
      },
      () => {
        // An invalid custom element name leaves the fallback visible.
        subscriptions.delete(tag);
      },
    );
  }
  const waiting = listeners;
  waiting.add(listener);
  return () => {
    waiting.delete(listener);
  };
}
