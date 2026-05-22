import type { Meta, StoryObj } from '@storybook/react';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import * as Icons from '@mszczygiel-projects/ui-core-icons/react';
import { LinkButton } from './LinkButton.js';

type IconName = keyof typeof svgMap;

const iconOptions = Object.keys(svgMap) as IconName[];

type LinkButtonStoryArgs = React.ComponentProps<typeof LinkButton> & {
  iconLeft?: IconName | '';
  iconRight?: IconName | '';
};

const toIconExportName = (name: IconName) =>
  name
    .split('-')
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const renderIcon = (name?: IconName | '') => {
  if (!name) return undefined;
  const IconComponent = Icons[toIconExportName(name) as keyof typeof Icons];
  return IconComponent ? <IconComponent /> : undefined;
};

const renderLinkButton = ({ children, iconLeft, iconRight, ...args }: LinkButtonStoryArgs) => (
  <LinkButton {...args} iconLeft={renderIcon(iconLeft)} iconRight={renderIcon(iconRight)}>
    {children}
  </LinkButton>
);

const meta: Meta<typeof LinkButton> = {
  title: 'React/LinkButton',
  component: LinkButton,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
    },
    href: { control: 'text' },
    target: {
      control: 'select',
      options: ['', '_self', '_blank', '_parent', '_top'],
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
    href: 'https://example.com',
    target: '_self',
    loading: false,
    disabled: false,
    children: 'More information',
    iconLeft: '',
    iconRight: '',
  },
};

export default meta;
type Story = StoryObj<LinkButtonStoryArgs>;

export const Primary: Story = {
  render: renderLinkButton,
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
  render: renderLinkButton,
};

export const Outline: Story = {
  args: { variant: 'outline' },
  render: renderLinkButton,
};

export const Ghost: Story = {
  args: { variant: 'ghost' },
  render: renderLinkButton,
};

export const Danger: Story = {
  args: { variant: 'danger' },
  render: renderLinkButton,
};

export const WithIcons: Story = {
  args: {
    children: 'Buy tickets',
    iconLeft: 'icon-ticket',
    iconRight: 'icon-chevron-right',
  },
  render: renderLinkButton,
};

export const Disabled: Story = {
  args: { disabled: true },
  render: renderLinkButton,
};

export const Loading: Story = {
  args: { loading: true },
  render: renderLinkButton,
};

export const ExternalLink: Story = {
  args: {
    href: 'https://example.com',
    target: '_blank',
    children: 'Open in new tab',
  },
  render: renderLinkButton,
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {(['small', 'default', 'large'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {(['primary', 'secondary', 'outline', 'ghost', 'danger'] as const).map((variant) => (
            <LinkButton key={variant} variant={variant} size={size} href="#">
              {variant}
            </LinkButton>
          ))}
        </div>
      ))}
    </div>
  ),
};
