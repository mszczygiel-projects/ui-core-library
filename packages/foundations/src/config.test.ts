import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  configureUiCore,
  defaultLabels,
  getUiCoreConfig,
  type LoaderVariant,
  resetUiCoreConfig,
  subscribeUiCoreConfig,
} from './config.ts';

const STATE_KEY = Symbol.for('ui-core.config');

afterEach(() => {
  resetUiCoreConfig();
});

describe('the configuration', () => {
  it('starts with the English labels and the spinner', () => {
    expect(getUiCoreConfig()).toEqual({ labels: defaultLabels, loaderVariant: 'spinner' });
    expect(getUiCoreConfig().labels.loader.label).toBe('Loading');
  });

  it('merges labels one by one and keeps the earlier ones', () => {
    configureUiCore({ labels: { loader: { label: 'Ładowanie' } } });
    configureUiCore({});
    expect(getUiCoreConfig().labels.loader.label).toBe('Ładowanie');
  });

  it('ignores a label set to undefined', () => {
    configureUiCore({ labels: { loader: { label: 'Ładowanie' } } });
    configureUiCore({ labels: { loader: {} } });
    expect(getUiCoreConfig().labels.loader.label).toBe('Ładowanie');
  });

  it('returns the same object until the configuration changes', () => {
    const first = getUiCoreConfig();
    expect(getUiCoreConfig()).toBe(first);
    configureUiCore({ labels: { loader: { label: 'Wait' } } });
    const second = getUiCoreConfig();
    expect(second).not.toBe(first);
    expect(getUiCoreConfig()).toBe(second);
  });

  it('cannot be changed through the object it returns', () => {
    const config = getUiCoreConfig();
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.labels)).toBe(true);
    expect(Object.isFrozen(config.labels.loader)).toBe(true);
  });

  it('calls its listeners after a change, and stops when asked', () => {
    const listener = vi.fn();
    const stop = subscribeUiCoreConfig(listener);
    configureUiCore({ labels: { loader: { label: 'Wait' } } });
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
    configureUiCore({ labels: { loader: { label: 'Hold on' } } });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('notifies nobody when nothing changes', () => {
    configureUiCore({ labels: { loader: { label: 'Wait' } }, loaderVariant: 'spinner' });
    const listener = vi.fn();
    const stop = subscribeUiCoreConfig(listener);
    configureUiCore({ labels: { loader: { label: 'Wait' } }, loaderVariant: 'spinner' });
    configureUiCore({});
    stop();
    expect(listener).not.toHaveBeenCalled();
  });

  it('resets to the defaults and notifies its listeners', () => {
    configureUiCore({ labels: { loader: { label: 'Wait' } } });
    const listener = vi.fn();
    const stop = subscribeUiCoreConfig(listener);
    resetUiCoreConfig();
    stop();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getUiCoreConfig().labels.loader.label).toBe('Loading');
  });

  it('keeps its state under a global symbol, so that every copy of the packages shares it', () => {
    configureUiCore({ labels: { loader: { label: 'Wait' } } });
    const state: unknown = Reflect.get(globalThis, STATE_KEY);
    expect(state).toMatchObject({ labels: { loader: { label: 'Wait' } } });
  });

  it('reads what another copy set, and leaves out what this copy does not know', () => {
    const state: unknown = Reflect.get(globalThis, STATE_KEY);
    if (typeof state !== 'object' || state === null) {
      throw new Error('Expected the shared state');
    }
    // A newer copy of the packages may set groups, labels and loaders that this copy lacks.
    Reflect.set(state, 'labels', { loader: { label: 'Wait', hint: 'Soon' }, pagination: {} });
    Reflect.set(state, 'loaderVariant', 'dots');
    Reflect.set(state, 'version', Number(Reflect.get(state, 'version')) + 1);
    expect(getUiCoreConfig()).toEqual({
      labels: {
        button: { loading: 'Loading' },
        chip: { dismiss: 'Remove' },
        iconButton: { loading: 'Loading' },
        loader: { label: 'Wait' },
        notification: { dismiss: 'Dismiss' },
        passwordField: { reveal: 'Show password' },
        searchField: { clear: 'Clear search' },
      },
      loaderVariant: 'spinner' satisfies LoaderVariant,
    });
  });

  it('keeps a default label when another copy set a value of another kind', () => {
    const state: unknown = Reflect.get(globalThis, STATE_KEY);
    if (typeof state !== 'object' || state === null) {
      throw new Error('Expected the shared state');
    }
    Reflect.set(state, 'labels', { loader: { label: 42 } });
    Reflect.set(state, 'version', Number(Reflect.get(state, 'version')) + 1);
    expect(getUiCoreConfig().labels.loader.label).toBe('Loading');
  });
});
