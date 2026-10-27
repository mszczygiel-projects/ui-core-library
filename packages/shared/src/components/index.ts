import { badge } from './badge.ts';
import { button } from './button.ts';
import { chip } from './chip.ts';
import type { ComponentSpec } from './component.ts';
import { iconButton } from './icon-button.ts';
import { linkButton } from './link-button.ts';
import { loader } from './loader.ts';
import { textField } from './text-field.ts';

/** The specifications of every component the library has, for documentation and tooling. */
export const specs: readonly ComponentSpec[] = [
  button,
  textField,
  loader,
  iconButton,
  linkButton,
  badge,
  chip,
];
