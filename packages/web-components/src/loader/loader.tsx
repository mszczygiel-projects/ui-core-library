import {
  getUiCoreConfig,
  type UiCoreConfig,
} from '@mszczygiel-projects/ui-core-foundations/config';
import {
  loader,
  type LoaderProps,
  type LoaderSize,
} from '@mszczygiel-projects/ui-core-shared/loader';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import { AttachInternals, Component, Element, h, Prop, State, type VNode } from '@stencil/core';

import { followConfig } from '../internal/config.ts';

/**
 * Shows that content is loading or that an action is in progress.
 *
 * The loader is a progress indicator without a value. Its role and its accessible name go through
 * `ElementInternals`, so an `aria-label` that the page sets on the element wins. It draws the
 * look that `loaderVariant` of `configureUiCore` chooses.
 *
 * @part indicator - The visual indicator shown while something loads.
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

  @Element() host!: HTMLUiLoaderElement;

  @State() config: UiCoreConfig = getUiCoreConfig();

  @State() reducedMotion = false;

  private stopConfig?: () => void;

  private motion?: MediaQueryList;

  connectedCallback(): void {
    this.stopConfig = followConfig((config) => {
      this.config = config;
    });
    this.motion = this.host.ownerDocument.defaultView?.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    this.motion?.addEventListener('change', this.updateMotion);
    this.updateMotion();
  }

  disconnectedCallback(): void {
    this.stopConfig?.();
    this.motion?.removeEventListener('change', this.updateMotion);
  }

  private readonly updateMotion = (): void => {
    this.reducedMotion = this.motion?.matches ?? false;
  };

  componentWillRender(): void {
    if (this.internals !== undefined) {
      this.internals.role = 'progressbar';
      this.internals.ariaLabel = this.label ?? this.config.labels.loader.label;
    }
  }

  render(): VNode {
    const size = oneOf(this.size, loader.options.size.options, loader.options.size.default);
    const presentation = this.config.loader?.webComponent;
    const registry = this.host.ownerDocument.defaultView?.customElements;
    if (
      presentation === undefined ||
      presentation.component === 'ui-loader' ||
      registry?.get(presentation.component) === undefined
    ) {
      return <span part="indicator" class={`indicator ${size}`} />;
    }

    const tag = this.reducedMotion ? presentation.reducedMotion : presentation.component;
    if (tag === undefined || tag === 'ui-loader' || registry.get(tag) === undefined) {
      return <span part="indicator" class={`indicator ${size} fallback`} />;
    }
    return (
      <span
        part="indicator"
        class={`indicator ${size} custom${this.reducedMotion ? '' : ' animated'}`}
        aria-hidden="true"
        inert
      >
        {h(tag, { 'attr:size': size })}
      </span>
    );
  }
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiLoader, keyof LoaderProps>;
