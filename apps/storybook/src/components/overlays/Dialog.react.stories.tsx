import { Button, Dialog, TextField } from '@mszczygiel-projects/ui-core-react';
import { dialog } from '@mszczygiel-projects/ui-core-shared/dialog';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ComponentProps, useState } from 'react';

import { onSurfaces } from '../decorators.tsx';

const { options } = dialog;

type DemoProps = ComponentProps<typeof Dialog> & { readonly trigger?: string };

/** A button that opens the dialog, as a page does; the dialog closes when the user asks. */
function DialogDemo({ trigger = 'Open dialog', footer, ...args }: DemoProps) {
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
  };
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        {trigger}
      </Button>
      <Dialog
        {...args}
        open={open}
        onOpenChange={setOpen}
        footer={
          footer ?? (
            <>
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button onClick={close}>Delete</Button>
            </>
          )
        }
      />
    </>
  );
}

const meta = {
  title: 'Components/Overlays/Dialog/React',
  component: Dialog,
  args: {
    heading: 'Delete the file?',
    description: 'The file moves to the bin for 30 days.',
    children: 'Anyone it is shared with loses access to it.',
    size: options.size.default,
    alert: false,
    hideCloseButton: false,
    dragToDismiss: false,
  },
  argTypes: {
    heading: { control: 'text' },
    description: { control: 'text' },
    children: { control: 'text' },
    size: { control: 'inline-radio', options: options.size.options },
    alert: { control: 'boolean' },
    hideCloseButton: { control: 'boolean' },
    closeLabel: { control: 'text' },
    dragToDismiss: { control: 'boolean' },
    label: { control: 'text' },
  },
  render: (args) => <DialogDemo {...args} />,
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-stack">
      {options.size.options.map((size) => (
        <DialogDemo key={size} {...args} size={size} heading={`A ${size} dialog`} trigger={size} />
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
    children: undefined,
  },
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    const close = () => {
      setOpen(false);
    };
    return (
      <>
        <Button
          onClick={() => {
            setOpen(true);
          }}
        >
          Discard
        </Button>
        <Dialog
          {...args}
          open={open}
          onOpenChange={setOpen}
          footer={
            <>
              <Button variant="secondary" onClick={close} data-autofocus>
                Keep editing
              </Button>
              <Button onClick={close}>Discard</Button>
            </>
          }
        />
      </>
    );
  },
};

export const WithForm: Story = {
  args: { heading: 'Rename the file', description: undefined, children: undefined },
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('Report.pdf');
    const [draft, setDraft] = useState(name);
    return (
      <div className="sb-stack">
        <Button
          onClick={() => {
            setDraft(name);
            setOpen(true);
          }}
        >
          Rename
        </Button>
        <span>{name}</span>
        <Dialog
          {...args}
          open={open}
          onOpenChange={(next, { reason, returnValue }) => {
            setOpen(next);
            if (reason === 'form' && returnValue === 'save') {
              setName(draft);
            }
          }}
          footer={
            <>
              <Button variant="secondary" type="submit" form="rename" value="cancel">
                Cancel
              </Button>
              <Button type="submit" form="rename" value="save">
                Save
              </Button>
            </>
          }
        >
          <form id="rename" method="dialog">
            <TextField label="Name" value={draft} onValueChange={setDraft} />
          </form>
        </Dialog>
      </div>
    );
  },
};

export const Draggable: Story = { args: { dragToDismiss: true } };

export const OnSurfaces: Story = { decorators: [onSurfaces] };
