import { Accordion, AccordionItem } from '@mszczygiel-projects/ui-core-react';
import { accordionHeadingLevels } from '@mszczygiel-projects/ui-core-shared/accordion-item';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { forEachSurface } from '../decorators.tsx';
import { SECTIONS } from './sections.ts';

const [section] = SECTIONS;

const meta = {
  title: 'Components/Content/AccordionItem/React',
  component: AccordionItem,
  args: { label: section.label, disabled: false, headingLevel: 3, children: section.content },
  argTypes: {
    label: { control: 'text' },
    open: { control: 'boolean' },
    disabled: { control: 'boolean' },
    headingLevel: { control: 'inline-radio', options: accordionHeadingLevels },
    children: { control: false },
  },
  render: (args) => (
    <Accordion>
      <AccordionItem {...args} />
    </Accordion>
  ),
} satisfies Meta<typeof AccordionItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Open: Story = { args: { defaultOpen: true } };

export const Disabled: Story = { args: { disabled: true } };

// Each panel is a region named by its heading, and two regions of a page need different names.
export const OnSurfaces: Story = {
  args: { defaultOpen: true },
  render: (args) =>
    forEachSurface((surface) => (
      <Accordion>
        <AccordionItem {...args} label={`${args.label} (${surface})`} />
      </Accordion>
    )),
};
