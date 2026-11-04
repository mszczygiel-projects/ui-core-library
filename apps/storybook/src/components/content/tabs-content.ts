import type { IconName } from '../icons.ts';

/** The views of a product page, the content tabs usually hold. */
export const TABS = [
  {
    value: 'overview',
    label: 'Overview',
    icon: 'iconHome',
    content: 'A light jacket for wind and rain, with taped seams and a packable hood.',
  },
  {
    value: 'details',
    label: 'Details',
    icon: 'iconInfo',
    content: 'Recycled polyester shell, two zipped pockets, and a weight of 280 grams.',
  },
  {
    value: 'reviews',
    label: 'Reviews',
    icon: 'iconStar',
    content: 'Buyers rate it 4.6 out of 5 for comfort and fit.',
  },
] as const satisfies readonly {
  value: string;
  label: string;
  icon: IconName;
  content: string;
}[];

/** More views than a narrow screen fits in one row. */
export const MANY_TABS = [
  ...TABS,
  { value: 'sizes', label: 'Size guide', icon: 'iconUser', content: 'Sizes run true to fit.' },
  { value: 'care', label: 'Care', icon: 'iconRefresh', content: 'Machine wash at 30 degrees.' },
  {
    value: 'shipping',
    label: 'Shipping and returns',
    icon: 'iconCart',
    content: 'Free shipping over 50 euro, and thirty days to return.',
  },
] as const;
