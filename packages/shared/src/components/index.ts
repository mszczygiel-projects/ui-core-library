import { button } from './button.ts';
import type { ComponentSpec } from './component.ts';
import { loader } from './loader.ts';
import { textField } from './text-field.ts';

/** The specifications of every component the library has, for documentation and tooling. */
export const specs: readonly ComponentSpec[] = [button, textField, loader];
