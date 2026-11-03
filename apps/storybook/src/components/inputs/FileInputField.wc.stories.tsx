import '@mszczygiel-projects/ui-core-web-components/button';
import '@mszczygiel-projects/ui-core-web-components/file-input-field';

import {
  fileInputField,
  type FileInputFieldVariant,
} from '@mszczygiel-projects/ui-core-shared/file-input-field';
import type { TextFieldSize, TextFieldState } from '@mszczygiel-projects/ui-core-shared/text-field';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type CSSProperties, useState } from 'react';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';
import { documents, picture } from '../sample-files.ts';

interface FileInputFieldArgs {
  readonly variant: FileInputFieldVariant;
  readonly size: TextFieldSize;
  readonly state: TextFieldState;
  readonly label: string;
  readonly hint?: string;
  readonly promptLabel?: string;
  readonly replaceLabel?: string;
  readonly name?: string;
  readonly accept?: string;
  readonly maxSize?: number;
  readonly maxFiles?: number;
  readonly locale?: string;
  readonly disabled: boolean;
  readonly required: boolean;
  readonly multiple: boolean;
  /** The initial files, which the defaultValue property takes: an attribute cannot hold files. */
  readonly defaultValue?: readonly File[];
}

const { options } = fileInputField;

function UiFileInputField(args: FileInputFieldArgs & { readonly style?: CSSProperties }) {
  return <ui-file-input-field {...args} />;
}

const source = (args: FileInputFieldArgs) =>
  htmlOf('ui-file-input-field', {
    variant: args.variant === options.variant.default ? undefined : args.variant,
    size: args.size === options.size.default ? undefined : args.size,
    state: args.state === options.state.default ? undefined : args.state,
    label: args.label,
    hint: args.hint,
    'prompt-label': args.promptLabel,
    'replace-label': args.replaceLabel,
    name: args.name,
    accept: args.accept,
    'max-size': args.maxSize,
    'max-files': args.maxFiles,
    locale: args.locale,
    disabled: args.disabled,
    required: args.required,
    multiple: args.multiple,
  });

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
      <ui-file-input-field
        label="Attachments"
        hint="Up to three files of at most 2 MB each"
        name="attachments"
        multiple
        required
        maxFiles={3}
        maxSize={2_000_000}
      />
      <div className="sb-row">
        <ui-button type="submit">Send</ui-button>
        <ui-button type="reset" variant="outline">
          Reset
        </ui-button>
      </div>
      <output>{submitted.join(', ')}</output>
    </form>
  );
}

const meta = {
  title: 'Components/Inputs/FileInputField/Web Component',
  tags: ['!manifest'],
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
    defaultValue: { control: false },
  },
  render: (args) => <UiFileInputField {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: FileInputFieldArgs }) => source(args),
      },
    },
  },
} satisfies Meta<FileInputFieldArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.variant.options.map((variant) => (
        <UiFileInputField
          key={variant}
          {...args}
          variant={variant}
          style={{ inlineSize: '20rem' }}
        />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: options.variant.options
          .map((variant) => source({ ...meta.args, variant }))
          .join('\n'),
      },
    },
  },
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
