import type { Meta, StoryObj } from '@storybook/react';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import * as Icons from '@mszczygiel-projects/ui-core-icons/react';
import { Badge } from './Badge.js';
import type { BadgeAppearance, BadgeShape, BadgeSize, BadgeVariant } from './Badge.js';

type IconName = keyof typeof svgMap;

const iconOptions = Object.keys(svgMap) as IconName[];

type BadgeStoryArgs = Omit<React.ComponentProps<typeof Badge>, 'icon'> & {
  icon?: IconName | '';
};

const toIconExportName = (name: IconName) =>
  name
    .split('-')
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const renderIcon = (name?: IconName | '') => {
  if (!name) {
    return undefined;
  }

  const IconComponent = Icons[toIconExportName(name) as keyof typeof Icons];

  return IconComponent ? <IconComponent /> : undefined;
};

const renderBadge = ({ icon, children, ...args }: BadgeStoryArgs) => (
  <Badge {...args} icon={renderIcon(icon)}>
    {children}
  </Badge>
);

const meta: Meta<BadgeStoryArgs> = {
  title: 'React/Badge',
  component: Badge,
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'brand', 'success', 'warning', 'error', 'info'],
    },
    appearance: {
      control: 'select',
      options: ['solid', 'subtle'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium'],
    },
    shape: {
      control: 'select',
      options: ['rounded', 'square'],
    },
    children: { control: 'text' },
    icon: {
      control: 'select',
      options: ['', ...iconOptions],
    },
  },
  args: {
    variant: 'neutral',
    appearance: 'solid',
    size: 'small',
    shape: 'rounded',
    children: 'Badge',
    icon: '',
  },
};

export default meta;
type Story = StoryObj<BadgeStoryArgs>;

const variants: BadgeVariant[] = ['neutral', 'brand', 'success', 'warning', 'error', 'info'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const rowStyle = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } as const;

const variantRow = (
  appearance: BadgeAppearance,
  size?: BadgeSize,
  shape?: BadgeShape,
  icon?: IconName | '',
) => (
  <div style={rowStyle}>
    {variants.map((variant) => (
      <Badge
        key={variant}
        variant={variant}
        appearance={appearance}
        size={size}
        shape={shape}
        icon={renderIcon(icon)}
      >
        {cap(variant)}
      </Badge>
    ))}
  </div>
);

export const Playground: Story = {
  render: renderBadge,
};

export const SolidVariants: Story = {
  render: ({ size, shape }) => variantRow('solid', size, shape),
};

export const SubtleVariants: Story = {
  render: ({ size, shape }) => variantRow('subtle', size, shape),
};

export const Sizes: Story = {
  render: ({ variant, appearance, shape }) => (
    <div style={rowStyle}>
      <Badge variant={variant} appearance={appearance} size="small" shape={shape}>
        Small
      </Badge>
      <Badge variant={variant} appearance={appearance} size="medium" shape={shape}>
        Medium
      </Badge>
    </div>
  ),
};

export const Shapes: Story = {
  render: ({ variant, appearance, size }) => (
    <div style={rowStyle}>
      <Badge variant={variant} appearance={appearance} size={size} shape="rounded">
        Rounded
      </Badge>
      <Badge variant={variant} appearance={appearance} size={size} shape="square">
        Square
      </Badge>
    </div>
  ),
};

export const WithIcon: Story = {
  args: { icon: 'icon-info' },
  render: ({ size, shape, appearance, icon }) => variantRow(appearance ?? 'solid', size, shape, icon),
};

export const IconOnly: Story = {
  args: { icon: 'icon-info' },
  render: ({ size, shape, appearance, icon }) => (
    <div style={rowStyle}>
      {variants.map((variant) => (
        <Badge
          key={variant}
          variant={variant}
          appearance={appearance}
          size={size}
          shape={shape}
          icon={renderIcon(icon)}
          aria-label={cap(variant)}
        />
      ))}
    </div>
  ),
};

export const OnSurfaces: Story = {
  render: ({ size, shape }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
      {(['default', 'subtle', 'inverse', 'primary'] as const).map((surface) => (
        <div
          key={surface}
          data-surface={surface === 'default' ? undefined : surface}
          style={{
            backgroundColor: 'var(--color-background-default)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {variantRow('solid', size, shape)}
          {variantRow('subtle', size, shape)}
        </div>
      ))}
    </div>
  ),
};
