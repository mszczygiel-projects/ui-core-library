import type { LoaderVariant, UiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import {
  loader,
  type LoaderProps,
  type LoaderSize,
} from '@mszczygiel-projects/ui-core-shared/loader';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import { AttachInternals, Component, h, Prop, State, type VNode } from '@stencil/core';

import { followConfig } from '../internal/config.ts';

/** The markup of each look of a loader, chosen by `loaderVariant` in the configuration. */
const looks: Readonly<Record<LoaderVariant, (size: LoaderSize) => VNode>> = {
  spinner: (size) => <span part="indicator" class={`indicator ${size}`} />,
};

/**
 * Shows that content is loading or that an action is in progress.
 *
 * The loader is a progress indicator without a value. Its role and its accessible name go through
 * `ElementInternals`, so an `aria-label` that the page sets on the element wins. It draws the
 * look that `loaderVariant` of `configureUiCore` chooses.
 *
 * @part indicator - The arc that turns while something loads.
 */
@Component({ tag: 'ui-loader', styleUrl: 'loader.css', shadow: true })
export class UiLoader implements LoaderProps {
  /** The diameter of the loader, which follows the density. */
  @Prop() size: LoaderSize = 'medium';

  /**
   * The accessible name. Without it, the loader takes the label `labels.loader.label` of the
   * configuration, "Loading" in English.
   */
  @Prop() label?: string;

  @AttachInternals() internals?: ElementInternals;

  @State() config: UiCoreConfig = getUiCoreConfig();

  private stopConfig?: () => void;

  connectedCallback(): void {
    this.stopConfig = followConfig((config) => {
      this.config = config;
    });
  }

  disconnectedCallback(): void {
    this.stopConfig?.();
  }

  componentWillRender(): void {
    if (this.internals !== undefined) {
      this.internals.role = 'progressbar';
      this.internals.ariaLabel = this.label ?? this.config.labels.loader.label;
    }
  }

  render(): VNode {
    const size = oneOf(this.size, loader.options.size.options, loader.options.size.default);
    return looks[this.config.loaderVariant](size);
  }
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiLoader, keyof LoaderProps>;
