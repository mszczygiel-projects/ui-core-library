import { createElement, useEffect, useRef, type ComponentType, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { BreadcrumbsItem } from './breadcrumbs.js';
import './breadcrumbs.js';

const TRAIL: BreadcrumbsItem[] = [
  { label: 'Home', href: '#/', icon: 'icon-home' },
  { label: 'Products', href: '#/products' },
  { label: 'Category', href: '#/products/category' },
  { label: 'Widget' },
];

type BreadcrumbsArgs = {
  size?: string;
  separator?: string;
  label?: string;
  items?: BreadcrumbsItem[];
};

/**
 * `items` is an array property, not an attribute — React 18 would stringify it,
 * so it is assigned imperatively through a ref.
 */
function BreadcrumbsWC(props: BreadcrumbsArgs) {
  const ref = useRef<HTMLElement & { items: BreadcrumbsItem[] }>(null);

  useEffect(() => {
    if (ref.current) ref.current.items = props.items ?? TRAIL;
  }, [props.items]);

  return createElement('ui-breadcrumbs', {
    ref,
    'data-size': props.size,
    separator: props.separator,
    label: props.label,
  });
}

const meta: Meta<BreadcrumbsArgs> = {
  title: 'Web Components/Breadcrumbs',
  // Tag-name string routes autodocs to the CEM extractor (see .storybook/preview.ts).
  component: 'ui-breadcrumbs' as unknown as ComponentType,
  argTypes: {
    size: { control: 'select', options: ['small', 'medium'] },
    separator: { control: 'select', options: ['chevron', 'slash'] },
    label: { control: 'text' },
  },
  args: {
    size: 'medium',
    separator: 'chevron',
  },
};

export default meta;
type Story = StoryObj<BreadcrumbsArgs>;

const column = (...children: ReactNode[]) =>
  createElement(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' } },
    ...children,
  );

export const Playground: Story = {
  render: (args) => createElement(BreadcrumbsWC, args),
};

export const Sizes: Story = {
  render: (args) =>
    column(
      createElement(BreadcrumbsWC, { ...args, size: 'small', key: 'small' }),
      createElement(BreadcrumbsWC, { ...args, size: 'medium', key: 'medium' }),
    ),
};

export const Separators: Story = {
  render: (args) =>
    column(
      createElement(BreadcrumbsWC, { ...args, separator: 'chevron', key: 'chevron' }),
      createElement(BreadcrumbsWC, { ...args, separator: 'slash', key: 'slash' }),
    ),
};

/** Two crumbs never collapse — there is nothing to hide behind the ellipsis. */
export const ShortTrail: Story = {
  render: (args) =>
    createElement(BreadcrumbsWC, {
      ...args,
      items: [{ label: 'Home', href: '#/' }, { label: 'Widget' }],
    }),
};

/** A crumb without `href` stays plain text — it is a step, not a link. */
export const NonNavigableStep: Story = {
  render: (args) =>
    createElement(BreadcrumbsWC, {
      ...args,
      items: [
        { label: 'Home', href: '#/', icon: 'icon-home' },
        { label: 'Archive' },
        { label: 'Widget' },
      ],
    }),
};

/** Resize the preview below 48rem to see the trail collapse to "… / parent / current". */
export const LongTrail: Story = {
  render: (args) =>
    createElement(BreadcrumbsWC, {
      ...args,
      items: [
        { label: 'Home', href: '#/', icon: 'icon-home' },
        { label: 'Products', href: '#/products' },
        { label: 'Outdoor', href: '#/products/outdoor' },
        { label: 'Camping', href: '#/products/outdoor/camping' },
        { label: 'Tents', href: '#/products/outdoor/camping/tents' },
        { label: 'Four season expedition tent' },
      ],
    }),
};

export const OnSurfaces: Story = {
  render: (args) =>
    column(
      ...['default', 'subtle', 'inverse', 'primary'].map((surface) =>
        createElement(
          'div',
          {
            key: surface,
            'data-surface': surface === 'default' ? undefined : surface,
            style: {
              backgroundColor: 'var(--color-background-default)',
              padding: 16,
              width: '100%',
            },
          },
          createElement(BreadcrumbsWC, args),
        ),
      ),
    ),
};
