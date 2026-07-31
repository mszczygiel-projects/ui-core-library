import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';
import { FileInputField } from './FileInputField.js';

type FileInputFieldStoryArgs = ComponentProps<typeof FileInputField>;

/*
 * Real file contents, not empty buffers: the preview and the list thumbnails
 * render through <img>, so a stub without decodable image data would document
 * the component with broken-image icons.
 */
const stubImage = (name: string, label: string) =>
  new File(
    [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100">` +
        `<rect width="160" height="100" fill="#8fa6c4"/>` +
        `<text x="80" y="56" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#12233d">${label}</text>` +
        `</svg>`,
    ],
    name,
    { type: 'image/svg+xml' },
  );

const stubFile = (name: string, type: string) => new File([new Uint8Array(2048)], name, { type });

const meta: Meta<FileInputFieldStoryArgs> = {
  title: 'React/FileInputField',
  component: FileInputField,
  argTypes: {
    variant: { control: 'select', options: ['outline', 'filled'] },
    size: { control: 'select', options: ['small', 'default', 'large'] },
    state: { control: 'select', options: ['default', 'success', 'error', 'disabled'] },
    label: { control: 'text' },
    prompt: { control: 'text' },
    description: { control: 'text' },
    hint: { control: 'text' },
    accept: { control: 'text' },
    multiple: { control: 'boolean' },
  },
  args: {
    variant: 'outline',
    size: 'default',
    state: 'default',
    label: 'Photo',
    description: 'PNG, SVG — max 2 MB',
    hint: 'Accepted: PNG, SVG.',
    accept: 'image/*',
    multiple: false,
  },
};

export default meta;
type Story = StoryObj<FileInputFieldStoryArgs>;

const column = (children: React.ReactNode) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 360 }}>{children}</div>
);

export const Playground: Story = {};

export const Variants: Story = {
  render: ({ size }) =>
    column(
      <>
        <FileInputField variant="outline" size={size} label="Outline" description="PNG, SVG" />
        <FileInputField variant="filled" size={size} label="Filled" description="PNG, SVG" />
      </>,
    ),
};

export const Sizes: Story = {
  render: ({ variant }) =>
    column(
      <>
        {(['small', 'default', 'large'] as const).map((size) => (
          <FileInputField
            key={size}
            variant={variant}
            size={size}
            label={size}
            description="PNG, SVG — max 2 MB"
          />
        ))}
      </>,
    ),
};

export const States: Story = {
  render: ({ variant, size }) =>
    column(
      <>
        {(['default', 'success', 'error', 'disabled'] as const).map((state) => (
          <FileInputField
            key={state}
            variant={variant}
            size={size}
            state={state}
            label={state}
            description="PNG, SVG — max 2 MB"
          />
        ))}
      </>,
    ),
};

export const WithPreview: Story = {
  name: 'Value: filled (single image)',
  render: ({ variant, size }) =>
    column(
      <FileInputField
        variant={variant}
        size={size}
        label="Photo"
        hint="Replace or remove the current file."
        defaultFiles={[stubImage('team-photo-2026.svg', 'team photo')]}
      />,
    ),
};

export const WithList: Story = {
  name: 'Value: list (multiple)',
  render: ({ variant, size }) =>
    column(
      <FileInputField
        variant={variant}
        size={size}
        multiple
        label="Attachments"
        description="Any format — max 5 files"
        defaultFiles={[
          stubImage('team-photo-2026.svg', 'team photo'),
          stubImage('sponsor-logo.svg', 'logo'),
          stubFile('contract.pdf', 'application/pdf'),
        ]}
      />,
    ),
};

/** Proves the whole Surfaces pipeline resolves through the component. */
export const OnSurfaces: Story = {
  render: ({ size }) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {(['default', 'subtle', 'inverse', 'primary'] as const).map((surface) => (
        <div
          key={surface}
          data-surface={surface === 'default' ? undefined : surface}
          style={{
            backgroundColor: 'var(--color-background-default)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <FileInputField variant="outline" size={size} label={surface} description="PNG, SVG" />
          <FileInputField variant="filled" size={size} description="PNG, SVG" />
        </div>
      ))}
    </div>
  ),
};
