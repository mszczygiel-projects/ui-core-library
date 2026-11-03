import { badge } from './badge.ts';
import { breadcrumbs } from './breadcrumbs.ts';
import { button } from './button.ts';
import { checkboxField } from './checkbox-field.ts';
import { chip } from './chip.ts';
import { combobox } from './combobox.ts';
import type { ComponentSpec } from './component.ts';
import { dateField } from './date-field.ts';
import { dialog } from './dialog.ts';
import { drawer } from './drawer.ts';
import { fileInputField } from './file-input-field.ts';
import { iconButton } from './icon-button.ts';
import { linkButton } from './link-button.ts';
import { listbox } from './listbox.ts';
import { loader } from './loader.ts';
import { notification } from './notification.ts';
import { numberField } from './number-field.ts';
import { pagination } from './pagination.ts';
import { passwordField } from './password-field.ts';
import { popover } from './popover.ts';
import { radioField } from './radio-field.ts';
import { radioGroup } from './radio-group.ts';
import { searchField } from './search-field.ts';
import { selectField } from './select-field.ts';
import { switchField } from './switch-field.ts';
import { textField } from './text-field.ts';
import { textareaField } from './textarea-field.ts';
import { tooltip } from './tooltip.ts';

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
  dialog,
  drawer,
  fileInputField,
  breadcrumbs,
  pagination,
  popover,
  tooltip,
];
