import { Breadcrumbs } from '@mszczygiel-projects/ui-core-react';
import { breadcrumbs } from '@mszczygiel-projects/ui-core-shared/breadcrumbs';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { forEachSurface } from '../decorators.tsx';
import { trail } from './trail.ts';

const { options } = breadcrumbs;

/** The trail of the stories, its first item with a home icon as a React node. */
const items = trail.map(({ icon, ...item }) =>
  icon === undefined
    ? item
    : { ...item, icon: <span dangerouslySetInnerHTML={{ __html: icon }} /> },
);

const meta = {
  title: 'Components/Navigation/Breadcrumbs/React',
  component: Breadcrumbs,
  args: {
    items,
    size: options.size.default,
    separator: options.separator.default,
    // The stories stay on their page: a press on a link only logs the event.
    onNavigate: (details) => {
      details.originalEvent.preventDefault();
    },
  },
  argTypes: {
    items: { control: false },
    label: { control: 'text' },
    size: { control: 'inline-radio', options: options.size.options },
    separator: { control: 'inline-radio', options: options.separator.options },
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A container narrower than breakpoint/sm, where the items before the last two collapse. */
export const Collapsed: Story = {
  render: (args) => (
    <div style={{ inlineSize: '20rem' }}>
      <Breadcrumbs {...args} />
    </div>
  ),
};

/** Each trail is named after its surface, since a page names every navigation apart. */
export const OnSurfaces: Story = {
  render: (args) =>
    forEachSurface((surface) => <Breadcrumbs {...args} label={`Breadcrumb, ${surface}`} />),
};
