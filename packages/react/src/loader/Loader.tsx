'use client';

import type { LoaderVariant } from '@mszczygiel-projects/ui-core-foundations/config';
import {
  loader,
  type LoaderProps as SharedLoaderProps,
  type LoaderSize,
} from '@mszczygiel-projects/ui-core-shared/loader';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import type { ComponentPropsWithRef, ReactElement } from 'react';

import { classNames } from '../internal/class-names.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';

export type { LoaderSize };

/** The props of {@link Loader}. Other attributes of a `span` go to its root element. */
export interface LoaderProps
  extends
    SharedLoaderProps,
    Omit<ComponentPropsWithRef<'span'>, keyof SharedLoaderProps | 'children'> {}

/** The markup of each look of a loader, chosen by `loaderVariant` in the configuration. */
const looks: Readonly<Record<LoaderVariant, () => ReactElement>> = {
  spinner: () => <span className="ui-loader__indicator" />,
};

/**
 * Shows that content is loading or that an action is in progress.
 *
 * The loader is a progress indicator without a value, named by `label`. An `aria-label` passed
 * as a prop wins over it, and so do the other attributes of the root element. It draws the look
 * that `loaderVariant` of `configureUiCore` chooses.
 */
export function Loader({ size = 'medium', label, className, ...rest }: LoaderProps) {
  const { labels, loaderVariant } = useUiCoreConfig();
  return (
    <span
      role="progressbar"
      aria-label={label ?? labels.loader.label}
      className={classNames(
        'ui-loader',
        `ui-loader--${oneOf(size, loader.options.size.options, loader.options.size.default)}`,
        className,
      )}
      {...rest}
    >
      {looks[loaderVariant]()}
    </span>
  );
}
