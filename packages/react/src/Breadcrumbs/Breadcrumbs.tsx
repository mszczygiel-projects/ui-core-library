import type { AriaAttributes, CSSProperties, MouseEvent, ReactNode } from 'react';
import { IconChevronRight } from '@mszczygiel-projects/ui-core-icons/react';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';
import { pickAriaProps } from '../aria.js';
import './Breadcrumbs.css';

export type BreadcrumbsSize = 'small' | 'medium';
export type BreadcrumbsSeparator = 'chevron' | 'slash';

export interface BreadcrumbsItem {
  /** Visible text of the crumb. */
  label: string;
  /**
   * Target URL. A crumb without one renders as plain text — a breadcrumb that
   * navigates should always be a real link, so keyboard and middle-click work.
   */
  href?: string;
  /** Leading icon, rendered before the label. */
  icon?: ReactNode;
}

/**
 * Hierarchical navigation trail. The last item is always the current page: it
 * renders as plain text with `aria-current="page"` and never links.
 *
 * Responsive by itself — the trail wraps when it runs out of room, and below the
 * `48rem` breakpoint it collapses to a leading `…` plus the last two crumbs. The
 * collapsed crumbs leave the layout but stay in the accessibility tree, so the
 * full path is still announced.
 *
 * @example
 * <Breadcrumbs
 *   items={[
 *     { label: 'Home', href: '/', icon: <IconHome /> },
 *     { label: 'Products', href: '/products' },
 *     { label: 'Widget' },
 *   ]}
 * />
 */
export interface BreadcrumbsProps extends AriaAttributes {
  /** The trail, root first. The last entry is the current page. */
  items: BreadcrumbsItem[];
  /**
   * Typography and icon scale.
   * @default 'medium'
   */
  size?: BreadcrumbsSize;
  /**
   * Mark drawn between crumbs.
   * @default 'chevron'
   */
  separator?: BreadcrumbsSeparator;
  /**
   * Called when a linked crumb is clicked. Call `event.preventDefault()` to
   * suppress the browser's navigation and route client-side instead.
   */
  onSelect?: (item: BreadcrumbsItem, index: number, event: MouseEvent<HTMLAnchorElement>) => void;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

export function Breadcrumbs({
  items,
  size = 'medium',
  separator = 'chevron',
  onSelect,
  className,
  style,
  'aria-label': ariaLabel,
  ...aria
}: BreadcrumbsProps) {
  if (items.length === 0) return null;

  const lastIndex = items.length - 1;
  const labels = getUiCoreConfig().labels.breadcrumbs;

  const renderSeparator = () => (
    <span className="ui-breadcrumbs__separator" aria-hidden="true">
      {separator === 'slash' ? '/' : <IconChevronRight />}
    </span>
  );

  const renderIcon = (item: BreadcrumbsItem) =>
    item.icon == null ? null : <span className="ui-breadcrumbs__icon">{item.icon}</span>;

  return (
    <nav
      {...pickAriaProps(aria)}
      aria-label={ariaLabel ?? labels.label}
      className={[
        'ui-breadcrumbs',
        `ui-breadcrumbs--${size}`,
        `ui-breadcrumbs--${separator}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <ol className="ui-breadcrumbs__list">
        {items.length > 2 && (
          <li className="ui-breadcrumbs__ellipsis" aria-hidden="true">
            <span className="ui-breadcrumbs__ellipsis-mark">…</span>
            {renderSeparator()}
          </li>
        )}
        {items.map((item, index) => {
          const isCurrent = index === lastIndex;
          return (
            <li key={`${item.label}-${index}`} className="ui-breadcrumbs__item">
              {!isCurrent && item.href ? (
                <a
                  className="ui-breadcrumbs__link"
                  href={item.href}
                  onClick={(event) => onSelect?.(item, index, event)}
                >
                  {renderIcon(item)}
                  <span className="ui-breadcrumbs__label">{item.label}</span>
                </a>
              ) : (
                <span
                  className={[
                    'ui-breadcrumbs__crumb',
                    isCurrent && 'ui-breadcrumbs__crumb--current',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {renderIcon(item)}
                  <span className="ui-breadcrumbs__label">{item.label}</span>
                </span>
              )}
              {!isCurrent && renderSeparator()}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
