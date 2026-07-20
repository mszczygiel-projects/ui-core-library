import { createElement, useEffect, useRef, useState, type ComponentType } from 'react';
import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { CalendarDateSelectDetail, UiCalendar } from './calendar.js';
import './calendar.js';

const meta: Meta = {
  title: 'Web Components/Calendar',
  // Tag-name string routes autodocs to the CEM extractor (see .storybook/preview.ts).
  component: 'ui-calendar' as unknown as ComponentType,
  argTypes: {
    selectionMode: { control: 'select', options: ['single', 'range'] },
    startDate: { control: 'text' },
    endDate: { control: 'text' },
    minDate: { control: 'text' },
    maxDate: { control: 'text' },
    firstDayOfWeek: { control: { type: 'number', min: 1, max: 7 } },
    locale: { control: 'text' },
  },
  args: {
    selectionMode: 'single',
    startDate: '2026-07-08',
    endDate: '',
    minDate: '',
    maxDate: '',
    locale: 'pl-PL',
  },
};

export default meta;
type Story = StoryObj;

type CalendarArgs = {
  selectionMode?: string;
  startDate?: string;
  endDate?: string;
  minDate?: string;
  maxDate?: string;
  firstDayOfWeek?: number;
  locale?: string;
  today?: string;
};

const calendar = (args: CalendarArgs): ReactNode =>
  createElement('ui-calendar', {
    'selection-mode': args.selectionMode,
    'start-date': args.startDate || undefined,
    'end-date': args.endDate || undefined,
    'min-date': args.minDate || undefined,
    'max-date': args.maxDate || undefined,
    'first-day-of-week': args.firstDayOfWeek || undefined,
    locale: args.locale || undefined,
    today: args.today || '2026-07-19',
  });

export const Playground: Story = {
  render: (args: CalendarArgs) => calendar(args),
};

export const RangeSelection: Story = {
  render: ({ locale }: CalendarArgs) =>
    calendar({
      selectionMode: 'range',
      startDate: '2026-07-08',
      endDate: '2026-07-14',
      locale,
    }),
};

export const MinMaxAndDisabled: Story = {
  render: ({ locale }: CalendarArgs) => {
    const Demo = () => {
      const ref = useRef<UiCalendar>(null);
      useEffect(() => {
        if (ref.current) ref.current.disabledDates = ['2026-07-15', '2026-07-16'];
      }, []);
      return createElement('ui-calendar', {
        ref,
        'start-date': '2026-07-08',
        'min-date': '2026-07-05',
        'max-date': '2026-07-25',
        locale,
        today: '2026-07-19',
      });
    };
    return createElement(Demo);
  },
};

export const Locales: Story = {
  render: () =>
    createElement(
      'div',
      { style: { display: 'flex', gap: 32, flexWrap: 'wrap' } },
      ...['pl-PL', 'en-US', 'de-DE'].map((locale) =>
        createElement(
          'div',
          { key: locale },
          createElement('p', { style: { marginBottom: 8 } }, locale),
          calendar({ selectionMode: 'range', startDate: '2026-07-08', endDate: '2026-07-14', locale }),
        ),
      ),
    ),
};

/** Full controlled loop: date-select proposals are applied back as properties. */
export const ControlledRange: Story = {
  render: ({ locale }: CalendarArgs) => {
    const Demo = () => {
      const ref = useRef<UiCalendar>(null);
      const [range, setRange] = useState<{ start: string | null; end: string | null }>({
        start: '2026-07-08',
        end: '2026-07-14',
      });
      useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const onSelect = (e: Event) => {
          const d = (e as CustomEvent<CalendarDateSelectDetail>).detail;
          setRange({ start: d.startDate, end: d.endDate });
        };
        el.addEventListener('date-select', onSelect);
        return () => el.removeEventListener('date-select', onSelect);
      }, []);
      return createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
        createElement('ui-calendar', {
          ref,
          'selection-mode': 'range',
          'start-date': range.start ?? undefined,
          'end-date': range.end ?? undefined,
          locale,
          today: '2026-07-19',
        }),
        createElement('code', {}, `start: ${range.start ?? '—'}  end: ${range.end ?? '—'}`),
      );
    };
    return createElement(Demo);
  },
};

export const OnSurfaces: Story = {
  render: ({ locale }: CalendarArgs) =>
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
            },
          },
          calendar({
            selectionMode: 'range',
            startDate: '2026-07-08',
            endDate: '2026-07-14',
            locale,
          }),
        ),
      ),
    ),
};
