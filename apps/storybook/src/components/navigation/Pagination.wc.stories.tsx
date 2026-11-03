import '@mszczygiel-projects/ui-core-web-components/pagination';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { forEachSurface } from '../decorators.tsx';
import { htmlOf } from '../html.ts';

interface PaginationArgs {
  readonly page: number;
  readonly pageCount: number;
  readonly siblingCount: number;
  readonly boundaryCount: number;
  readonly disabled: boolean;
  readonly showStatus: boolean;
  readonly showJump: boolean;
  readonly label?: string;
  readonly previousLabel?: string;
  readonly nextLabel?: string;
  readonly jumpLabel?: string;
}

const source = (args: PaginationArgs) =>
  htmlOf('ui-pagination', {
    page: args.page === 1 ? undefined : args.page,
    'page-count': args.pageCount,
    'sibling-count': args.siblingCount === 1 ? undefined : args.siblingCount,
    'boundary-count': args.boundaryCount === 1 ? undefined : args.boundaryCount,
    disabled: args.disabled,
    'show-status': args.showStatus,
    'show-jump': args.showJump,
    label: args.label,
    'previous-label': args.previousLabel,
    'next-label': args.nextLabel,
    'jump-label': args.jumpLabel,
  });

const meta = {
  title: 'Components/Navigation/Pagination/Web Component',
  tags: ['!manifest'],
  args: {
    page: 5,
    pageCount: 10,
    siblingCount: 1,
    boundaryCount: 1,
    disabled: false,
    showStatus: false,
    showJump: false,
  },
  argTypes: {
    page: { control: 'number' },
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
  },
  render: (args) => <ui-pagination {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: PaginationArgs }) => source(args),
      },
    },
  },
} satisfies Meta<PaginationArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = { args: { showStatus: true, showJump: true } };

/** Each control is named after its surface, since a page names every navigation apart. */
export const OnSurfaces: Story = {
  args: { showStatus: true },
  render: (args) =>
    forEachSurface((surface) => <ui-pagination {...args} label={`Pagination, ${surface}`} />),
};
