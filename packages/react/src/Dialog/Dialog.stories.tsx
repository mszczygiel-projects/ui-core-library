import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Dialog, type DialogProps } from './Dialog.js';
import { Button } from '../Button/Button.js';

const BODY =
  'Dialog body content goes here. It scrolls independently when it grows taller than the available space.';

const meta: Meta<typeof Dialog> = {
  title: 'React/Dialog',
  component: Dialog,
  argTypes: {
    size: { control: 'select', options: ['small', 'medium', 'large', 'fullscreen'] },
    variant: { control: 'select', options: ['default', 'alert'] },
    dismissOn: { control: 'select', options: ['outside-click', 'escape', 'both', 'none'] },
    hasCloseButton: { control: 'boolean' },
  },
  args: {
    size: 'medium',
    variant: 'default',
    dismissOn: 'both',
    hasCloseButton: true,
    title: 'Dialog title',
    description: 'Supporting text that explains what this dialog is asking for.',
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

/**
 * The component is fully controlled, so every story owns the state and writes it
 * back from `onOpenChange` — exactly what a consumer has to do.
 */
function Host({
  args,
  body,
  withFooter = true,
  triggerLabel = 'Open dialog',
}: {
  args: Partial<DialogProps>;
  body?: ReactNode;
  withFooter?: boolean;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
      <Dialog
        {...args}
        open={open}
        onOpenChange={(detail) => setOpen(detail.open)}
        footer={
          withFooter ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={args.variant === 'alert' ? 'danger' : 'primary'}
                onClick={() => setOpen(false)}
              >
                Confirm
              </Button>
            </>
          ) : undefined
        }
      >
        {body ?? BODY}
      </Dialog>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => <Host args={args} />,
};

export const Alert: Story = {
  args: {
    variant: 'alert',
    hasCloseButton: false,
    title: 'Delete account?',
    description: 'This action cannot be undone.',
  },
  render: (args) => <Host args={args} />,
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      {(['small', 'medium', 'large', 'fullscreen'] as const).map((size) => (
        <Host
          key={size}
          args={{ ...args, size, title: `Size: ${size}` }}
          triggerLabel={`Open ${size}`}
        />
      ))}
    </div>
  ),
};

export const NoFooter: Story = {
  render: (args) => <Host args={args} withFooter={false} />,
};

export const ScrollingContent: Story = {
  name: 'Scrolling content (auto dividers)',
  render: (args) => (
    <Host
      args={args}
      body={
        <div>
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i} style={{ margin: '0 0 12px' }}>
              {i + 1}. {BODY}
            </p>
          ))}
        </div>
      }
    />
  ),
};

/**
 * Drag-to-dismiss is sheet-only. Narrow the viewport below 48rem to see the
 * grabber appear and to flick the panel away; above that the gesture and its
 * affordance are both absent.
 */
export const DragToDismiss: Story = {
  name: 'Drag to dismiss (sheet only)',
  render: (args) => (
    <div>
      <p style={{ margin: '0 0 12px', font: '14px/1.5 sans-serif' }}>
        Resize the preview below 48rem — the grabber appears and the sheet can be dragged down.
      </p>
      <Host args={{ ...args, dragToDismiss: true }} triggerLabel="Open draggable sheet" />
    </div>
  ),
};

/**
 * Proves the whole Surfaces pipeline: each dialog is a DOM descendant of its
 * surface wrapper, so its tokens resolve from that surface even though the
 * panel renders in the top layer.
 */
export const OnSurfaces: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(['default', 'subtle', 'inverse', 'primary'] as const).map((surface) => (
        <div
          key={surface}
          data-surface={surface === 'default' ? undefined : surface}
          style={{
            backgroundColor: 'var(--color-background-default)',
            color: 'var(--color-text-primary)',
            padding: 24,
          }}
        >
          <Host
            args={{ ...args, title: `Surface: ${surface}` }}
            triggerLabel={`Open on ${surface}`}
          />
        </div>
      ))}
    </div>
  ),
};
