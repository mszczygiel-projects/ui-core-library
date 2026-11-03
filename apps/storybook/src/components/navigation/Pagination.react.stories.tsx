import { Pagination } from '@mszczygiel-projects/ui-core-react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { forEachSurface } from '../decorators.tsx';

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

export const Playground: Story = {
  args: { showStatus: true, showJump: true },
};

/** Each control is named after its surface, since a page names every navigation apart. */
export const OnSurfaces: Story = {
  args: { showStatus: true },
  render: (args) =>
    forEachSurface((surface) => <Pagination {...args} label={`Pagination, ${surface}`} />),
};
