import '@mszczygiel-projects/ui-core-web-components/button';
import '@mszczygiel-projects/ui-core-web-components/dialog';
import '@mszczygiel-projects/ui-core-web-components/text-field';

import { dialog, type DialogSize } from '@mszczygiel-projects/ui-core-shared/dialog';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf, textOf } from '../html.ts';

interface DialogArgs {
  readonly heading: string;
  readonly description: string;
  readonly text: string;
  readonly size: DialogSize;
  readonly alert: boolean;
  readonly hideCloseButton: boolean;
  readonly closeLabel?: string;
  readonly dragToDismiss: boolean;
  readonly label?: string;
}

const { options } = dialog;

const FOOTER = `
  <ui-button slot="footer" variant="secondary">Cancel</ui-button>
  <ui-button slot="footer">Delete</ui-button>
`;

/** A button that opens the dialog, as a page does; the dialog closes itself when the user asks. */
function UiDialog({
  trigger = 'Open dialog',
  footer,
  children,
  onClose,
  ...args
}: DialogArgs & {
  readonly trigger?: string;
  readonly footer?: ReactNode;
  readonly children?: ReactNode;
  readonly onClose?: (returnValue: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
  };
  return (
    <>
      <ui-button
        onClick={() => {
          setOpen(true);
        }}
      >
        {trigger}
      </ui-button>
      <ui-dialog
        open={open}
        heading={args.heading}
        description={args.description === '' ? undefined : args.description}
        size={args.size}
        alert={args.alert}
        hideCloseButton={args.hideCloseButton}
        closeLabel={args.closeLabel === '' ? undefined : args.closeLabel}
        dragToDismiss={args.dragToDismiss}
        label={args.label === '' ? undefined : args.label}
        onui-open-change={(event) => {
          setOpen(false);
          onClose?.(event.detail.returnValue);
        }}
      >
        {children ?? args.text}
        {footer ?? (
          <>
            <ui-button slot="footer" variant="secondary" onClick={close}>
              Cancel
            </ui-button>
            <ui-button slot="footer" onClick={close}>
              Delete
            </ui-button>
          </>
        )}
      </ui-dialog>
    </>
  );
}

const source = (args: DialogArgs) =>
  htmlOf(
    'ui-dialog',
    {
      open: true,
      heading: args.heading,
      description: args.description,
      size: args.size === options.size.default ? undefined : args.size,
      alert: args.alert,
      'hide-close-button': args.hideCloseButton,
      'close-label': args.closeLabel,
      'drag-to-dismiss': args.dragToDismiss,
      label: args.label,
    },
    `\n  ${textOf(args.text)}${FOOTER}`,
  );

const meta = {
  title: 'Components/Overlays/Dialog/Web Component',
  tags: ['!manifest'],
  args: {
    heading: 'Delete the file?',
    description: 'The file moves to the bin for 30 days.',
    text: 'Anyone it is shared with loses access to it.',
    size: options.size.default,
    alert: false,
    hideCloseButton: false,
    dragToDismiss: false,
  },
  argTypes: {
    heading: { control: 'text' },
    description: { control: 'text' },
    text: { control: 'text' },
    size: { control: 'inline-radio', options: options.size.options },
    alert: { control: 'boolean' },
    hideCloseButton: { control: 'boolean' },
    closeLabel: { control: 'text' },
    dragToDismiss: { control: 'boolean' },
    label: { control: 'text' },
  },
  render: (args) => <UiDialog {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: DialogArgs }) => source(args),
      },
    },
  },
} satisfies Meta<DialogArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-stack">
      {options.size.options.map((size) => (
        <UiDialog key={size} {...args} size={size} heading={`A ${size} dialog`} trigger={size} />
      ))}
    </div>
  ),
};

export const Alert: Story = {
  args: {
    alert: true,
    hideCloseButton: true,
    heading: 'Discard the changes?',
    description: 'The changes since the last save are lost.',
    text: '',
  },
  render: (args) => (
    <UiDialog
      {...args}
      trigger="Discard"
      footer={
        <form method="dialog" slot="footer" className="sb-stack">
          <ui-button type="submit" variant="secondary" value="keep" data-autofocus>
            Keep editing
          </ui-button>
          <ui-button type="submit" value="discard">
            Discard
          </ui-button>
        </form>
      }
    />
  ),
};

export const WithForm: Story = {
  args: { heading: 'Rename the file', description: '', text: '' },
  render: function Render(args) {
    const [result, setResult] = useState('');
    return (
      <div className="sb-stack">
        <UiDialog
          {...args}
          trigger="Rename"
          onClose={setResult}
          footer={
            <form method="dialog" slot="footer" className="sb-stack">
              <ui-button type="submit" variant="secondary" value="cancel">
                Cancel
              </ui-button>
              <ui-button type="submit" value="save">
                Save
              </ui-button>
            </form>
          }
        >
          <ui-text-field label="Name" value="Report.pdf" />
        </UiDialog>
        <span>Closed with: {result === '' ? 'nothing' : result}</span>
      </div>
    );
  },
};

export const Draggable: Story = { args: { dragToDismiss: true } };

export const OnSurfaces: Story = { decorators: [onSurfaces] };
