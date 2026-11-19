import {
  getUiCoreConfig,
  type UiCoreConfig,
} from '@mszczygiel-projects/ui-core-foundations/config';
import { getReducedMotionStore } from '@mszczygiel-projects/ui-core-foundations/motion-preference';
import {
  loader,
  type LoaderProps,
  type LoaderSize,
} from '@mszczygiel-projects/ui-core-shared/loader';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import { AttachInternals, Component, Element, h, Prop, State, type VNode } from '@stencil/core';

import { followConfig } from '../internal/config.ts';
import { followLoaderDefinition } from './loader-definition.ts';

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

  @State() customTag?: string;

  private stopConfig?: () => void;

  private motion?: ReturnType<typeof getReducedMotionStore>;

  private stopMotion?: () => void;

  private stopDefinition?: () => void;

  connectedCallback(): void {
    const view = this.host.ownerDocument.defaultView;
    this.motion = view === null ? undefined : getReducedMotionStore(view);
    this.stopMotion = this.motion?.subscribe(this.updateVisual);
    this.stopConfig = followConfig((config) => {
      this.config = config;
      this.updateVisual();
    });
  }

  disconnectedCallback(): void {
    this.stopConfig?.();
    this.stopMotion?.();
    this.stopDefinition?.();
    this.stopDefinition = undefined;
  }

  private readonly updateVisual = (): void => {
    this.stopDefinition?.();
    this.stopDefinition = undefined;
    const presentation = this.config.loader?.webComponent;
    const tag = this.motion?.getSnapshot() ? presentation?.reducedMotion : presentation?.component;
    const registry = this.host.ownerDocument.defaultView?.customElements;
    if (tag === undefined || tag === 'ui-loader' || registry === undefined) {
      this.customTag = undefined;
    } else if (registry.get(tag) === undefined) {
      this.customTag = undefined;
      this.stopDefinition = followLoaderDefinition(registry, tag, () => {
        this.stopDefinition = undefined;
        this.customTag = tag;
      });
    } else {
      this.customTag = tag;
    }
  };

  componentWillRender(): void {
    if (this.internals !== undefined) {
      this.internals.role = 'progressbar';
      this.internals.ariaLabel = this.label ?? this.config.labels.loader.label;
    }
  }

  render(): VNode {
    const size = oneOf(this.size, loader.options.size.options, loader.options.size.default);
    if (this.customTag === undefined) {
      const fallback = this.config.loader?.webComponent === undefined ? '' : ' fallback';
      return <span part="indicator" class={`indicator ${size}${fallback}`} />;
    }
    return (
      <span part="indicator" class={`indicator ${size} custom`} aria-hidden="true" inert>
        {h(this.customTag, { 'attr:size': size })}
      </span>
    );
  }
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiLoader, keyof LoaderProps>;
