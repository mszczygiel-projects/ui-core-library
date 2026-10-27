import { Notification } from '@mszczygiel-projects/ui-core-react';
import { notification } from '@mszczygiel-projects/ui-core-shared/notification';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { onSurfaces } from '../decorators.tsx';

const { options } = notification;

const meta = {
  title: 'Components/Feedback/Notification/React',
  component: Notification,
  args: {
    heading: 'Changes saved',
    children: 'Your profile is up to date.',
    tone: options.tone.default,
    variant: options.variant.default,
    hasLeadingIcon: true,
    dismissible: false,
    announce: false,
  },
  argTypes: {
    heading: { control: 'text' },
    children: { control: 'text' },
    tone: { control: 'select', options: options.tone.options },
    variant: { control: 'inline-radio', options: options.variant.options },
    hasLeadingIcon: { control: 'boolean' },
    dismissible: { control: 'boolean' },
    dismissLabel: { control: 'text' },
    announce: { control: 'boolean' },
  },
} satisfies Meta<typeof Notification>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-stack">
      {options.variant.options.map((variant) =>
        options.tone.options.map((tone) => (
          <Notification
            key={`${variant}-${tone}`}
            {...args}
            tone={tone}
            variant={variant}
            heading={`${tone} ${variant}`}
          />
        )),
      )}
    </div>
  ),
};

export const Dismissible: Story = {
  args: { dismissible: true },
  render: function Render(args) {
    const [open, setOpen] = useState(true);
    return open ? (
      <Notification
        {...args}
        onDismiss={() => {
          setOpen(false);
        }}
      />
    ) : (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Show again
      </button>
    );
  },
};

export const Announced: Story = {
  args: { announce: true, tone: 'success' },
  render: function Render(args) {
    const [count, setCount] = useState(0);
    return (
      <div className="sb-stack">
        <button
          type="button"
          onClick={() => {
            setCount((current) => current + 1);
          }}
        >
          Save
        </button>
        {count > 0 && <Notification key={count} {...args} />}
      </div>
    );
  },
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
