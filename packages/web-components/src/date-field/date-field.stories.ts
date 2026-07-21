import { createElement, type ComponentType } from 'react';
import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import './date-field.js';

const meta: Meta = {
  title: 'Web Components/DateField',
  // Tag-name string routes autodocs to the CEM extractor (see .storybook/preview.ts).
  component: 'ui-date-field' as unknown as ComponentType,
  argTypes: {
    mode: { control: 'select', options: ['single', 'range'] },
    variant: { control: 'select', options: ['outline', 'filled', 'underlined'] },
    size: { control: 'select', options: ['small', 'default', 'large'] },
    labelPlacement: { control: 'select', options: ['top', 'floating', 'inner'] },
    state: { control: 'select', options: ['default', 'success', 'error', 'disabled'] },
    locale: { control: 'text' },
  },
  args: {
    mode: 'single',
    variant: 'outline',
    size: 'default',
    labelPlacement: 'top',
    state: 'default',
    locale: 'pl-PL',
  },
};

export default meta;
type Story = StoryObj;

type DateFieldArgs = {
  mode?: string;
  variant?: string;
  size?: string;
  labelPlacement?: string;
  state?: string;
  locale?: string;
};

const field = (args: DateFieldArgs, extra: Record<string, unknown> = {}): ReactNode =>
  createElement('ui-date-field', {
    mode: args.mode,
    variant: args.variant,
    'data-size': args.size,
    'label-placement': args.labelPlacement,
    state: args.state,
    locale: args.locale,
    today: '2026-07-19',
    label: args.mode === 'range' ? 'Date range' : 'Date',
    placeholder: 'Pick or type a date',
    style: { display: 'block', width: 320 },
    ...extra,
  });

export const Playground: Story = {
  render: (args: DateFieldArgs) =>
    createElement(
      'div',
      { style: { paddingBottom: 420 } },
      field(args, { 'start-date': '2026-07-05' }),
    ),
};

export const RangeMode: Story = {
  render: (args: DateFieldArgs) =>
    createElement(
      'div',
      { style: { paddingBottom: 460 } },
      field(
        { ...args, mode: 'range' },
        { 'start-date': '2026-07-05', 'end-date': '2026-07-12', hint: 'Type "5 lip 2026 – 12 lip 2026" or pick in the calendar' },
      ),
    ),
};

export const ValidationBounds: Story = {
  render: (args: DateFieldArgs) =>
    createElement(
      'div',
      { style: { paddingBottom: 420 } },
      field(args, {
        'min-date': '2026-07-05',
        'max-date': '2026-07-25',
        hint: 'Allowed: 2026-07-05 … 2026-07-25 — type an outside date to see the invalid treatment',
      }),
    ),
};

export const OnSurfaces: Story = {
  render: (args: DateFieldArgs) =>
    createElement(
      'div',
      { style: { display: 'flex', gap: 16, flexWrap: 'wrap' } },
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
              width: 360,
            },
          },
          field({ ...args, mode: 'range' }, { 'start-date': '2026-07-05', 'end-date': '2026-07-12' }),
        ),
      ),
    ),
};
