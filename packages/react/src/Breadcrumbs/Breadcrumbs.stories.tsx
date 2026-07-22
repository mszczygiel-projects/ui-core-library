import type { Meta, StoryObj } from '@storybook/react';
import { IconHome } from '@mszczygiel-projects/ui-core-icons/react';
import { Breadcrumbs } from './Breadcrumbs.js';
import type { BreadcrumbsItem } from './Breadcrumbs.js';

const TRAIL: BreadcrumbsItem[] = [
  { label: 'Home', href: '#/', icon: <IconHome /> },
  { label: 'Products', href: '#/products' },
  { label: 'Category', href: '#/products/category' },
  { label: 'Widget' },
];

const meta: Meta<typeof Breadcrumbs> = {
  title: 'React/Breadcrumbs',
  component: Breadcrumbs,
  argTypes: {
    size: { control: 'select', options: ['small', 'medium'] },
    separator: { control: 'select', options: ['chevron', 'slash'] },
  },
  args: {
    items: TRAIL,
    size: 'medium',
    separator: 'chevron',
  },
};

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

const Column = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
    {children}
  </div>
);

export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <Column>
      <Breadcrumbs {...args} size="small" />
      <Breadcrumbs {...args} size="medium" />
    </Column>
  ),
};

export const Separators: Story = {
  render: (args) => (
    <Column>
      <Breadcrumbs {...args} separator="chevron" />
      <Breadcrumbs {...args} separator="slash" />
    </Column>
  ),
};

/** Two crumbs never collapse — there is nothing to hide behind the ellipsis. */
export const ShortTrail: Story = {
  args: { items: [{ label: 'Home', href: '#/' }, { label: 'Widget' }] },
};

/** A crumb without `href` stays plain text — it is a step, not a link. */
export const NonNavigableStep: Story = {
  args: {
    items: [
      { label: 'Home', href: '#/', icon: <IconHome /> },
      { label: 'Archive' },
      { label: 'Widget' },
    ],
  },
};

/** Resize the preview below 48rem to see the trail collapse to "… / parent / current". */
export const LongTrail: Story = {
  args: {
    items: [
      { label: 'Home', href: '#/', icon: <IconHome /> },
      { label: 'Products', href: '#/products' },
      { label: 'Outdoor', href: '#/products/outdoor' },
      { label: 'Camping', href: '#/products/outdoor/camping' },
      { label: 'Tents', href: '#/products/outdoor/camping/tents' },
      { label: 'Four season expedition tent' },
    ],
  },
};

/** Client-side routing: cancel the browser navigation and handle it yourself. */
export const ClientSideRouting: Story = {
  render: (args) => (
    <Breadcrumbs
      {...args}
      onSelect={(item, index, event) => {
        event.preventDefault();
        console.log('navigate to', item.href, 'at index', index);
      }}
    />
  ),
};

export const OnSurfaces: Story = {
  render: (args) => (
    <Column>
      {(['default', 'subtle', 'inverse', 'primary'] as const).map((surface) => (
        <div
          key={surface}
          data-surface={surface === 'default' ? undefined : surface}
          style={{ backgroundColor: 'var(--color-background-default)', padding: 16, width: '100%' }}
        >
          <Breadcrumbs {...args} />
        </div>
      ))}
    </Column>
  ),
};
