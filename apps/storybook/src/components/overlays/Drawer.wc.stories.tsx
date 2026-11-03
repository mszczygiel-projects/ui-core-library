import '@mszczygiel-projects/ui-core-web-components/button';
import '@mszczygiel-projects/ui-core-web-components/checkbox-field';
import '@mszczygiel-projects/ui-core-web-components/drawer';

import { drawer, type DrawerPlacement } from '@mszczygiel-projects/ui-core-shared/drawer';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';

interface DrawerArgs {
  readonly label: string;
  readonly placement: DrawerPlacement;
  readonly hideCloseButton: boolean;
  readonly closeLabel?: string;
  readonly dragToDismiss: boolean;
}

const { options } = drawer;

const CONTENT = `
  <ui-checkbox-field label="In stock"></ui-checkbox-field>
  <ui-checkbox-field label="On sale"></ui-checkbox-field>
  <ui-checkbox-field label="Free delivery"></ui-checkbox-field>
`;

/** A button that opens the drawer, as a page does; the drawer closes itself when the user asks. */
function UiDrawer({
  trigger = 'Open drawer',
  children,
  onClose,
  ...args
}: DrawerArgs & {
  readonly trigger?: string;
  readonly children?: ReactNode;
  readonly onClose?: (returnValue: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ui-button
        onClick={() => {
          setOpen(true);
        }}
        size="small"
      >
        {trigger}
      </ui-button>
      <ui-drawer
        open={open}
        label={args.label}
        placement={args.placement}
        hideCloseButton={args.hideCloseButton}
        closeLabel={args.closeLabel === '' ? undefined : args.closeLabel}
        dragToDismiss={args.dragToDismiss}
        onui-open-change={(event) => {
          setOpen(false);
          onClose?.(event.detail.returnValue);
        }}
      >
        {children ?? (
          <div className="sb-stack">
            <ui-checkbox-field label="In stock" />
            <ui-checkbox-field label="On sale" />
            <ui-checkbox-field label="Free delivery" />
          </div>
        )}
      </ui-drawer>
    </>
  );
}

const source = (args: DrawerArgs) =>
  htmlOf(
    'ui-drawer',
    {
      open: true,
      label: args.label,
      placement: args.placement === options.placement.default ? undefined : args.placement,
      'hide-close-button': args.hideCloseButton,
      'close-label': args.closeLabel,
      'drag-to-dismiss': args.dragToDismiss,
    },
    CONTENT,
  );

const meta = {
  title: 'Components/Overlays/Drawer/Web Component',
  tags: ['!manifest'],
  args: {
    label: 'Filters',
    placement: options.placement.default,
    hideCloseButton: false,
    dragToDismiss: false,
  },
  argTypes: {
    label: { control: 'text' },
    placement: { control: 'inline-radio', options: options.placement.options },
    hideCloseButton: { control: 'boolean' },
    closeLabel: { control: 'text' },
    dragToDismiss: { control: 'boolean' },
  },
  render: (args) => <UiDrawer {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: DrawerArgs }) => source(args),
      },
    },
  },
} satisfies Meta<DrawerArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Placements: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.placement.options.map((placement) => (
        <UiDrawer key={placement} {...args} placement={placement} trigger={placement} />
      ))}
    </div>
  ),
};

export const WithForm: Story = {
  render: function Render(args) {
    const [applied, setApplied] = useState('');
    return (
      <div className="sb-row">
        <UiDrawer {...args} trigger="Filters" onClose={setApplied}>
          <form method="dialog" className="sb-stack">
            <ui-checkbox-field label="In stock" />
            <ui-button type="submit" value="in stock">
              Apply
            </ui-button>
          </form>
        </UiDrawer>
        <span>Applied: {applied === '' ? 'none' : applied}</span>
      </div>
    );
  },
};

export const Draggable: Story = { args: { placement: 'bottom', dragToDismiss: true } };

export const OnSurfaces: Story = { decorators: [onSurfaces] };
