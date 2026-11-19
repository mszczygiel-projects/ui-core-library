import {
  configureUiCore,
  type LoaderVariantDefinition,
  resetUiCoreConfig,
} from '@mszczygiel-projects/ui-core-foundations/config';
import type { CustomLoaderProps } from '@mszczygiel-projects/ui-core-react';
import type { LoaderProps } from '@mszczygiel-projects/ui-core-shared/loader';
import { beforeAll, expect, it, vi } from 'vitest';
import { commands, userEvent } from 'vitest/browser';

import type { Mount } from '../harness/types.ts';
import { pixels, tokenValue } from '../tokens.ts';
import type { ButtonContractProps } from './button.contract.ts';
import type { ComboboxContractProps } from './combobox.contract.ts';
import type { IconButtonContractProps } from './icon-button.contract.ts';
import type { SplitButtonContractProps } from './split-button.contract.ts';

const animatedId = 'contract-animated-loader';
const staticId = 'contract-static-loader';
const animationMounted = vi.fn();

function AnimatedLoader({ size }: CustomLoaderProps) {
  return (
    <span
      data-testid={animatedId}
      data-loader-size={size}
      ref={(element) => {
        if (element !== null) {
          animationMounted();
        }
      }}
      tabIndex={-1}
    />
  );
}

function StaticLoader({ size }: CustomLoaderProps) {
  return <span data-testid={staticId} data-loader-size={size} />;
}

function defineLoader(tag: string, onMount?: () => void): void {
  customElements.define(
    tag,
    class extends HTMLElement {
      static readonly observedAttributes = ['size'];

      connectedCallback(): void {
        this.dataset['testid'] = tag;
        this.tabIndex = -1;
        onMount?.();
      }

      attributeChangedCallback(_name: string, _previous: string | null, size: string): void {
        this.dataset['loaderSize'] = size;
      }
    },
  );
}

const fullVariant: LoaderVariantDefinition = {
  react: { component: AnimatedLoader, reducedMotion: StaticLoader },
  webComponent: { component: animatedId, reducedMotion: staticId },
};

function register(definition = fullVariant): void {
  configureUiCore({ loaderVariant: 'brand', loaderVariants: { brand: definition } });
}

/** The same global selection must reach the standalone loader and all of its existing callers. */
export function customLoaderContract(mounts: {
  readonly loader: Mount<LoaderProps>;
  readonly button: Mount<ButtonContractProps>;
  readonly iconButton: Mount<IconButtonContractProps>;
  readonly splitButton: Mount<SplitButtonContractProps>;
  readonly combobox: Mount<ComboboxContractProps>;
}): void {
  beforeAll(() => {
    defineLoader(animatedId, animationMounted);
    defineLoader(staticId);
  });

  it('changes a mounted Loader in place and keeps its name, size and colour', async () => {
    const loader = await mounts.loader(
      { size: 'large', label: 'Fetching' },
      { density: 'compact' },
    );
    try {
      register();
      const visual = loader.screen.getByTestId(animatedId);
      await expect.element(visual).toHaveAttribute('data-loader-size', 'large');
      const visualElement = visual.element() as HTMLElement;
      const indicator = loader.part('indicator');
      const diameter = pixels(tokenValue('--loader-large-size', { density: 'compact' }));
      expect(indicator.offsetWidth).toBe(diameter);
      expect(indicator.offsetHeight).toBe(diameter);
      expect(getComputedStyle(visualElement).color).toBe(getComputedStyle(loader.element).color);
      expect(indicator.inert).toBe(true);
      expect(indicator.getAttribute('aria-hidden')).toBe('true');
      visualElement.focus();
      expect(visualElement.matches(':focus')).toBe(false);
      expect(await loader.accessibleNode()).toEqual({ role: 'progressbar', name: 'Fetching' });

      await loader.update({ size: 'small' });
      await expect.element(visual).toHaveAttribute('data-loader-size', 'small');
      configureUiCore({ loaderVariant: 'unknown' });
      await expect.element(visual).not.toBeInTheDocument();
      expect(loader.part('indicator').getAnimations()).not.toHaveLength(0);
      configureUiCore({ loaderVariant: 'brand' });
      await expect.element(visual).toBeInTheDocument();
      resetUiCoreConfig();
      await expect.element(visual).not.toBeInTheDocument();
      register({});
      await expect.poll(() => loader.part('indicator').getAnimations().length).toBeGreaterThan(0);
    } finally {
      await loader.unmount();
    }
  });

  it('uses the static component first with reduced motion and a motionless spinner as fallback', async () => {
    animationMounted.mockClear();
    await commands.emulateMedia({ reducedMotion: 'reduce' });
    register();
    const loader = await mounts.loader({});
    try {
      await expect
        .element(loader.screen.getByTestId(staticId))
        .toHaveAttribute('data-loader-size', 'medium');
      await expect.element(loader.screen.getByTestId(animatedId)).not.toBeInTheDocument();
      expect(animationMounted).not.toHaveBeenCalled();
      register({ react: { component: AnimatedLoader }, webComponent: { component: animatedId } });
      await expect.element(loader.screen.getByTestId(staticId)).not.toBeInTheDocument();
      expect(loader.part('indicator').getAnimations()).toHaveLength(0);
      await commands.emulateMedia({ reducedMotion: 'no-preference' });
      await expect.element(loader.screen.getByTestId(animatedId)).toBeInTheDocument();
    } finally {
      await loader.unmount();
    }
  });

  const actions = [
    ['Button', () => mounts.button({ label: 'Save' }), 'base'],
    ['IconButton', () => mounts.iconButton({ label: 'Save' }), 'base'],
    ['SplitButton', () => mounts.splitButton({ label: 'Save' }), 'action'],
  ] as const;

  for (const [name, mount, controlPart] of actions) {
    it(`updates the loading visual of ${name} without changing its name, focus or dimensions`, async () => {
      const button = await mount();
      try {
        const base = button.part(controlPart);
        const width = base.offsetWidth;
        const nameBefore = (await button.accessibleTree()).find(
          (node) => node.role === 'button',
        )?.name;
        expect(nameBefore).toBeTruthy();
        base.focus();
        await button.update({ loading: true });
        register();
        const animated = button.screen.getByTestId(animatedId);
        await expect.element(animated).toHaveAttribute('data-loader-size', 'small');
        expect(getComputedStyle(animated.element()).color).toBe(getComputedStyle(base).color);

        await commands.emulateMedia({ reducedMotion: 'reduce' });
        await expect.element(button.screen.getByTestId(staticId)).toBeInTheDocument();
        await expect.element(animated).not.toBeInTheDocument();
        expect(button.part(controlPart)).toBe(base);
        expect(base.matches(':focus')).toBe(true);
        expect(base.offsetWidth).toBe(width);
        expect(base.getAttribute('aria-busy')).toBe('true');
        const tree = await button.accessibleTree();
        expect(tree.find((node) => node.role === 'button')).toMatchObject({
          name: nameBefore,
          description: 'Loading',
        });
        expect(tree.some((node) => node.role === 'progressbar')).toBe(false);
      } finally {
        await button.unmount();
      }
    });
  }

  it('uses the configured visual for the Combobox loading message', async () => {
    register();
    const field = await mounts.combobox({ loading: true });
    try {
      await userEvent.click(field.part('input'));
      const visual = field.screen.getByTestId(animatedId);
      await expect.element(visual).toHaveAttribute('data-loader-size', 'small');
      await commands.emulateMedia({ reducedMotion: 'reduce' });
      await expect.element(field.screen.getByTestId(staticId)).toBeInTheDocument();
      await expect.element(visual).not.toBeInTheDocument();
      expect(field.part('listbox').getAttribute('aria-busy')).toBe('true');
      expect(field.part('message').textContent).toBe('Loading options');
    } finally {
      await field.unmount();
    }
  });
}
