import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Pagination, type PaginationProps } from './Pagination.js';

const meta: Meta<typeof Pagination> = {
  title: 'React/Pagination',
  component: Pagination,
  argTypes: {
    currentPage: { control: { type: 'number', min: 1 } },
    totalPages: { control: { type: 'number', min: 1 } },
    siblingCount: { control: { type: 'number', min: 0 } },
    hideJumpToPage: { control: 'boolean' },
    jumpLabel: { control: 'text' },
    prevLabel: { control: 'text' },
    nextLabel: { control: 'text' },
    pageLabel: { control: 'text' },
    onChange: { control: false },
    onJumpToPage: { control: false },
    getItemAriaLabel: { control: false },
  },
  args: {
    currentPage: 5,
    totalPages: 10,
    siblingCount: 1,
    hideJumpToPage: false,
  },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

/** Stateful wrapper — the component is controlled-only. */
function Controlled({ withLabel = true, ...args }: PaginationProps & { withLabel?: boolean }) {
  const [page, setPage] = useState(args.currentPage);
  return (
    <Pagination
      {...args}
      currentPage={page}
      onChange={setPage}
      pageLabel={withLabel ? (args.pageLabel ?? `Page ${page} of ${args.totalPages}`) : undefined}
    />
  );
}

export const Default: Story = {
  render: (args) => <Controlled {...args} />,
};

export const WithoutPageLabel: Story = {
  render: (args) => <Controlled {...args} withLabel={false} />,
};

export const HiddenJump: Story = {
  args: { hideJumpToPage: true },
  render: (args) => <Controlled {...args} />,
};

export const Boundaries: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <Controlled {...args} currentPage={1} />
      <Controlled {...args} currentPage={args.totalPages} />
    </div>
  ),
};

export const LongRange: Story = {
  args: { currentPage: 25, totalPages: 50, siblingCount: 2 },
  render: (args) => <Controlled {...args} />,
};

export const MobileViewport: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: (args) => <Controlled {...args} />,
};

export const OnSurfaces: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16 }}>
      {([undefined, 'subtle', 'inverse', 'primary'] as const).map((surface) => (
        <div
          key={surface ?? 'default'}
          data-surface={surface}
          style={{ padding: 16, backgroundColor: 'var(--color-background-default)' }}
        >
          <Controlled {...args} />
        </div>
      ))}
    </div>
  ),
};
