import { badge } from './badge.ts';
import { button } from './button.ts';
import { checkboxField } from './checkbox-field.ts';
import { chip } from './chip.ts';
import { combobox } from './combobox.ts';
import type { ComponentSpec } from './component.ts';
import { dateField } from './date-field.ts';
import { iconButton } from './icon-button.ts';
import { linkButton } from './link-button.ts';
import { listbox } from './listbox.ts';
import { loader } from './loader.ts';
import { notification } from './notification.ts';
import { numberField } from './number-field.ts';
import { passwordField } from './password-field.ts';
import { radioField } from './radio-field.ts';
import { radioGroup } from './radio-group.ts';
import { searchField } from './search-field.ts';
import { selectField } from './select-field.ts';
import { switchField } from './switch-field.ts';
import { textField } from './text-field.ts';
import { textareaField } from './textarea-field.ts';

/** The specifications of every component the library has, for documentation and tooling. */
export const specs: readonly ComponentSpec[] = [
  button,
  textField,
  loader,
  iconButton,
  linkButton,
  badge,
  chip,
  notification,
  passwordField,
  searchField,
  textareaField,
  checkboxField,
  switchField,
  radioGroup,
  radioField,
  listbox,
  selectField,
  numberField,
  dateField,
  combobox,
];
