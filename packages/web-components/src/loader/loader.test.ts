import '../../dist/components/ui-loader.js';

import {
  configureUiCore,
  resetUiCoreConfig,
} from '@mszczygiel-projects/ui-core-foundations/config';
import type { LoaderProps } from '@mszczygiel-projects/ui-core-shared/loader';
import { describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

type UiLoader = HTMLElement & LoaderProps;

async function mount(): Promise<UiLoader> {
  const loader = document.createElement('ui-loader') as UiLoader;
  document.body.append(loader);
  await nextRender();
  return loader;
}

describe('ui-loader', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-loader')).toBeDefined();
  });

  it('writes no attribute on its host: the host belongs to the page', async () => {
    const loader = await mount();
    loader.size = 'large';
    loader.label = 'Saving';
    await nextRender();
    expect(loader.getAttributeNames()).toEqual([]);
    loader.remove();
  });

  it('keeps the attributes that the page wrote', async () => {
    const loader = await mount();
    loader.setAttribute('aria-label', 'Fetching orders');
    loader.setAttribute('role', 'img');
    loader.size = 'small';
    await nextRender();
    expect(loader.getAttribute('aria-label')).toBe('Fetching orders');
    expect(loader.getAttribute('role')).toBe('img');
    loader.remove();
  });

  it('picks up a change of the configuration made while it was off the page', async () => {
    // The name lives in ElementInternals, which no selector can read, so the test records what
    // the element hands to it.
    const names: (string | null)[] = [];
    const descriptor = Object.getOwnPropertyDescriptor(ElementInternals.prototype, 'ariaLabel');
    if (descriptor?.set === undefined) {
      throw new Error('ElementInternals has no ariaLabel');
    }
    Object.defineProperty(ElementInternals.prototype, 'ariaLabel', {
      ...descriptor,
      set(this: ElementInternals, value: string | null) {
        names.push(value);
        Reflect.apply(Reflect.get(descriptor, 'set') as (value: unknown) => void, this, [value]);
      },
    });
    try {
      const loader = await mount();
      loader.remove();
      configureUiCore({ labels: { loader: { label: 'Ładowanie' } } });
      document.body.append(loader);
      await nextRender();
      expect(names.at(-1)).toBe('Ładowanie');
      loader.remove();
    } finally {
      Object.defineProperty(ElementInternals.prototype, 'ariaLabel', descriptor);
      resetUiCoreConfig();
    }
  });

  it('reads its size and label from attributes too', async () => {
    const loader = await mount();
    loader.setAttribute('size', 'small');
    loader.setAttribute('label', 'Saving');
    await nextRender();
    expect(loader.size).toBe('small');
    expect(loader.label).toBe('Saving');
    loader.remove();
  });
});
