'use client';

import { iconChevronRight } from '@mszczygiel-projects/ui-core-icons';
import {
  breadcrumbs,
  type BreadcrumbsItem,
  type BreadcrumbsNavigateDetails,
  type BreadcrumbsProps as SharedBreadcrumbsProps,
  type BreadcrumbsSeparator,
  type BreadcrumbsSize,
} from '@mszczygiel-projects/ui-core-shared/breadcrumbs';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import { classNames } from '../internal/class-names.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';

export type { BreadcrumbsItem, BreadcrumbsSeparator, BreadcrumbsSize };

const { options } = breadcrumbs;

/** The props of Breadcrumbs. Other attributes of a `nav`, the ref among them, go to its root. */
export interface BreadcrumbsProps
  extends
    SharedBreadcrumbsProps<ReactNode>,
    Omit<ComponentPropsWithRef<'nav'>, keyof SharedBreadcrumbsProps> {
  /**
   * Called when a user presses the link of an item. Call `preventDefault()` on the original
   * event to keep the browser from following the link, as a page with client-side routing does.
   */
  onNavigate?: (details: BreadcrumbsNavigateDetails<MouseEvent, ReactNode>) => void;
}

/**
 * A trail of links from the top of a site down to the current page.
 *
 * A navigation landmark holds an ordered list of the items. The last item is the current page:
 * text with `aria-current="page"`, never a link. An item with `href` is a link, and one without
 * is text. In a container narrower than `breakpoint/sm` the items before the last two hide behind
 * an ellipsis; they stay in the accessibility tree. The separators are decorative and follow the
 * direction of the text. An `aria-label` names the navigation instead of the label.
 */
export function Breadcrumbs({
  items = [],
  label,
  size = 'medium',
  separator = 'chevron',
  onNavigate,
  className,
  'aria-label': ariaLabel,
  ...rest
}: BreadcrumbsProps) {
  const { labels } = useUiCoreConfig();
  const sizeClass = oneOf(size, options.size.options, options.size.default);
  const separatorClass = oneOf(separator, options.separator.options, options.separator.default);
  // The items before the last two hide in a narrow container, so a trail of two never does.
  const hidden = Math.max(items.length - 2, 0);
  const mark = (
    <span
      className="ui-breadcrumbs__separator"
      aria-hidden="true"
      dangerouslySetInnerHTML={
        separatorClass === 'chevron' ? { __html: iconChevronRight } : undefined
      }
    />
  );
  return (
    <nav
      className={classNames(
        'ui-breadcrumbs',
        'ui-breadcrumbs__base',
        `ui-breadcrumbs--${sizeClass}`,
        `ui-breadcrumbs--${separatorClass}`,
        className,
      )}
      aria-label={ariaLabel ?? label ?? labels.breadcrumbs.label}
      {...rest}
    >
      <ol className="ui-breadcrumbs__list">
        {hidden > 0 && (
          <li className="ui-breadcrumbs__item ui-breadcrumbs__item--ellipsis" aria-hidden="true">
            <span className="ui-breadcrumbs__ellipsis" />
            {mark}
          </li>
        )}
        {items.map((item, index) => {
          const last = index === items.length - 1;
          const content = (
            <>
              {item.icon !== undefined && item.icon !== null && item.icon !== false && (
                <span className="ui-breadcrumbs__item-icon" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span className="ui-breadcrumbs__item-label">{item.label}</span>
            </>
          );
          let node: ReactNode;
          if (last) {
            node = (
              <span className="ui-breadcrumbs__current" aria-current="page">
                {content}
              </span>
            );
          } else if (typeof item.href !== 'string' || item.href === '') {
            node = <span className="ui-breadcrumbs__text">{content}</span>;
          } else {
            node = (
              <a
                className="ui-breadcrumbs__link"
                href={item.href}
                onClick={(event) => {
                  onNavigate?.({ item, index, originalEvent: event.nativeEvent });
                }}
              >
                {content}
              </a>
            );
          }
          return (
            // The trail has no ids, and its order is its meaning.
            <li
              key={index}
              className={classNames(
                'ui-breadcrumbs__item',
                index < hidden && 'ui-breadcrumbs__item--collapsible',
              )}
            >
              {node}
              {!last && mark}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
