import '@mszczygiel-projects/ui-core-web-components/button';
import '@mszczygiel-projects/ui-core-web-components/icon-button';
import '@mszczygiel-projects/ui-core-web-components/menu';

import { iconDelete, iconMenu, iconShare } from '@mszczygiel-projects/ui-core-icons';
import {
  menu,
  type MenuAlign,
  type MenuItems,
  type MenuPlacement,
  type MenuSize,
} from '@mszczygiel-projects/ui-core-shared/menu';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';

interface MenuArgs {
  readonly size: MenuSize;
  readonly placement: MenuPlacement;
  readonly align: MenuAlign;
  readonly label?: string;
}

const { options } = menu;

const ACTIONS: MenuItems<string> = [
  { value: 'rename', label: 'Rename' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'share', label: 'Share', icon: iconShare },
  { value: 'archive', label: 'Archive', disabled: true },
];

const GROUPS: MenuItems<string> = [
  {
    options: [
      { value: 'rename', label: 'Rename' },
      { value: 'duplicate', label: 'Duplicate' },
    ],
  },
  { options: [{ value: 'share', label: 'Share', icon: iconShare }] },
  { options: [{ value: 'delete', label: 'Delete', icon: iconDelete }] },
];

/** A menu that opens from a button and reports the action picked. */
function UiMenu({
  items = ACTIONS,
  trigger,
  onPick,
  ...args
}: MenuArgs & {
  readonly items?: MenuItems<string>;
  readonly trigger?: ReactNode;
  readonly onPick?: (value: string) => void;
}) {
  return (
    <ui-menu
      size={args.size}
      placement={args.placement}
      align={args.align}
      label={args.label === '' ? undefined : args.label}
      options={items}
      onui-action={(event) => {
        onPick?.(event.detail.value);
      }}
    >
      {trigger ?? (
        <ui-button slot="trigger" size="small">
          Actions
        </ui-button>
      )}
    </ui-menu>
  );
}

const source = (args: MenuArgs) =>
  `${htmlOf(
    'ui-menu',
    {
      size: args.size === options.size.default ? undefined : args.size,
      placement: args.placement === options.placement.default ? undefined : args.placement,
      align: args.align === options.align.default ? undefined : args.align,
      label: args.label,
    },
    '\n  <ui-button slot="trigger" size="small">Actions</ui-button>\n',
  )}\n<script>\n  document.querySelector('ui-menu').options = [\n    { value: 'rename', label: 'Rename' },\n    { value: 'duplicate', label: 'Duplicate' },\n  ];\n</script>`;

const meta = {
  title: 'Components/Overlays/Menu/Web Component',
  tags: ['!manifest'],
  args: {
    size: options.size.default,
    placement: options.placement.default,
    align: options.align.default,
  },
  argTypes: {
    size: { control: 'inline-radio', options: options.size.options },
    placement: { control: 'inline-radio', options: options.placement.options },
    align: { control: 'inline-radio', options: options.align.options },
    label: { control: 'text' },
  },
  render: (args) => <UiMenu {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: MenuArgs }) => source(args),
      },
    },
  },
} satisfies Meta<MenuArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Render(args) {
    const [picked, setPicked] = useState('none');
    return (
      <div className="sb-row">
        <UiMenu {...args} onPick={setPicked} />
        <span>Picked: {picked}</span>
      </div>
    );
  },
};

export const Groups: Story = {
  args: { label: 'Page actions' },
  render: (args) => (
    <UiMenu
      {...args}
      items={GROUPS}
      trigger={
        <ui-icon-button slot="trigger" size="small" label="Page actions">
          <span slot="icon" dangerouslySetInnerHTML={{ __html: iconMenu }} />
        </ui-icon-button>
      }
    />
  ),
};

export const Placements: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.placement.options.map((placement) => (
        <UiMenu
          key={placement}
          {...args}
          placement={placement}
          trigger={
            <ui-button slot="trigger" size="small">
              {placement}
            </ui-button>
          }
        />
      ))}
    </div>
  ),
};

export const OnSurfaces: Story = { decorators: [onSurfaces] };
