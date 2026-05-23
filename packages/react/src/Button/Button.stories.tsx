import type { Meta, StoryObj } from '@storybook/react';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import * as Icons from '@mszczygiel-projects/ui-core-icons/react';
import { Button } from './Button.js';

type IconName = keyof typeof svgMap;

const iconOptions = Object.keys(svgMap) as IconName[];

type ButtonStoryArgs = Omit<React.ComponentProps<typeof Button>, 'leadingIcon' | 'trailingIcon'> & {
  iconLeft?: IconName | '';
  iconRight?: IconName | '';
  leadingIcon?: IconName | '';
  trailingIcon?: IconName | '';
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

const renderButtonWithBoxes = ({
  children,
  iconLeft,
  iconRight,
  leadingIcon,
  trailingIcon,
  ...args
}: ButtonStoryArgs) => (
  <Button
    {...args}
    iconLeft={renderIcon(iconLeft)}
    iconRight={renderIcon(iconRight)}
    leadingIcon={renderIcon(leadingIcon)}
    trailingIcon={renderIcon(trailingIcon)}
  >
    {children}
  </Button>
);

const meta: Meta<ButtonStoryArgs> = {
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
    leadingIcon: {
      control: 'select',
      options: ['', ...iconOptions],
    },
    trailingIcon: {
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
    leadingIcon: '',
    trailingIcon: '',
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
    children: 'Buy tickets',
    iconLeft: 'icon-ticket',
    iconRight: 'icon-chevron-right',
  },
  render: renderButton,
};

export const WithIconBoxes: Story = {
  args: {
    children: 'Buy tickets',
    leadingIcon: 'icon-ticket',
    trailingIcon: 'icon-chevron-right',
    iconLeft: '',
    iconRight: '',
  },
  render: renderButtonWithBoxes,
};

export const SplitLeading: Story = {
  name: 'Split — Leading (independent action)',
  args: {
    children: 'Buy tickets',
    leadingIcon: 'icon-ticket',
    trailingIcon: '',
    iconLeft: '',
    iconRight: '',
  },
  render: ({ children, iconLeft, iconRight, leadingIcon, trailingIcon, ...args }) => (
    <Button
      {...args}
      iconLeft={renderIcon(iconLeft)}
      iconRight={renderIcon(iconRight)}
      leadingIcon={renderIcon(leadingIcon)}
      trailingIcon={renderIcon(trailingIcon)}
      onLeadingIconClick={() => alert('Leading icon clicked!')}
    >
      {children}
    </Button>
  ),
};

export const SplitTrailing: Story = {
  name: 'Split — Trailing (independent action)',
  args: {
    children: 'Buy tickets',
    leadingIcon: '',
    trailingIcon: 'icon-chevron-right',
    iconLeft: '',
    iconRight: '',
  },
  render: ({ children, iconLeft, iconRight, leadingIcon, trailingIcon, ...args }) => (
    <Button
      {...args}
      iconLeft={renderIcon(iconLeft)}
      iconRight={renderIcon(iconRight)}
      leadingIcon={renderIcon(leadingIcon)}
      trailingIcon={renderIcon(trailingIcon)}
      onTrailingIconClick={() => alert('Trailing icon clicked!')}
    >
      {children}
    </Button>
  ),
};
