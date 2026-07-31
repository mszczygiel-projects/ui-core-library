import {
  createElement,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { UiDrawer } from './drawer.js';
import './drawer.js';
import '../button/button.js';

const BODY =
  'Drawer content goes here. The drawer imposes no structure on it — headings, forms and action rows are all yours to compose.';

type Args = {
  placement: string;
  dismissOn: string;
  hasCloseButton: boolean;
  dragToDismiss: boolean;
  label: string;
};

const meta: Meta<Args> = {
  title: 'Web Components/Drawer',
  // Tag-name string routes autodocs to the CEM extractor (see .storybook/preview.ts).
  component: 'ui-drawer' as unknown as ComponentType,
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
 * The element is fully controlled, so every story owns the state and writes it
 * back from `open-change` — exactly what a consumer has to do. Boolean
 * properties and the CustomEvent listener are applied imperatively, since React
 * knows neither.
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
  const ref = useRef<UiDrawer | null>(null);
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
    el.dragToDismiss = args.dragToDismiss;
  }, [open, args.hasCloseButton, args.dragToDismiss]);

  return createElement(
    'div',
    null,
    createElement('ui-button', { onClick: () => setOpen(true) }, triggerLabel),
    createElement(
      'ui-drawer',
      {
        ref,
        placement: args.placement,
        'dismiss-on': args.dismissOn,
        label: args.label,
      },
      body ?? BODY,
    ),
  );
}

export const Playground: Story = {
  render: (args) => createElement(Host, { args }),
};

/**
 * Side drawers span the full viewport height at `--drawer-width`; the bottom
 * sheet hugs its content instead, capped at 90dvh.
 */
export const Placements: Story = {
  render: (args) =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' } },
      ...['right', 'left', 'bottom'].map((placement) =>
        createElement(Host, {
          key: placement,
          args: { ...args, placement, label: `Drawer: ${placement}` },
          triggerLabel: `Open ${placement}`,
        }),
      ),
    ),
};

/** Long content scrolls inside the body while the close affordance stays put. */
export const ScrollingContent: Story = {
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

/** A pure container: no close button at all, the content owns every affordance. */
export const WithoutCloseButton: Story = {
  render: (args) => createElement(Host, { args: { ...args, hasCloseButton: false } }),
};

/**
 * Drag-to-dismiss is bottom-only. A horizontal drag handle on a side panel is an
 * affordance nobody recognises, so `right` and `left` render no grabber and the
 * gesture stays inert there.
 */
export const DragToDismiss: Story = {
  name: 'Drag to dismiss (bottom only)',
  render: (args) =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' } },
      createElement(
        'p',
        { style: { margin: 0, font: '14px/1.5 sans-serif' } },
        'The sheet can be flicked downwards. Escape, the backdrop and the close button all stay live — a pointer gesture is never the only way out.',
      ),
      createElement(Host, {
        args: { ...args, placement: 'bottom', dragToDismiss: true },
        triggerLabel: 'Open draggable sheet',
      }),
      createElement(Host, {
        args: { ...args, placement: 'right', dragToDismiss: true },
        triggerLabel: 'Open side drawer (no grabber, gesture inert)',
      }),
    ),
};

/**
 * Proves the whole Surfaces pipeline: each drawer is a DOM descendant of its
 * surface wrapper, so its tokens resolve from that surface even though the panel
 * renders in the top layer.
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
            args: { ...args, label: `Surface: ${surface}` },
            triggerLabel: `Open on ${surface}`,
          }),
        ),
      ),
    ),
};
