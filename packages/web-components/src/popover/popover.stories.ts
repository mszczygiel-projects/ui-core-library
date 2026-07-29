import {
  createElement,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { UiPopover, PopoverOpenChangeDetail } from './popover.js';
import './popover.js';
import '../button/button.js';

const PLACEMENTS = [
  'top-start',
  'top',
  'top-end',
  'left-start',
  'right-start',
  'left',
  'right',
  'left-end',
  'right-end',
  'bottom-start',
  'bottom',
  'bottom-end',
] as const;

const meta: Meta = {
  title: 'Web Components/Popover',
  // Tag-name string routes autodocs to the CEM extractor (see .storybook/preview.ts).
  component: 'ui-popover' as unknown as ComponentType,
  argTypes: {
    placement: { control: 'select', options: PLACEMENTS },
    trigger: { control: 'select', options: ['click', 'hover', 'manual'] },
    dismissOn: { control: 'select', options: ['outside-click', 'escape', 'both'] },
    trapFocus: { control: 'boolean' },
    arrow: { control: 'boolean' },
    offset: { control: 'number' },
  },
  args: {
    placement: 'bottom',
    trigger: 'click',
    dismissOn: 'both',
    trapFocus: false,
    arrow: false,
  },
};

export default meta;
type Story = StoryObj;

type PopoverArgs = {
  placement?: string;
  trigger?: string;
  dismissOn?: string;
  trapFocus?: boolean;
  arrow?: boolean;
  offset?: number;
};

const demoContent = () =>
  createElement(
    'div',
    { style: { maxWidth: 240, display: 'flex', flexDirection: 'column', gap: 8 } },
    createElement('strong', null, 'Popover content'),
    createElement('span', null, 'Sizes to its content — no size variants.'),
  );

/** Stories own the open state — the component is fully controlled. */
const ControlledPopover = ({
  args,
  content,
  triggerLabel = 'Toggle popover',
  initialOpen = false,
}: {
  args: PopoverArgs;
  content?: ReactNode;
  triggerLabel?: string;
  initialOpen?: boolean;
}) => {
  const ref = useRef<UiPopover | null>(null);
  const [open, setOpen] = useState(initialOpen);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const onOpenChange = (event: Event) => {
      setOpen((event as CustomEvent<PopoverOpenChangeDetail>).detail.open);
    };
    el.addEventListener('open-change', onOpenChange);
    return () => el.removeEventListener('open-change', onOpenChange);
  }, []);

  return createElement(
    'ui-popover',
    {
      ref,
      open: open || undefined,
      placement: args.placement,
      trigger: args.trigger,
      'dismiss-on': args.dismissOn,
      'trap-focus': args.trapFocus || undefined,
      arrow: args.arrow || undefined,
      offset: args.offset,
    },
    createElement('ui-button', { slot: 'trigger', variant: 'secondary' }, triggerLabel),
    content ?? demoContent(),
  );
};

export const Playground: Story = {
  render: (args: PopoverArgs) => createElement(ControlledPopover, { args }),
};

/** All 12 placements, statically open (flip/shift disabled to show true placement). */
export const Placements: Story = {
  render: ({ arrow }: PopoverArgs) =>
    createElement(
      'div',
      {
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(3, max-content)',
          gap: 140,
          padding: 120,
          justifyContent: 'center',
        },
      },
      ...PLACEMENTS.map((placement) =>
        createElement(
          'ui-popover',
          {
            key: placement,
            open: true,
            placement,
            trigger: 'manual',
            arrow: arrow || undefined,
            ref: (el: UiPopover | null) => {
              if (el) {
                el.flip = false;
                el.shift = false;
              }
            },
          },
          createElement(
            'span',
            {
              slot: 'trigger',
              style: {
                display: 'inline-block',
                padding: 8,
                border: '1px dashed var(--color-border-default)',
              },
            },
            placement,
          ),
          createElement('span', { style: { whiteSpace: 'nowrap' } }, placement),
        ),
      ),
    ),
};

export const WithArrow: Story = {
  args: { arrow: true, placement: 'top' },
  render: (args: PopoverArgs) => createElement(ControlledPopover, { args, initialOpen: true }),
};

export const TrapFocus: Story = {
  args: { trapFocus: true },
  render: (args: PopoverArgs) =>
    createElement(ControlledPopover, {
      args,
      content: createElement(
        'div',
        { style: { display: 'flex', gap: 8 } },
        createElement('ui-button', { variant: 'secondary' }, 'First'),
        createElement('ui-button', { variant: 'secondary' }, 'Second'),
      ),
    }),
};

export const HoverTrigger: Story = {
  args: { trigger: 'hover', arrow: true, placement: 'top' },
  render: (args: PopoverArgs) =>
    createElement(ControlledPopover, { args, triggerLabel: 'Hover me' }),
};

export const OnSurfaces: Story = {
  render: ({ arrow }: PopoverArgs) =>
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
              paddingBottom: 160,
            },
          },
          createElement(
            'ui-popover',
            { open: true, placement: 'bottom-start', trigger: 'manual', arrow: arrow || undefined },
            createElement('ui-button', { slot: 'trigger', variant: 'secondary' }, surface),
            demoContent(),
          ),
        ),
      ),
    ),
};
