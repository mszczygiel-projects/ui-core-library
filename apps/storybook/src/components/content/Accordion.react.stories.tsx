import { Accordion, AccordionItem } from '@mszczygiel-projects/ui-core-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

import { forEachSurface } from '../decorators.tsx';
import { SECTIONS } from './sections.ts';

function Sections({
  disabledIndex,
  surface,
  ...args
}: ComponentProps<typeof Accordion> & {
  readonly disabledIndex?: number;
  readonly surface?: string;
}) {
  return (
    <Accordion {...args}>
      {SECTIONS.map((section, index) => (
        <AccordionItem
          key={section.label}
          label={surface === undefined ? section.label : `${section.label} (${surface})`}
          defaultOpen={index === 0}
          disabled={index === disabledIndex}
        >
          {section.content}
        </AccordionItem>
      ))}
    </Accordion>
  );
}

const meta = {
  title: 'Components/Content/Accordion/React',
  component: Accordion,
  args: { multiple: false },
  argTypes: { multiple: { control: 'boolean' } },
  render: (args) => <Sections {...args} />,
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Multiple: Story = { args: { multiple: true } };

export const WithDisabledItem: Story = {
  render: (args) => <Sections {...args} disabledIndex={2} />,
};

// Each panel is a region named by its heading, and two regions of a page need different names.
export const OnSurfaces: Story = {
  render: (args) => forEachSurface((surface) => <Sections {...args} surface={surface} />),
};
