import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Drawer } from './Drawer.js';
import type { DrawerPlacement } from './Drawer.js';
import { Button } from '../Button/Button.js';

const BODY =
  'Drawer content goes here. The drawer imposes no structure on it — headings, forms and action rows are all yours to compose.';

type Args = {
  placement: DrawerPlacement;
  dismissOn: 'outside-click' | 'escape' | 'both' | 'none';
  hasCloseButton: boolean;
  dragToDismiss: boolean;
  label: string;
};

const meta: Meta<Args> = {
  title: 'React/Drawer',
  component: Drawer as never,
  argTypes: {
    placement: { control: 'select', options: ['right', 'left', 'bottom'] },
    dismissOn: { control: 'select', options: ['outside-click', 'escape', 'both', 'none'] },
    hasCloseButton: { control: 'boolean' },
    dragToDismiss: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: {
    placement: 'right',
    dismissOn: 'both',
    hasCloseButton: true,
    dragToDismiss: false,
    label: 'Drawer',
  },
};

export default meta;
type Story = StoryObj<Args>;

/**
 * The component is fully controlled, so every story owns the state and writes it
 * back from `onOpenChange` — exactly what a consumer has to do.
 */
function Host({
  args,
  body,
  triggerLabel = 'Open drawer',
}: {
  args: Args;
  body?: ReactNode;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
      <Drawer
        open={open}
        placement={args.placement}
        dismissOn={args.dismissOn}
        hasCloseButton={args.hasCloseButton}
        dragToDismiss={args.dragToDismiss}
        label={args.label}
        onOpenChange={(detail) => setOpen(detail.open)}
      >
        {body ?? BODY}
      </Drawer>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => <Host args={args} />,
};

/**
 * Side drawers span the full viewport height at `--drawer-width`; the bottom
 * sheet hugs its content instead, capped at 90dvh.
 */
export const Placements: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      {(['right', 'left', 'bottom'] as const).map((placement) => (
        <Host
          key={placement}
          args={{ ...args, placement, label: `Drawer: ${placement}` }}
          triggerLabel={`Open ${placement}`}
        />
      ))}
    </div>
  ),
};

/** Long content scrolls inside the body while the close affordance stays put. */
export const ScrollingContent: Story = {
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

/** A pure container: no close button at all, the content owns every affordance. */
export const WithoutCloseButton: Story = {
  render: (args) => <Host args={{ ...args, hasCloseButton: false }} />,
};

/**
 * Drag-to-dismiss is bottom-only. A horizontal drag handle on a side panel is an
 * affordance nobody recognises, so `right` and `left` render no grabber and the
 * gesture stays inert there.
 */
export const DragToDismiss: Story = {
  name: 'Drag to dismiss (bottom only)',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <p style={{ margin: 0, font: '14px/1.5 sans-serif' }}>
        The sheet can be flicked downwards. Escape, the backdrop and the close button all stay live
        — a pointer gesture is never the only way out.
      </p>
      <Host
        args={{ ...args, placement: 'bottom', dragToDismiss: true }}
        triggerLabel="Open draggable sheet"
      />
      <Host
        args={{ ...args, placement: 'right', dragToDismiss: true }}
        triggerLabel="Open side drawer (no grabber, gesture inert)"
      />
    </div>
  ),
};

/**
 * Proves the whole Surfaces pipeline: each drawer is a DOM descendant of its
 * surface wrapper, so its tokens resolve from that surface even though the panel
 * renders in the top layer.
 */
export const OnSurfaces: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {['default', 'subtle', 'inverse', 'primary'].map((surface) => (
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
            args={{ ...args, label: `Surface: ${surface}` }}
            triggerLabel={`Open on ${surface}`}
          />
        </div>
      ))}
    </div>
  ),
};
