import { createElement, useEffect, useRef, useState, type ComponentType } from 'react';
import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { UiDatePicker, DatePickerRangeChangeDetail } from './date-picker.js';
import type { PopoverOpenChangeDetail } from '../popover/popover.js';
import './date-picker.js';

const meta: Meta = {
  title: 'Web Components/DatePicker',
  // Tag-name string routes autodocs to the CEM extractor (see .storybook/preview.ts).
  component: 'ui-date-picker' as unknown as ComponentType,
  argTypes: {
    selectionMode: { control: 'select', options: ['single', 'range'] },
    placement: {
      control: 'select',
      options: ['bottom-start', 'bottom', 'bottom-end', 'top-start', 'top', 'top-end'],
    },
    locale: { control: 'text' },
  },
  args: {
    selectionMode: 'single',
    placement: 'bottom-start',
    locale: 'pl-PL',
  },
};

export default meta;
type Story = StoryObj;

type DatePickerArgs = {
  selectionMode?: 'single' | 'range';
  placement?: string;
  locale?: string;
};

/** Fully controlled demo: open + committed dates live in story state. */
const controlledDemo = (args: DatePickerArgs): ReactNode => {
  const Demo = () => {
    const ref = useRef<UiDatePicker>(null);
    const [open, setOpen] = useState(true);
    const [single, setSingle] = useState<string | null>('2026-07-08');
    const [range, setRange] = useState<{ start: string | null; end: string | null }>({
      start: '2026-07-08',
      end: '2026-07-14',
    });
    const isRange = args.selectionMode === 'range';

    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const onOpenChange = (e: Event) =>
        setOpen((e as CustomEvent<PopoverOpenChangeDetail>).detail.open);
      const onDateChange = (e: Event) =>
        setSingle((e as CustomEvent<{ date: string }>).detail.date);
      const onRangeChange = (e: Event) => {
        const d = (e as CustomEvent<DatePickerRangeChangeDetail>).detail;
        setRange({ start: d.startDate, end: d.endDate });
      };
      el.addEventListener('open-change', onOpenChange);
      el.addEventListener('date-change', onDateChange);
      el.addEventListener('range-change', onRangeChange);
      return () => {
        el.removeEventListener('open-change', onOpenChange);
        el.removeEventListener('date-change', onDateChange);
        el.removeEventListener('range-change', onRangeChange);
      };
    }, []);

    return createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 380 } },
      createElement(
        'ui-date-picker',
        {
          ref,
          'selection-mode': args.selectionMode,
          placement: args.placement,
          locale: args.locale,
          today: '2026-07-19',
          open: open || undefined,
          'start-date': (isRange ? range.start : single) ?? undefined,
          'end-date': (isRange ? range.end : undefined) ?? undefined,
        },
        createElement(
          'button',
          { slot: 'trigger', onClick: () => setOpen((o) => !o) },
          'Pick date',
        ),
      ),
      createElement(
        'code',
        {},
        isRange
          ? `start: ${range.start ?? '—'}  end: ${range.end ?? '—'}`
          : `date: ${single ?? '—'}`,
      ),
    );
  };
  return createElement(Demo);
};

export const SingleAutoCommit: Story = {
  render: (args: DatePickerArgs) => controlledDemo({ ...args, selectionMode: 'single' }),
};

export const RangeWithFooter: Story = {
  render: (args: DatePickerArgs) => controlledDemo({ ...args, selectionMode: 'range' }),
};

export const OnSurfaces: Story = {
  render: ({ locale }: DatePickerArgs) =>
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
              paddingBottom: 420,
            },
          },
          createElement(
            'ui-date-picker',
            {
              'selection-mode': 'range',
              open: true,
              locale,
              today: '2026-07-19',
              'start-date': '2026-07-08',
              'end-date': '2026-07-14',
            },
            createElement('button', { slot: 'trigger' }, 'Pick date'),
          ),
        ),
      ),
    ),
};
