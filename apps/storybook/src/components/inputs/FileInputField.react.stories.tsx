import { Button, FileInputField } from '@mszczygiel-projects/ui-core-react';
import { fileInputField } from '@mszczygiel-projects/ui-core-shared/file-input-field';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { onSurfaces } from '../decorators.tsx';
import { documents, picture } from '../sample-files.ts';

const { options } = fileInputField;

/** A form that shows what it would submit, instead of leaving the page. */
function FileForm() {
  const [submitted, setSubmitted] = useState<readonly string[]>([]);
  return (
    <form
      className="sb-stack"
      onSubmit={(event) => {
        event.preventDefault();
        const entries = new FormData(event.currentTarget).getAll('attachments');
        setSubmitted(entries.map((entry) => (entry instanceof File ? entry.name : entry)));
      }}
    >
      <FileInputField
        label="Attachments"
        hint="Up to three files of at most 2 MB each"
        name="attachments"
        multiple
        required
        maxFiles={3}
        maxSize={2_000_000}
      />
      <div className="sb-row">
        <Button type="submit">Send</Button>
        <Button type="reset" variant="outline">
          Reset
        </Button>
      </div>
      <output>{submitted.join(', ')}</output>
    </form>
  );
}

const meta = {
  title: 'Components/Inputs/FileInputField/React',
  component: FileInputField,
  args: {
    label: 'Photo',
    hint: 'PNG or SVG, at most 2 MB',
    accept: '.png,.svg',
    maxSize: 2_000_000,
    variant: options.variant.default,
    size: options.size.default,
    state: options.state.default,
    disabled: false,
    required: false,
    multiple: false,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    promptLabel: { control: 'text' },
    replaceLabel: { control: 'text' },
    variant: { control: 'inline-radio', options: options.variant.options },
    size: { control: 'inline-radio', options: options.size.options },
    state: { control: 'inline-radio', options: options.state.options },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    multiple: { control: 'boolean' },
    name: { control: 'text' },
    accept: { control: 'text' },
    maxSize: { control: 'number' },
    maxFiles: { control: 'number' },
    locale: { control: 'text' },
    value: { control: false },
    defaultValue: { control: false },
    getRemoveLabel: { control: false },
  },
} satisfies Meta<typeof FileInputField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.variant.options.map((variant) => (
        <FileInputField key={variant} {...args} variant={variant} style={{ inlineSize: '20rem' }} />
      ))}
    </div>
  ),
};

export const Multiple: Story = {
  args: {
    label: 'Attachments',
    hint: 'Add as many files as you need',
    accept: undefined,
    multiple: true,
    defaultValue: documents,
  },
};

export const ImagePreview: Story = { args: { defaultValue: [picture] } };

export const WithForm: Story = { render: () => <FileForm /> };

export const OnSurfaces: Story = {
  decorators: [onSurfaces],
  args: { multiple: true, defaultValue: documents },
  render: Variants.render,
};
