import type {
  LoaderPresentation,
  LoaderVariantDefinition,
} from '@mszczygiel-projects/ui-core-foundations/config';
import type { LoaderSize } from '@mszczygiel-projects/ui-core-shared/loader';
import type { ComponentType } from 'react';

/** The token-based size given to a custom React loader. */
export interface CustomLoaderProps {
  readonly size: LoaderSize;
}

type ReactLoader = ComponentType<CustomLoaderProps>;

const ADAPTER_KEY = Symbol.for('ui-core.loader.react');

/** Defines a decorative React visual and its optional static counterpart for reduced motion. */
export function defineReactLoader(
  component: ReactLoader,
  reducedMotion?: ReactLoader,
): LoaderVariantDefinition {
  return { [ADAPTER_KEY]: { component, reducedMotion } };
}

/** Recovers the typed presentation stored by the React adapter. */
export function reactLoaderPresentation(
  definition: LoaderVariantDefinition | undefined,
): LoaderPresentation<ReactLoader> | undefined {
  return definition?.[ADAPTER_KEY] as LoaderPresentation<ReactLoader> | undefined;
}
