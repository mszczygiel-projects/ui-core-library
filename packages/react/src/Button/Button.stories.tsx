import type { Meta, StoryObj } from '@storybook/react';
import { svgMap } from '@ui-core/icons';
import * as Icons from '@ui-core/icons/react';
import { Button } from './Button.js';

type IconName = keyof typeof svgMap;

const iconOptions = Object.keys(svgMap) as IconName[];

type ButtonStoryArgs = React.ComponentProps<typeof Button> & {
  iconLeft?: IconName | '';
  iconRight?: IconName | '';
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

const renderButton = ({ children, iconLeft, iconRight, ...args }: ButtonStoryArgs) => (
  <Button {...args} iconLeft={renderIcon(iconLeft)} iconRight={renderIcon(iconRight)}>
    {children}
  </Button>
);

const meta: Meta<typeof Button> = {
  title: 'React/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
    iconLeft: {
      control: 'select',
      options: ['', ...iconOptions],
    },
    iconRight: {
      control: 'select',
      options: ['', ...iconOptions],
    },
  },
  args: {
    variant: 'primary',
    size: 'default',
    loading: false,
    disabled: false,
    children: 'More information',
    iconLeft: '',
    iconRight: '',
  },
};

export default meta;
type Story = StoryObj<ButtonStoryArgs>;

export const Primary: Story = {
  render: renderButton,
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
  render: renderButton,
};

export const Outline: Story = {
  args: { variant: 'outline' },
  render: renderButton,
};

export const Ghost: Story = {
  args: { variant: 'ghost' },
  render: renderButton,
};

export const Danger: Story = {
  args: { variant: 'danger' },
  render: renderButton,
};

export const WithIcons: Story = {
  args: {
    children: 'Buy ticket',
    iconLeft: 'icon-ticket',
    iconRight: 'icon-chevron-right',
  },
  render: renderButton,
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {(['small', 'default', 'large'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {(['primary', 'secondary', 'outline', 'ghost', 'danger'] as const).map((variant) => (
            <Button key={variant} variant={variant} size={size}>
              {variant}
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
};
