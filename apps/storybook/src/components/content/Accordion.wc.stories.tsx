import '@mszczygiel-projects/ui-core-web-components/accordion';
import '@mszczygiel-projects/ui-core-web-components/accordion-item';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { forEachSurface } from '../decorators.tsx';
import { htmlOf } from '../html.ts';
import { SECTIONS } from './sections.ts';

interface AccordionArgs {
  readonly multiple: boolean;
}

function UiAccordion({
  multiple,
  disabledIndex,
  surface,
}: AccordionArgs & { readonly disabledIndex?: number; readonly surface?: string }) {
  return (
    <ui-accordion multiple={multiple}>
      {SECTIONS.map((section, index) => (
        <ui-accordion-item
          key={section.label}
          label={surface === undefined ? section.label : `${section.label} (${surface})`}
          open={index === 0}
          disabled={index === disabledIndex}
        >
          {section.content}
        </ui-accordion-item>
      ))}
    </ui-accordion>
  );
}

const source = (args: AccordionArgs) =>
  htmlOf(
    'ui-accordion',
    { multiple: args.multiple },
    SECTIONS.map((section, index) =>
      htmlOf('ui-accordion-item', { label: section.label, open: index === 0 }, section.content),
    ).join(''),
  );

const meta = {
  title: 'Components/Content/Accordion/Web Component',
  tags: ['!manifest'],
  args: { multiple: false },
  argTypes: { multiple: { control: 'boolean' } },
  render: (args) => <UiAccordion {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: AccordionArgs }) => source(args),
      },
    },
  },
} satisfies Meta<AccordionArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Multiple: Story = { args: { multiple: true } };

export const WithDisabledItem: Story = {
  render: (args) => <UiAccordion {...args} disabledIndex={2} />,
};

// Each panel is a region named by its heading, and two regions of a page need different names.
export const OnSurfaces: Story = {
  render: (args) => forEachSurface((surface) => <UiAccordion {...args} surface={surface} />),
};
