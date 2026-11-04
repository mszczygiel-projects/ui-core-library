import { iconDelete } from '@mszczygiel-projects/ui-core-icons';
import { type MenuItems, SplitButton } from '@mszczygiel-projects/ui-core-react';
import { splitButton } from '@mszczygiel-projects/ui-core-shared/split-button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';

import { onSurfaces } from '../decorators.tsx';
import { iconOptions, svgMap } from '../icons.ts';

const { options } = splitButton;
const variants = options.variant.options;

/** Every icon as a node for the icon props, its SVG string from the icons package only. */
const iconNodes = Object.fromEntries(
  iconOptions.map((name) => [
    name,
    <span key={name} dangerouslySetInnerHTML={{ __html: svgMap[name] }} />,
  ]),
);

const ACTIONS: MenuItems<ReactNode> = [
  { value: 'draft', label: 'Save as draft' },
  { value: 'template', label: 'Save as template' },
  { value: 'schedule', label: 'Schedule', disabled: true },
];

const GROUPS: MenuItems<ReactNode> = [
  {
    options: [
      { value: 'draft', label: 'Save as draft' },
      { value: 'template', label: 'Save as template' },
    ],
  },
  {
    options: [
      {
        value: 'discard',
        label: 'Discard changes',
        icon: <span dangerouslySetInnerHTML={{ __html: iconDelete }} />,
      },
    ],
  },
];

const meta = {
  title: 'Components/Actions/SplitButton/React',
  component: SplitButton,
  args: {
    children: 'Save',
    options: ACTIONS,
    variant: options.variant.default,
    size: options.size.default,
    disabled: false,
    loading: false,
    type: options.type.default,
  },
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: variants },
    size: { control: 'inline-radio', options: options.size.options },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    type: { control: 'inline-radio', options: options.type.options },
    name: { control: 'text' },
    value: { control: 'text' },
    label: { control: 'text' },
    loadingLabel: { control: 'text' },
    menuLabel: { control: 'text' },
    leadingIcon: { control: 'select', options: iconOptions, mapping: iconNodes },
    trailingIcon: { control: 'select', options: iconOptions, mapping: iconNodes },
    open: { control: false },
    options: { control: false },
  },
} satisfies Meta<typeof SplitButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Render(args) {
    const [last, setLast] = useState('none');
    return (
      <div className="sb-row">
        <SplitButton
          {...args}
          onClick={() => {
            setLast('save');
          }}
          onAction={setLast}
        />
        <span>Last action: {last}</span>
      </div>
    );
  },
};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {variants.map((variant) => (
        <SplitButton key={variant} {...args} variant={variant}>
          {variant}
        </SplitButton>
      ))}
    </div>
  ),
};

export const WithIcons: Story = {
  args: { leadingIcon: 'iconCheck' },
};

export const Groups: Story = {
  args: { options: GROUPS },
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
