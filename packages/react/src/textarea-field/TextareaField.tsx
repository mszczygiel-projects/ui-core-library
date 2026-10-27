'use client';

import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  textareaField,
  type TextareaFieldProps as SharedTextareaFieldProps,
  type TextareaFieldResize,
} from '@mszczygiel-projects/ui-core-shared/textarea-field';
import {
  type ComponentPropsWithRef,
  type CSSProperties,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
} from 'react';

import {
  Field,
  fieldDescription,
  fieldPart,
  fieldPlaceholder,
  splitFieldAttributes,
} from '../internal/field.tsx';
import { setRef } from '../internal/set-ref.ts';
import type { TextFieldValueChangeDetails } from '../text-field/TextField.tsx';

export type { TextareaFieldResize };

const { options } = textareaField;

/** TextareaField props. Appearance attributes reach the root; native attributes and ref reach the textarea. */
export interface TextareaFieldProps
  extends
    SharedTextareaFieldProps,
    Omit<
      ComponentPropsWithRef<'textarea'>,
      keyof SharedTextareaFieldProps | 'value' | 'defaultValue' | 'children'
    > {
  /** The controlled value. Pair it with onValueChange to accept edits. */
  value?: string;
  /** The initial uncontrolled value, restored by native form reset. @default '' */
  defaultValue?: string;
  /** A hint for the virtual keyboard. */
  inputMode?: ComponentPropsWithRef<'textarea'>['inputMode'];
  /** A hint for the virtual keyboard's Enter key. */
  enterKeyHint?: ComponentPropsWithRef<'textarea'>['enterKeyHint'];
  /** Turns the browser's spelling suggestions on or off. */
  spellCheck?: boolean;
  /** React's native change handler, called on each user edit. */
  onChange?: ComponentPropsWithRef<'textarea'>['onChange'];
  /** Called once per user edit, with the new string and original input event. */
  onValueChange?: (value: string, details: TextFieldValueChangeDetails) => void;
}

/**
 * Gives the stylesheet the height of the content. Measuring needs the layout: the height returns
 * to auto, and the scroll height then says what the content needs.
 */
function fitContent(textarea: HTMLTextAreaElement, auto: boolean): void {
  if (!auto) {
    textarea.style.removeProperty('--_auto-block-size');
    return;
  }
  textarea.style.setProperty('--_auto-block-size', 'auto');
  textarea.style.setProperty('--_auto-block-size', `${String(textarea.scrollHeight)}px`);
}

/**
 * A multi-line text input with a label, hint and validation feedback.
 *
 * Enter starts a new line and never submits. With `resize="auto"`, the textarea grows with its
 * content and the width of the page, up to `maxRows` lines, and then scrolls.
 */
export function TextareaField({
  variant = 'outline',
  size = 'medium',
  labelPlacement = 'top',
  state = 'default',
  resize = 'vertical',
  maxRows,
  label,
  hint,
  placeholder,
  value,
  onValueChange,
  onChange,
  id,
  className,
  style,
  dir,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: TextareaFieldProps) {
  const attributes = splitFieldAttributes(rest);
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const hintId = `${generatedId}-hint`;
  const mode = oneOf(resize, options.resize.options, options.resize.default);
  const auto = mode === 'auto';
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // A new controlled value or mode changes the content before the browser paints.
  useLayoutEffect(() => {
    if (textareaRef.current !== null) {
      fitContent(textareaRef.current, auto);
    }
  }, [auto, value]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea === null || !auto) {
      return;
    }
    let measured = 0;
    const observer = new ResizeObserver((entries) => {
      const inlineSize = entries[0]?.contentBoxSize[0]?.inlineSize ?? 0;
      // Only a new width wraps the text differently; a new height is the result of measuring.
      if (inlineSize !== measured) {
        measured = inlineSize;
        fitContent(textarea, true);
      }
    });
    observer.observe(textarea);
    return () => {
      observer.disconnect();
    };
  }, [auto]);

  const rows: CSSProperties | undefined =
    auto && maxRows !== undefined && maxRows > 0
      ? ({ '--_max-rows': String(maxRows) } as CSSProperties)
      : undefined;

  return (
    <Field
      block="textarea-field"
      controlId={textareaId}
      hintId={hintId}
      className={className}
      style={style}
      dir={dir}
      rootAttributes={attributes.root}
      modifiers={[`ui-textarea-field--resize-${mode}`]}
      variant={variant}
      size={size}
      labelPlacement={labelPlacement}
      state={state}
      label={label}
      hint={hint}
    >
      <textarea
        id={textareaId}
        className={fieldPart('textarea-field', 'input')}
        placeholder={fieldPlaceholder(placeholder)}
        style={rows}
        aria-invalid={state === 'error' || undefined}
        {...(value === undefined ? {} : { value })}
        {...attributes.control}
        ref={(textarea) => {
          textareaRef.current = textarea;
          const release = setRef(ref, textarea);
          return () => {
            textareaRef.current = null;
            release();
          };
        }}
        aria-describedby={fieldDescription(describedBy, hint, hintId)}
        onChange={(event) => {
          const next = event.currentTarget.value;
          fitContent(event.currentTarget, auto);
          onChange?.(event);
          onValueChange?.(next, { originalEvent: event.nativeEvent });
        }}
      />
    </Field>
  );
}
