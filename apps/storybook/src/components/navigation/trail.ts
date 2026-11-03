import { iconHome } from '@mszczygiel-projects/ui-core-icons';
import type { BreadcrumbsItem } from '@mszczygiel-projects/ui-core-shared/breadcrumbs';

/** The trail of the Breadcrumbs stories, its first item with a home icon as an SVG string. */
export const trail: readonly BreadcrumbsItem<string>[] = [
  { label: 'Home', href: '#home', icon: iconHome },
  { label: 'Products', href: '#products' },
  { label: 'Category', href: '#category' },
  { label: 'Widget' },
];
