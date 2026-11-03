import '@mszczygiel-projects/ui-core-web-components/breadcrumbs';

import {
  breadcrumbs,
  type BreadcrumbsSeparator,
  type BreadcrumbsSize,
} from '@mszczygiel-projects/ui-core-shared/breadcrumbs';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { forEachSurface } from '../decorators.tsx';
import { htmlOf } from '../html.ts';
import { trail } from './trail.ts';

interface BreadcrumbsArgs {
  readonly label?: string;
  readonly size: BreadcrumbsSize;
  readonly separator: BreadcrumbsSeparator;
}

const { options } = breadcrumbs;

/** The trail goes in as a property, and a press on a link only logs the event. */
function UiBreadcrumbs(args: BreadcrumbsArgs) {
  return (
    <ui-breadcrumbs
      {...args}
      items={trail}
      onui-navigate={(event) => {
        event.preventDefault();
      }}
    />
  );
}

/** The HTML of the component, which the code panel shows, with the script that sets the items. */
const source = (args: BreadcrumbsArgs) =>
  `${htmlOf('ui-breadcrumbs', {
    label: args.label,
    size: args.size === options.size.default ? undefined : args.size,
    separator: args.separator === options.separator.default ? undefined : args.separator,
  })}
<script type="module">
  document.querySelector('ui-breadcrumbs').items = [
    { label: 'Home', href: '/', icon: iconHome, iconOnly: true },
    { label: 'Products', href: '/products' },
    { label: 'Category', href: '/products/category' },
    { label: 'Widget' },
  ];
</script>`;

const meta = {
  title: 'Components/Navigation/Breadcrumbs/Web Component',
  tags: ['!manifest'],
  args: { size: options.size.default, separator: options.separator.default },
  argTypes: {
    label: { control: 'text' },
    size: { control: 'inline-radio', options: options.size.options },
    separator: { control: 'inline-radio', options: options.separator.options },
  },
  render: (args) => <UiBreadcrumbs {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: BreadcrumbsArgs }) => source(args),
      },
    },
  },
} satisfies Meta<BreadcrumbsArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A container narrower than breakpoint/sm, where the items before the last two collapse. */
export const Collapsed: Story = {
  render: (args) => (
    <div style={{ inlineSize: '20rem' }}>
      <UiBreadcrumbs {...args} />
    </div>
  ),
};

/** Each trail is named after its surface, since a page names every navigation apart. */
export const OnSurfaces: Story = {
  render: (args) =>
    forEachSurface((surface) => <UiBreadcrumbs {...args} label={`Breadcrumb, ${surface}`} />),
};
