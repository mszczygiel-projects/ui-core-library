import '@mszczygiel-projects/ui-core-web-components/button';
import '@mszczygiel-projects/ui-core-web-components/checkbox-field';
import '@mszczygiel-projects/ui-core-web-components/popover';

import { popover, type PopoverPlacement } from '@mszczygiel-projects/ui-core-shared/popover';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';

interface PopoverArgs {
  readonly label: string;
  readonly placement: PopoverPlacement;
  readonly showArrow: boolean;
}

const { options } = popover;

const CONTENT = `
  <ui-button slot="trigger" size="small">Filters</ui-button>
  <ui-checkbox-field label="In stock"></ui-checkbox-field>
  <ui-checkbox-field label="On sale"></ui-checkbox-field>
`;

/** A popover with a button and two fields, which opens and closes itself. */
function UiPopover({
  trigger = 'Filters',
  children,
  ...args
}: PopoverArgs & { readonly trigger?: string; readonly children?: ReactNode }) {
  return (
    <ui-popover label={args.label} placement={args.placement} showArrow={args.showArrow}>
      <ui-button slot="trigger" size="small">
        {trigger}
      </ui-button>
      {children ?? (
        <div className="sb-stack">
          <ui-checkbox-field label="In stock" />
          <ui-checkbox-field label="On sale" />
        </div>
      )}
    </ui-popover>
  );
}

const source = (args: PopoverArgs) =>
  htmlOf(
    'ui-popover',
    {
      label: args.label,
      placement: args.placement === options.placement.default ? undefined : args.placement,
      'show-arrow': args.showArrow,
    },
    CONTENT,
  );

const meta = {
  title: 'Components/Overlays/Popover/Web Component',
  tags: ['!manifest'],
  args: { label: 'Filters', placement: options.placement.default, showArrow: false },
  argTypes: {
    label: { control: 'text' },
    placement: { control: 'inline-radio', options: options.placement.options },
    showArrow: { control: 'boolean' },
  },
  render: (args) => <UiPopover {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: PopoverArgs }) => source(args),
      },
    },
  },
} satisfies Meta<PopoverArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Placements: Story = {
  args: { showArrow: true },
  render: (args) => (
    <div className="sb-row">
      {options.placement.options.map((placement) => (
        <UiPopover key={placement} {...args} placement={placement} trigger={placement} />
      ))}
    </div>
  ),
};

export const WithForm: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    const [applied, setApplied] = useState('none');
    return (
      <div className="sb-row">
        <ui-popover
          label={args.label}
          placement={args.placement}
          showArrow={args.showArrow}
          open={open}
          onui-open-change={(event) => {
            setOpen(event.detail.value);
          }}
        >
          <ui-button slot="trigger" size="small">
            Filters
          </ui-button>
          <form
            className="sb-stack"
            onSubmit={(event) => {
              event.preventDefault();
              setApplied('in stock');
              setOpen(false);
            }}
          >
            <ui-checkbox-field label="In stock" />
            <ui-button type="submit" size="small">
              Apply
            </ui-button>
          </form>
        </ui-popover>
        <span>Applied: {applied}</span>
      </div>
    );
  },
};

export const OnSurfaces: Story = { decorators: [onSurfaces] };
