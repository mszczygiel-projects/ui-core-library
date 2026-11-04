import '@mszczygiel-projects/ui-core-web-components/button';
import '@mszczygiel-projects/ui-core-web-components/tooltip';

import { tooltip, type TooltipPlacement } from '@mszczygiel-projects/ui-core-shared/tooltip';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';

interface TooltipArgs {
  readonly content: string;
  readonly placement: TooltipPlacement;
  readonly showArrow: boolean;
}

const { options } = tooltip;

/** A button described by a tooltip. */
function UiTooltip({ trigger = 'Copy', ...args }: TooltipArgs & { readonly trigger?: string }) {
  return (
    <ui-tooltip content={args.content} placement={args.placement} showArrow={args.showArrow}>
      <ui-button size="small">{trigger}</ui-button>
    </ui-tooltip>
  );
}

const source = (args: TooltipArgs) =>
  htmlOf(
    'ui-tooltip',
    {
      content: args.content,
      placement: args.placement === options.placement.default ? undefined : args.placement,
      'show-arrow': args.showArrow,
    },
    '\n  <ui-button size="small">Copy</ui-button>\n',
  );

const meta = {
  title: 'Components/Overlays/Tooltip/Web Component',
  tags: ['!manifest'],
  args: { content: 'Copy link', placement: options.placement.default, showArrow: false },
  argTypes: {
    content: { control: 'text' },
    placement: { control: 'inline-radio', options: options.placement.options },
    showArrow: { control: 'boolean' },
  },
  render: (args) => <UiTooltip {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: TooltipArgs }) => source(args),
      },
    },
  },
} satisfies Meta<TooltipArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Placements: Story = {
  args: { showArrow: true },
  render: (args) => (
    <div className="sb-row">
      {options.placement.options.map((placement) => (
        <UiTooltip key={placement} {...args} placement={placement} trigger={placement} />
      ))}
    </div>
  ),
};

export const OnSurfaces: Story = { decorators: [onSurfaces] };
