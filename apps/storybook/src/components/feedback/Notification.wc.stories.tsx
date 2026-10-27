import '@mszczygiel-projects/ui-core-web-components/notification';

import {
  notification,
  type NotificationTone,
  type NotificationVariant,
} from '@mszczygiel-projects/ui-core-shared/notification';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf, textOf } from '../html.ts';

interface NotificationArgs {
  readonly heading: string;
  readonly text: string;
  readonly tone: NotificationTone;
  readonly variant: NotificationVariant;
  readonly hasLeadingIcon: boolean;
  readonly dismissible: boolean;
  readonly dismissLabel?: string;
  readonly announce: boolean;
}

const { options } = notification;

function UiNotification({
  onDismiss,
  ...args
}: NotificationArgs & { readonly onDismiss?: () => void }) {
  return (
    <ui-notification
      tone={args.tone}
      variant={args.variant}
      heading={args.heading}
      hasLeadingIcon={args.hasLeadingIcon}
      dismissible={args.dismissible}
      dismissLabel={args.dismissLabel === '' ? undefined : args.dismissLabel}
      announce={args.announce}
      onui-dismiss={onDismiss}
    >
      {args.text}
    </ui-notification>
  );
}

const source = (args: NotificationArgs) =>
  htmlOf(
    'ui-notification',
    {
      tone: args.tone === options.tone.default ? undefined : args.tone,
      variant: args.variant === options.variant.default ? undefined : args.variant,
      heading: args.heading,
      'has-leading-icon': args.hasLeadingIcon,
      dismissible: args.dismissible,
      'dismiss-label': args.dismissLabel,
      announce: args.announce,
    },
    textOf(args.text),
  );

const meta = {
  title: 'Components/Feedback/Notification/Web Component',
  tags: ['!manifest'],
  args: {
    heading: 'Changes saved',
    text: 'Your profile is up to date.',
    tone: options.tone.default,
    variant: options.variant.default,
    hasLeadingIcon: true,
    dismissible: false,
    announce: false,
  },
  argTypes: {
    heading: { control: 'text' },
    text: { control: 'text' },
    tone: { control: 'select', options: options.tone.options },
    variant: { control: 'inline-radio', options: options.variant.options },
    hasLeadingIcon: { control: 'boolean' },
    dismissible: { control: 'boolean' },
    dismissLabel: { control: 'text' },
    announce: { control: 'boolean' },
  },
  render: (args) => <UiNotification {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: NotificationArgs }) => source(args),
      },
    },
  },
} satisfies Meta<NotificationArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-stack">
      {options.variant.options.map((variant) =>
        options.tone.options.map((tone) => (
          <UiNotification
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
  parameters: {
    docs: {
      source: {
        code: options.variant.options
          .flatMap((variant) =>
            options.tone.options.map((tone) =>
              source({ ...meta.args, tone, variant, heading: `${tone} ${variant}` }),
            ),
          )
          .join('\n'),
      },
    },
  },
};

export const Dismissible: Story = {
  args: { dismissible: true },
  render: function Render(args) {
    const [open, setOpen] = useState(true);
    return open ? (
      <UiNotification
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
        {count > 0 && <UiNotification key={count} {...args} />}
      </div>
    );
  },
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
