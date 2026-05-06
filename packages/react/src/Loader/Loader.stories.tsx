import type { Meta, StoryObj } from '@storybook/react';
import { Loader } from './Loader.js';

const meta: Meta<typeof Loader> = {
  title: 'React/Loader',
  component: Loader,
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
type Story = StoryObj<typeof Loader>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <Loader size="small" label="Loading small" />
      <Loader size="default" label="Loading default" />
      <Loader size="large" label="Loading large" />
    </div>
  ),
};

export const InheritedColor: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The Loader resolves color via `color: var(--loader-color, var(--color-icon-default))` — ' +
          'a plain `color` on a wrapper is overridden by this declaration. Two ways to override: ' +
          '(1) Set `--loader-color` on any ancestor — CSS custom properties inherit through the cascade. ' +
          '(2) Pass `style={{ color: "currentColor" }}` directly to `<Loader>` — this merges on top ' +
          "of the default and resolves to the parent's color, so no `--loader-color` is needed.",
      },
    },
  },
  render: () => (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <div style={{ '--loader-color': 'red' } as any}>
      <Loader label="Color from --loader-color: red" size="default" />
    </div>
  ),
};

export const ReducedMotion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'When `prefers-reduced-motion: reduce` is active, the `.ui-loader__spinner` CSS rule ' +
          'cuts animation duration to `0.01ms` and limits iteration count to `1`, effectively ' +
          'freezing the spinner. To test: enable "Reduce motion" in your OS accessibility settings.',
      },
    },
  },
  render: () => <Loader label="Loading" size="default" />,
};
