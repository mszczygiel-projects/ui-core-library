import '@mszczygiel-projects/ui-core-web-components/accordion';
import '@mszczygiel-projects/ui-core-web-components/accordion-item';

import {
  type AccordionHeadingLevel,
  accordionHeadingLevels,
} from '@mszczygiel-projects/ui-core-shared/accordion-item';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { forEachSurface } from '../decorators.tsx';
import { htmlOf } from '../html.ts';
import { SECTIONS } from './sections.ts';

interface AccordionItemArgs {
  readonly label: string;
  readonly open: boolean;
  readonly disabled: boolean;
  readonly headingLevel: AccordionHeadingLevel;
}

const [section] = SECTIONS;

const source = (args: AccordionItemArgs) =>
  htmlOf(
    'ui-accordion',
    {},
    htmlOf(
      'ui-accordion-item',
      {
        label: args.label,
        open: args.open,
        disabled: args.disabled,
        'heading-level': args.headingLevel === 3 ? undefined : String(args.headingLevel),
      },
      section.content,
    ),
  );

const meta = {
  title: 'Components/Content/AccordionItem/Web Component',
  tags: ['!manifest'],
  args: { label: section.label, open: false, disabled: false, headingLevel: 3 },
  argTypes: {
    label: { control: 'text' },
    open: { control: 'boolean' },
    disabled: { control: 'boolean' },
    headingLevel: { control: 'inline-radio', options: accordionHeadingLevels },
  },
  render: (args) => (
    <ui-accordion>
      <ui-accordion-item
        label={args.label}
        open={args.open}
        disabled={args.disabled}
        headingLevel={args.headingLevel}
      >
        {section.content}
      </ui-accordion-item>
    </ui-accordion>
  ),
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: AccordionItemArgs }) => source(args),
      },
    },
  },
} satisfies Meta<AccordionItemArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Open: Story = { args: { open: true } };

export const Disabled: Story = { args: { disabled: true } };

// Each panel is a region named by its heading, and two regions of a page need different names.
export const OnSurfaces: Story = {
  args: { open: true },
  render: (args) =>
    forEachSurface((surface) => (
      <ui-accordion>
        <ui-accordion-item
          label={`${args.label} (${surface})`}
          open={args.open}
          disabled={args.disabled}
          headingLevel={args.headingLevel}
        >
          {section.content}
        </ui-accordion-item>
      </ui-accordion>
    )),
};
