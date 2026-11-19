'use client';

import type { LoaderPresentation } from '@mszczygiel-projects/ui-core-foundations/config';
import { getReducedMotionStore } from '@mszczygiel-projects/ui-core-foundations/motion-preference';
import {
  loader,
  type LoaderProps as SharedLoaderProps,
  type LoaderSize,
} from '@mszczygiel-projects/ui-core-shared/loader';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import { type ComponentPropsWithRef, type ComponentType, useSyncExternalStore } from 'react';

import { classNames } from '../internal/class-names.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';
import { type CustomLoaderProps, reactLoaderPresentation } from './define-react-loader.ts';

export type { LoaderSize };

/** The props of {@link Loader}. Other attributes of a `span` go to its root element. */
export interface LoaderProps
  extends
    SharedLoaderProps,
    Omit<ComponentPropsWithRef<'span'>, keyof SharedLoaderProps | 'children'> {}

const browserReducedMotion = () => getReducedMotionStore(window).getSnapshot();
const serverReducedMotion = () => undefined;
const subscribeToReducedMotion = (listener: () => void) =>
  getReducedMotionStore(window).subscribe(listener);

function CustomIndicator({
  presentation,
  size,
}: {
  readonly presentation: LoaderPresentation<ComponentType<CustomLoaderProps>>;
  readonly size: LoaderSize;
}) {
  // The server and first hydration render use the spinner until the preference is known.
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    browserReducedMotion,
    serverReducedMotion,
  );

  const Visual =
    reducedMotion === undefined
      ? undefined
      : reducedMotion
        ? presentation.reducedMotion
        : presentation.component;
  return Visual === undefined ? (
    <span className="ui-loader__indicator ui-loader__indicator--fallback" />
  ) : (
    <span aria-hidden="true" inert className="ui-loader__indicator ui-loader__indicator--custom">
      <Visual size={size} />
    </span>
  );
}

/**
 * Shows that content is loading or that an action is in progress.
 *
 * The loader is a progress indicator without a value, named by `label`. An `aria-label` passed
 * as a prop wins over it, and so do the other attributes of the root element. It draws the look
 * that `loaderVariant` of `configureUiCore` chooses.
 */
export function Loader({ size, label, className, ...rest }: LoaderProps) {
  const { labels, loader: customLoader } = useUiCoreConfig();
  const visualSize = oneOf(size, loader.options.size.options, loader.options.size.default);
  const presentation = reactLoaderPresentation(customLoader);
  return (
    <span
      role="progressbar"
      aria-label={label ?? labels.loader.label}
      className={classNames('ui-loader', `ui-loader--${visualSize}`, className)}
      {...rest}
    >
      {presentation === undefined ? (
        <span className="ui-loader__indicator" />
      ) : (
        <CustomIndicator presentation={presentation} size={visualSize} />
      )}
    </span>
  );
}
