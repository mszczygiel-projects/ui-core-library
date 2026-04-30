import { createElement } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import './loader.js';

const meta: Meta = {
  title: 'Web Components/Loader',
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
    },
    label: { control: 'text' },
  },
  args: {
    size: 'default',
    label: 'Loading',
  },
};

export default meta;
type Story = StoryObj;

const el = ({ size, ...rest }: Record<string, unknown>) =>
  createElement('ui-loader', { ...rest, 'data-size': size });

export const Default: Story = {
  render: ({ label, size }: { label: string; size: 'small' | 'default' | 'large' }) =>
    el({ label, size }),
};

export const Sizes: Story = {
  render: () =>
    createElement(
      'div',
      { style: { display: 'flex', gap: '2rem', alignItems: 'center' } },
      el({ label: 'Loading small', size: 'small' }),
      el({ label: 'Loading default', size: 'default' }),
      el({ label: 'Loading large', size: 'large' }),
    ),
};

export const InheritedColor: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Shadow DOM blocks plain `color` inheritance — `:host { color: var(--loader-color, …) }` ' +
          "always wins over an ancestor's `color`. Two ways to override: " +
          '(1) Set `--loader-color` on any ancestor — CSS custom properties inherit through shadow boundaries. ' +
          '(2) Set `color: currentColor` directly on `<ui-loader>` — outer-document styles targeting ' +
          'the host beat `:host {}` rules from inside the shadow, so the element picks up its ' +
          "parent's color without needing `--loader-color` at all.",
      },
    },
  },
  render: () =>
    createElement(
      'div',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { style: { '--loader-color': 'red' } as any },
      el({ label: 'Color from --loader-color: red', size: 'default' }),
    ),
};

export const ReducedMotion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'When `prefers-reduced-motion: reduce` is active, `motionStyles` cuts the animation ' +
          'duration to `0.01ms` and limits iteration count to `1`, effectively freezing the spinner. ' +
          'To test: enable "Reduce motion" in your OS accessibility settings.',
      },
    },
  },
  render: () => el({ label: 'Loading', size: 'default' }),
};
