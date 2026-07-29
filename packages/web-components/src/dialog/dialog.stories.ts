import {
  createElement,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { UiDialog } from './dialog.js';
import './dialog.js';
import '../button/button.js';

const BODY =
  'Dialog body content goes here. It scrolls independently when it grows taller than the available space.';

type Args = {
  size: string;
  variant: string;
  dismissOn: string;
  hasCloseButton: boolean;
  title: string;
  description: string;
};

const meta: Meta<Args> = {
  title: 'Web Components/Dialog',
  // Tag-name string routes autodocs to the CEM extractor (see .storybook/preview.ts).
  component: 'ui-dialog' as unknown as ComponentType,
  argTypes: {
    size: { control: 'select', options: ['small', 'medium', 'large', 'fullscreen'] },
    variant: { control: 'select', options: ['default', 'alert'] },
    dismissOn: { control: 'select', options: ['outside-click', 'escape', 'both', 'none'] },
    hasCloseButton: { control: 'boolean' },
    title: { control: 'text' },
    description: { control: 'text' },
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
type Story = StoryObj<Args>;

/** Footer actions, matching the Figma component set. */
function actions(danger: boolean): ReactNode {
  return createElement(
    'div',
    { slot: 'footer', style: { display: 'contents' } },
    createElement('ui-button', { variant: 'outline' }, 'Cancel'),
    createElement('ui-button', { variant: danger ? 'danger' : 'primary' }, 'Confirm'),
  );
}

/**
 * The element is fully controlled, so every story owns the state and writes it
 * back from `open-change` — exactly what a consumer has to do. Boolean
 * attributes and the CustomEvent listener are applied imperatively, since React
 * knows neither.
 */
function Host({
  args,
  body,
  withFooter = true,
  triggerLabel = 'Open dialog',
}: {
  args: Args;
  body?: ReactNode;
  withFooter?: boolean;
  triggerLabel?: string;
}) {
  const ref = useRef<UiDialog | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onChange = (event: Event) => setOpen((event as CustomEvent).detail.open);
    el.addEventListener('open-change', onChange);
    return () => el.removeEventListener('open-change', onChange);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.open = open;
    el.hasCloseButton = args.hasCloseButton;
  }, [open, args.hasCloseButton]);

  return createElement(
    'div',
    null,
    createElement('ui-button', { onClick: () => setOpen(true) }, triggerLabel),
    createElement(
      'ui-dialog',
      {
        ref,
        'data-size': args.size,
        variant: args.variant,
        'dismiss-on': args.dismissOn,
      },
      createElement('span', { slot: 'title' }, args.title),
      args.description ? createElement('span', { slot: 'description' }, args.description) : null,
      body ?? BODY,
      withFooter ? actions(args.variant === 'alert') : null,
    ),
  );
}

export const Playground: Story = {
  render: (args) => createElement(Host, { args }),
};

export const Alert: Story = {
  args: {
    variant: 'alert',
    hasCloseButton: false,
    title: 'Delete account?',
    description: 'This action cannot be undone.',
  },
  render: (args) => createElement(Host, { args }),
};

export const Sizes: Story = {
  render: (args) =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' } },
      ...['small', 'medium', 'large', 'fullscreen'].map((size) =>
        createElement(Host, {
          key: size,
          args: { ...args, size, title: `Size: ${size}` },
          triggerLabel: `Open ${size}`,
        }),
      ),
    ),
};

export const NoFooter: Story = {
  render: (args) => createElement(Host, { args, withFooter: false }),
};

export const ScrollingContent: Story = {
  name: 'Scrolling content (auto dividers)',
  render: (args) =>
    createElement(Host, {
      args,
      body: createElement(
        'div',
        null,
        ...Array.from({ length: 20 }, (_, i) =>
          createElement('p', { key: i, style: { margin: '0 0 12px' } }, `${i + 1}. ${BODY}`),
        ),
      ),
    }),
};

/**
 * Drag-to-dismiss is sheet-only. Narrow the viewport below 48rem to see the
 * grabber appear and to flick the panel away; above that the gesture and its
 * affordance are both absent.
 */
export const DragToDismiss: Story = {
  name: 'Drag to dismiss (sheet only)',
  render: (args) =>
    createElement(
      'div',
      null,
      createElement(
        'p',
        { style: { margin: '0 0 12px', font: '14px/1.5 sans-serif' } },
        'Resize the preview below 48rem — the grabber appears and the sheet can be dragged down.',
      ),
      createElement(DragHost, { args }),
    ),
};

/** Same as Host, plus the opt-in gesture. */
function DragHost({ args }: { args: Args }) {
  const ref = useRef<UiDialog | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onChange = (event: Event) => setOpen((event as CustomEvent).detail.open);
    el.addEventListener('open-change', onChange);
    return () => el.removeEventListener('open-change', onChange);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.open = open;
    el.dragToDismiss = true;
  }, [open]);

  return createElement(
    'div',
    null,
    createElement('ui-button', { onClick: () => setOpen(true) }, 'Open draggable sheet'),
    createElement(
      'ui-dialog',
      { ref, 'data-size': args.size, variant: args.variant, 'dismiss-on': args.dismissOn },
      createElement('span', { slot: 'title' }, args.title),
      createElement('span', { slot: 'description' }, args.description),
      BODY,
      actions(false),
    ),
  );
}

/**
 * Proves the whole Surfaces pipeline: each dialog is a DOM descendant of its
 * surface wrapper, so its tokens resolve from that surface even though the
 * panel renders in the top layer.
 */
export const OnSurfaces: Story = {
  render: (args) =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
      ...['default', 'subtle', 'inverse', 'primary'].map((surface) =>
        createElement(
          'div',
          {
            key: surface,
            'data-surface': surface === 'default' ? undefined : surface,
            style: {
              backgroundColor: 'var(--color-background-default)',
              color: 'var(--color-text-primary)',
              padding: 24,
            },
          },
          createElement(Host, {
            args: { ...args, title: `Surface: ${surface}` },
            triggerLabel: `Open on ${surface}`,
          }),
        ),
      ),
    ),
};
