import { Badge } from '@mszczygiel-projects/ui-core-react';
import { badge } from '@mszczygiel-projects/ui-core-shared/badge';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { iconOptions, svgMap } from '../icons.ts';

const { options } = badge;

/** Every icon as a node for the leading prop, its SVG string from the icons package only. */
const iconNodes = Object.fromEntries(
  iconOptions.map((name) => [
    name,
    <span key={name} dangerouslySetInnerHTML={{ __html: svgMap[name] }} />,
  ]),
);

const meta = {
  title: 'Components/Feedback/Badge/React',
  component: Badge,
  args: {
    children: 'Active',
    tone: options.tone.default,
    variant: options.variant.default,
    size: options.size.default,
    shape: options.shape.default,
  },
  argTypes: {
    children: { control: 'text' },
    leading: { control: 'select', options: iconOptions, mapping: iconNodes },
    trailing: { control: false },
    tone: { control: 'select', options: options.tone.options },
    variant: { control: 'inline-radio', options: options.variant.options },
    size: { control: 'inline-radio', options: options.size.options },
    shape: { control: 'inline-radio', options: options.shape.options },
    label: { control: 'text' },
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-stack">
      {options.variant.options.map((variant) => (
        <div key={variant} className="sb-row">
          {options.tone.options.map((tone) => (
            <Badge key={tone} {...args} tone={tone} variant={variant}>
              {tone}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Shapes: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.shape.options.map((shape) =>
        options.size.options.map((size) => (
          <Badge key={`${shape}-${size}`} {...args} shape={shape} size={size}>
            {`${shape} ${size}`}
          </Badge>
        )),
      )}
    </div>
  ),
};

export const WithIcon: Story = {
  render: (args) => (
    <div className="sb-row">
      <Badge {...args} tone="success" leading={iconNodes['iconCheck']}>
        Verified
      </Badge>
      <Badge {...args} tone="success" leading={iconNodes['iconCheck']} label="Verified">
        {undefined}
      </Badge>
    </div>
  ),
};

export const StatusDot: Story = {
  render: (args) => (
    <div className="sb-row">
      <Badge {...args} tone="success" variant="subtle" leading={<span className="sb-status-dot" />}>
        Live
      </Badge>
      <Badge
        {...args}
        tone="warning"
        variant="subtle"
        trailing={<span className="sb-status-dot" />}
      >
        Draft
      </Badge>
    </div>
  ),
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
