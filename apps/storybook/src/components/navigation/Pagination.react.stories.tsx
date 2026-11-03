import { Pagination } from '@mszczygiel-projects/ui-core-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ComponentProps, useState } from 'react';

import { forEachSurface } from '../decorators.tsx';

/** A controlled control that keeps a link from leaving the story and shows its address. */
function LinkedPagination(args: ComponentProps<typeof Pagination>) {
  const [page, setPage] = useState(args.defaultPage ?? 1);
  const [address, setAddress] = useState<string>();
  return (
    <div className="sb-stack">
      <Pagination
        {...args}
        page={page}
        onPageChange={(next, details) => {
          details.originalEvent.preventDefault();
          setPage(next);
          setAddress(details.href);
        }}
      />
      <output>{address}</output>
    </div>
  );
}

const meta = {
  title: 'Components/Navigation/Pagination/React',
  component: Pagination,
  args: {
    pageCount: 10,
    defaultPage: 5,
    siblingCount: 1,
    boundaryCount: 1,
    disabled: false,
    showStatus: false,
    showJump: false,
  },
  argTypes: {
    page: { control: false },
    defaultPage: { control: 'number' },
    pageCount: { control: 'number' },
    siblingCount: { control: 'number' },
    boundaryCount: { control: 'number' },
    disabled: { control: 'boolean' },
    showStatus: { control: 'boolean' },
    showJump: { control: 'boolean' },
    label: { control: 'text' },
    previousLabel: { control: 'text' },
    nextLabel: { control: 'text' },
    jumpLabel: { control: 'text' },
    getPageHref: { control: false },
  },
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithStatus: Story = { args: { showStatus: true } };

/** In a container narrower than breakpoint/sm the field replaces the pages and the status. */
export const WithJump: Story = {
  args: { showStatus: true, showJump: true },
  render: (args) => (
    <div className="sb-stack">
      <Pagination {...args} label="Pagination, wide" />
      <div style={{ inlineSize: '20rem' }}>
        <Pagination {...args} label="Pagination, narrow" />
      </div>
    </div>
  ),
};

/** Pages as links that a crawler can follow; the story keeps them from leaving the page. */
export const WithLinks: Story = {
  args: { getPageHref: (page) => `?page=${String(page)}` },
  render: (args) => <LinkedPagination {...args} />,
};

/** Each control is named after its surface, since a page names every navigation apart. */
export const OnSurfaces: Story = {
  args: { showStatus: true },
  render: (args) =>
    forEachSurface((surface) => <Pagination {...args} label={`Pagination, ${surface}`} />),
};
