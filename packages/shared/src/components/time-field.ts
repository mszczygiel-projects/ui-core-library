import type { TimeConstraints } from '../utils/time.ts';
import { defineComponent } from './component.ts';
import { type TextControlProps, textField } from './text-field.ts';

/** The specification of TimeField. */
export const timeField = defineComponent({
  name: 'TimeField',
  tag: 'ui-time-field',
  category: 'Inputs',
  status: 'in-progress',
  figma: '3329:4',
  design: {
    nested: 'TextField',
    flags: [],
    booleans: [],
    codeOnly: ['min', 'max', 'readOnly', 'required', 'name', 'autoComplete'],
    previews: {},
  },
  summary: 'A time input with a native time picker and a 24-hour value with minute precision.',
  options: {
    variant: textField.options.variant,
    size: textField.options.size,
    labelPlacement: textField.options.labelPlacement,
    state: textField.options.state,
  },
  labels: ['inconsistentLimits'],
  parts: [
    'base',
    'control',
    'input-row',
    'input',
    'label',
    'label-row',
    'label-text',
    'label-hint',
    'hint',
    'hint-text',
  ],
  slots: [],
  events: ['ui-value-change'],
  stories: ['Playground', 'Variants', 'WithConstraints', 'OnSurfaces'],
  exceptions: [...textField.exceptions],
});

/** The native event that caused a time edit. */
export interface TimeFieldValueChangeDetails<OriginalEvent> {
  /** The native event that caused the edit. */
  readonly originalEvent: OriginalEvent;
}

/** A time edit and its canonical value. */
export interface TimeFieldValueChangeDetail<
  OriginalEvent,
> extends TimeFieldValueChangeDetails<OriginalEvent> {
  /** The canonical time, or an empty string. */
  readonly value: string;
}

/** The props both implementations of TimeField share. */
export interface TimeFieldProps
  extends Omit<TextControlProps, 'minLength' | 'maxLength' | 'placeholder'>, TimeConstraints {
  /** The canonical time, HH:mm; an empty string means empty. @default '' */
  value?: string;
}
