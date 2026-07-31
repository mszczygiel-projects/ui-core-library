import { createElement, type ComponentType, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import './file-input-field.js';
import type { UiFileInputField } from './file-input-field.js';

const meta: Meta = {
  title: 'Web Components/FileInputField',
  // Tag-name string routes autodocs to the CEM extractor (see .storybook/preview.ts).
  component: 'ui-file-input-field' as unknown as ComponentType,
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
type Story = StoryObj;

type FileInputArgs = {
  variant?: string;
  size?: string;
  state?: string;
  label?: string;
  prompt?: string;
  description?: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
};

const field = (props: FileInputArgs = {}, key?: string) =>
  createElement('ui-file-input-field', {
    key,
    variant: props.variant,
    'data-size': props.size,
    state: props.state,
    label: props.label,
    prompt: props.prompt,
    description: props.description,
    hint: props.hint,
    accept: props.accept,
    multiple: props.multiple || undefined,
  });

const column = (...children: ReactNode[]) =>
  createElement(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 360 } },
    ...children,
  );

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

/**
 * `files` is a property, not an attribute — a `File` cannot cross an attribute.
 * Seeding only while the field is still empty keeps a story's own interactions
 * (removing a file, picking another) from being undone on the next render.
 */
const seeded = (props: FileInputArgs, files: () => File[], extra: Record<string, unknown> = {}) =>
  createElement('ui-file-input-field', {
    variant: props.variant,
    'data-size': props.size,
    label: props.label,
    description: props.description,
    hint: props.hint,
    ...extra,
    ref: (node: UiFileInputField | null) => {
      if (node && node.files.length === 0) node.files = files();
    },
  });

export const Playground: Story = {
  render: (args: FileInputArgs) => field(args),
};

export const Variants: Story = {
  render: ({ size }: FileInputArgs) =>
    column(
      field({ variant: 'outline', size, label: 'Outline', description: 'PNG, SVG' }, 'o'),
      field({ variant: 'filled', size, label: 'Filled', description: 'PNG, SVG' }, 'f'),
    ),
};

export const Sizes: Story = {
  render: ({ variant }: FileInputArgs) =>
    column(
      ...['small', 'default', 'large'].map((size) =>
        field({ variant, size, label: size, description: 'PNG, SVG — max 2 MB' }, size),
      ),
    ),
};

export const States: Story = {
  render: ({ variant, size }: FileInputArgs) =>
    column(
      ...['default', 'success', 'error', 'disabled'].map((state) =>
        field({ variant, size, state, label: state, description: 'PNG, SVG — max 2 MB' }, state),
      ),
    ),
};

export const WithPreview: Story = {
  name: 'Value: filled (single image)',
  render: ({ variant, size }: FileInputArgs) =>
    column(
      seeded({ variant, size, label: 'Photo', hint: 'Replace or remove the current file.' }, () => [
        stubImage('team-photo-2026.svg', 'team photo'),
      ]),
    ),
};

export const WithList: Story = {
  name: 'Value: list (multiple)',
  render: ({ variant, size }: FileInputArgs) =>
    column(
      seeded(
        { variant, size, label: 'Attachments', description: 'Any format — max 5 files' },
        () => [
          stubImage('team-photo-2026.svg', 'team photo'),
          stubImage('sponsor-logo.svg', 'logo'),
          stubFile('contract.pdf', 'application/pdf'),
        ],
        { multiple: true },
      ),
    ),
};

/** Proves the whole Surfaces pipeline resolves through the component. */
export const OnSurfaces: Story = {
  render: ({ size }: FileInputArgs) =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column' } },
      ...['default', 'subtle', 'inverse', 'primary'].map((surface) =>
        createElement(
          'div',
          {
            key: surface,
            'data-surface': surface === 'default' ? undefined : surface,
            style: {
              backgroundColor: 'var(--color-background-default)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            },
          },
          field({ variant: 'outline', size, label: surface, description: 'PNG, SVG' }, 'o'),
          field({ variant: 'filled', size, description: 'PNG, SVG' }, 'f'),
        ),
      ),
    ),
};
